"""driver_portal_tables

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-11-14 07:11:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    # --- trips ---
    op.create_table(
        "trips",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("allocation_id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("route_id", sa.Integer(), nullable=False),
        sa.Column("bus_id", sa.Integer(), nullable=False),
        sa.Column(
            "started_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column("ended_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "status",
            sa.String(length=30),
            server_default="active",
            nullable=False,
        ),
        sa.Column("start_lat", sa.Float(), nullable=True),
        sa.Column("start_lng", sa.Float(), nullable=True),
        sa.Column("end_lat", sa.Float(), nullable=True),
        sa.Column("end_lng", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["allocation_id"],
            ["bus_allocations.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["driver_id"],
            ["drivers.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["route_id"],
            ["routes.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["bus_id"],
            ["buses.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- fuel_records ---
    op.create_table(
        "fuel_records",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("bus_id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("allocation_id", sa.Integer(), nullable=True),
        sa.Column(
            "recorded_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column("fuel_litres", sa.Float(), nullable=False),
        sa.Column("amount_paid", sa.Float(), nullable=False),
        sa.Column("odometer_km", sa.Float(), nullable=True),
        sa.Column("fuel_station", sa.String(length=200), nullable=True),
        sa.Column("receipt_file_path", sa.String(length=500), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["bus_id"],
            ["buses.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["driver_id"],
            ["drivers.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["allocation_id"],
            ["bus_allocations.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- service_records ---
    op.create_table(
        "service_records",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("bus_id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("allocation_id", sa.Integer(), nullable=True),
        sa.Column("service_date", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("odometer_km", sa.Float(), nullable=True),
        sa.Column("service_centre", sa.String(length=200), nullable=True),
        sa.Column("cost", sa.Float(), nullable=True),
        sa.Column("next_service_date", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("next_service_km", sa.Float(), nullable=True),
        sa.Column("invoice_file_path", sa.String(length=500), nullable=True),
        sa.Column(
            "status",
            sa.String(length=30),
            server_default="pending",
            nullable=False,
        ),
        sa.Column("management_approved_by", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["bus_id"],
            ["buses.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["driver_id"],
            ["drivers.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["allocation_id"],
            ["bus_allocations.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["management_approved_by"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- sequence for vehicle_issue_reports ticket numbers ---
    op.execute("CREATE SEQUENCE vehicle_issue_ticket_seq START 1")

    # --- vehicle_issue_reports ---
    op.create_table(
        "vehicle_issue_reports",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("bus_id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("trip_id", sa.Integer(), nullable=True),
        sa.Column("ticket_number", sa.String(length=40), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "severity",
            sa.String(length=20),
            server_default="medium",
            nullable=False,
        ),
        sa.Column("evidence_file_path", sa.String(length=500), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column(
            "status",
            sa.String(length=30),
            server_default="open",
            nullable=False,
        ),
        sa.Column("management_response", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["bus_id"],
            ["buses.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["driver_id"],
            ["drivers.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["trip_id"],
            ["trips.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("ticket_number"),
    )

    # --- driver_notifications ---
    op.create_table(
        "driver_notifications",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("message", sa.String(length=1000), nullable=False),
        sa.Column(
            "category",
            sa.String(length=50),
            server_default="general",
            nullable=False,
        ),
        sa.Column(
            "priority",
            sa.String(length=30),
            server_default="normal",
            nullable=False,
        ),
        sa.Column(
            "is_read",
            sa.Boolean(),
            server_default=sa.text("FALSE"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["driver_id"],
            ["drivers.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- column additions to existing tables ---
    op.add_column(
        "attendance",
        sa.Column(
            "trip_id",
            sa.Integer(),
            sa.ForeignKey("trips.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "drivers",
        sa.Column("profile_photo_url", sa.String(length=500), nullable=True),
    )
    op.add_column(
        "drivers",
        sa.Column("experience_years", sa.Integer(), nullable=True),
    )
    op.add_column(
        "drivers",
        sa.Column("address", sa.Text(), nullable=True),
    )


def downgrade():
    # --- remove column additions ---
    op.drop_column("drivers", "address")
    op.drop_column("drivers", "experience_years")
    op.drop_column("drivers", "profile_photo_url")
    op.drop_column("attendance", "trip_id")

    # --- drop tables in reverse dependency order ---
    op.drop_table("driver_notifications")
    op.drop_table("vehicle_issue_reports")
    op.execute("DROP SEQUENCE IF EXISTS vehicle_issue_ticket_seq")
    op.drop_table("service_records")
    op.drop_table("fuel_records")
    op.drop_table("trips")
