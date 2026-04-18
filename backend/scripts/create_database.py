"""Create the local development database and apply migrations."""

from __future__ import annotations

import asyncio
from pathlib import Path
import subprocess
import sys
from urllib.parse import urlparse

import asyncpg
from sqlmodel.ext.asyncio.session import AsyncSession

from ..db.config import get_database_settings
from ..db.session import SessionLocal
from .seed_data import seed_dev_data

REPO_ROOT = Path(__file__).resolve().parents[2]


def _normalized_postgres_url(url: str) -> str:
    return url.replace("+asyncpg", "")


async def _create_database_if_missing() -> None:
    settings = get_database_settings()
    parsed = urlparse(_normalized_postgres_url(settings.database_url))
    target_db = parsed.path.lstrip("/")
    if not target_db:
        raise RuntimeError("DATABASE_URL must include a database name.")

    admin_db_url = parsed._replace(path="/postgres").geturl()
    connection = await asyncpg.connect(admin_db_url)
    try:
        exists = await connection.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            target_db,
        )
        if not exists:
            await connection.execute(f'CREATE DATABASE "{target_db}"')
    finally:
        await connection.close()


def _run_migrations() -> None:
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=REPO_ROOT,
        check=True,
    )


async def _seed() -> None:
    async with SessionLocal() as session:  # type: AsyncSession
        await seed_dev_data(session)


async def _main() -> None:
    await _create_database_if_missing()
    _run_migrations()
    await _seed()


if __name__ == "__main__":
    asyncio.run(_main())
