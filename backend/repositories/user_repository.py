"""User repository abstractions and provider implementations."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Protocol

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..auth.google_auth import GoogleUserIdentity
from ..db.models import UserTable
from ..models.user_profile import FeatureFlags, UserProfile, UserRole


class UserRepository(Protocol):
    async def upsert_google_user(self, identity: GoogleUserIdentity) -> UserProfile:
        """Create or update a user profile from Google identity."""

    async def get_user_by_id(self, user_id: str) -> UserProfile | None:
        """Fetch a user profile by stable id."""


class InMemoryUserRepository:
    """In-memory user adapter used for mock provider mode."""

    def __init__(self) -> None:
        self._users_by_id: dict[str, UserProfile] = {}

    async def upsert_google_user(self, identity: GoogleUserIdentity) -> UserProfile:
        existing = self._users_by_id.get(identity.subject)
        if existing:
            updated = existing.model_copy(
                update={
                    "email": identity.email,
                    "display_name": identity.display_name,
                    "last_login_at": datetime.now(timezone.utc),
                }
            )
            self._users_by_id[identity.subject] = updated
            return updated

        profile = UserProfile(
            id=identity.subject,
            email=identity.email,
            display_name=identity.display_name,
            role=UserRole.COLLECTOR,
            created_at=datetime.now(timezone.utc),
            last_login_at=datetime.now(timezone.utc),
            hashed_password="google-oauth",
            feature_flags=FeatureFlags(),
        )
        self._users_by_id[identity.subject] = profile
        return profile

    async def get_user_by_id(self, user_id: str) -> UserProfile | None:
        return self._users_by_id.get(user_id)


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
            role=UserRole.COLLECTOR.value,
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


def _to_user_profile(record: UserTable) -> UserProfile:
    return UserProfile(
        id=record.id,
        email=record.email,
        display_name=record.display_name,
        role=UserRole(record.role),
        created_at=record.created_at,
        hashed_password=record.hashed_password,
        last_login_at=record.last_login_at,
        mfa_enabled=record.mfa_enabled,
        recovery_email=record.recovery_email,
        recovery_phone=record.recovery_phone,
        feature_flags=FeatureFlags.model_validate(record.feature_flags or {}),
        disabled=record.disabled,
        notes=record.notes,
    )
