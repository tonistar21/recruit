import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import check_csrf, ensure_candidate_access, get_current_user, require_permission
from app.core.database import get_db
from app.models import AuditLog, Candidate, Document, Interview, InterviewParticipant, Notification, User, WorkflowStage
from app.services.audit import write_audit

router = APIRouter(tags=["operations"])


class InterviewInput(BaseModel):
    candidate_id: uuid.UUID
    starts_at: datetime
    duration_minutes: int = Field(default=60, ge=15, le=480)
    format: str = Field(pattern="^(online|offline)$")
    address: str | None = None
    meeting_url: str | None = None
    comment: str | None = None
    participant_ids: list[uuid.UUID] = Field(default_factory=list)


class InterviewUpdate(BaseModel):
    starts_at: datetime | None = None
    duration_minutes: int | None = Field(default=None, ge=15, le=480)
    status: str | None = None
    comment: str | None = None
    result: str | None = None
    score: int | None = Field(default=None, ge=1, le=10)


def interview_view(item: Interview) -> dict:
    return {"id": str(item.id), "candidate_id": str(item.candidate_id), "responsible_id": str(item.responsible_id), "starts_at": item.starts_at, "duration_minutes": item.duration_minutes, "format": item.format, "address": item.address, "meeting_url": item.meeting_url, "status": item.status, "comment": item.comment, "result": item.result, "score": item.score}


@router.get("/interviews")
def interviews(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = select(Interview).order_by(Interview.starts_at)
    if user.role.code == "candidate":
        query = query.join(Candidate).where(Candidate.user_id == user.id)
    elif "interviews.manage" not in {p.code for p in user.role.permissions}:
        raise HTTPException(status_code=403, detail="Недостатньо прав")
    return [interview_view(item) for item in db.scalars(query).all()]


@router.post("/interviews", status_code=201, dependencies=[Depends(check_csrf)])
def create_interview(payload: InterviewInput, request: Request, user: User = Depends(require_permission("interviews.manage")), db: Session = Depends(get_db)):
    candidate = db.get(Candidate, payload.candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Кандидата не знайдено")
    ensure_candidate_access(db, user, candidate)
    data = payload.model_dump(exclude={"participant_ids"})
    item = Interview(**data, responsible_id=user.id)
    db.add(item)
    db.flush()
    for participant_id in set(payload.participant_ids):
        if db.get(User, participant_id):
            db.add(InterviewParticipant(interview_id=item.id, user_id=participant_id))
    if candidate.user_id:
        db.add(Notification(user_id=candidate.user_id, type="interview_created", title="Заплановано співбесіду", message=f"Дата: {payload.starts_at:%d.%m.%Y %H:%M}", link="/cabinet/interviews"))
    write_audit(db, request, "interview.created", "Створено співбесіду", user, "interview", str(item.id))
    db.commit()
    db.refresh(item)
    return interview_view(item)


@router.patch("/interviews/{interview_id}", dependencies=[Depends(check_csrf)])
def update_interview(interview_id: uuid.UUID, payload: InterviewUpdate, request: Request, user: User = Depends(require_permission("interviews.manage")), db: Session = Depends(get_db)):
    item = db.get(Interview, interview_id)
    if not item:
        raise HTTPException(status_code=404, detail="Співбесіду не знайдено")
    allowed = {"planned", "confirmed", "completed", "cancelled", "rescheduled"}
    if payload.status and payload.status not in allowed:
        raise HTTPException(status_code=422, detail="Некоректний статус")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    candidate = db.get(Candidate, item.candidate_id)
    if candidate.user_id and payload.status in {"cancelled", "rescheduled", "completed"}:
        db.add(Notification(user_id=candidate.user_id, type="interview_updated", title="Оновлено співбесіду", message=f"Статус: {payload.status}", link="/cabinet/interviews"))
    write_audit(db, request, "interview.updated", "Оновлено співбесіду", user, "interview", str(item.id))
    db.commit()
    return interview_view(item)


@router.get("/notifications")
def notifications(unread: bool = False, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = select(Notification).where(Notification.user_id == user.id)
    if unread:
        query = query.where(Notification.read_at.is_(None))
    return list(db.scalars(query.order_by(Notification.created_at.desc()).limit(100)).all())


@router.post("/notifications/{notification_id}/read", dependencies=[Depends(check_csrf)])
def read_notification(notification_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.get(Notification, notification_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Сповіщення не знайдено")
    item.read_at = datetime.now(UTC)
    db.commit()
    return {"message": "Сповіщення прочитано"}


@router.get("/analytics/dashboard")
def dashboard(_: User = Depends(require_permission("analytics.read")), db: Session = Depends(get_db)):
    week_ago = datetime.now(UTC) - timedelta(days=7)
    stages = db.execute(select(WorkflowStage.name, func.count(Candidate.id)).outerjoin(Candidate).group_by(WorkflowStage.id).order_by(WorkflowStage.position)).all()
    return {
        "total": db.scalar(select(func.count(Candidate.id))) or 0,
        "new_week": db.scalar(select(func.count(Candidate.id)).where(Candidate.created_at >= week_ago)) or 0,
        "by_stage": [{"name": name, "count": count} for name, count in stages],
        "upcoming_interviews": db.scalar(select(func.count(Interview.id)).where(Interview.starts_at >= datetime.now(UTC), Interview.status.in_(["planned", "confirmed"]))) or 0,
    }


@router.get("/analytics")
def analytics(date_from: datetime | None = None, date_to: datetime | None = None, _: User = Depends(require_permission("analytics.read")), db: Session = Depends(get_db)):
    filters = []
    if date_from:
        filters.append(Candidate.created_at >= date_from)
    if date_to:
        filters.append(Candidate.created_at <= date_to)
    candidates = list(db.scalars(select(Candidate).where(*filters)).all())
    by_status: dict[str, int] = {}
    by_source: dict[str, int] = {}
    registrations: dict[str, int] = {}
    for candidate in candidates:
        by_status[candidate.status] = by_status.get(candidate.status, 0) + 1
        source = candidate.source or "Не вказано"
        by_source[source] = by_source.get(source, 0) + 1
        day = candidate.created_at.date().isoformat()
        registrations[day] = registrations.get(day, 0) + 1
    recruiter_rows = db.execute(select(User.display_name, func.count(Candidate.id)).join(Candidate, Candidate.recruiter_id == User.id).where(*filters).group_by(User.id).order_by(func.count(Candidate.id).desc())).all()
    pending_documents = db.scalar(select(func.count(Document.id)).where(Document.deleted_at.is_(None), Document.status.in_(["uploaded", "under_review"]))) or 0
    upcoming = db.scalars(select(Interview).where(Interview.starts_at >= datetime.now(UTC), Interview.status.in_(["planned", "confirmed"])).order_by(Interview.starts_at).limit(10)).all()
    accepted = sum(1 for c in candidates if c.status == "accepted")
    return {"total": len(candidates), "conversion": round(accepted / len(candidates) * 100, 1) if candidates else 0, "registrations": [{"date": key, "count": registrations[key]} for key in sorted(registrations)], "by_status": [{"name": k, "count": v} for k, v in sorted(by_status.items())], "by_source": [{"name": k, "count": v} for k, v in sorted(by_source.items())], "recruiters": [{"name": n, "count": c} for n, c in recruiter_rows], "pending_documents": pending_documents, "upcoming_interviews": [interview_view(x) for x in upcoming]}


@router.get("/audit")
def audit(page: int = Query(1, ge=1), page_size: int = Query(30, ge=1, le=100), _: User = Depends(require_permission("audit.read")), db: Session = Depends(get_db)):
    total = db.scalar(select(func.count(AuditLog.id))) or 0
    items = db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
    return {"items": list(items), "total": total, "page": page, "page_size": page_size}


@router.get("/search")
def search(q: str = Query(min_length=2, max_length=100), user: User = Depends(require_permission("candidates.read")), db: Session = Depends(get_db)):
    needle = f"%{q}%"
    query = select(Candidate).where((Candidate.first_name.ilike(needle)) | (Candidate.last_name.ilike(needle)) | (Candidate.email.ilike(needle)) | (Candidate.public_id.ilike(needle))).limit(10)
    if user.role.code == "candidate":
        query = query.where(Candidate.user_id == user.id)
    results = [{"type": "candidate", "id": str(c.id), "label": f"{c.public_id} · {c.last_name} {c.first_name}", "url": f"/candidates/{c.id}" if user.role.code != "candidate" else "/cabinet/profile"} for c in db.scalars(query).all()]
    permissions = {p.code for p in user.role.permissions}
    if "users.manage" in permissions:
        users = db.scalars(select(User).where((User.display_name.ilike(needle)) | (User.email.ilike(needle))).limit(5)).all()
        results.extend({"type": "user", "id": str(x.id), "label": f"{x.display_name} · {x.email}", "url": "/users"} for x in users)
    if "documents.read" in permissions:
        documents = select(Document).where(Document.deleted_at.is_(None), Document.original_name.ilike(needle)).limit(5)
        if user.role.code == "candidate":
            documents = documents.join(Candidate).where(Candidate.user_id == user.id)
        results.extend({"type": "document", "id": str(x.id), "label": x.original_name, "url": "/cabinet/documents" if user.role.code == "candidate" else "/documents"} for x in db.scalars(documents).all())
    return results
