"""Scan catalog repository abstractions and mock implementation."""

from __future__ import annotations

from typing import Protocol

from ..models.card_model import CardIdentity


class ScanCatalogRepository(Protocol):
    async def select_card_identity(self, image_bytes: bytes) -> CardIdentity:
        """Resolve a card identity for an uploaded image payload."""


class MockScanCatalogRepository:
    """Mock card catalog adapter used before live catalog persistence is added."""

    _catalog = [
        CardIdentity(
            name="Charizard ex",
            card_number="203",
            language="English",
        ),
        CardIdentity(
            name="Mewtwo VSTAR",
            card_number="GG44",
            language="English",
        ),
        CardIdentity(
            name="Charizard",
            card_number="4",
            language="English",
        ),
    ]

    async def select_card_identity(self, image_bytes: bytes) -> CardIdentity:
        if not image_bytes:
            return self._catalog[0]
        index = image_bytes[0] % len(self._catalog)
        return self._catalog[index]
