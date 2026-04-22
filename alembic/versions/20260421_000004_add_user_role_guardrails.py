"""Add user role guardrails and seed initial admins.

Revision ID: 20260421_000004
Revises: 20260419_000003
Create Date: 2026-04-21 00:00:04.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260421_000004"
down_revision = "20260419_000003"
branch_labels = None
depends_on = None


INITIAL_ADMIN_EMAILS = (
    "muhammadfouly@gmail.com",
    "nick@organizedinsomnia.com",
    "zyang3104@gmail.com",
    "simonafelt@gmail.com",
    "chrisbutcher901@gmail.com",
)


def upgrade() -> None:
    quoted_admin_emails = ", ".join(
        f"'{email.lower().replace(chr(39), chr(39) + chr(39))}'"
        for email in INITIAL_ADMIN_EMAILS
    )

    op.execute(
        sa.text(
            """
            UPDATE users
            SET role = lower(role)
            WHERE role IS NOT NULL
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE users
            SET role = 'na'
            WHERE role IS NULL OR trim(role) = '' OR role NOT IN ('na', 'collector', 'admin')
            """
        )
    )
    op.execute(
        sa.text(
            f"""
            UPDATE users
            SET role = 'admin'
            WHERE lower(email) IN ({quoted_admin_emails})
            """
        )
    )

    op.alter_column("users", "role", server_default="na", existing_type=sa.String())
    op.create_check_constraint(
        "ck_users_role_allowed",
        "users",
        "role IN ('na', 'collector', 'admin')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_users_role_allowed", "users", type_="check")
    op.alter_column("users", "role", server_default="collector", existing_type=sa.String())
    op.execute(
        sa.text(
            """
            UPDATE users
            SET role = 'collector'
            WHERE role = 'na'
            """
        )
    )
