from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient

from backend.auth.dependencies import get_current_user
from backend.auth.jwt_service import AuthTokenPayload
from backend.main import app


@pytest.mark.asyncio
async def test_pricing_catalog_status_returns_admin_snapshot(
    async_client: AsyncClient,
    repository_mocks: dict[str, MagicMock],
) -> None:
    async def _mock_count_rows():
        return 123

    async def _mock_get_last_refreshed_at():
        return datetime(2026, 4, 25, 0, 0, 0, tzinfo=UTC)

    repository_mocks["pricing_repository"].count_rows = MagicMock(side_effect=_mock_count_rows)
    repository_mocks["pricing_repository"].get_last_refreshed_at = MagicMock(
        side_effect=_mock_get_last_refreshed_at
    )
    sync_settings = MagicMock(enabled=True, interval_seconds=3600, run_on_startup=True)

    with patch("backend.api.admin_routes.get_pricing_catalog_sync_settings", return_value=sync_settings):
        response = await async_client.get("/api/admin/pricing-catalog/status")

    assert response.status_code == 200
    body = response.json()
    assert body["enabled"] is True
    assert body["interval_seconds"] == 3600
    assert body["run_on_startup"] is True
    assert body["row_count"] == 123
    assert body["last_refreshed_at"] == "2026-04-25T00:00:00+00:00"


@pytest.mark.asyncio
async def test_admin_users_success(async_client: AsyncClient) -> None:
    async def _mock_list_users_page(*, page, page_size, search, role, repository):
        _ = page
        _ = page_size
        _ = search
        _ = role
        _ = repository
        return {
            "items": [
                {
                    "id": "user-1",
                    "display_name": "Ash",
                    "email": "ash@example.com",
                    "role": "collector",
                }
            ],
            "page": 1,
            "page_size": 20,
            "total": 1,
        }

    with patch("backend.api.admin_routes.list_users_page", new=MagicMock(side_effect=_mock_list_users_page)):
        response = await async_client.get("/api/admin/users")

    assert response.status_code == 200
    assert response.json()["items"][0]["id"] == "user-1"


@pytest.mark.asyncio
async def test_admin_patch_user_role_forbidden_for_self(async_client: AsyncClient) -> None:
    response = await async_client.patch("/api/admin/users/test-user/role", json={"role": "admin"})

    assert response.status_code == 403
    assert response.json()["detail"] == "You cannot change your own role."


@pytest.mark.asyncio
async def test_admin_patch_user_role_not_found_returns_404(async_client: AsyncClient) -> None:
    async def _mock_update_user_role(*, user_id, role, repository):
        _ = user_id
        _ = role
        _ = repository
        return None

    with patch("backend.api.admin_routes.update_user_role", new=MagicMock(side_effect=_mock_update_user_role)):
        response = await async_client.patch("/api/admin/users/missing-user/role", json={"role": "collector"})

    assert response.status_code == 404
    assert response.json()["detail"] == "User not found."


@pytest.mark.asyncio
async def test_admin_route_forbidden_for_non_admin(async_client: AsyncClient) -> None:
    app.dependency_overrides[get_current_user] = lambda: AuthTokenPayload(
        sub="collector-user",
        email="collector@example.com",
        display_name="Collector",
        role="collector",
        exp=4_102_444_800,
    )

    response = await async_client.get("/api/admin/users")

    assert response.status_code == 403
    assert response.json()["detail"] == "Insufficient role for this action."