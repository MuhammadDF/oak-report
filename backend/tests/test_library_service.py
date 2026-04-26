from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from backend.services.library_service import list_library_cards


@pytest.mark.asyncio
async def test_list_library_cards_maps_repository_cards() -> None:
    repository = MagicMock()
    repository_card = MagicMock()
    repository_card.id = "xy-1"
    repository_card.name = "Pikachu"
    repository_card.set = "XY Base"
    repository_card.number = "42"
    repository_card.rarity = "Common"
    repository_card.type = "Electric"
    repository_card.price = 1.25

    async def _mock_list_cards():
        return [repository_card]

    repository.list_cards = MagicMock(side_effect=_mock_list_cards)

    with patch("backend.services.library_service.get_library_repository", return_value=repository):
        result = await list_library_cards()

    assert len(result) == 1
    assert result[0].id == "xy-1"
    assert result[0].name == "Pikachu"
    repository.list_cards.assert_called_once()