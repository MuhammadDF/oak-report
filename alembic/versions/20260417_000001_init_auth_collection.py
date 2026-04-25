"""Initial auth and collection tables.

Revision ID: 20260417_000001
Revises: 
Create Date: 2026-04-17 00:00:01.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260417_000001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("display_name", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("mfa_enabled", sa.Boolean(), nullable=False),
        sa.Column("recovery_email", sa.String(), nullable=True),
        sa.Column("recovery_phone", sa.String(), nullable=True),
        sa.Column("feature_flags", sa.JSON(), nullable=False),
        sa.Column("disabled", sa.Boolean(), nullable=False),
        sa.Column("notes", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)

    op.create_table(
        "collection_items",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("owner_id", sa.String(), nullable=False),
        sa.Column("card_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("set", sa.String(), nullable=False),
        sa.Column("number", sa.String(), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("image", sa.String(), nullable=False),
        sa.Column("grade", sa.String(), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner_id", "card_id", name="uq_owner_card"),
    )
    op.create_index(
        op.f("ix_collection_items_owner_id"),
        "collection_items",
        ["owner_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_collection_items_card_id"),
        "collection_items",
        ["card_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_collection_items_card_id"), table_name="collection_items")
    op.drop_index(op.f("ix_collection_items_owner_id"), table_name="collection_items")
    op.drop_table("collection_items")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
