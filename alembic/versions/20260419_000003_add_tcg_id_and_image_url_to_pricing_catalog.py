"""Add tcg_id and image_url columns to pricing catalog.

Revision ID: 20260419_000003
Revises: 20260418_000002
Create Date: 2026-04-19 00:00:03.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260419_000003"
down_revision = "20260418_000002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("pricing_catalog", sa.Column("tcg_id", sa.String(), nullable=True))
    op.add_column("pricing_catalog", sa.Column("image_url", sa.String(), nullable=False, server_default=""))
    op.alter_column("pricing_catalog", "image_url", server_default=None)


def downgrade() -> None:
    op.drop_column("pricing_catalog", "image_url")
    op.drop_column("pricing_catalog", "tcg_id")
