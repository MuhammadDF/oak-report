from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

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
        "backend.services.scan_service.get_card_info", new=MagicMock(side_effect=_mock_get_card_info)
    ) as mock_get_card_info:
        result = await identify_card_from_image(b"image-bytes")

    assert result.card.name == "Mew"
    assert result.card.card_number is None
    assert result.set_name == "Promo"

    called_card = mock_get_card_info.call_args.args[0]
    assert called_card.card_number is None
