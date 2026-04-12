"""JWT issue and verification utilities for app session tokens."""

import os
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from pydantic import BaseModel, EmailStr


class AuthTokenPayload(BaseModel):
    """Claims we persist in app-issued bearer tokens."""

    sub: str
    email: EmailStr
    display_name: str
    role: str
    exp: int


def _jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise ValueError("JWT_SECRET is not configured.")
    return secret


def issue_auth_token(*, user_id: str, email: str, display_name: str, role: str) -> str:
    """Issue a signed JWT for the authenticated user."""

    expires_at = datetime.now(UTC) + timedelta(hours=8)
    payload = {
        "sub": user_id,
        "email": email,
        "display_name": display_name,
        "role": role,
        "exp": int(expires_at.timestamp()),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm="HS256")


def verify_auth_token(token: str) -> AuthTokenPayload:
    """Decode and validate an app-issued JWT token."""

    decoded: dict[str, Any] = jwt.decode(token, _jwt_secret(), algorithms=["HS256"])
    return AuthTokenPayload.model_validate(decoded)
