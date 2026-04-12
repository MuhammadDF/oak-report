"""Library repository abstractions and mock implementation."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass
class LibraryCardRecord:
    id: str
    name: str
    set: str
    number: str
    rarity: str
    type: str
    price: float


class LibraryRepository(Protocol):
    async def list_cards(self) -> list[LibraryCardRecord]:
        """List searchable library cards."""


class MockLibraryRepository:
    """Mock library adapter used for development before durable storage is wired."""

    _cards: tuple[LibraryCardRecord, ...] = (
        LibraryCardRecord(
            id="l1",
            name="Charizard ex",
            set="Obsidian Flames",
            number="223/197",
            rarity="Special Art Rare",
            type="Fire",
            price=89.99,
        ),
        LibraryCardRecord(
            id="l2",
            name="Mewtwo ex",
            set="SV 151",
            number="191/165",
            rarity="Special Art Rare",
            type="Psychic",
            price=67.0,
        ),
        LibraryCardRecord(
            id="l3",
            name="Giratina VSTAR",
            set="Lost Origin",
            number="131/196",
            rarity="Ultra Rare",
            type="Dragon",
            price=28.5,
        ),
        LibraryCardRecord(
            id="l4",
            name="Blastoise ex",
            set="Paldea Evolved",
            number="239/193",
            rarity="Special Art Rare",
            type="Water",
            price=48.0,
        ),
    )

    async def list_cards(self) -> list[LibraryCardRecord]:
        return list(self._cards)