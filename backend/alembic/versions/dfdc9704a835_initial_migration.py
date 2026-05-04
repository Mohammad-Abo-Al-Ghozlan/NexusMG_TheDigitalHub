"""Initial migration

Revision ID: dfdc9704a835
Revises: 
Create Date: 2026-05-03 09:56:34.765618

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dfdc9704a835'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    user_role = sa.Enum("trainee", "instructor", "admin", name="userrole")
    evaluation_type = sa.Enum("cv", "github", "linkedin", "idea", "interview", "english", name="evaluationtype")
    evaluation_status = sa.Enum("pending", "in_progress", "completed", "failed", name="evaluationstatus")

    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("role", user_role, nullable=False, server_default=sa.text("'trainee'")),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("1")),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("university", sa.String(255), nullable=True),
        sa.Column("major", sa.String(255), nullable=True),
        sa.Column("graduation_year", sa.Integer, nullable=True),
        sa.Column("github_username", sa.String(100), nullable=True),
        sa.Column("linkedin_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("instructor_id", sa.Integer, sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_instructor_id", "users", ["instructor_id"])

    op.create_table(
        "instructor_invites",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("invite_code", sa.String(100), nullable=False, unique=True),
        sa.Column("invited_by", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("is_used", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "evaluations",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("evaluation_type", evaluation_type, nullable=False),
        sa.Column("status", evaluation_status, nullable=False, server_default=sa.text("'pending'")),
        sa.Column("score", sa.Float, nullable=True),
        sa.Column("input_data", sa.JSON, nullable=True),
        sa.Column("analysis", sa.JSON, nullable=True),
        sa.Column("feedback", sa.Text, nullable=True),
        sa.Column("recommendations", sa.JSON, nullable=True),
        sa.Column("file_path", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_evaluations_user_type_status", "evaluations", ["user_id", "evaluation_type", "status"])
    op.create_index("ix_evaluations_user_type_created", "evaluations", ["user_id", "evaluation_type", "created_at"])

    op.create_table(
        "cv_evaluations",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("evaluation_id", sa.Integer, sa.ForeignKey("evaluations.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("extracted_text", sa.Text, nullable=True),
        sa.Column("skills", sa.JSON, nullable=True),
        sa.Column("experience", sa.JSON, nullable=True),
        sa.Column("education", sa.JSON, nullable=True),
        sa.Column("projects", sa.JSON, nullable=True),
        sa.Column("format_score", sa.Float, nullable=True),
        sa.Column("content_score", sa.Float, nullable=True),
        sa.Column("skills_score", sa.Float, nullable=True),
        sa.Column("experience_score", sa.Float, nullable=True),
    )

    op.create_table(
        "github_evaluations",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("evaluation_id", sa.Integer, sa.ForeignKey("evaluations.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("username", sa.String(100), nullable=False),
        sa.Column("profile_data", sa.JSON, nullable=True),
        sa.Column("repositories", sa.JSON, nullable=True),
        sa.Column("activity_score", sa.Float, nullable=True),
        sa.Column("code_quality_score", sa.Float, nullable=True),
        sa.Column("diversity_score", sa.Float, nullable=True),
        sa.Column("documentation_score", sa.Float, nullable=True),
    )

    op.create_table(
        "linkedin_evaluations",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("evaluation_id", sa.Integer, sa.ForeignKey("evaluations.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("profile_url", sa.String(500), nullable=True),
        sa.Column("profile_data", sa.JSON, nullable=True),
        sa.Column("is_manual_entry", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("completeness_score", sa.Float, nullable=True),
        sa.Column("network_score", sa.Float, nullable=True),
        sa.Column("engagement_score", sa.Float, nullable=True),
    )

    op.create_table(
        "idea_evaluations",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("evaluation_id", sa.Integer, sa.ForeignKey("evaluations.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("problem_statement", sa.Text, nullable=True),
        sa.Column("target_audience", sa.Text, nullable=True),
        sa.Column("tech_stack", sa.JSON, nullable=True),
        sa.Column("innovation_score", sa.Float, nullable=True),
        sa.Column("feasibility_score", sa.Float, nullable=True),
        sa.Column("market_score", sa.Float, nullable=True),
        sa.Column("technical_score", sa.Float, nullable=True),
    )

    op.create_table(
        "interview_evaluations",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("evaluation_id", sa.Integer, sa.ForeignKey("evaluations.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("questions", sa.JSON, nullable=True),
        sa.Column("answers", sa.JSON, nullable=True),
        sa.Column("topic", sa.String(100), nullable=True),
        sa.Column("difficulty", sa.String(50), nullable=True),
        sa.Column("technical_score", sa.Float, nullable=True),
        sa.Column("communication_score", sa.Float, nullable=True),
        sa.Column("problem_solving_score", sa.Float, nullable=True),
    )

    op.create_table(
        "english_evaluations",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("evaluation_id", sa.Integer, sa.ForeignKey("evaluations.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("assessment_type", sa.String(50), nullable=True),
        sa.Column("questions", sa.JSON, nullable=True),
        sa.Column("answers", sa.JSON, nullable=True),
        sa.Column("grammar_score", sa.Float, nullable=True),
        sa.Column("vocabulary_score", sa.Float, nullable=True),
        sa.Column("fluency_score", sa.Float, nullable=True),
        sa.Column("comprehension_score", sa.Float, nullable=True),
    )

    op.create_table(
        "readiness_scores",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("overall_score", sa.Float, nullable=False, server_default="0"),
        sa.Column("cv_score", sa.Float, nullable=False, server_default="0"),
        sa.Column("github_score", sa.Float, nullable=False, server_default="0"),
        sa.Column("linkedin_score", sa.Float, nullable=False, server_default="0"),
        sa.Column("idea_score", sa.Float, nullable=False, server_default="0"),
        sa.Column("interview_score", sa.Float, nullable=False, server_default="0"),
        sa.Column("english_score", sa.Float, nullable=False, server_default="0"),
        sa.Column("cv_completed", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column("github_completed", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column("linkedin_completed", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column("idea_completed", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column("interview_completed", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column("english_completed", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column("strengths", sa.JSON, nullable=True),
        sa.Column("weaknesses", sa.JSON, nullable=True),
        sa.Column("recommendations", sa.JSON, nullable=True),
        sa.Column("career_suggestions", sa.JSON, nullable=True),
        sa.Column("summary", sa.Text, nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("readiness_scores")
    op.drop_table("english_evaluations")
    op.drop_table("interview_evaluations")
    op.drop_table("idea_evaluations")
    op.drop_table("linkedin_evaluations")
    op.drop_table("github_evaluations")
    op.drop_table("cv_evaluations")
    op.drop_index("ix_evaluations_user_type_created", table_name="evaluations")
    op.drop_index("ix_evaluations_user_type_status", table_name="evaluations")
    op.drop_table("evaluations")
    op.drop_table("instructor_invites")
    op.drop_index("ix_users_instructor_id", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

