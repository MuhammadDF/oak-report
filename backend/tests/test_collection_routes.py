from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient

from backend.auth.dependencies import get_current_user
from backend.auth.jwt_service import AuthTokenPayload
from backend.main import app


@pytest.mark.asyncio
async def test_get_collection_success(async_client: AsyncClient, repository_mocks: dict[str, MagicMock]) -> None:
    async def _mock_get_collection_for_user(owner_id, repository):
        _ = owner_id
        _ = repository
        return {"owner_id": "test-user", "items": []}

    mock_get_collection_for_user = MagicMock(side_effect=_mock_get_collection_for_user)

    with patch("backend.api.collection_routes.get_collection_for_user", new=mock_get_collection_for_user):
        response = await async_client.get("/api/collection/")

    assert response.status_code == 200
    assert response.json() == {"owner_id": "test-user", "items": []}
    mock_get_collection_for_user.assert_called_once_with(
        "test-user", repository_mocks["collection_repository"]
    )


@pytest.mark.asyncio
async def test_add_to_collection_success(
    async_client: AsyncClient,
    repository_mocks: dict[str, MagicMock],
) -> None:
    async def _mock_add_scan_to_collection(owner_id, payload, repository):
        _ = payload
        _ = repository
        return {
            "owner_id": owner_id,
            "added_item": {
                "id": "card-charizard-base-set-4",
                "name": "Charizard",
                "set": "Base Set",
                "number": "4",
                "price": 249.99,
                "image": "https://example.com/cards/charizard.jpg",
                "grade": None,
                "quantity": 1,
            },
            "total_items": 1,
        }

    mock_add_scan_to_collection = MagicMock(side_effect=_mock_add_scan_to_collection)

    with patch("backend.api.collection_routes.add_scan_to_collection", new=mock_add_scan_to_collection):
        response = await async_client.post(
            "/api/collection/add",
            json={
                "name": "Charizard",
                "set": "Base Set",
                "number": "4",
                "price": 249.99,
                "image": "https://example.com/cards/charizard.jpg",
            },
        )

    assert response.status_code == 200
    assert response.json()["owner_id"] == "test-user"
    assert response.json()["added_item"]["name"] == "Charizard"
    mock_add_scan_to_collection.assert_called_once()
    assert mock_add_scan_to_collection.call_args.args[0] == "test-user"
    assert mock_add_scan_to_collection.call_args.args[2] is repository_mocks["collection_repository"]


@pytest.mark.asyncio
async def test_add_to_collection_missing_required_field_returns_422(async_client: AsyncClient) -> None:
    response = await async_client.post(
        "/api/collection/add",
        json={
            "set": "Base Set",
            "number": "4",
            "price": 249.99,
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_collection_item_not_found_returns_404(async_client: AsyncClient) -> None:
    async def _mock_update_collection_quantity(owner_id, item_id, quantity, repository):
        _ = owner_id
        _ = item_id
        _ = quantity
        _ = repository
        raise KeyError("missing")

    with patch(
        "backend.api.collection_routes.update_collection_quantity",
        new=MagicMock(side_effect=_mock_update_collection_quantity),
    ):
        response = await async_client.patch("/api/collection/missing-item/quantity", json={"quantity": 2})

    assert response.status_code == 404
    assert response.json()["detail"] == "Collection item not found."


@pytest.mark.asyncio
async def test_delete_collection_item_not_found_returns_404(async_client: AsyncClient) -> None:
    async def _mock_remove_collection_item(owner_id, item_id, repository):
        _ = owner_id
        _ = item_id
        _ = repository
        raise KeyError("missing")

    with patch(
        "backend.api.collection_routes.remove_collection_item",
        new=MagicMock(side_effect=_mock_remove_collection_item),
    ):
        response = await async_client.delete("/api/collection/missing-item")

    assert response.status_code == 404
    assert response.json()["detail"] == "Collection item not found."


@pytest.mark.asyncio
async def test_collection_route_forbidden_for_non_collector_role(async_client: AsyncClient) -> None:
    app.dependency_overrides[get_current_user] = lambda: AuthTokenPayload(
        sub="test-user",
        email="tester@example.com",
        display_name="Test User",
        role="na",
        exp=4_102_444_800,
    )

    response = await async_client.get("/api/collection/")

    assert response.status_code == 403
    assert response.json()["detail"] == "Insufficient role for this action."