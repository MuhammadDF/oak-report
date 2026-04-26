from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_auth_google_success_returns_token_and_user(
    async_client: AsyncClient,
    repository_mocks: dict[str, MagicMock],
) -> None:
    identity = MagicMock(sub="google-sub", email="ash@example.com", display_name="Ash")
    user = MagicMock(
        id="user-1",
        email="ash@example.com",
        display_name="Ash",
        role=MagicMock(value="collector"),
    )

    async def _mock_upsert_google_user(identity_arg, repository_arg):
        _ = identity_arg
        _ = repository_arg
        return user

    mock_upsert_google_user = MagicMock(side_effect=_mock_upsert_google_user)

    with patch("backend.api.auth_routes.verify_google_id_token", return_value=identity), patch(
        "backend.api.auth_routes.upsert_google_user", new=mock_upsert_google_user
    ), patch("backend.api.auth_routes.issue_auth_token", return_value="jwt-token"):
        response = await async_client.post("/api/auth/google", json={"id_token": "valid-google-token"})

    assert response.status_code == 200
    body = response.json()
    assert body["access_token"] == "jwt-token"
    assert body["token_type"] == "bearer"
    assert body["user"]["id"] == "user-1"
    assert body["user"]["role"] == "collector"

    mock_upsert_google_user.assert_called_once()
    assert mock_upsert_google_user.call_args.args[1] is repository_mocks["user_repository"]


@pytest.mark.asyncio
async def test_auth_google_invalid_token_returns_401(async_client: AsyncClient) -> None:
    with patch(
        "backend.api.auth_routes.verify_google_id_token",
        side_effect=ValueError("Token verification failed"),
    ):
        response = await async_client.post("/api/auth/google", json={"id_token": "bad-token"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Token verification failed"


@pytest.mark.asyncio
async def test_auth_me_success_returns_current_user(async_client: AsyncClient) -> None:
    user = MagicMock(
        id="test-user",
        email="tester@example.com",
        display_name="Test User",
        role=MagicMock(value="admin"),
    )

    async def _mock_get_user_by_id(user_id, repository):
        _ = user_id
        _ = repository
        return user

    mock_get_user_by_id = MagicMock(side_effect=_mock_get_user_by_id)

    with patch("backend.api.auth_routes.get_user_by_id", new=mock_get_user_by_id):
        response = await async_client.get("/api/auth/me")

    assert response.status_code == 200
    assert response.json() == {
        "id": "test-user",
        "email": "tester@example.com",
        "display_name": "Test User",
        "role": "admin",
    }


@pytest.mark.asyncio
async def test_auth_me_missing_user_returns_401(async_client: AsyncClient) -> None:
    async def _mock_get_user_by_id(user_id, repository):
        _ = user_id
        _ = repository
        return None

    with patch("backend.api.auth_routes.get_user_by_id", new=MagicMock(side_effect=_mock_get_user_by_id)):
        response = await async_client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.json()["detail"] == "User no longer available."


@pytest.mark.asyncio
async def test_logout_returns_client_side_message(async_client: AsyncClient) -> None:
    response = await async_client.post("/api/auth/logout")

    assert response.status_code == 200
    assert response.json() == {"message": "Logout is handled client-side by discarding the token."}