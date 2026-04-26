from __future__ import annotations

from collections.abc import AsyncIterator
import asyncio
from pathlib import Path
import os
import sys
from urllib.parse import urlparse
from unittest.mock import MagicMock

import asyncpg
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import backend.db.models  # noqa: F401
from backend.auth.dependencies import get_current_user
from backend.auth.jwt_service import AuthTokenPayload
from backend.db.dependencies import (
    get_collection_repository_dependency,
    get_pricing_catalog_repository_dependency,
    get_user_repository_dependency,
)
from backend.main import app


def _test_database_url() -> str:
    database_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:password@postgres:5432/pokemon")
    parsed = urlparse(database_url)
    database_name = parsed.path.lstrip("/") or "pokemon"
    return parsed._replace(path=f"/{database_name}_test").geturl()


def _admin_database_url(database_url: str) -> str:
    parsed = urlparse(database_url.replace("+asyncpg", ""))
    return parsed._replace(path="/postgres").geturl()


async def _ensure_test_database_exists(database_url: str) -> None:
    parsed = urlparse(database_url)
    database_name = parsed.path.lstrip("/")

    connection = await asyncpg.connect(_admin_database_url(database_url))
    try:
        exists = await connection.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            database_name,
        )
        if not exists:
            try:
                await connection.execute(f'CREATE DATABASE "{database_name}"')
            except asyncpg.DuplicateDatabaseError:
                pass
    finally:
        await connection.close()


@pytest.fixture(scope="session")
def test_database_url() -> str:
    database_url = _test_database_url()
    asyncio.run(_ensure_test_database_exists(database_url))

    return database_url


@pytest_asyncio.fixture(scope="session", loop_scope="session")
async def test_engine(test_database_url: str):
    engine = create_async_engine(test_database_url, echo=False, pool_pre_ping=True)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(loop_scope="session")
async def db_session_factory(test_engine) -> AsyncIterator[async_sessionmaker[AsyncSession]]:
    async with test_engine.begin() as connection:
        await connection.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        await connection.execute(text("CREATE SCHEMA public"))
        await connection.run_sync(SQLModel.metadata.create_all)

    session_factory = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    yield session_factory

    async with test_engine.begin() as connection:
        await connection.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        await connection.execute(text("CREATE SCHEMA public"))


@pytest_asyncio.fixture(loop_scope="session")
async def db_session(
    db_session_factory: async_sessionmaker[AsyncSession],
) -> AsyncIterator[AsyncSession]:
    async with db_session_factory() as session:
        yield session


@pytest.fixture(autouse=True)
def override_auth_dependency() -> AsyncIterator[None]:
    def _mock_current_user() -> AuthTokenPayload:
        return AuthTokenPayload(
            sub="test-user",
            email="tester@example.com",
            display_name="Test User",
            role="admin",
            exp=4_102_444_800,
        )

    app.dependency_overrides[get_current_user] = _mock_current_user
    yield
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
def repository_mocks() -> AsyncIterator[dict[str, MagicMock]]:
    user_repository = MagicMock(name="user_repository")
    collection_repository = MagicMock(name="collection_repository")
    pricing_repository = MagicMock(name="pricing_repository")

    app.dependency_overrides[get_user_repository_dependency] = lambda: user_repository
    app.dependency_overrides[get_collection_repository_dependency] = lambda: collection_repository
    app.dependency_overrides[get_pricing_catalog_repository_dependency] = lambda: pricing_repository

    yield {
        "user_repository": user_repository,
        "collection_repository": collection_repository,
        "pricing_repository": pricing_repository,
    }

    app.dependency_overrides.pop(get_user_repository_dependency, None)
    app.dependency_overrides.pop(get_collection_repository_dependency, None)
    app.dependency_overrides.pop(get_pricing_catalog_repository_dependency, None)


@pytest_asyncio.fixture
async def async_client(repository_mocks: dict[str, MagicMock]) -> AsyncIterator[AsyncClient]:
    _ = repository_mocks
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client
