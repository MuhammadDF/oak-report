"""Add trigram indexes for pricing catalog search.

Revision ID: 20260425_000006
Revises: 20260425_000005
Create Date: 2026-04-25 00:00:06.000000
"""

from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260425_000006"
down_revision = "20260425_000005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.create_index(
        "ix_pricing_catalog_product_name_trgm",
        "pricing_catalog",
        ["product_name"],
        unique=False,
        postgresql_using="gin",
        postgresql_ops={"product_name": "gin_trgm_ops"},
    )
    op.create_index(
        "ix_pricing_catalog_console_name_trgm",
        "pricing_catalog",
        ["console_name"],
        unique=False,
        postgresql_using="gin",
        postgresql_ops={"console_name": "gin_trgm_ops"},
    )


def downgrade() -> None:
    op.drop_index("ix_pricing_catalog_console_name_trgm", table_name="pricing_catalog")
    op.drop_index("ix_pricing_catalog_product_name_trgm", table_name="pricing_catalog")