"""Routes for searchable library card catalog."""

from fastapi import APIRouter, Depends

from ..auth.dependencies import require_roles
from ..auth.jwt_service import AuthTokenPayload
from ..services.library_service import LibraryCardModel, list_library_cards

router = APIRouter(tags=["Library"])


@router.get(
    "/cards",
    response_model=list[LibraryCardModel],
    summary="List library cards",
)
async def get_library_cards(
    current_user: AuthTokenPayload = Depends(require_roles("na", "collector", "admin")),
) -> list[LibraryCardModel]:
    _ = current_user
    return await list_library_cards()