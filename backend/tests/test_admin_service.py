from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from backend.models.user_profile import UserRole
from backend.services.admin_service import list_users_page, update_user_role


@pytest.mark.asyncio
async def test_list_users_page_maps_repository_results() -> None:
    repository = MagicMock()
    repository_user = MagicMock(
        id="user-1",
        display_name="Ash",
        email="ash@example.com",
        role=UserRole.COLLECTOR,
    )

    async def _mock_list_users(*, page, page_size, search, role):
        _ = page
        _ = page_size
        _ = search
        _ = role
        return [repository_user], 1

    repository.list_users = MagicMock(side_effect=_mock_list_users)

    result = await list_users_page(
        page=1,
        page_size=20,
        search="ash",
        role=UserRole.COLLECTOR,
        repository=repository,
    )

    assert result.total == 1
    assert result.items[0].id == "user-1"
    assert result.items[0].role == UserRole.COLLECTOR
    repository.list_users.assert_called_once_with(
        page=1, page_size=20, search="ash", role="collector"
    )


@pytest.mark.asyncio
async def test_update_user_role_returns_none_when_not_found() -> None:
    repository = MagicMock()

    async def _mock_update_user_role(*, user_id, role):
        _ = user_id
        _ = role
        return None

    repository.update_user_role = MagicMock(side_effect=_mock_update_user_role)

    result = await update_user_role(
        user_id="missing-user",
        role=UserRole.ADMIN,
        repository=repository,
    )

    assert result is None


@pytest.mark.asyncio
async def test_update_user_role_maps_updated_user() -> None:
    repository = MagicMock()
    updated_user = MagicMock(
        id="user-1",
        display_name="Ash",
        email="ash@example.com",
        role=UserRole.ADMIN,
    )

    async def _mock_update_user_role(*, user_id, role):
        _ = user_id
        _ = role
        return updated_user

    repository.update_user_role = MagicMock(side_effect=_mock_update_user_role)

    result = await update_user_role(
        user_id="user-1",
        role=UserRole.ADMIN,
        repository=repository,
    )

    assert result is not None
    assert result.id == "user-1"
    assert result.role == UserRole.ADMIN