from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from backend.services.search_service import _parse_card_identity, search_cards


def test_parse_card_identity_extracts_language_and_card_number() -> None:
    parsed = _parse_card_identity("Charizard #004 Japanese")

    assert parsed.name == "Charizard"
    assert parsed.card_number == "#004"
    assert parsed.language == "Japanese"


def test_parse_card_identity_keeps_slash_card_number() -> None:
    parsed = _parse_card_identity("Pikachu tg10/tg30 english")

    assert parsed.name == "Pikachu"
    assert parsed.card_number == "tg10/tg30"
    assert parsed.language == "English"


@pytest.mark.asyncio
async def test_search_cards_returns_empty_when_query_has_no_identity() -> None:
    with patch("backend.services.search_service.get_all_card_info", new=MagicMock()) as mocked_lookup:
        result = await search_cards("   /   ")

    assert result == []
    mocked_lookup.assert_not_called()


@pytest.mark.asyncio
async def test_search_cards_delegates_to_get_all_card_info() -> None:
    fake_rows = [MagicMock(id="row-1")]

    async def _mock_get_all_card_info(card_identity):
        _ = card_identity
        return fake_rows

    mock_get_all_card_info = MagicMock(side_effect=_mock_get_all_card_info)

    with patch("backend.services.search_service.get_all_card_info", new=mock_get_all_card_info):
        result = await search_cards("Charizard 4 English")

    assert result == fake_rows
    mock_get_all_card_info.assert_called_once()
    called_identity = mock_get_all_card_info.call_args.args[0]
    assert called_identity.name == "Charizard"
    assert called_identity.card_number == "4"
    assert called_identity.language == "English"