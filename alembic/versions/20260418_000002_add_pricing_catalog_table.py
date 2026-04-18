"""Add pricing catalog table.

Revision ID: 20260418_000002
Revises: 20260417_000001
Create Date: 2026-04-18 00:00:02.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260418_000002"
down_revision = "20260417_000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pricing_catalog",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("console_name", sa.String(), nullable=False),
        sa.Column("product_name", sa.String(), nullable=False),
        sa.Column("loose_price", sa.Float(), nullable=False),
        sa.Column("refreshed_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_pricing_catalog_console_name"),
        "pricing_catalog",
        ["console_name"],
        unique=False,
    )
    op.create_index(
        op.f("ix_pricing_catalog_product_name"),
        "pricing_catalog",
        ["product_name"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_pricing_catalog_product_name"), table_name="pricing_catalog")
    op.drop_index(op.f("ix_pricing_catalog_console_name"), table_name="pricing_catalog")
    op.drop_table("pricing_catalog")
