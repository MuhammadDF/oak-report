"""Response models for scan and appraisal workflows."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl

from .card_model import CardIdentity


class PricePoint(BaseModel):
    """One market datapoint used to estimate card value."""

    source: str
    label: str
    price: float = Field(ge=0.0)
    url: str


class PricingSnapshot(BaseModel):
    """Pricing breakdown returned to the client."""

    currency: str = "USD"
    estimated_market_value: float = Field(ge=0.0)
    price_points: List[PricePoint]


class ScanResultModel(BaseModel):
    """Complete appraisal payload for the scan workflow."""

    processed_at: datetime
    card: CardIdentity
    pricing: PricingSnapshot
    image_url: Optional[HttpUrl] = HttpUrl("https://images.pokemontcg.io/sv03/203.png")
    set_name: Optional[str] = None
