from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from backend.repositories.collection_repository import CollectionItemRecord, CollectionRecord
from backend.services.collection_service import (
    AddCollectionItemInput,
    _build_item_id,
    add_scan_to_collection,
    get_collection_for_user,
    remove_collection_item,
    update_collection_quantity,
)


def test_build_item_id_includes_slugified_language() -> None:
    payload = AddCollectionItemInput(
        name="Charizard ex",
        set="Scarlet & Violet",
        number="006",
        price=9.99,
        language="Japanese",
    )

    assert _build_item_id(payload) == "card-charizard-ex-scarlet-violet-006-japanese"


@pytest.mark.asyncio
async def test_get_collection_for_user_maps_repository_record() -> None:
    record = CollectionRecord(
        owner_id="user-1",
        items=[
            CollectionItemRecord(
                id="card-1",
                name="Pikachu",
                set="Base Set",
                number="58",
                price=2.5,
                image="https://example.com/pikachu.jpg",
                grade=None,
                quantity=2,
            )
        ],
    )

    async def _mock_get_collection(owner_id):
        _ = owner_id
        return record

    repository = MagicMock()
    repository.get_collection = MagicMock(side_effect=_mock_get_collection)

    result = await get_collection_for_user("user-1", repository)

    assert result.owner_id == "user-1"
    assert len(result.items) == 1
    assert result.items[0].name == "Pikachu"
    repository.get_collection.assert_called_once_with("user-1")


@pytest.mark.asyncio
async def test_add_scan_to_collection_clamps_price_and_defaults_image() -> None:
    added_record = CollectionRecord(
        owner_id="user-1",
        items=[
            CollectionItemRecord(
                id="card-charizard-base-set-4",
                name="Charizard",
                set="Base Set",
                number="4",
                price=0.0,
                image="https://placehold.co/600x840?text=Pokemon+Card",
                grade=None,
                quantity=1,
            )
        ],
    )

    async def _mock_add_item(owner_id, item):
        _ = owner_id
        _ = item
        return added_record

    repository = MagicMock()
    repository.add_item = MagicMock(side_effect=_mock_add_item)

    payload = AddCollectionItemInput(
        name="Charizard",
        set="Base Set",
        number="4",
        price=-10.0,
        image=None,
        grade=None,
    )

    result = await add_scan_to_collection("user-1", payload, repository)

    assert result.owner_id == "user-1"
    assert result.added_item.price == 0.0
    assert result.added_item.image == "https://placehold.co/600x840?text=Pokemon+Card"
    assert result.total_items == 1
    repository.add_item.assert_called_once()


@pytest.mark.asyncio
async def test_update_collection_quantity_returns_summary() -> None:
    updated_record = CollectionRecord(
        owner_id="user-1",
        items=[
            CollectionItemRecord(
                id="card-1",
                name="Mew",
                set="151",
                number="151",
                price=12.0,
                image="https://example.com/mew.jpg",
                grade="NM",
                quantity=3,
            )
        ],
    )

    async def _mock_update_quantity(owner_id, item_id, quantity):
        _ = owner_id
        _ = item_id
        _ = quantity
        return updated_record

    repository = MagicMock()
    repository.update_quantity = MagicMock(side_effect=_mock_update_quantity)

    result = await update_collection_quantity("user-1", "card-1", 3, repository)

    assert result.items[0].quantity == 3
    repository.update_quantity.assert_called_once_with("user-1", "card-1", 3)


@pytest.mark.asyncio
async def test_remove_collection_item_returns_summary() -> None:
    remaining_record = CollectionRecord(owner_id="user-1", items=[])

    async def _mock_remove_item(owner_id, item_id):
        _ = owner_id
        _ = item_id
        return remaining_record

    repository = MagicMock()
    repository.remove_item = MagicMock(side_effect=_mock_remove_item)

    result = await remove_collection_item("user-1", "card-1", repository)

    assert result.owner_id == "user-1"
    assert result.items == []
    repository.remove_item.assert_called_once_with("user-1", "card-1")