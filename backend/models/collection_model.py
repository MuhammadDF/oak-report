"""Pydantic schema representing a user's stored Pokémon card collection."""

from typing import List

from pydantic import BaseModel, Field

from .card_model import CardModel


class CollectionModel(BaseModel):
    """Collection aggregate capturing cards plus total valuation."""

    id: str  # Collection identifier (e.g., UUID)
    owner_id: str  # References the UserProfile.id that owns the collection
    cards: List[CardModel] = Field(default_factory=list)
    total_value: float = 0.0  # Precomputed aggregate value (e.g., USD)
    currency: str = "USD"

    @property
    def computed_total_value(self) -> float:
        """Derive total value from the embedded cards when needed."""

        return sum(card.current_value or 0.0 for card in self.cards)
