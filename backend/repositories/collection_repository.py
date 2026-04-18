"""Collection repository abstractions and mock implementation."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass
class CollectionItemRecord:
    id: str
    name: str
    set: str
    number: str
    price: float
    trend: str
    trend_pct: float
    image: str
    grade: str | None
    quantity: int


@dataclass
class CollectionRecord:
    owner_id: str
    items: list[CollectionItemRecord]


class CollectionRepository(Protocol):
    async def get_collection(self, owner_id: str) -> CollectionRecord:
        """Return a collection record for a user."""

    async def add_item(
        self,
        owner_id: str,
        item: CollectionItemRecord,
    ) -> CollectionRecord:
        """Add or merge a collection item for the user."""

    async def update_quantity(
        self,
        owner_id: str,
        item_id: str,
        quantity: int,
    ) -> CollectionRecord:
        """Update the quantity for an item. Zero removes the item."""

    async def remove_item(self, owner_id: str, item_id: str) -> CollectionRecord:
        """Remove an item from the user's collection."""


class InMemoryCollectionRepository:
    """Simple in-memory collection adapter used until persistence is added."""

    def __init__(self) -> None:
        self._collections: dict[str, CollectionRecord] = {}

    async def get_collection(self, owner_id: str) -> CollectionRecord:
        return self._collections.setdefault(
            owner_id,
            CollectionRecord(owner_id=owner_id, items=[]),
        )

    async def add_item(
        self,
        owner_id: str,
        item: CollectionItemRecord,
    ) -> CollectionRecord:
        record = await self.get_collection(owner_id)
        existing = next((entry for entry in record.items if entry.id == item.id), None)
        if existing:
            existing.quantity += max(1, item.quantity)
            existing.price = item.price
            existing.grade = item.grade
            existing.image = item.image
            existing.name = item.name
            existing.set = item.set
            existing.number = item.number
            existing.trend = item.trend
            existing.trend_pct = item.trend_pct
            return record

        record.items.append(item)
        return record

    async def update_quantity(
        self,
        owner_id: str,
        item_id: str,
        quantity: int,
    ) -> CollectionRecord:
        record = await self.get_collection(owner_id)
        item = next((entry for entry in record.items if entry.id == item_id), None)
        if item is None:
            raise KeyError(item_id)

        if quantity <= 0:
            record.items = [entry for entry in record.items if entry.id != item_id]
            return record

        item.quantity = quantity
        return record

    async def remove_item(self, owner_id: str, item_id: str) -> CollectionRecord:
        record = await self.get_collection(owner_id)
        existing_count = len(record.items)
        record.items = [entry for entry in record.items if entry.id != item_id]
        if len(record.items) == existing_count:
            raise KeyError(item_id)

        return record
