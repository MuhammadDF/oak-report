"""Repository factory for provider-based data source selection."""

from __future__ import annotations

import os

from .collection_repository import CollectionRepository, InMemoryCollectionRepository
from .library_repository import LibraryRepository, MockLibraryRepository
from .search_repository import MockSearchRepository, SearchRepository
from .scan_catalog_repository import MockScanCatalogRepository, ScanCatalogRepository

_collection_repo: CollectionRepository | None = None
_library_repo: LibraryRepository | None = None
_search_repo: SearchRepository | None = None
_scan_catalog_repo: ScanCatalogRepository | None = None


def _provider_name() -> str:
    return os.getenv("DATA_PROVIDER", "mock").strip().lower()


def get_collection_repository() -> CollectionRepository:
    global _collection_repo

    if _collection_repo is not None:
        return _collection_repo

    provider = _provider_name()
    if provider == "mock":
        _collection_repo = InMemoryCollectionRepository()
        return _collection_repo

    if provider == "postgres":
        raise NotImplementedError(
            "Postgres collection repository not implemented yet. "
            "Add a Postgres adapter and wire it in factory.get_collection_repository()."
        )

    raise ValueError(f"Unsupported DATA_PROVIDER '{provider}'.")


def get_search_repository() -> SearchRepository:
    global _search_repo

    if _search_repo is not None:
        return _search_repo

    provider = _provider_name()
    if provider == "mock":
        _search_repo = MockSearchRepository()
        return _search_repo

    if provider == "postgres":
        raise NotImplementedError(
            "Postgres search repository not implemented yet. "
            "Add a Postgres adapter and wire it in factory.get_search_repository()."
        )

    raise ValueError(f"Unsupported DATA_PROVIDER '{provider}'.")


def get_library_repository() -> LibraryRepository:
    global _library_repo

    if _library_repo is not None:
        return _library_repo

    provider = _provider_name()
    if provider == "mock":
        _library_repo = MockLibraryRepository()
        return _library_repo

    if provider == "postgres":
        raise NotImplementedError(
            "Postgres library repository not implemented yet. "
            "Add a Postgres adapter and wire it in factory.get_library_repository()."
        )

    raise ValueError(f"Unsupported DATA_PROVIDER '{provider}'.")


def get_scan_catalog_repository() -> ScanCatalogRepository:
    global _scan_catalog_repo

    if _scan_catalog_repo is not None:
        return _scan_catalog_repo

    provider = _provider_name()
    if provider == "mock":
        _scan_catalog_repo = MockScanCatalogRepository()
        return _scan_catalog_repo

    if provider == "postgres":
        raise NotImplementedError(
            "Postgres scan-catalog repository not implemented yet. "
            "Add a Postgres adapter and wire it in factory.get_scan_catalog_repository()."
        )

    raise ValueError(f"Unsupported DATA_PROVIDER '{provider}'.")
