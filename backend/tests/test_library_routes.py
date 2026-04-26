from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient

from backend.auth.dependencies import get_current_user
from backend.auth.jwt_service import AuthTokenPayload
from backend.main import app


@pytest.mark.asyncio
async def test_library_cards_success(async_client: AsyncClient) -> None:
    async def _mock_list_library_cards():
        return [
            {
                "id": "xy-1",
                "name": "Pikachu",
                "set": "XY Base",
                "number": "42",
                "rarity": "Common",
                "type": "Electric",
                "price": 1.25,
            }
        ]

    with patch("backend.api.library_routes.list_library_cards", new=MagicMock(side_effect=_mock_list_library_cards)):
        response = await async_client.get("/api/library/cards")

    assert response.status_code == 200
    assert response.json()[0]["id"] == "xy-1"
    assert isinstance(response.json()[0]["price"], float)


@pytest.mark.asyncio
async def test_library_cards_forbidden_for_unknown_role(async_client: AsyncClient) -> None:
    app.dependency_overrides[get_current_user] = lambda: AuthTokenPayload(
        sub="guest-user",
        email="guest@example.com",
        display_name="Guest",
        role="guest",
        exp=4_102_444_800,
    )

    response = await async_client.get("/api/library/cards")

    assert response.status_code == 403
    assert response.json()["detail"] == "Insufficient role for this action."