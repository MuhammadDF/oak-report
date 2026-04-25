"""FastAPI auth dependencies for bearer token validation."""

from collections.abc import Iterable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import ExpiredSignatureError, InvalidTokenError

from .jwt_service import AuthTokenPayload, verify_auth_token

bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> AuthTokenPayload:
    """Resolve and validate the current user from Authorization header."""

    try:
        return verify_auth_token(credentials.credentials)
    except ExpiredSignatureError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired.",
        ) from error
    except (InvalidTokenError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        ) from error


def require_roles(*allowed_roles: str):
    """Return a dependency that enforces any of the provided role values."""

    allowed = {role.strip().lower() for role in allowed_roles if role.strip()}
    if not allowed:
        raise ValueError("At least one allowed role must be provided.")

    def _dependency(current_user: AuthTokenPayload = Depends(get_current_user)) -> AuthTokenPayload:
        user_role = current_user.role.strip().lower()
        if user_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role for this action.",
            )
        return current_user

    return _dependency


def require_any_role(roles: Iterable[str]):
    """Helper for call sites that already maintain role lists."""

    return require_roles(*list(roles))


def require_admin():
    """Return a dependency that only allows admin users."""

    return require_roles("admin")
