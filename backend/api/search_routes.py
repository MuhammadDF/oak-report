from fastapi import APIRouter, Depends, Query

from ..auth.dependencies import require_roles
from ..auth.jwt_service import AuthTokenPayload
from ..models.card_search_model import CardSearchResponseModel
from ..services.search_service import search_cards

router = APIRouter()


@router.get(
    "/cards",
    response_model=CardSearchResponseModel,
    summary="Search for cards to use as a reference",
)
async def search_cards_endpoint(
    query: str = Query(..., min_length=2),
    current_user: AuthTokenPayload = Depends(require_roles("na", "collector", "admin")),
) -> CardSearchResponseModel:
    """Return mocked card matches for the provided query."""

    _ = current_user
    results = await search_cards(query)
    return CardSearchResponseModel(query=query, results=results)
