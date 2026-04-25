from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from backend.services.auth_service import get_user_by_id, upsert_google_user


@pytest.mark.asyncio
async def test_upsert_google_user_delegates_to_repository() -> None:
    repository = MagicMock()
    identity = MagicMock(sub="google-sub")
    expected_user = MagicMock(id="user-1")

    async def _mock_upsert_google_user(identity_arg):
        _ = identity_arg
        return expected_user

    repository.upsert_google_user = MagicMock(side_effect=_mock_upsert_google_user)

    result = await upsert_google_user(identity, repository)

    assert result is expected_user
    repository.upsert_google_user.assert_called_once_with(identity)


@pytest.mark.asyncio
async def test_get_user_by_id_delegates_to_repository() -> None:
    repository = MagicMock()
    expected_user = MagicMock(id="user-1")

    async def _mock_get_user_by_id(user_id):
        _ = user_id
        return expected_user

    repository.get_user_by_id = MagicMock(side_effect=_mock_get_user_by_id)

    result = await get_user_by_id("user-1", repository)

    assert result is expected_user
    repository.get_user_by_id.assert_called_once_with("user-1")