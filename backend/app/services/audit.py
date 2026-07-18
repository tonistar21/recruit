from fastapi import Request
from sqlalchemy.orm import Session

from app.models import AuditLog, User


def write_audit(db: Session, request: Request, action: str, description: str, user: User | None = None, object_type: str | None = None, object_id: str | None = None) -> None:
    db.add(AuditLog(
        user_id=user.id if user else None,
        action=action,
        object_type=object_type,
        object_id=object_id,
        description=description,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:500],
        request_id=getattr(request.state, "request_id", None),
    ))
