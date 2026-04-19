"""Repository access for PriceCharting catalog records."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Protocol

from sqlalchemy import func
from sqlmodel import delete, select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..db.models import PricingCatalogTable


@dataclass
class PricingCatalogRecord:
    id: str
    console_name: str
    product_name: str
    loose_price: float
    tcg_id: str | None
    image_url: str


class PricingCatalogRepository(Protocol):
    async def replace_all_rows(self, records: list[PricingCatalogRecord]) -> int:
        """Replace the full catalog with incoming records and return the row count."""

    async def count_rows(self) -> int:
        """Return number of rows in the catalog."""

    async def get_last_refreshed_at(self) -> datetime | None:
        """Return the latest refresh timestamp, if any rows exist."""


class PostgresPricingCatalogRepository:
    """Postgres-backed catalog repository."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def replace_all_rows(self, records: list[PricingCatalogRecord]) -> int:
        refreshed_at = datetime.now(timezone.utc)

        async with self._session.begin():
            await self._session.exec(delete(PricingCatalogTable))

            if records:
                rows = [
                    PricingCatalogTable(
                        id=record.id,
                        console_name=record.console_name,
                        product_name=record.product_name,
                        loose_price=record.loose_price,
                        tcg_id=record.tcg_id,
                        image_url=record.image_url,
                        refreshed_at=refreshed_at,
                    )
                    for record in records
                ]
                self._session.add_all(rows)

        return len(records)

    async def count_rows(self) -> int:
        statement = select(func.count()).select_from(PricingCatalogTable)
        return int((await self._session.exec(statement)).one())

    async def get_last_refreshed_at(self) -> datetime | None:
        statement = select(func.max(PricingCatalogTable.refreshed_at))
        return (await self._session.exec(statement)).one()
