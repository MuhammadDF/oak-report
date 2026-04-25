"""Seed baseline development data from the project CSV."""

from __future__ import annotations

import csv
from pathlib import Path

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..db.models import CollectionItemTable, UserTable

CSV_PATH = Path(__file__).resolve().parents[2] / "data" / "pokemon_cards.csv"
DEMO_USER_ID = "demo-user"
DEMO_EMAIL = "demo@oak-report.local"
MAX_SEED_ROWS = 12


def _parse_price(raw: str | None) -> float:
    if not raw:
        return 0.0
    try:
        return max(0.0, float(raw))
    except ValueError:
        return 0.0


async def seed_dev_data(session: AsyncSession) -> None:
    existing_user = (
        await session.exec(select(UserTable).where(UserTable.id == DEMO_USER_ID))
    ).first()

    if existing_user is None:
        session.add(
            UserTable(
                id=DEMO_USER_ID,
                email=DEMO_EMAIL,
                display_name="Demo Collector",
                role="collector",
                hashed_password="seeded-demo-user",
                feature_flags={
                    "memory_bank_enabled": True,
                    "proxy_check_enabled": True,
                    "instant_appraisal_enabled": True,
                    "library_search_enabled": True,
                    "admin_dashboard_enabled": False,
                    "bulk_scan_enabled": False,
                    "user_management_enabled": False,
                    "account_disable_enabled": False,
                },
            )
        )

    existing_items = await session.exec(
        select(CollectionItemTable).where(CollectionItemTable.owner_id == DEMO_USER_ID)
    )
    if existing_items.first() is not None:
        await session.commit()
        return

    with CSV_PATH.open("r", newline="", encoding="utf-8") as file_handle:
        reader = csv.DictReader(file_handle)
        for index, row in enumerate(reader):
            if index >= MAX_SEED_ROWS:
                break

            session.add(
                CollectionItemTable(
                    owner_id=DEMO_USER_ID,
                    card_id=row.get("id") or f"seed-{index}",
                    name=row.get("product-name") or "Unknown Card",
                    set=row.get("console-name") or "Unknown Set",
                    number=str(index + 1),
                    price=_parse_price(row.get("new-price")),
                    image="https://placehold.co/600x840?text=Pokemon+Card",
                    quantity=1,
                )
            )

    await session.commit()
