"""
Domain service placeholder for collection management, library search, and Memory Bank persistence.

Scope:
- FR-3 Personal Collection CRUD with condition metadata
- FR-4 Searchable Library queries for unscanned cards
- FR-7 Memory Bank historical trend storage
- I-1 Dashboard + Library data feeds for mobile GUI
- Reliability requirement NFR-3 (cloud-backed storage)

The implementation will handle data validation, repository orchestration, and event logging.
"""
from __future__ import annotations

from pydantic import BaseModel

from ..repositories.collection_repository import (
	CollectionItemRecord,
	CollectionRepository,
)


class CollectionCardModel(BaseModel):
	id: str
	name: str
	set: str
	number: str
	price: float
	trend: str
	trendPct: float
	image: str
	grade: str | None = None
	quantity: int


class CollectionSummary(BaseModel):
	owner_id: str
	items: list[CollectionCardModel]


class AddCollectionItemInput(BaseModel):
	scan_id: str
	name: str
	set: str
	number: str
	price: float
	image: str | None = None
	grade: str | None = None


class AddToCollectionResult(BaseModel):
	owner_id: str
	added_item: CollectionCardModel
	total_items: int


def _derive_trend(item_id: str) -> tuple[str, float]:
	checksum = sum(ord(char) for char in item_id)
	trend = "up" if checksum % 2 == 0 else "down"
	trend_pct = round(((checksum % 120) + 5) / 10, 1)
	return trend, trend_pct


def _to_card_model(item: CollectionItemRecord) -> CollectionCardModel:
	return CollectionCardModel(
		id=item.id,
		name=item.name,
		set=item.set,
		number=item.number,
		price=item.price,
		trend=item.trend,
		trendPct=item.trend_pct,
		image=item.image,
		grade=item.grade,
		quantity=item.quantity,
	)


def _to_summary(owner_id: str, items: list[CollectionItemRecord]) -> CollectionSummary:
	return CollectionSummary(
		owner_id=owner_id,
		items=[_to_card_model(item) for item in items],
	)


async def get_collection_for_user(
	owner_id: str,
	repository: CollectionRepository,
) -> CollectionSummary:
	"""Return collection data for the authenticated user."""

	record = await repository.get_collection(owner_id)
	return _to_summary(record.owner_id, record.items)


async def add_scan_to_collection(
	owner_id: str,
	payload: AddCollectionItemInput,
	repository: CollectionRepository,
) -> AddToCollectionResult:
	"""Add or merge a collection card based on a scan/search action."""

	trend, trend_pct = _derive_trend(payload.scan_id)
	item = CollectionItemRecord(
		id=payload.scan_id,
		name=payload.name,
		set=payload.set,
		number=payload.number,
		price=max(0.0, payload.price),
		trend=trend,
		trend_pct=trend_pct,
		image=payload.image or "https://placehold.co/600x840?text=Pokemon+Card",
		grade=payload.grade,
		quantity=1,
	)

	record = await repository.add_item(owner_id, item)
	return AddToCollectionResult(
		owner_id=record.owner_id,
		added_item=_to_card_model(item),
		total_items=len(record.items),
	)


async def update_collection_quantity(
	owner_id: str,
	item_id: str,
	quantity: int,
	repository: CollectionRepository,
) -> CollectionSummary:
	"""Update quantity for a collection card and return refreshed summary."""

	record = await repository.update_quantity(owner_id, item_id, quantity)
	return _to_summary(record.owner_id, record.items)


async def remove_collection_item(
	owner_id: str,
	item_id: str,
	repository: CollectionRepository,
) -> CollectionSummary:
	"""Remove a collection card and return refreshed summary."""

	record = await repository.remove_item(owner_id, item_id)
	return _to_summary(record.owner_id, record.items)
