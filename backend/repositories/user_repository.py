"""User repository abstractions and provider implementations."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Protocol

from pydantic import ValidationError
from sqlalchemy import func, or_
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..auth.google_auth import GoogleUserIdentity
from ..db.models import UserTable
from ..models.user_profile import FeatureFlags, UserProfile, UserRole

INITIAL_ADMIN_EMAILS = {
    "muhammadfouly@gmail.com",
    "nick@organizedinsomnia.com",
    "zyang3104@gmail.com",
    "simonafelt@gmail.com",
    "chrisbutcher901@gmail.com",
}


class UserRepository(Protocol):
    async def upsert_google_user(self, identity: GoogleUserIdentity) -> UserProfile:
        """Create or update a user profile from Google identity."""

    async def get_user_by_id(self, user_id: str) -> UserProfile | None:
        """Fetch a user profile by stable id."""

    async def list_users(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None,
        role: str | None,
    ) -> tuple[list[UserProfile], int]:
        """List users with optional search and role filter."""

    async def update_user_role(self, *, user_id: str, role: UserRole) -> UserProfile | None:
        """Update the role for a user and return the updated profile."""


class PostgresUserRepository:
    """Postgres-backed user adapter for auth persistence."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def upsert_google_user(self, identity: GoogleUserIdentity) -> UserProfile:
        statement = select(UserTable).where(UserTable.id == identity.subject)
        existing = (await self._session.exec(statement)).first()

        if existing:
            existing.email = str(identity.email)
            existing.display_name = identity.display_name
            existing.last_login_at = datetime.now(timezone.utc)
            await self._session.commit()
            await self._session.refresh(existing)
            return _to_user_profile(existing)

        record = UserTable(
            id=identity.subject,
            email=str(identity.email),
            display_name=identity.display_name,
            role=(
                UserRole.ADMIN.value
                if str(identity.email).lower() in INITIAL_ADMIN_EMAILS
                else UserRole.NA.value
            ),
            created_at=datetime.now(timezone.utc),
            last_login_at=datetime.now(timezone.utc),
            hashed_password="google-oauth",
            feature_flags=FeatureFlags().model_dump(),
        )
        self._session.add(record)
        await self._session.commit()
        await self._session.refresh(record)
        return _to_user_profile(record)

    async def get_user_by_id(self, user_id: str) -> UserProfile | None:
        statement = select(UserTable).where(UserTable.id == user_id)
        record = (await self._session.exec(statement)).first()
        if record is None:
            return None

        return _to_user_profile(record)

    async def list_users(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None,
        role: str | None,
    ) -> tuple[list[UserProfile], int]:
        filters = []

        if search:
            term = f"%{search.strip()}%"
            filters.append(
                or_(
                    UserTable.display_name.ilike(term),
                    UserTable.email.ilike(term),
                )
            )

        if role:
            filters.append(UserTable.role == role.strip().lower())

        list_statement = (
            select(UserTable)
            .where(*filters)
            .order_by(UserTable.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        records = (await self._session.exec(list_statement)).all()

        count_statement = select(func.count()).select_from(UserTable).where(*filters)
        total = int((await self._session.exec(count_statement)).one())

        return [_to_user_profile(record) for record in records], total

    async def update_user_role(self, *, user_id: str, role: UserRole) -> UserProfile | None:
        statement = select(UserTable).where(UserTable.id == user_id)
        record = (await self._session.exec(statement)).first()
        if record is None:
            return None

        record.role = role.value
        await self._session.commit()
        await self._session.refresh(record)
        return _to_user_profile(record)


def _to_user_profile(record: UserTable) -> UserProfile:
    role_value = record.role.strip().lower() if record.role else UserRole.NA.value
    if role_value not in {UserRole.NA.value, UserRole.COLLECTOR.value, UserRole.ADMIN.value}:
        role_value = UserRole.NA.value

    user_payload = {
        "id": record.id,
        "email": record.email,
        "display_name": record.display_name,
        "role": UserRole(role_value),
        "created_at": record.created_at,
        "hashed_password": record.hashed_password,
        "last_login_at": record.last_login_at,
        "mfa_enabled": record.mfa_enabled,
        "recovery_email": record.recovery_email,
        "recovery_phone": record.recovery_phone,
        "feature_flags": FeatureFlags.model_validate(record.feature_flags or {}),
        "disabled": record.disabled,
        "notes": record.notes,
    }

    try:
        return UserProfile(**user_payload)
    except ValidationError as error:
        # Legacy/local test users may contain reserved-domain emails.
        # Build without strict validation so admin tooling can still function.
        if any(validation.get("loc") == ("email",) for validation in error.errors()):
            return UserProfile.model_construct(**user_payload)
        raise
