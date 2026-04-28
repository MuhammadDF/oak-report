"""Collection repository abstractions and Postgres implementation."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Protocol

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..db.models import CollectionItemTable, PricingCatalogTable


CARD_NUMBER_PATTERN = re.compile(r"#\s*([A-Za-z0-9-]+)")


@dataclass
class CollectionItemRecord:
    id: str
    name: str
    set: str
    number: str
    price: float
    image: str
    grade: str | None
    quantity: int
    pricing_catalog_id: str | None = None


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


class PostgresCollectionRepository:
    """Postgres-backed collection adapter."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_collection(self, owner_id: str) -> CollectionRecord:
        statement = (
            select(CollectionItemTable)
            .where(CollectionItemTable.owner_id == owner_id)
            .order_by(CollectionItemTable.name.asc())
        )
        rows = (await self._session.exec(statement)).all()
        items: list[CollectionItemRecord] = []
        for row in rows:
            items.append(await _hydrate_item_record(self._session, _to_item_record(row)))

        return CollectionRecord(owner_id=owner_id, items=items)

    async def add_item(
        self,
        owner_id: str,
        item: CollectionItemRecord,
    ) -> CollectionRecord:
        pricing_catalog_row = await _resolve_pricing_catalog_row(self._session, item)
        live_price = _current_price(item.price, pricing_catalog_row)
        pricing_catalog_id = pricing_catalog_row.id if pricing_catalog_row else item.pricing_catalog_id

        statement = select(CollectionItemTable).where(
            CollectionItemTable.owner_id == owner_id,
            CollectionItemTable.card_id == item.id,
        )
        existing = (await self._session.exec(statement)).first()

        if existing:
            existing.quantity += max(1, item.quantity)
            existing.price = live_price
            existing.grade = item.grade
            existing.image = item.image
            existing.name = item.name
            existing.set = item.set
            existing.number = item.number
            existing.pricing_catalog_id = pricing_catalog_id
            await self._session.commit()
            return await self.get_collection(owner_id)

        row = CollectionItemTable(
            owner_id=owner_id,
            card_id=item.id,
            pricing_catalog_id=pricing_catalog_id,
            name=item.name,
            set=item.set,
            number=item.number,
            price=live_price,
            image=item.image,
            grade=item.grade,
            quantity=max(1, item.quantity),
        )
        self._session.add(row)
        await self._session.commit()
        return await self.get_collection(owner_id)

    async def update_quantity(
        self,
        owner_id: str,
        item_id: str,
        quantity: int,
    ) -> CollectionRecord:
        statement = select(CollectionItemTable).where(
            CollectionItemTable.owner_id == owner_id,
            CollectionItemTable.card_id == item_id,
        )
        row = (await self._session.exec(statement)).first()

        if row is None:
            raise KeyError(item_id)

        if quantity <= 0:
            await self._session.delete(row)
            await self._session.commit()
            return await self.get_collection(owner_id)

        row.quantity = quantity
        await self._session.commit()
        return await self.get_collection(owner_id)

    async def remove_item(self, owner_id: str, item_id: str) -> CollectionRecord:
        statement = select(CollectionItemTable).where(
            CollectionItemTable.owner_id == owner_id,
            CollectionItemTable.card_id == item_id,
        )
        row = (await self._session.exec(statement)).first()

        if row is None:
            raise KeyError(item_id)

        await self._session.delete(row)
        await self._session.commit()
        return await self.get_collection(owner_id)


def _current_price(default_price: float, pricing_catalog_row: PricingCatalogTable | None) -> float:
    if pricing_catalog_row is None:
        return default_price

    return float(pricing_catalog_row.loose_price)


def _normalize_card_number(value: str | None) -> str:
    if not value:
        return ""

    stripped = value.strip()
    if stripped.isdigit():
        return stripped.lstrip("0") or "0"

    return stripped.lower()


def _product_matches_card_number(product_name: str | None, card_num: str) -> bool:
    if not product_name:
        return False

    match = CARD_NUMBER_PATTERN.search(product_name)
    if not match:
        return False

    return _normalize_card_number(match.group(1)) == _normalize_card_number(card_num)


async def _resolve_pricing_catalog_row(
    session: AsyncSession,
    item: CollectionItemRecord,
) -> PricingCatalogTable | None:
    if item.pricing_catalog_id:
        statement = select(PricingCatalogTable).where(
            PricingCatalogTable.id == item.pricing_catalog_id,
        )
        return (await session.exec(statement)).first()

    card_num = item.number.split("/")[0] if item.number else "0"
    card_num = str(card_num).lstrip("0") or "0"
    statement = select(PricingCatalogTable).where(
        PricingCatalogTable.product_name.ilike(f"%{item.name}%")
    )

    if item.set and item.set.strip().lower() != "unknown set":
        statement = statement.where(
            PricingCatalogTable.console_name.ilike(f"%{item.set}%")
        )

    matches = (await session.exec(statement)).all()
    for match in matches:
        if _product_matches_card_number(match.product_name, card_num):
            return match

    return None


def _to_item_record(row: CollectionItemTable) -> CollectionItemRecord:
    return CollectionItemRecord(
        id=row.card_id,
        name=row.name,
        set=row.set,
        number=row.number,
        price=row.price,
        image=row.image,
        grade=row.grade,
        quantity=row.quantity,
        pricing_catalog_id=getattr(row, "pricing_catalog_id", None),
    )


async def _hydrate_item_record(
    session: AsyncSession,
    item: CollectionItemRecord,
) -> CollectionItemRecord:
    pricing_catalog_row = await _resolve_pricing_catalog_row(session, item)
    return CollectionItemRecord(
        id=item.id,
        name=item.name,
        set=item.set,
        number=item.number,
        price=_current_price(item.price, pricing_catalog_row),
        image=item.image,
        grade=item.grade,
        quantity=item.quantity,
        pricing_catalog_id=(
            pricing_catalog_row.id if pricing_catalog_row else item.pricing_catalog_id),
    )
