"""Scan catalog repository abstractions and mock implementation."""

from __future__ import annotations

from typing import Protocol

from pydantic import HttpUrl

from ..models.card_model import CardIdentity


class ScanCatalogRepository(Protocol):
    async def select_card_identity(self, image_bytes: bytes) -> CardIdentity:
        """Resolve a card identity for an uploaded image payload."""


class MockScanCatalogRepository:
    """Mock card catalog adapter used before live catalog persistence is added."""

    _catalog = [
        CardIdentity(
            card_id="sv03-203",
            name="Charizard ex",
            supertype="Pokémon",
            set_name="Obsidian Flames",
            card_number="203",
            set_size=197,
            rarity="Ultra Rare",
            types=["Fire"],
            is_holo=True,
            promo=False,
            image_url=HttpUrl("https://images.pokemontcg.io/sv03/203.png"),
        ),
        CardIdentity(
            card_id="swsh12pt5gg-44",
            name="Mewtwo VSTAR",
            supertype="Pokémon",
            set_name="Crown Zenith",
            card_number="GG44",
            set_size=70,
            rarity="Ultra Rare",
            types=["Psychic"],
            is_holo=True,
            promo=False,
            image_url=HttpUrl("https://images.pokemontcg.io/swsh12pt5gg/GG44.png"),
        ),
        CardIdentity(
            card_id="base1-4",
            name="Charizard",
            supertype="Pokémon",
            set_name="Base Set",
            card_number="4",
            set_size=102,
            rarity="Rare",
            types=["Fire"],
            is_holo=True,
            promo=False,
            image_url=HttpUrl("https://images.pokemontcg.io/base1/4.png"),
        ),
    ]

    async def select_card_identity(self, image_bytes: bytes) -> CardIdentity:
        if not image_bytes:
            return self._catalog[0]
        index = image_bytes[0] % len(self._catalog)
        return self._catalog[index]
