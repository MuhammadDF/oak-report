from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_search_cards_valid_query_returns_pricing_results(async_client: AsyncClient) -> None:
    mock_match = MagicMock(
        id="charizard-base-4",
        console_name="Pokemon Base Set",
        product_name="Charizard #4",
        loose_price=249.99,
        tcg_id="base1-4",
        image_url="https://example.com/cards/charizard.jpg",
        refreshed_at=datetime.now(UTC),
    )

    async def _mock_search_cards(query: str):
        return [mock_match]

    mock_search_cards = MagicMock(side_effect=_mock_search_cards)

    with patch("backend.api.search_routes.search_cards", new=mock_search_cards):
        response = await async_client.get("/api/search/cards", params={"query": "Charizard"})

    assert response.status_code == 200
    body = response.json()
    assert "results" in body
    assert len(body["results"]) == 1

    first_result = body["results"][0]
    assert isinstance(first_result["loose_price"], float)
    assert first_result["id"] == "charizard-base-4"
    assert first_result["product_name"] == "Charizard #4"
    assert first_result["image_url"] == "https://example.com/cards/charizard.jpg"
    mock_search_cards.assert_called_once_with("Charizard")


@pytest.mark.asyncio
async def test_search_cards_invalid_query_returns_empty_results(async_client: AsyncClient) -> None:
    async def _mock_search_cards(query: str):
        return []

    mock_search_cards = MagicMock(side_effect=_mock_search_cards)

    with patch("backend.api.search_routes.search_cards", new=mock_search_cards):
        response = await async_client.get("/api/search/cards", params={"query": "MissingNo999"})

    assert response.status_code == 200
    assert response.json() == {"results": []}
    mock_search_cards.assert_called_once_with("MissingNo999")


@pytest.mark.asyncio
async def test_search_cards_missing_query_returns_422(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/search/cards")

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_search_card_info_valid_payload_returns_pricing_results(async_client: AsyncClient) -> None:
    mock_match = MagicMock(
        id="charizard-base-4",
        console_name="Pokemon Base Set",
        product_name="Charizard #4",
        loose_price=249.99,
        tcg_id="base1-4",
        image_url="https://example.com/cards/charizard.jpg",
        refreshed_at=datetime.now(UTC),
    )

    async def _mock_get_all_card_info(card_identity):
        return [mock_match]

    mock_get_all_card_info = MagicMock(side_effect=_mock_get_all_card_info)

    payload = {
        "name": "Charizard",
        "card_number": "4",
        "language": "English",
    }

    with patch("backend.api.search_routes.get_all_card_info", new=mock_get_all_card_info):
        response = await async_client.post("/api/search/card-info", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert "results" in body
    assert len(body["results"]) == 1
    assert isinstance(body["results"][0]["loose_price"], float)

    mock_get_all_card_info.assert_called_once()
    called_identity = mock_get_all_card_info.call_args.args[0]
    assert called_identity.name == "Charizard"
    assert called_identity.card_number == "4"
    assert called_identity.language == "English"


@pytest.mark.asyncio
async def test_search_card_info_missing_required_body_field_returns_422(
    async_client: AsyncClient,
) -> None:
    response = await async_client.post("/api/search/card-info", json={"card_number": "4"})

    assert response.status_code == 422