"""Weekly synchronization service for the PriceCharting CSV catalog."""

from __future__ import annotations

import asyncio
import csv
from dataclasses import dataclass
from io import StringIO
import logging
import os
from typing import Final

from ..repositories.pricing_catalog_repository import (
    PricingCatalogRecord,
    PricingCatalogRepository,
)
from .pricing_service import get_all_cards

logger = logging.getLogger(__name__)

CSV_ID_FIELD: Final[str] = "id"
CSV_CONSOLE_FIELD: Final[str] = "console-name"
CSV_PRODUCT_FIELD: Final[str] = "product-name"
CSV_LOOSE_PRICE_FIELD: Final[str] = "loose-price"


@dataclass(frozen=True)
class PricingCatalogSyncSettings:
    enabled: bool
    interval_seconds: int
    run_on_startup: bool


@dataclass(frozen=True)
class PricingCatalogSyncResult:
    rows_loaded: int


def _as_bool(raw: str | None, *, default: bool = False) -> bool:
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def get_pricing_catalog_sync_settings() -> PricingCatalogSyncSettings:
    interval_raw = os.getenv("PRICING_CATALOG_REFRESH_INTERVAL_SECONDS", "604800")
    try:
        interval_seconds = max(3600, int(interval_raw))
    except ValueError:
        interval_seconds = 604800

    return PricingCatalogSyncSettings(
        enabled=_as_bool(os.getenv("PRICING_CATALOG_REFRESH_ENABLED"), default=True),
        interval_seconds=interval_seconds,
        run_on_startup=_as_bool(os.getenv("PRICING_CATALOG_REFRESH_ON_STARTUP"), default=True),
    )


def _parse_loose_price(raw: str | None) -> float:
    if raw is None:
        return 0.0

    cleaned = raw.strip().replace("$", "").replace(",", "")
    if not cleaned:
        return 0.0

    try:
        return max(0.0, float(cleaned))
    except ValueError:
        return 0.0


def _parse_catalog_csv(csv_payload: str) -> list[PricingCatalogRecord]:
    reader = csv.DictReader(StringIO(csv_payload))
    deduped: dict[str, PricingCatalogRecord] = {}

    for row in reader:
        card_id = (row.get(CSV_ID_FIELD) or "").strip()
        if not card_id:
            continue

        deduped[card_id] = PricingCatalogRecord(
            id=card_id,
            console_name=(row.get(CSV_CONSOLE_FIELD) or "").strip(),
            product_name=(row.get(CSV_PRODUCT_FIELD) or "").strip(),
            loose_price=_parse_loose_price(row.get(CSV_LOOSE_PRICE_FIELD)),
        )

    return list(deduped.values())


async def refresh_pricing_catalog(
    repository: PricingCatalogRepository,
) -> PricingCatalogSyncResult:
    logger.info("Starting PriceCharting catalog refresh")
    csv_payload = await asyncio.to_thread(get_all_cards)
    records = _parse_catalog_csv(csv_payload)
    loaded = await repository.replace_all_rows(records)
    logger.info("Completed PriceCharting catalog refresh with %s rows", loaded)
    return PricingCatalogSyncResult(rows_loaded=loaded)
