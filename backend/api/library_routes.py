"""Routes for searchable library card catalog."""

from fastapi import APIRouter

from ..services.library_service import LibraryCardModel, list_library_cards

router = APIRouter()


@router.get(
    "/cards",
    response_model=list[LibraryCardModel],
    summary="List library cards",
)
async def get_library_cards() -> list[LibraryCardModel]:
    return await list_library_cards()