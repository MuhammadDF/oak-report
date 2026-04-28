"""Add pricing catalog pointer to collection items.

Revision ID: 20260427_000007
Revises: 20260425_000006
Create Date: 2026-04-27 00:00:07.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260427_000007"
down_revision = "20260425_000006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "collection_items",
        sa.Column("pricing_catalog_id", sa.String(), nullable=True),
    )
    op.create_index(
        op.f("ix_collection_items_pricing_catalog_id"),
        "collection_items",
        ["pricing_catalog_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_collection_items_pricing_catalog_id_pricing_catalog",
        "collection_items",
        "pricing_catalog",
        ["pricing_catalog_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_collection_items_pricing_catalog_id_pricing_catalog",
        "collection_items",
        type_="foreignkey",
    )
    op.drop_index(op.f("ix_collection_items_pricing_catalog_id"),
                  table_name="collection_items")
    op.drop_column("collection_items", "pricing_catalog_id")
