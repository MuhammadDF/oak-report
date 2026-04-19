"""Response models for scan and appraisal workflows."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, HttpUrl

from .card_model import CardIdentity


class ScanResultModel(BaseModel):
    """Complete appraisal payload for the scan workflow."""

    processed_at: datetime
    card: CardIdentity
    pricing: float = Field(ge=0.0)
    image_url: Optional[HttpUrl] = HttpUrl(
        "https://images.pokemontcg.io/sv03/203.png")
    set_name: Optional[str] = None
