"""Google Identity token verification helpers."""

import os
from datetime import datetime, timezone

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pydantic import BaseModel, EmailStr


class GoogleUserIdentity(BaseModel):
    """Normalized user fields extracted from a verified Google ID token."""

    subject: str
    email: EmailStr
    display_name: str
    issued_at: datetime
    expires_at: datetime


def verify_google_id_token(raw_id_token: str) -> GoogleUserIdentity:
    """Validate a Google ID token and return normalized user identity data."""

    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not google_client_id:
        raise ValueError("GOOGLE_CLIENT_ID is not configured.")

    request = google_requests.Request()
    payload = id_token.verify_oauth2_token(raw_id_token, request, google_client_id)

    if payload.get("iss") not in {"accounts.google.com", "https://accounts.google.com"}:
        raise ValueError("Invalid token issuer.")

    now = datetime.now(timezone.utc)
    issued_at = datetime.fromtimestamp(payload["iat"], tz=timezone.utc)
    expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)

    if expires_at <= now:
        raise ValueError("Google token is expired.")

    return GoogleUserIdentity(
        subject=payload["sub"],
        email=payload["email"],
        display_name=payload.get("name", payload["email"]),
        issued_at=issued_at,
        expires_at=expires_at,
    )
