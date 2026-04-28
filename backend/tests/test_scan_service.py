from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException
from google.genai import errors

from backend.services.scan_service import identify_card_from_image


@pytest.mark.asyncio
async def test_identify_card_from_image_maps_card_and_pricing() -> None:
    response = MagicMock()
    response.text = '{"name": "Charizard", "card_number": "004/102", "language": "English"}'

    client = MagicMock()
    client.models.generate_content.return_value = response

    async def _mock_get_card_info(card):
        _ = card
        return 249.99, "Base Set", "https://example.com/cards/charizard.jpg"

    with patch("backend.services.scan_service.load_dotenv"), patch(
        "backend.services.scan_service.genai.Client", return_value=client
    ), patch(
        "backend.services.scan_service.types.Part.from_bytes", return_value="part"
    ), patch(
        "backend.services.scan_service.get_all_card_info", new=AsyncMock(return_value=[])
    ), patch(
        "backend.services.scan_service.get_card_info", new=MagicMock(side_effect=_mock_get_card_info)
    ) as mock_get_card_info:
        result = await identify_card_from_image(b"image-bytes")

    assert result.card.name == "Charizard"
    assert result.card.card_number == "004"
    assert result.pricing == 249.99
    assert result.set_name == "Base Set"
    assert result.image_url == "https://example.com/cards/charizard.jpg"

    called_card = mock_get_card_info.call_args.args[0]
    assert called_card.name == "Charizard"
    assert called_card.card_number == "004"
    assert called_card.language == "English"


@pytest.mark.asyncio
async def test_identify_card_from_image_uses_fallback_set_name_from_response() -> None:
    response = MagicMock()
    response.text = '{"name": "Pikachu", "card number": "25", "language": "Japanese", "set_name": "Starter Set"}'

    client = MagicMock()
    client.models.generate_content.return_value = response

    async def _mock_get_card_info(card):
        _ = card
        return 10.5, None, ""

    with patch("backend.services.scan_service.load_dotenv"), patch(
        "backend.services.scan_service.genai.Client", return_value=client
    ), patch(
        "backend.services.scan_service.types.Part.from_bytes", return_value="part"
    ), patch(
        "backend.services.scan_service.get_all_card_info", new=AsyncMock(return_value=[])
    ), patch(
        "backend.services.scan_service.get_card_info", new=MagicMock(side_effect=_mock_get_card_info)
    ):
        result = await identify_card_from_image(b"image-bytes")

    assert result.card.name == "Pikachu"
    assert result.card.card_number == "25"
    assert result.card.language == "Japanese"
    assert result.set_name == "Starter Set"


@pytest.mark.asyncio
async def test_identify_card_from_image_uses_set_field_when_pricing_has_no_console_name() -> None:
    response = MagicMock()
    response.text = '{"name": "Bulbasaur", "card_number": "001/102", "language": "English", "set": "Base Set"}'

    client = MagicMock()
    client.models.generate_content.return_value = response

    async def _mock_get_card_info(card):
        _ = card
        return 5.25, None, ""

    with patch("backend.services.scan_service.load_dotenv"), patch(
        "backend.services.scan_service.genai.Client", return_value=client
    ), patch(
        "backend.services.scan_service.types.Part.from_bytes", return_value="part"
    ), patch(
        "backend.services.scan_service.get_all_card_info", new=AsyncMock(return_value=[])
    ), patch(
        "backend.services.scan_service.get_card_info", new=MagicMock(side_effect=_mock_get_card_info)
    ):
        result = await identify_card_from_image(b"image-bytes")

    assert result.card.name == "Bulbasaur"
    assert result.card.card_number == "001"
    assert result.set_name == "Base Set"


@pytest.mark.asyncio
async def test_identify_card_from_image_allows_missing_card_number() -> None:
    response = MagicMock()
    response.text = '{"name": "Mew", "language": "English"}'

    client = MagicMock()
    client.models.generate_content.return_value = response

    async def _mock_get_card_info(card):
        _ = card
        return 50.0, "Promo", "https://example.com/cards/mew.jpg"

    with patch("backend.services.scan_service.load_dotenv"), patch(
        "backend.services.scan_service.genai.Client", return_value=client
    ), patch(
        "backend.services.scan_service.types.Part.from_bytes", return_value="part"
    ), patch(
        "backend.services.scan_service.get_all_card_info", new=AsyncMock(return_value=[])
    ), patch(
        "backend.services.scan_service.get_card_info", new=MagicMock(side_effect=_mock_get_card_info)
    ) as mock_get_card_info:
        result = await identify_card_from_image(b"image-bytes")

    assert result.card.name == "Mew"
    assert result.card.card_number is None
    assert result.set_name == "Promo"

    called_card = mock_get_card_info.call_args.args[0]
    assert called_card.card_number is None


@pytest.mark.asyncio
async def test_identify_card_from_image_includes_matching_cards_when_ambiguous() -> None:
    response = MagicMock()
    response.text = '{"name": "Charizard", "card_number": "004/102", "language": "English"}'

    client = MagicMock()
    client.models.generate_content.return_value = response

    match = MagicMock(
        id="1",
        console_name="Base Set",
        product_name="Charizard #4",
        loose_price=249.99,
        tcg_id="123",
        image_url="https://example.com/cards/charizard.jpg",
        refreshed_at=datetime(2026, 4, 25, 0, 0, 0, tzinfo=UTC),
    )
    alternate_match = MagicMock(
        id="2",
        console_name="Base Set 2",
        product_name="Charizard #4",
        loose_price=199.99,
        tcg_id="456",
        image_url="https://example.com/cards/charizard-2.jpg",
        refreshed_at=datetime(2026, 4, 25, 0, 0, 0, tzinfo=UTC),
    )

    async def _mock_get_card_info(card):
        _ = card
        return 249.99, "Base Set", "https://example.com/cards/charizard.jpg"

    with patch("backend.services.scan_service.load_dotenv"), patch(
        "backend.services.scan_service.genai.Client", return_value=client
    ), patch(
        "backend.services.scan_service.types.Part.from_bytes", return_value="part"
    ), patch(
        "backend.services.scan_service.get_all_card_info", new=AsyncMock(return_value=[match, alternate_match])
    ), patch(
        "backend.services.scan_service.get_card_info", new=MagicMock(side_effect=_mock_get_card_info)
    ):
        result = await identify_card_from_image(b"image-bytes")

    assert result.matches is not None
    assert len(result.matches) == 2
    assert result.matches[0].product_name == "Charizard #4"


@pytest.mark.asyncio
async def test_identify_card_from_image_translates_upstream_server_error_to_503() -> None:
    client = MagicMock()
    client.models.generate_content.side_effect = errors.ServerError(
        503,
        {"error": {"message": "temporarily unavailable"}},
    )

    with patch("backend.services.scan_service.load_dotenv"), patch(
        "backend.services.scan_service.genai.Client", return_value=client
    ), patch(
        "backend.services.scan_service.types.Part.from_bytes", return_value="part"
    ):
        with pytest.raises(HTTPException) as exc_info:
            await identify_card_from_image(b"image-bytes")

    assert exc_info.value.status_code == 503
    assert exc_info.value.detail == "The scan service is temporarily down. Use search or try again later."
