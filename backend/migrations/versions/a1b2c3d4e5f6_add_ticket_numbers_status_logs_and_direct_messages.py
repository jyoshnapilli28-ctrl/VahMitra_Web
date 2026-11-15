"""add ticket numbers status logs and direct messages

Revision ID: a1b2c3d4e5f6
Revises: 9a1b2c3d4e5f
Create Date: 2026-11-14 06:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "9a1b2c3d4e5f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create atomic, non-cycling monotonic sequence for complaint ticket numbers
    op.execute("CREATE SEQUENCE IF NOT EXISTS complaint_ticket_seq START WITH 1 INCREMENT BY 1 NO CYCLE;")

    # 2. Add ticket columns & archival metadata to complaints
    op.add_column("complaints", sa.Column("ticket_number", sa.String(length=40), nullable=True))
    op.add_column("complaints", sa.Column("evidence_file_path", sa.String(length=500), nullable=True))
    op.add_column("complaints", sa.Column("is_archived", sa.Boolean(), server_default=sa.false(), nullable=False))
    op.add_column("complaints", sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("complaints", sa.Column("archived_by_user_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_complaints_archived_by_user_id",
        "complaints",
        "users",
        ["archived_by_user_id"],
        ["id"],
        ondelete="SET NULL"
    )

    # 3. Backfill any existing complaints in Asia/Kolkata year without data loss
    op.execute("""
        UPDATE complaints
        SET ticket_number = 'VAH-CMP-' || to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY') || '-' || lpad(id::text, 6, '0')
        WHERE ticket_number IS NULL;
    """)

    # 4. Sync sequence past highest existing ID
    op.execute("""
        SELECT setval('complaint_ticket_seq', COALESCE((SELECT MAX(id) FROM complaints), 0) + 1, false);
    """)

    # 5. Create unique constraint & enforce NOT NULL on ticket_number
    op.create_index(op.f("ix_complaints_ticket_number"), "complaints", ["ticket_number"], unique=True)
    op.alter_column("complaints", "ticket_number", nullable=False)

    # 6. Create immutable complaint_status_logs table (ON DELETE RESTRICT protects complaint lifecycle)
    op.create_table(
        "complaint_status_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("complaint_id", sa.Integer(), nullable=False),
        sa.Column("complaint_ticket_number", sa.String(length=40), nullable=False),
        sa.Column("old_status", sa.String(length=30), nullable=True),
        sa.Column("new_status", sa.String(length=30), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("updated_by_role", sa.String(length=30), nullable=False),
        sa.Column("updated_by_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["complaint_id"], ["complaints.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["updated_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_complaint_status_logs_id"), "complaint_status_logs", ["id"], unique=False)
    op.create_index(op.f("ix_complaint_status_logs_complaint_id"), "complaint_status_logs", ["complaint_id"], unique=False)
    op.create_index(op.f("ix_complaint_status_logs_ticket"), "complaint_status_logs", ["complaint_ticket_number"], unique=False)

    # 7. Create append-only trigger on complaint_status_logs to physically forbid UPDATE or DELETE
    op.execute("""
        CREATE OR REPLACE FUNCTION prevent_complaint_status_log_mutation()
        RETURNS TRIGGER AS $$
        BEGIN
            RAISE EXCEPTION 'Historical audit logs in complaint_status_logs are immutable and cannot be updated or deleted.';
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trg_protect_complaint_status_logs ON complaint_status_logs;
        CREATE TRIGGER trg_protect_complaint_status_logs
        BEFORE UPDATE OR DELETE ON complaint_status_logs
        FOR EACH ROW
        EXECUTE FUNCTION prevent_complaint_status_log_mutation();
    """)

    # 8. Create direct_messages table (audit-preserved, ON DELETE SET NULL)
    op.create_table(
        "direct_messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("broadcast_id", sa.String(length=64), nullable=True),
        sa.Column("sender_id", sa.Integer(), nullable=True),
        sa.Column("recipient_id", sa.Integer(), nullable=True),
        sa.Column("sender_name", sa.String(length=100), nullable=False),
        sa.Column("sender_role", sa.String(length=30), nullable=False),
        sa.Column("recipient_name", sa.String(length=100), nullable=False),
        sa.Column("recipient_role", sa.String(length=30), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted_by_sender", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("is_deleted_by_recipient", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["recipient_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_direct_messages_id"), "direct_messages", ["id"], unique=False)
    op.create_index(op.f("ix_direct_messages_recipient_read"), "direct_messages", ["recipient_id", "is_read"], unique=False)
    op.create_index(op.f("ix_direct_messages_created_at"), "direct_messages", ["created_at"], unique=False)
    op.create_index(op.f("ix_direct_messages_broadcast_id"), "direct_messages", ["broadcast_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_direct_messages_broadcast_id"), table_name="direct_messages")
    op.drop_index(op.f("ix_direct_messages_created_at"), table_name="direct_messages")
    op.drop_index(op.f("ix_direct_messages_recipient_read"), table_name="direct_messages")
    op.drop_index(op.f("ix_direct_messages_id"), table_name="direct_messages")
    op.drop_table("direct_messages")

    op.execute("DROP TRIGGER IF EXISTS trg_protect_complaint_status_logs ON complaint_status_logs;")
    op.execute("DROP FUNCTION IF EXISTS prevent_complaint_status_log_mutation();")

    op.drop_index(op.f("ix_complaint_status_logs_ticket"), table_name="complaint_status_logs")
    op.drop_index(op.f("ix_complaint_status_logs_complaint_id"), table_name="complaint_status_logs")
    op.drop_index(op.f("ix_complaint_status_logs_id"), table_name="complaint_status_logs")
    op.drop_table("complaint_status_logs")

    op.drop_index(op.f("ix_complaints_ticket_number"), table_name="complaints")
    op.drop_constraint("fk_complaints_archived_by_user_id", "complaints", type_="foreignkey")
    op.drop_column("complaints", "archived_by_user_id")
    op.drop_column("complaints", "archived_at")
    op.drop_column("complaints", "is_archived")
    op.drop_column("complaints", "evidence_file_path")
    op.drop_column("complaints", "ticket_number")

    op.execute("DROP SEQUENCE IF EXISTS complaint_ticket_seq;")

