from fastapi import APIRouter, Depends, Query

from ..auth.dependencies import require_roles
from ..auth.jwt_service import AuthTokenPayload
from ..models.card_model import CardIdentity
from ..models.card_search_model import (
    CardPricingMatchModel,
    CardPricingMatchResponseModel,
    CardSearchResponseModel,
)
from ..services.pricing_service import get_all_card_info
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


@router.post(
    "/card-info",
    response_model=CardPricingMatchResponseModel,
    summary="Get all pricing catalog matches for a specific card",
)
async def search_card_info_endpoint(
    card: CardIdentity,
    current_user: AuthTokenPayload = Depends(require_roles("na", "collector", "admin")),
) -> CardPricingMatchResponseModel:
    """Return all full pricing-catalog matches for the provided card identity."""

    _ = current_user
    matches = await get_all_card_info(card)
    results = [
        CardPricingMatchModel(
            id=match.id,
            console_name=match.console_name,
            product_name=match.product_name,
            loose_price=match.loose_price,
            tcg_id=match.tcg_id,
            image_url=match.image_url,
            refreshed_at=match.refreshed_at,
        )
        for match in matches
    ]
    return CardPricingMatchResponseModel(results=results)
