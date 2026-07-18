"""Add normalized candidate tags."""
from alembic import op

from app.core.database import Base
from app.models import entities  # noqa: F401

revision = "0002_candidate_tags"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.tables["tags"].create(bind, checkfirst=True)
    Base.metadata.tables["candidate_tags"].create(bind, checkfirst=True)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.tables["candidate_tags"].drop(bind, checkfirst=True)
    Base.metadata.tables["tags"].drop(bind, checkfirst=True)
