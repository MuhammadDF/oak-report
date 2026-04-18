"""Data models for normalized Pokemon card metadata."""

from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl


class CardIdentity(BaseModel):
    """Canonical card fields extracted from a scan."""

    name: str
    card_number: Optional[str] = None
    language: Optional[str] = None
