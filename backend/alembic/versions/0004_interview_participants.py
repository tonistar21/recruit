"""Add interview participants."""
from alembic import op
from app.core.database import Base
from app.models import entities  # noqa: F401
revision = "0004_interview_participants"
down_revision = "0003_document_history"
branch_labels = None
depends_on = None
def upgrade() -> None:
    Base.metadata.tables["interview_participants"].create(op.get_bind(), checkfirst=True)
def downgrade() -> None:
    Base.metadata.tables["interview_participants"].drop(op.get_bind(), checkfirst=True)
