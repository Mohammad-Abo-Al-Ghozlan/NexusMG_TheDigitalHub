"""Add avatar_url to users

Revision ID: 7a3c0a1d9e2f
Revises: dfdc9704a835
Create Date: 2026-05-05

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "7a3c0a1d9e2f"
down_revision = "dfdc9704a835"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "avatar_url")
