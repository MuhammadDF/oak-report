"""Reset the local development database and reseed data."""

from __future__ import annotations

import asyncio

import asyncpg

from ..db.config import get_database_settings
from .create_database import (
    _create_database_if_missing,
    _normalized_postgres_url,
    _run_migrations,
)
from .seed_data import seed_dev_data
from ..db.session import SessionLocal


async def _reset_schema() -> None:
    settings = get_database_settings()
    connection = await asyncpg.connect(_normalized_postgres_url(settings.database_url))
    try:
        await connection.execute("DROP SCHEMA IF EXISTS public CASCADE")
        await connection.execute("CREATE SCHEMA public")
    finally:
        await connection.close()


async def _main() -> None:
    await _create_database_if_missing()
    await _reset_schema()
    _run_migrations()
    async with SessionLocal() as session:
        await seed_dev_data(session)


if __name__ == "__main__":
    asyncio.run(_main())
