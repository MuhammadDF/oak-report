"""In-memory auth user service for Google-authenticated sessions."""

from datetime import datetime

from ..auth.google_auth import GoogleUserIdentity
from ..models.user_profile import UserProfile, UserRole

_users_by_id: dict[str, UserProfile] = {}


def upsert_google_user(identity: GoogleUserIdentity) -> UserProfile:
    """Create or update a user profile from Google identity fields."""

    existing = _users_by_id.get(identity.subject)
    if existing:
        updated = existing.model_copy(
            update={
                "email": identity.email,
                "display_name": identity.display_name,
                "last_login_at": datetime.utcnow(),
            }
        )
        _users_by_id[identity.subject] = updated
        return updated

    profile = UserProfile(
        id=identity.subject,
        email=identity.email,
        display_name=identity.display_name,
        role=UserRole.COLLECTOR,
        created_at=datetime.utcnow(),
        last_login_at=datetime.utcnow(),
        hashed_password="google-oauth",
    )
    _users_by_id[identity.subject] = profile
    return profile


def get_user_by_id(user_id: str) -> UserProfile | None:
    """Fetch a user profile by stable id."""

    return _users_by_id.get(user_id)
