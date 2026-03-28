"""Response models for scan and appraisal workflows."""

from datetime import datetime
from typing import List

from pydantic import BaseModel, Field

from .card_model import CardCondition, CardIdentity


class AuthenticitySignal(BaseModel):
    """One proxy-detection signal surfaced to the user."""

    name: str
    passed: bool
    detail: str


class AuthenticityReport(BaseModel):
    """Aggregated authenticity result."""

    is_authentic_guess: bool
    confidence: float = Field(ge=0.0, le=1.0)
    summary: str
    signals: List[AuthenticitySignal]


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

    scan_id: str
    processed_at: datetime
    card: CardIdentity
    condition: CardCondition
    authenticity: AuthenticityReport
    pricing: PricingSnapshot
