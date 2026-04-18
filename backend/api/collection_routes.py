"""
Placeholder for collection and library endpoints spanning Cal Collector flows.

Coverage:
- FR-3 Personal Collection CRUD with condition tracking
- FR-4 Searchable Library for cards not yet scanned
- FR-7 Memory Bank pricing trends per scan
- I-1 Mobile GUI data endpoints feeding Dashboard + Library views

Routes added here will simply collect HTTP concerns (auth, pagination, filtering)
before delegating to the underlying services.
"""
from fastapi import APIRouter, Depends
from fastapi import HTTPException
from pydantic import BaseModel
from pydantic import Field

from ..auth.dependencies import get_current_user
from ..db.dependencies import CollectionRepositoryDI
from ..auth.jwt_service import AuthTokenPayload
from ..services.collection_service import (
	AddCollectionItemInput,
	AddToCollectionResult,
	CollectionSummary,
	add_scan_to_collection,
	get_collection_for_user,
	remove_collection_item,
	update_collection_quantity,
)

router = APIRouter()


class AddScanRequest(BaseModel):
	scan_id: str
	name: str
	set: str
	number: str
	price: float = Field(ge=0.0)
	image: str | None = None
	grade: str | None = None


class UpdateQuantityRequest(BaseModel):
	quantity: int = Field(ge=0)


@router.get(
	"/",
	response_model=CollectionSummary,
	summary="Get the current user's collection",
)
async def get_collection(
	repository: CollectionRepositoryDI,
	current_user: AuthTokenPayload = Depends(get_current_user),
) -> CollectionSummary:
	return await get_collection_for_user(current_user.sub, repository)


@router.post(
	"/add",
	response_model=AddToCollectionResult,
	summary="Add a scan result to the current user's collection",
)
async def add_to_collection(
	payload: AddScanRequest,
	repository: CollectionRepositoryDI,
	current_user: AuthTokenPayload = Depends(get_current_user),
) -> AddToCollectionResult:
	return await add_scan_to_collection(
		current_user.sub,
		AddCollectionItemInput(
			scan_id=payload.scan_id,
			name=payload.name,
			set=payload.set,
			number=payload.number,
			price=payload.price,
			image=payload.image,
			grade=payload.grade,
		),
		repository,
	)


@router.patch(
	"/{item_id}/quantity",
	response_model=CollectionSummary,
	summary="Update a collection card quantity",
)
async def update_item_quantity(
	item_id: str,
	payload: UpdateQuantityRequest,
	repository: CollectionRepositoryDI,
	current_user: AuthTokenPayload = Depends(get_current_user),
) -> CollectionSummary:
	try:
		return await update_collection_quantity(
			current_user.sub,
			item_id,
			payload.quantity,
			repository,
		)
	except KeyError as caught_error:
		raise HTTPException(status_code=404, detail="Collection item not found.") from caught_error


@router.delete(
	"/{item_id}",
	response_model=CollectionSummary,
	summary="Remove a collection card",
)
async def delete_collection_item(
	item_id: str,
	repository: CollectionRepositoryDI,
	current_user: AuthTokenPayload = Depends(get_current_user),
) -> CollectionSummary:
	try:
		return await remove_collection_item(current_user.sub, item_id, repository)
	except KeyError as caught_error:
		raise HTTPException(status_code=404, detail="Collection item not found.") from caught_error