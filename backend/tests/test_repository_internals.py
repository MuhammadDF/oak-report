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
    PostgresCollectionRepository,
    _hydrate_item_record,
    _to_item_record,
)
from backend.repositories.factory import (
    get_collection_repository,
    get_library_repository,
    get_pricing_catalog_repository,
    get_user_repository,
)
from backend.repositories.library_repository import MockLibraryRepository
from backend.repositories.pricing_catalog_repository import (
    PostgresPricingCatalogRepository,
    PricingCatalogRecord,
)
from backend.repositories.user_repository import (
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
async def test_library_mock_repository_returns_expected_data() -> None:
    library_cards = await MockLibraryRepository().list_cards()
    assert len(library_cards) == 4


def test_repository_factory_respects_provider_and_caching(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import backend.repositories.factory as factory

    monkeypatch.setenv("DATA_PROVIDER", "mock")
    factory._library_repo = None

    assert get_library_repository() is get_library_repository()

    monkeypatch.setenv("DATA_PROVIDER", "postgres")
    session = object()
    assert get_collection_repository(
        session).__class__.__name__ == "PostgresCollectionRepository"
    assert get_pricing_catalog_repository(
        session).__class__.__name__ == "PostgresPricingCatalogRepository"
    assert get_user_repository(
        session).__class__.__name__ == "PostgresUserRepository"

    with pytest.raises(ValueError, match="database session is required"):
        get_collection_repository()
    with pytest.raises(ValueError, match="database session is required"):
        get_pricing_catalog_repository()
    with pytest.raises(ValueError, match="database session is required"):
        get_user_repository()

    factory._library_repo = None

    assert get_library_repository().__class__.__name__ == "MockLibraryRepository"
    factory._library_repo = None

    monkeypatch.setenv("DATA_PROVIDER", "invalid")
    factory._library_repo = None

    with pytest.raises(ValueError, match="Unsupported DATA_PROVIDER 'invalid'"):
        get_library_repository()
    with pytest.raises(ValueError, match="Unsupported DATA_PROVIDER 'invalid'"):
        get_collection_repository(object())
    with pytest.raises(ValueError, match="Unsupported DATA_PROVIDER 'invalid'"):
        get_pricing_catalog_repository(object())
    with pytest.raises(ValueError, match="Unsupported DATA_PROVIDER 'invalid'"):
        get_user_repository(object())


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
    assert next(item for item in updated.items if item.id ==
                "card-1").quantity == 7

    removed_by_zero = await repository.update_quantity("user-1", "card-1", 0)
    assert {item.id for item in removed_by_zero.items} == {"card-2"}

    with pytest.raises(KeyError):
        await repository.remove_item("user-1", "missing")

    removed = await repository.remove_item("user-1", "card-2")
    assert removed.items == []


@pytest.mark.asyncio(loop_scope="session")
async def test_postgres_collection_repository_reflects_catalog_price_updates(
    db_session,
) -> None:
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
    db_session.add(
        PricingCatalogTable(
            id="pc-1",
            console_name="Base Set",
            product_name="Charizard #4",
            loose_price=249.99,
            tcg_id=None,
            image_url="",
        )
    )
    await db_session.commit()

    repository = PostgresCollectionRepository(db_session)

    added = await repository.add_item(
        "user-1",
        CollectionItemRecord(
            id="card-1",
            name="Charizard",
            set="Base Set",
            number="4",
            price=123.45,
            image="https://example.com/card.jpg",
            grade="NM",
            quantity=1,
            pricing_catalog_id="pc-1",
        ),
    )

    assert added.items[0].pricing_catalog_id == "pc-1"
    assert added.items[0].price == 249.99

    catalog_row = (
        await db_session.exec(
            select(PricingCatalogTable).where(PricingCatalogTable.id == "pc-1")
        )
    ).first()
    assert catalog_row is not None
    catalog_row.loose_price = 299.99
    await db_session.commit()

    refreshed = await repository.get_collection("user-1")

    assert refreshed.items[0].pricing_catalog_id == "pc-1"
    assert refreshed.items[0].price == 299.99


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
async def test_hydrate_item_record_uses_catalog_price() -> None:
    from backend.db.models import PricingCatalogTable

    class FakeResult:
        def __init__(self, *, first_value=None, all_values=None):
            self._first_value = first_value
            self._all_values = all_values or []

        def first(self):
            return self._first_value

        def all(self):
            return self._all_values

    class FakeSession:
        def __init__(self, results):
            self._results = list(results)

        async def exec(self, statement):
            _ = statement
            return self._results.pop(0)

    session = FakeSession(
        [
            FakeResult(
                all_values=[
                    PricingCatalogTable(
                        id="pc-1",
                        console_name="Base Set",
                        product_name="Charizard #4",
                        loose_price=319.99,
                        tcg_id=None,
                        image_url="",
                    )
                ]
            )
        ]
    )
    row = SimpleNamespace(
        card_id="card-1",
        name="Charizard",
        set="Base Set",
        number="4",
        price=249.99,
        image="https://example.com/card.jpg",
        grade="NM",
        quantity=2,
        pricing_catalog_id=None,
    )

    item = await _hydrate_item_record(session, _to_item_record(row))

    assert item.pricing_catalog_id == "pc-1"
    assert item.price == 319.99


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
        identity.model_copy(
            update={"subject": "new-user", "email": "new@example.com", "display_name": "New"})
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
