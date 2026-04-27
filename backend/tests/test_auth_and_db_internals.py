from __future__ import annotations

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from jwt import ExpiredSignatureError, InvalidTokenError

from backend.auth.dependencies import (
    get_current_user,
    require_admin,
    require_any_role,
    require_roles,
)
from backend.auth.google_auth import GoogleUserIdentity, verify_google_id_token
from backend.auth.jwt_service import (
    AuthTokenPayload,
    _jwt_secret,
    issue_auth_token,
    verify_auth_token,
)
from backend.db.config import _as_bool, _build_default_database_url, get_database_settings
from backend.db.dependencies import (
    get_collection_repository_dependency,
    get_pricing_catalog_repository_dependency,
    get_user_repository_dependency,
)
from backend.db.session import get_session
from backend.tests.conftest import _admin_database_url, _ensure_test_database_exists, _test_database_url


def _auth_payload(role: str = "admin") -> AuthTokenPayload:
    return AuthTokenPayload(
        sub="user-1",
        email="ash@example.com",
        display_name="Ash",
        role=role,
        exp=4_102_444_800,
    )


def test_get_current_user_returns_verified_payload() -> None:
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token")

    with patch("backend.auth.dependencies.verify_auth_token", return_value=_auth_payload()) as mock_verify:
        result = get_current_user(credentials)

    assert result.sub == "user-1"
    mock_verify.assert_called_once_with("token")


def test_get_current_user_maps_expired_token_error() -> None:
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token")

    with patch(
        "backend.auth.dependencies.verify_auth_token",
        side_effect=ExpiredSignatureError("expired"),
    ):
        with pytest.raises(HTTPException) as error:
            get_current_user(credentials)

    assert error.value.status_code == 401
    assert error.value.detail == "Authentication token has expired."


def test_get_current_user_maps_invalid_token_error() -> None:
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token")

    with patch(
        "backend.auth.dependencies.verify_auth_token",
        side_effect=InvalidTokenError("bad"),
    ):
        with pytest.raises(HTTPException) as error:
            get_current_user(credentials)

    assert error.value.status_code == 401
    assert error.value.detail == "Invalid authentication token."


def test_require_roles_validates_and_enforces_allowed_roles() -> None:
    with pytest.raises(ValueError, match="At least one allowed role must be provided."):
        require_roles(" ", "")

    dependency = require_roles("admin", "collector")
    assert dependency(current_user=_auth_payload("collector")).role == "collector"

    with pytest.raises(HTTPException) as error:
        dependency(current_user=_auth_payload("na"))

    assert error.value.status_code == 403
    assert error.value.detail == "Insufficient role for this action."


def test_require_any_role_and_require_admin_delegate() -> None:
    assert require_any_role(["admin"])(current_user=_auth_payload("admin")).role == "admin"
    assert require_admin()(current_user=_auth_payload("admin")).role == "admin"


def test_verify_google_id_token_requires_google_client_id(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("GOOGLE_CLIENT_ID", raising=False)

    with pytest.raises(ValueError, match="GOOGLE_CLIENT_ID is not configured."):
        verify_google_id_token("token")


def test_verify_google_id_token_rejects_invalid_issuer(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "client-id")
    now = datetime.now(UTC)
    payload = {
        "iss": "example.com",
        "sub": "google-sub",
        "email": "ash@example.com",
        "iat": int((now - timedelta(minutes=5)).timestamp()),
        "exp": int((now + timedelta(minutes=5)).timestamp()),
    }

    with patch("backend.auth.google_auth.google_requests.Request"), patch(
        "backend.auth.google_auth.id_token.verify_oauth2_token",
        return_value=payload,
    ):
        with pytest.raises(ValueError, match="Invalid token issuer."):
            verify_google_id_token("token")


def test_verify_google_id_token_rejects_expired_token(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "client-id")
    now = datetime.now(UTC)
    payload = {
        "iss": "accounts.google.com",
        "sub": "google-sub",
        "email": "ash@example.com",
        "iat": int((now - timedelta(hours=2)).timestamp()),
        "exp": int((now - timedelta(hours=1)).timestamp()),
    }

    with patch("backend.auth.google_auth.google_requests.Request"), patch(
        "backend.auth.google_auth.id_token.verify_oauth2_token",
        return_value=payload,
    ):
        with pytest.raises(ValueError, match="Google token is expired."):
            verify_google_id_token("token")


def test_verify_google_id_token_maps_valid_payload(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "client-id")
    now = datetime.now(UTC)
    payload = {
        "iss": "https://accounts.google.com",
        "sub": "google-sub",
        "email": "ash@example.com",
        "iat": int((now - timedelta(minutes=5)).timestamp()),
        "exp": int((now + timedelta(minutes=5)).timestamp()),
    }

    with patch("backend.auth.google_auth.google_requests.Request"), patch(
        "backend.auth.google_auth.id_token.verify_oauth2_token",
        return_value=payload,
    ):
        result = verify_google_id_token("token")

    assert result == GoogleUserIdentity(
        subject="google-sub",
        email="ash@example.com",
        display_name="ash@example.com",
        issued_at=datetime.fromtimestamp(payload["iat"], tz=UTC),
        expires_at=datetime.fromtimestamp(payload["exp"], tz=UTC),
    )


def test_jwt_secret_requires_environment_variable(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("JWT_SECRET", raising=False)

    with pytest.raises(ValueError, match="JWT_SECRET is not configured."):
        _jwt_secret()


def test_issue_and_verify_auth_token_round_trip(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JWT_SECRET", "test-secret")

    token = issue_auth_token(
        user_id="user-1",
        email="ash@example.com",
        display_name="Ash",
        role="collector",
    )
    payload = verify_auth_token(token)

    assert payload.sub == "user-1"
    assert payload.email == "ash@example.com"
    assert payload.display_name == "Ash"
    assert payload.role == "collector"


def test_as_bool_and_database_settings_helpers(monkeypatch: pytest.MonkeyPatch) -> None:
    assert _as_bool(None, default=True) is True
    assert _as_bool(" yes ") is True
    assert _as_bool("no") is False

    monkeypatch.setenv("POSTGRES_USER", "oak")
    monkeypatch.setenv("POSTGRES_PASSWORD", "secret")
    monkeypatch.setenv("POSTGRES_HOST", "db")
    monkeypatch.setenv("POSTGRES_PORT", "5433")
    monkeypatch.setenv("POSTGRES_DB", "cards")
    assert _build_default_database_url() == "postgresql+asyncpg://oak:secret@db:5433/cards"

    monkeypatch.setenv("DATA_PROVIDER", " MOCK ")
    monkeypatch.setenv("DATABASE_URL", " postgres://custom ")
    monkeypatch.setenv("DB_ECHO", "true")
    settings = get_database_settings()

    assert settings.data_provider == "mock"
    assert settings.database_url == "postgres://custom"
    assert settings.db_echo is True


def test_get_database_settings_falls_back_to_default_url(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("DB_ECHO", raising=False)
    monkeypatch.delenv("DATA_PROVIDER", raising=False)
    monkeypatch.setenv("POSTGRES_USER", "postgres")
    monkeypatch.setenv("POSTGRES_PASSWORD", "password")
    monkeypatch.setenv("POSTGRES_HOST", "localhost")
    monkeypatch.setenv("POSTGRES_PORT", "5432")
    monkeypatch.setenv("POSTGRES_DB", "pokemon")

    settings = get_database_settings()

    assert settings.data_provider == "postgres"
    assert settings.database_url == "postgresql+asyncpg://postgres:password@localhost:5432/pokemon"
    assert settings.db_echo is False


def test_test_database_url_helpers(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://postgres:password@postgres:5432/pokemon")

    assert _test_database_url() == "postgresql+asyncpg://postgres:password@postgres:5432/pokemon_test"
    assert _admin_database_url(_test_database_url()) == "postgresql://postgres:password@postgres:5432/postgres"


def test_db_dependency_helpers_delegate_to_factory() -> None:
    session = MagicMock(name="session")
    collection_repo = MagicMock(name="collection_repo")
    user_repo = MagicMock(name="user_repo")
    pricing_repo = MagicMock(name="pricing_repo")

    with patch("backend.db.dependencies.get_collection_repository", return_value=collection_repo), patch(
        "backend.db.dependencies.get_user_repository", return_value=user_repo
    ), patch(
        "backend.db.dependencies.get_pricing_catalog_repository", return_value=pricing_repo
    ):
        assert get_collection_repository_dependency(session) is collection_repo
        assert get_user_repository_dependency(session) is user_repo
        assert get_pricing_catalog_repository_dependency(session) is pricing_repo


@pytest.mark.asyncio
async def test_get_session_yields_session_from_session_local() -> None:
    yielded_session = MagicMock(name="yielded_session")

    class _SessionContext:
        async def __aenter__(self):
            return yielded_session

        async def __aexit__(self, exc_type, exc, tb):
            _ = exc_type
            _ = exc
            _ = tb
            return False

    with patch("backend.db.session.SessionLocal", return_value=_SessionContext()):
        generator = get_session()
        result = await anext(generator)

    assert result is yielded_session


@pytest.mark.asyncio
async def test_ensure_test_database_exists_creates_missing_database() -> None:
    connection = MagicMock()
    connection.fetchval = AsyncMock(return_value=None)
    connection.execute = AsyncMock()
    connection.close = AsyncMock()

    with patch("backend.tests.conftest.asyncpg.connect", AsyncMock(return_value=connection)):
        await _ensure_test_database_exists("postgresql+asyncpg://postgres:password@postgres:5432/pokemon_test")

    connection.execute.assert_awaited_once_with('CREATE DATABASE "pokemon_test"')
    connection.close.assert_awaited_once()


@pytest.mark.asyncio
async def test_ensure_test_database_exists_ignores_duplicate_database_error() -> None:
    connection = MagicMock()
    connection.fetchval = AsyncMock(return_value=None)
    connection.execute = AsyncMock(side_effect=__import__("asyncpg").DuplicateDatabaseError("exists"))
    connection.close = AsyncMock()

    with patch("backend.tests.conftest.asyncpg.connect", AsyncMock(return_value=connection)):
        await _ensure_test_database_exists("postgresql+asyncpg://postgres:password@postgres:5432/pokemon_test")

    connection.close.assert_awaited_once()
