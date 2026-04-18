"""Auth user service backed by provider-specific repository adapters."""

from ..auth.google_auth import GoogleUserIdentity
from ..models.user_profile import UserProfile
from ..repositories.user_repository import UserRepository


async def upsert_google_user(
    identity: GoogleUserIdentity,
    repository: UserRepository,
) -> UserProfile:
    """Create or update a user profile from Google identity fields."""

    return await repository.upsert_google_user(identity)


async def get_user_by_id(user_id: str, repository: UserRepository) -> UserProfile | None:
    """Fetch a user profile by stable id."""

    return await repository.get_user_by_id(user_id)
