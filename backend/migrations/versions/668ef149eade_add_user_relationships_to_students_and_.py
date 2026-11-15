
"""add user relationships to students and drivers

Revision ID: 668ef149eade
Revises:
Create Date: 2026-11-11 19:46:39.444383
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "668ef149eade"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add user relationship to drivers
    op.add_column(
        "drivers",
        sa.Column("user_id", sa.Integer(), nullable=False)
    )

    op.create_unique_constraint(
        "uq_drivers_user_id",
        "drivers",
        ["user_id"]
    )

    op.create_foreign_key(
        "fk_drivers_user_id_users",
        "drivers",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE"
    )

    # Add user relationship to students
    op.add_column(
        "students",
        sa.Column("user_id", sa.Integer(), nullable=False)
    )

    op.create_unique_constraint(
        "uq_students_user_id",
        "students",
        ["user_id"]
    )

    op.create_foreign_key(
        "fk_students_user_id_users",
        "students",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE"
    )


def downgrade() -> None:
    # Remove student relationship
    op.drop_constraint(
        "fk_students_user_id_users",
        "students",
        type_="foreignkey"
    )

    op.drop_constraint(
        "uq_students_user_id",
        "students",
        type_="unique"
    )

    op.drop_column("students", "user_id")

    # Remove driver relationship
    op.drop_constraint(
        "fk_drivers_user_id_users",
        "drivers",
        type_="foreignkey"
    )

    op.drop_constraint(
        "uq_drivers_user_id",
        "drivers",
        type_="unique"
    )

    op.drop_column("drivers", "user_id")
