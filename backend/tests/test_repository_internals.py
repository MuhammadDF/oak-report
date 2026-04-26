from __future__ import annotations

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import pytest
from sqlmodel import select

from backend.auth.google_auth import GoogleUserIdentity
from backend.db.models import CollectionItemTable, PricingCatalogTable, UserTable
from backend.models.user_profile import UserRole
from backend.repositories.collection_repository import (
    CollectionItemRecord,
    InMemoryCollectionRepository,
    PostgresCollectionRepository,
    _to_item_record,
)
from backend.repositories.factory import (
    get_collection_repository,
    get_library_repository,
    get_pricing_catalog_repository,
    get_scan_catalog_repository,
    get_search_repository,
    get_user_repository,
)
from backend.repositories.library_repository import MockLibraryRepository
from backend.repositories.pricing_catalog_repository import (
    PostgresPricingCatalogRepository,
    PricingCatalogRecord,
)
from backend.repositories.scan_catalog_repository import MockScanCatalogRepository
from backend.repositories.search_repository import MockSearchRepository
from backend.repositories.user_repository import (
    InMemoryUserRepository,
    PostgresUserRepository,
    _to_user_profile,
)


def _collection_item(quantity: int = 1) -> CollectionItemRecord:
    return CollectionItemRecord(
        id="card-1",
        name="Charizard",
        set="Base Set",
        number="4",
        price=249.99,
        image="https://example.com/card.jpg",
        grade="NM",
        quantity=quantity,
    )


@pytest.mark.asyncio(loop_scope="session")
async def test_mock_repositories_return_expected_data() -> None:
    library_cards = await MockLibraryRepository().list_cards()
    assert len(library_cards) == 4

    empty_results = await MockSearchRepository().search_cards("   ")
    charizard_results = await MockSearchRepository().search_cards("charizard")
    assert empty_results == []
    assert len(charizard_results) == 3

    scan_repo = MockScanCatalogRepository()
    assert (await scan_repo.select_card_identity(b"")).name == "Charizard ex"
    assert (await scan_repo.select_card_identity(bytes([1]))).name == "Mewtwo VSTAR"


def test_repository_factory_respects_provider_and_caching(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import backend.repositories.factory as factory

    monkeypatch.setenv("DATA_PROVIDER", "mock")
    factory._library_repo = None
    factory._search_repo = None
    factory._scan_catalog_repo = None

    assert get_library_repository() is get_library_repository()
    assert get_search_repository() is get_search_repository()
    assert get_scan_catalog_repository() is get_scan_catalog_repository()

    monkeypatch.setenv("DATA_PROVIDER", "postgres")
    session = object()
    assert get_collection_repository(session).__class__.__name__ == "PostgresCollectionRepository"
    assert get_pricing_catalog_repository(session).__class__.__name__ == "PostgresPricingCatalogRepository"
    assert get_user_repository(session).__class__.__name__ == "PostgresUserRepository"

    with pytest.raises(ValueError, match="database session is required"):
        get_collection_repository()
    with pytest.raises(ValueError, match="database session is required"):
        get_pricing_catalog_repository()
    with pytest.raises(ValueError, match="database session is required"):
        get_user_repository()

    factory._library_repo = None
    factory._search_repo = None
    factory._scan_catalog_repo = None

    assert get_library_repository().__class__.__name__ == "MockLibraryRepository"
    factory._library_repo = None
    assert get_search_repository().__class__.__name__ == "MockSearchRepository"
    factory._search_repo = None
    assert get_scan_catalog_repository().__class__.__name__ == "MockScanCatalogRepository"

    monkeypatch.setenv("DATA_PROVIDER", "invalid")
    factory._library_repo = None
    factory._search_repo = None
    factory._scan_catalog_repo = None

    with pytest.raises(ValueError, match="Unsupported DATA_PROVIDER 'invalid'"):
        get_library_repository()
    with pytest.raises(ValueError, match="Unsupported DATA_PROVIDER 'invalid'"):
        get_search_repository()
    with pytest.raises(ValueError, match="Unsupported DATA_PROVIDER 'invalid'"):
        get_scan_catalog_repository()
    with pytest.raises(ValueError, match="Unsupported DATA_PROVIDER 'invalid'"):
        get_collection_repository(object())
    with pytest.raises(ValueError, match="Unsupported DATA_PROVIDER 'invalid'"):
        get_pricing_catalog_repository(object())
    with pytest.raises(ValueError, match="Unsupported DATA_PROVIDER 'invalid'"):
        get_user_repository(object())


@pytest.mark.asyncio(loop_scope="session")
async def test_in_memory_collection_repository_covers_merge_update_and_remove() -> None:
    repository = InMemoryCollectionRepository()
    item = _collection_item()

    record = await repository.add_item("user-1", item)
    assert len(record.items) == 1

    merged = await repository.add_item("user-1", _collection_item(quantity=2))
    assert merged.items[0].quantity == 3

    updated = await repository.update_quantity("user-1", "card-1", 7)
    assert updated.items[0].quantity == 7

    removed_by_zero = await repository.update_quantity("user-1", "card-1", 0)
    assert removed_by_zero.items == []

    with pytest.raises(KeyError):
        await repository.update_quantity("user-1", "missing", 1)
    with pytest.raises(KeyError):
        await repository.remove_item("user-1", "missing")

    await repository.add_item("user-1", _collection_item())
    removed = await repository.remove_item("user-1", "card-1")
    assert removed.items == []


@pytest.mark.asyncio(loop_scope="session")
async def test_postgres_collection_repository_covers_all_paths(db_session, db_session_factory) -> None:
    db_session.add(
        UserTable(
            id="user-1",
            email="ash@example.com",
            display_name="Ash",
            role="collector",
            hashed_password="secret",
            feature_flags={},
        )
    )
    await db_session.commit()

    db_session.add(
        CollectionItemTable(
            owner_id="user-1",
            card_id="card-1",
            name="Charizard",
            set="Base Set",
            number="4",
            price=249.99,
            image="https://example.com/card.jpg",
            grade="NM",
            quantity=2,
        )
    )
    await db_session.commit()

    repository = PostgresCollectionRepository(db_session)

    collection = await repository.get_collection("user-1")
    assert collection.items[0].id == "card-1"

    merged = await repository.add_item("user-1", _collection_item(quantity=3))
    assert merged.items[0].quantity == 5

    created = await repository.add_item(
        "user-1",
        CollectionItemRecord(
            id="card-2",
            name="Blastoise",
            set="Base Set",
            number="2",
            price=149.99,
            image="https://example.com/blastoise.jpg",
            grade=None,
            quantity=1,
        ),
    )
    assert {item.id for item in created.items} == {"card-1", "card-2"}

    async with db_session_factory() as verify_session:
        rows = (
            await verify_session.exec(
                select(CollectionItemTable)
                .where(CollectionItemTable.owner_id == "user-1")
                .order_by(CollectionItemTable.card_id)
            )
        ).all()
    assert [row.card_id for row in rows] == ["card-1", "card-2"]
    assert rows[0].quantity == 5

    with pytest.raises(KeyError):
        await repository.update_quantity("user-1", "missing", 1)

    updated = await repository.update_quantity("user-1", "card-1", 7)
    assert next(item for item in updated.items if item.id == "card-1").quantity == 7

    removed_by_zero = await repository.update_quantity("user-1", "card-1", 0)
    assert {item.id for item in removed_by_zero.items} == {"card-2"}

    with pytest.raises(KeyError):
        await repository.remove_item("user-1", "missing")

    removed = await repository.remove_item("user-1", "card-2")
    assert removed.items == []


def test_to_item_record_maps_collection_row() -> None:
    row = SimpleNamespace(
        card_id="card-1",
        name="Charizard",
        set="Base Set",
        number="4",
        price=249.99,
        image="https://example.com/card.jpg",
        grade="NM",
        quantity=2,
    )

    item = _to_item_record(row)

    assert item.id == "card-1"
    assert item.quantity == 2


@pytest.mark.asyncio(loop_scope="session")
async def test_in_memory_user_repository_covers_admin_search_and_role_update() -> None:
    repository = InMemoryUserRepository()
    now = datetime.now(UTC)
    admin_identity = GoogleUserIdentity(
        subject="admin-user",
        email="muhammadfouly@gmail.com",
        display_name="Admin",
        issued_at=now,
        expires_at=now + timedelta(hours=1),
    )
    user_identity = GoogleUserIdentity(
        subject="collector-user",
        email="ash@example.com",
        display_name="Ash",
        issued_at=now,
        expires_at=now + timedelta(hours=1),
    )

    admin = await repository.upsert_google_user(admin_identity)
    collector = await repository.upsert_google_user(user_identity)
    updated = await repository.upsert_google_user(
        user_identity.model_copy(update={"display_name": "Ash Ketchum"})
    )

    assert admin.role == UserRole.ADMIN
    assert collector.role == UserRole.NA
    assert updated.display_name == "Ash Ketchum"
    assert await repository.get_user_by_id("collector-user") is not None

    filtered, total = await repository.list_users(
        page=1,
        page_size=10,
        search="ash",
        role=UserRole.NA.value,
    )
    assert total == 1
    assert filtered[0].id == "collector-user"

    paged, total_all = await repository.list_users(page=2, page_size=1, search=None, role=None)
    assert total_all == 2
    assert len(paged) == 1

    assert await repository.update_user_role(user_id="missing", role=UserRole.ADMIN) is None
    assert (await repository.update_user_role(user_id="collector-user", role=UserRole.COLLECTOR)).role == (
        UserRole.COLLECTOR
    )


@pytest.mark.asyncio(loop_scope="session")
async def test_postgres_user_repository_covers_all_paths(db_session, db_session_factory) -> None:
    now = datetime.now(UTC)
    identity = GoogleUserIdentity(
        subject="google-sub",
        email="ash@example.com",
        display_name="Ash",
        issued_at=now,
        expires_at=now + timedelta(hours=1),
    )
    db_session.add(
        UserTable(
            id="google-sub",
            email="old@example.com",
            display_name="Old",
            role="collector",
            created_at=now,
            last_login_at=now,
            hashed_password="secret",
            feature_flags={},
        )
    )
    await db_session.commit()

    repository = PostgresUserRepository(db_session)

    updated = await repository.upsert_google_user(identity)
    created = await repository.upsert_google_user(
        identity.model_copy(update={"subject": "new-user", "email": "new@example.com", "display_name": "New"})
    )
    assert updated.email == "ash@example.com"
    assert created.id == "new-user"

    assert await repository.get_user_by_id("missing") is None
    assert (await repository.get_user_by_id("new-user")).id == "new-user"

    users, total = await repository.list_users(page=1, page_size=20, search="new", role="na")
    assert total == 1
    assert users[0].id == "new-user"

    assert await repository.update_user_role(user_id="missing", role=UserRole.COLLECTOR) is None
    assert (await repository.update_user_role(user_id="new-user", role=UserRole.COLLECTOR)).role == (
        UserRole.COLLECTOR
    )

    async with db_session_factory() as verify_session:
        created_row = (
            await verify_session.exec(select(UserTable).where(UserTable.id == "new-user"))
        ).first()
    assert created_row is not None
    assert created_row.role == "collector"


def test_to_user_profile_handles_invalid_role_invalid_email_and_other_validation_errors() -> None:
    now = datetime.now(UTC)
    invalid_role_row = SimpleNamespace(
        id="user-1",
        email="ash@example.com",
        display_name="Ash",
        role="weird-role",
        created_at=now,
        last_login_at=now,
        hashed_password="secret",
        mfa_enabled=False,
        recovery_email=None,
        recovery_phone=None,
        feature_flags={},
        disabled=False,
        notes=None,
    )
    invalid_email_row = SimpleNamespace(
        id="user-2",
        email="demo@oak-report.local",
        display_name="Demo",
        role="admin",
        created_at=now,
        last_login_at=now,
        hashed_password="secret",
        mfa_enabled=False,
        recovery_email=None,
        recovery_phone=None,
        feature_flags={},
        disabled=False,
        notes=None,
    )
    invalid_created_at_row = SimpleNamespace(
        id="user-3",
        email="ash@example.com",
        display_name="Ash",
        role="admin",
        created_at=None,
        last_login_at=now,
        hashed_password="secret",
        mfa_enabled=False,
        recovery_email=None,
        recovery_phone=None,
        feature_flags={},
        disabled=False,
        notes=None,
    )

    assert _to_user_profile(invalid_role_row).role == UserRole.NA
    assert _to_user_profile(invalid_email_row).email == "demo@oak-report.local"
    with pytest.raises(Exception):
        _to_user_profile(invalid_created_at_row)


@pytest.mark.asyncio(loop_scope="session")
async def test_postgres_pricing_catalog_repository_covers_replace_count_and_last_refresh(
    db_session,
    db_session_factory,
) -> None:
    repository = PostgresPricingCatalogRepository(db_session)
    records = [
        PricingCatalogRecord(
            id="pc-1",
            console_name="Pokemon Base Set",
            product_name="Charizard #4",
            loose_price=249.99,
            tcg_id="1234",
            image_url="https://example.com/card.jpg",
        )
    ]

    assert await repository.replace_all_rows(records) == 1
    assert await repository.replace_all_rows([]) == 0
    assert await repository.replace_all_rows(records) == 1
    assert await repository.count_rows() == 1

    last_refreshed_at = await repository.get_last_refreshed_at()
    assert last_refreshed_at is not None

    async with db_session_factory() as verify_session:
        row = (await verify_session.exec(select(PricingCatalogTable))).first()
    assert row is not None
    assert row.id == "pc-1"
    assert row.refreshed_at == last_refreshed_at
