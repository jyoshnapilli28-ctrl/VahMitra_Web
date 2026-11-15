
"""add route area and composite uniqueness

Revision ID: 805baa3c8d33
Revises: 6f6f1b9e882c
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "805baa3c8d33"
down_revision: Union[str, Sequence[str], None] = "6f6f1b9e882c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add area as nullable temporarily
    op.add_column(
        "routes",
        sa.Column("area", sa.String(length=50), nullable=True)
    )

    # Preserve existing demo route
    op.execute(
        "UPDATE routes SET area = 'Vijayawada' WHERE area IS NULL"
    )

    # Make area mandatory
    op.alter_column(
        "routes",
        "area",
        existing_type=sa.String(length=50),
        nullable=False
    )

    # Replace global uniqueness with area + route code uniqueness
    op.drop_constraint(
        "routes_route_code_key",
        "routes",
        type_="unique"
    )

    op.create_unique_constraint(
        "uq_route_area_code",
        "routes",
        ["area", "route_code"]
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_route_area_code",
        "routes",
        type_="unique"
    )

    op.create_unique_constraint(
        "routes_route_code_key",
        "routes",
        ["route_code"]
    )

    op.drop_column("routes", "area")
