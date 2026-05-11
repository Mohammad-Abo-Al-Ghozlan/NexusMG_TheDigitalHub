"""normalize enum values

Revision ID: beff709e0f48
Revises: 51b38b07f78f
Create Date: 2026-05-11 17:46:50.584572

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'beff709e0f48'
down_revision: Union[str, None] = '51b38b07f78f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE users MODIFY COLUMN role "
        "ENUM('trainee','instructor','admin','TRAINEE','INSTRUCTOR','ADMIN') "
        "NOT NULL DEFAULT 'trainee'"
    )
    op.execute(
        "ALTER TABLE evaluations MODIFY COLUMN evaluation_type "
        "ENUM('cv','github','linkedin','idea','interview','english',"
        "'CV','GITHUB','LINKEDIN','IDEA','INTERVIEW','ENGLISH') NOT NULL"
    )
    op.execute(
        "ALTER TABLE evaluation_notes MODIFY COLUMN module "
        "ENUM('cv','github','linkedin','idea','interview','english',"
        "'CV','GITHUB','LINKEDIN','IDEA','INTERVIEW','ENGLISH') NOT NULL"
    )
    op.execute(
        "ALTER TABLE evaluations MODIFY COLUMN status "
        "ENUM('pending','in_progress','completed','failed',"
        "'PENDING','IN_PROGRESS','COMPLETED','FAILED') NOT NULL DEFAULT 'pending'"
    )

    op.execute("UPDATE users SET role = LOWER(role)")
    op.execute("UPDATE evaluations SET evaluation_type = LOWER(evaluation_type)")
    op.execute("UPDATE evaluation_notes SET module = LOWER(module)")
    op.execute("UPDATE evaluations SET status = LOWER(status)")

    op.execute(
        "ALTER TABLE users MODIFY COLUMN role "
        "ENUM('trainee','instructor','admin') NOT NULL DEFAULT 'trainee'"
    )
    op.execute(
        "ALTER TABLE evaluations MODIFY COLUMN evaluation_type "
        "ENUM('cv','github','linkedin','idea','interview','english') NOT NULL"
    )
    op.execute(
        "ALTER TABLE evaluation_notes MODIFY COLUMN module "
        "ENUM('cv','github','linkedin','idea','interview','english') NOT NULL"
    )
    op.execute(
        "ALTER TABLE evaluations MODIFY COLUMN status "
        "ENUM('pending','in_progress','completed','failed') NOT NULL DEFAULT 'pending'"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE users MODIFY COLUMN role "
        "ENUM('trainee','instructor','admin','TRAINEE','INSTRUCTOR','ADMIN') "
        "NOT NULL DEFAULT 'trainee'"
    )
    op.execute(
        "ALTER TABLE evaluations MODIFY COLUMN evaluation_type "
        "ENUM('cv','github','linkedin','idea','interview','english',"
        "'CV','GITHUB','LINKEDIN','IDEA','INTERVIEW','ENGLISH') NOT NULL"
    )
    op.execute(
        "ALTER TABLE evaluation_notes MODIFY COLUMN module "
        "ENUM('cv','github','linkedin','idea','interview','english',"
        "'CV','GITHUB','LINKEDIN','IDEA','INTERVIEW','ENGLISH') NOT NULL"
    )
    op.execute(
        "ALTER TABLE evaluations MODIFY COLUMN status "
        "ENUM('pending','in_progress','completed','failed',"
        "'PENDING','IN_PROGRESS','COMPLETED','FAILED') NOT NULL DEFAULT 'pending'"
    )

    op.execute("UPDATE users SET role = UPPER(role)")
    op.execute("UPDATE evaluations SET evaluation_type = UPPER(evaluation_type)")
    op.execute("UPDATE evaluation_notes SET module = UPPER(module)")
    op.execute("UPDATE evaluations SET status = UPPER(status)")

    op.execute(
        "ALTER TABLE users MODIFY COLUMN role "
        "ENUM('TRAINEE','INSTRUCTOR','ADMIN') NOT NULL DEFAULT 'TRAINEE'"
    )
    op.execute(
        "ALTER TABLE evaluations MODIFY COLUMN evaluation_type "
        "ENUM('CV','GITHUB','LINKEDIN','IDEA','INTERVIEW','ENGLISH') NOT NULL"
    )
    op.execute(
        "ALTER TABLE evaluation_notes MODIFY COLUMN module "
        "ENUM('CV','GITHUB','LINKEDIN','IDEA','INTERVIEW','ENGLISH') NOT NULL"
    )
    op.execute(
        "ALTER TABLE evaluations MODIFY COLUMN status "
        "ENUM('PENDING','IN_PROGRESS','COMPLETED','FAILED') NOT NULL DEFAULT 'PENDING'"
    )
