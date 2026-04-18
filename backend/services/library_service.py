"""Library service for catalog card listing."""

from pydantic import BaseModel

from ..repositories.factory import get_library_repository


class LibraryCardModel(BaseModel):
    id: str
    name: str
    set: str
    number: str
    rarity: str
    type: str
    price: float


async def list_library_cards() -> list[LibraryCardModel]:
    """Return catalog cards from the configured provider."""

    repository = get_library_repository()
    cards = await repository.list_cards()
    return [
        LibraryCardModel(
            id=card.id,
            name=card.name,
            set=card.set,
            number=card.number,
            rarity=card.rarity,
            type=card.type,
            price=card.price,
        )
        for card in cards
    ]