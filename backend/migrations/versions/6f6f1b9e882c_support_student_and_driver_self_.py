"""support student and driver self registration

Revision ID: 6f6f1b9e882c
Revises: e734042d9713
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "6f6f1b9e882c"
down_revision: Union[str, Sequence[str], None] = "e734042d9713"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Allow official records to exist before users create accounts.
    op.alter_column(
        "students",
        "user_id",
        existing_type=sa.Integer(),
        nullable=True
    )

    op.alter_column(
        "drivers",
        "user_id",
        existing_type=sa.Integer(),
        nullable=True
    )

    # Store only hashed onboarding codes.
    op.add_column(
        "students",
        sa.Column("onboarding_code_hash", sa.String(255), nullable=True)
    )

    op.add_column(
        "students",
        sa.Column(
            "onboarding_code_used",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false()
        )
    )

    op.add_column(
        "drivers",
        sa.Column("onboarding_code_hash", sa.String(255), nullable=True)
    )

    op.add_column(
        "drivers",
        sa.Column(
            "onboarding_code_used",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false()
        )
    )


def downgrade() -> None:
    # This will fail safely if unclaimed records still have NULL user_id.
    op.alter_column(
        "students",
        "user_id",
        existing_type=sa.Integer(),
        nullable=False
    )

    op.alter_column(
        "drivers",
        "user_id",
        existing_type=sa.Integer(),
        nullable=False
    )

    op.drop_column("drivers", "onboarding_code_used")
    op.drop_column("drivers", "onboarding_code_hash")
    op.drop_column("students", "onboarding_code_used")
    op.drop_column("students", "onboarding_code_hash")
