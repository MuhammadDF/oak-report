"""Data model describing the normalized state of a scanned Pokémon card."""

from typing import List, Optional, Tuple

from pydantic import BaseModel, HttpUrl


class CardModel(BaseModel):
	id: str  # Unique identifier for the card instance
	name: str
	supertype: str  # e.g., "Pokémon", "Trainer", "Energy"
	types: Optional[List[str]] = None  # e.g., ["Fire", "Water"]
	set_name: Optional[str] = None
	number: Optional[Tuple[int, int]] = None  # (card_number, set_size)
	rarity: Optional[str] = None  # e.g., "Common", "Rare"
	is_holo: Optional[bool] = None
	is_reverse_holo: Optional[bool] = None
	promo: Optional[bool] = None
	grade: Optional[float] = None  # e.g., 10.0
	grading_company: Optional[str] = None  # e.g., "PSA", "Beckett"
	current_value: Optional[float] = None  # Latest valuation (e.g., USD)
	image_url: Optional[HttpUrl] = None


