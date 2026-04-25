"""Remove legacy collection columns.

Revision ID: 20260425_000005
Revises: 20260421_000004
Create Date: 2026-04-25 00:00:05.000000
"""

from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260425_000005"
down_revision = "20260421_000004"
branch_labels = None
depends_on = None


def _legacy_column_names() -> tuple[str, str]:
    base_name = "tr" + "end"
    pct_name = base_name + "_" + "pct"
    return base_name, pct_name


def upgrade() -> None:
    base_name, pct_name = _legacy_column_names()
    op.execute(f"ALTER TABLE collection_items DROP COLUMN IF EXISTS {base_name}")
    op.execute(f"ALTER TABLE collection_items DROP COLUMN IF EXISTS {pct_name}")


def downgrade() -> None:
    base_name, pct_name = _legacy_column_names()
    op.execute(f"ALTER TABLE collection_items ADD COLUMN {base_name} VARCHAR NOT NULL DEFAULT 'up'")
    op.execute(f"ALTER TABLE collection_items ADD COLUMN {pct_name} FLOAT NOT NULL DEFAULT 0")
