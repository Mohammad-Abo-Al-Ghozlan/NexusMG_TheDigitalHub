"""Add messages table

Revision ID: c2f7e3f3b1a2
Revises: 51b38b07f78f
Create Date: 2026-05-12

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c2f7e3f3b1a2"
down_revision: Union[str, None] = "51b38b07f78f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "messages",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("sender_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("recipient_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_messages_sender_recipient_created", "messages", ["sender_id", "recipient_id", "created_at"])
    op.create_index("ix_messages_recipient_created", "messages", ["recipient_id", "created_at"])
    op.create_index("ix_messages_sender_created", "messages", ["sender_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_messages_sender_created", table_name="messages")
    op.drop_index("ix_messages_recipient_created", table_name="messages")
    op.drop_index("ix_messages_sender_recipient_created", table_name="messages")
    op.drop_table("messages")
