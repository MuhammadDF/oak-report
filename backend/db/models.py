"""SQLModel tables for auth and collection persistence."""

from __future__ import annotations

from datetime import datetime, timezone
import uuid

from sqlalchemy import Column, DateTime, JSON, UniqueConstraint
from sqlmodel import Field, SQLModel


class UserTable(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(primary_key=True)
    email: str = Field(index=True)
    display_name: str
    role: str = Field(default="na")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    last_login_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    hashed_password: str = Field(default="google-oauth")

    mfa_enabled: bool = Field(default=False)
    recovery_email: str | None = Field(default=None)
    recovery_phone: str | None = Field(default=None)
    feature_flags: dict[str, bool] = Field(
        default_factory=dict,
        sa_column=Column(JSON, nullable=False),
    )
    disabled: bool = Field(default=False)
    notes: str | None = Field(default=None)


class CollectionItemTable(SQLModel, table=True):
    __tablename__ = "collection_items"
    __table_args__ = (UniqueConstraint("owner_id", "card_id", name="uq_owner_card"),)

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    owner_id: str = Field(foreign_key="users.id", index=True)
    card_id: str = Field(index=True)

    name: str
    set: str
    number: str
    price: float
    trend: str
    trend_pct: float
    image: str
    grade: str | None = Field(default=None)
    quantity: int = Field(default=1)


class PricingCatalogTable(SQLModel, table=True):
    __tablename__ = "pricing_catalog"

    id: str = Field(primary_key=True)
    console_name: str = Field(index=True)
    product_name: str = Field(index=True)
    loose_price: float = Field(default=0.0)
    tcg_id: str | None = Field(default=None)
    image_url: str = Field(default="")
    refreshed_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
