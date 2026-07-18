"""Add document status history."""
from alembic import op
from app.core.database import Base
from app.models import entities  # noqa: F401
revision = "0003_document_history"
down_revision = "0002_candidate_tags"
branch_labels = None
depends_on = None
def upgrade() -> None:
    Base.metadata.tables["document_status_history"].create(op.get_bind(), checkfirst=True)
def downgrade() -> None:
    Base.metadata.tables["document_status_history"].drop(op.get_bind(), checkfirst=True)
