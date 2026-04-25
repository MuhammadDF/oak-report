from pydantic import BaseModel
from datetime import datetime


class CardSearchResultModel(BaseModel):
    """Simplified representation of a card returned by the search endpoint."""

    id: str
    name: str
    set: str
    rarity: str
    type: str
    lowest_listing: float


class CardSearchResponseModel(BaseModel):
    """Response envelope for the search endpoint."""

    query: str
    results: list[CardSearchResultModel]


class CardPricingMatchModel(BaseModel):
    """Full pricing catalog row returned for a card match lookup."""

    id: str
    console_name: str
    product_name: str
    loose_price: float
    tcg_id: str | None
    image_url: str
    refreshed_at: datetime


class CardPricingMatchResponseModel(BaseModel):
    """Response envelope for full card pricing matches."""

    results: list[CardPricingMatchModel]
