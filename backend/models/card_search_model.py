from pydantic import BaseModel


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
