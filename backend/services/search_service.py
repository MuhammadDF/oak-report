"""Search orchestration using provider-backed repositories."""

from ..models.card_search_model import CardSearchResultModel
from ..repositories.factory import get_search_repository


async def search_cards(query: str) -> list[CardSearchResultModel]:
    """Return card matches using the configured data provider."""

    repository = get_search_repository()
    return await repository.search_cards(query)
