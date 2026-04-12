"""Search repository abstractions and mock implementation."""

from __future__ import annotations

from typing import Protocol, Sequence

from ..models.card_search_model import CardSearchResultModel


class SearchRepository(Protocol):
    async def search_cards(self, query: str) -> list[CardSearchResultModel]:
        """Search cards for a normalized query string."""


class MockSearchRepository:
    """Mock search adapter used for development before durable storage is wired."""

    _search_cards: Sequence[dict[str, object]] = (
        {
            "id": "base-set-4",
            "name": "Charizard",
            "set": "Base Set",
            "rarity": "Holo Rare",
            "type": "Fire",
            "lowest_listing": 249.99,
        },
        {
            "id": "jpn-neo-15",
            "name": "Lugia",
            "set": "Neo Genesis",
            "rarity": "Holo Rare",
            "type": "Psychic",
            "lowest_listing": 189.0,
        },
        {
            "id": "sv1-89",
            "name": "Miraidon ex",
            "set": "Scarlet & Violet",
            "rarity": "Double Rare",
            "type": "Lightning",
            "lowest_listing": 32.5,
        },
        {
            "id": "sv2-80",
            "name": "Iono",
            "set": "Paldea Evolved",
            "rarity": "Ultra Rare",
            "type": "Trainer",
            "lowest_listing": 42.0,
        },
        {
            "id": "sv3-125",
            "name": "Charizard ex",
            "set": "Obsidian Flames",
            "rarity": "Ultra Rare",
            "type": "Fire",
            "lowest_listing": 94.75,
        },
        {
            "id": "swsh12-177",
            "name": "Lance's Charizard V",
            "set": "Silver Tempest",
            "rarity": "Ultra Rare",
            "type": "Dragon",
            "lowest_listing": 17.25,
        },
    )

    async def search_cards(self, query: str) -> list[CardSearchResultModel]:
        normalized = query.strip().lower()
        if not normalized:
            return []

        matches: list[CardSearchResultModel] = []
        for card in self._search_cards:
            name = str(card["name"]).lower()
            set_name = str(card["set"]).lower()
            if normalized in name or normalized in set_name:
                matches.append(CardSearchResultModel(**card))

        return matches[:5]
