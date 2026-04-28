"""Repository factory for provider-based data source selection."""

from __future__ import annotations

import os
from sqlmodel.ext.asyncio.session import AsyncSession

from .collection_repository import (
    CollectionRepository,
    PostgresCollectionRepository,
)
from .library_repository import LibraryRepository, MockLibraryRepository
from .pricing_catalog_repository import (
    PostgresPricingCatalogRepository,
    PricingCatalogRepository,
)
from .user_repository import (
    PostgresUserRepository,
    UserRepository,
)

_library_repo: LibraryRepository | None = None


def _provider_name() -> str:
    return os.getenv("DATA_PROVIDER", "postgres").strip().lower()


def get_collection_repository(session: AsyncSession | None = None) -> CollectionRepository:
    provider = _provider_name()

    if provider != "postgres":
        raise ValueError(f"Unsupported DATA_PROVIDER '{provider}'. Collection data must come from Postgres.")

    if session is None:
        raise ValueError("A database session is required for postgres collection repository.")

    return PostgresCollectionRepository(session)


def get_pricing_catalog_repository(
    session: AsyncSession | None = None,
) -> PricingCatalogRepository:
    provider = _provider_name()

    if provider != "postgres":
        raise ValueError(
            f"Unsupported DATA_PROVIDER '{provider}'. Pricing catalog data must come from Postgres."
        )

    if session is None:
        raise ValueError("A database session is required for postgres pricing catalog repository.")

    return PostgresPricingCatalogRepository(session)


def get_library_repository() -> LibraryRepository:
    global _library_repo

    if _library_repo is not None:
        return _library_repo

    provider = _provider_name()
    if provider == "mock":
        _library_repo = MockLibraryRepository()
        return _library_repo

    if provider == "postgres":
        _library_repo = MockLibraryRepository()
        return _library_repo

    raise ValueError(f"Unsupported DATA_PROVIDER '{provider}'.")


def get_user_repository(session: AsyncSession | None = None) -> UserRepository:
    provider = _provider_name()

    if provider != "postgres":
        raise ValueError(f"Unsupported DATA_PROVIDER '{provider}'. User data must come from Postgres.")

    if session is None:
        raise ValueError("A database session is required for postgres user repository.")

    return PostgresUserRepository(session)
