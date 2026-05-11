"""Add evaluation notes

Revision ID: b9c2f0f7a3c1
Revises: 7a3c0a1d9e2f
Create Date: 2026-05-11

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b9c2f0f7a3c1"
down_revision = "7a3c0a1d9e2f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    evaluation_type = sa.Enum(
        "cv",
        "github",
        "linkedin",
        "idea",
        "interview",
        "english",
        name="evaluationtype",
        create_type=False,
    )

    op.create_table(
        "evaluation_notes",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("trainee_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("instructor_id", sa.Integer, sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("module", evaluation_type, nullable=False),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_evaluation_notes_trainee", "evaluation_notes", ["trainee_id"])
    op.create_index(
        "ix_evaluation_notes_trainee_module",
        "evaluation_notes",
        ["trainee_id", "module"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_evaluation_notes_trainee_module", table_name="evaluation_notes")
    op.drop_index("ix_evaluation_notes_trainee", table_name="evaluation_notes")
    op.drop_table("evaluation_notes")
