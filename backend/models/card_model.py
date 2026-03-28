"""Data models for normalized Pokemon card metadata."""

from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl


class CardIdentity(BaseModel):
    """Canonical card fields extracted from a scan."""

    card_id: str
    name: str
    supertype: str
    set_name: Optional[str] = None
    card_number: Optional[str] = None
    set_size: Optional[int] = None
    rarity: Optional[str] = None
    types: List[str] = Field(default_factory=list)
    is_holo: Optional[bool] = None
    is_reverse_holo: Optional[bool] = None
    promo: bool = False
    image_url: Optional[HttpUrl] = None


class CardCondition(BaseModel):
    """Condition details used for pricing context."""

    grade: Optional[float] = None
    grading_company: Optional[str] = None
    condition_label: str = "Near Mint"


class CardModel(BaseModel):
    """Backward-compatible aggregate card model for collection records."""

    id: str
    name: str
    supertype: str
    types: List[str] = Field(default_factory=list)
    set_name: Optional[str] = None
    number: Optional[str] = None
    set_size: Optional[int] = None
    rarity: Optional[str] = None
    is_holo: Optional[bool] = None
    is_reverse_holo: Optional[bool] = None
    promo: bool = False
    grade: Optional[float] = None
    grading_company: Optional[str] = None
    current_value: Optional[float] = None
    image_url: Optional[HttpUrl] = None
