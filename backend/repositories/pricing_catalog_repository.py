"""Repository access for PriceCharting catalog records."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Protocol

from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..db.models import PricingCatalogTable

PRICING_CATALOG_UPSERT_BATCH_SIZE = 4000


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
        """Upsert incoming catalog records and return the processed row count."""

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

        if not records:
            return 0

        rows = [
            {
                "id": record.id,
                "console_name": record.console_name,
                "product_name": record.product_name,
                "loose_price": record.loose_price,
                "tcg_id": record.tcg_id,
                "image_url": record.image_url,
                "refreshed_at": refreshed_at,
            }
            for record in records
        ]

        for start in range(0, len(rows), PRICING_CATALOG_UPSERT_BATCH_SIZE):
            batch = rows[start : start + PRICING_CATALOG_UPSERT_BATCH_SIZE]
            statement = insert(PricingCatalogTable).values(batch)
            statement = statement.on_conflict_do_update(
                index_elements=[PricingCatalogTable.id],
                set_={
                    "console_name": statement.excluded.console_name,
                    "product_name": statement.excluded.product_name,
                    "loose_price": statement.excluded.loose_price,
                    "tcg_id": statement.excluded.tcg_id,
                    "image_url": statement.excluded.image_url,
                    "refreshed_at": statement.excluded.refreshed_at,
                },
            )
            await self._session.exec(statement)

        await self._session.commit()

        return len(records)

    async def count_rows(self) -> int:
        statement = select(func.count()).select_from(PricingCatalogTable)
        return int((await self._session.exec(statement)).one())

    async def get_last_refreshed_at(self) -> datetime | None:
        statement = select(func.max(PricingCatalogTable.refreshed_at))
        return (await self._session.exec(statement)).one()
