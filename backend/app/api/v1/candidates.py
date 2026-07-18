import csv
import io
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import check_csrf, ensure_candidate_access, get_current_user, require_permission
from app.core.database import get_db
from app.models import AuditLog, Candidate, CandidateComment, CandidateStageHistory, CandidateState, Notification, Tag, User, WorkflowStage
from app.schemas.candidate import CandidateCreate, CandidateUpdate, CandidateView, CommentCreate, StageMove, StageView, TagsUpdate
from app.schemas.common import Message, Page
from app.services.audit import write_audit

router = APIRouter(prefix="/candidates", tags=["candidates"])


@router.get("", response_model=Page[CandidateView])
def list_candidates(q: str = "", stage_id: int | None = None, status: str | None = None, recruiter_id: uuid.UUID | None = None, state: CandidateState | None = None, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), sort: str = "-created_at", user: User = Depends(require_permission("candidates.read")), db: Session = Depends(get_db)):
    query = select(Candidate)
    count_query = select(func.count(Candidate.id))
    filters = []
    if user.role.code == "recruiter":
        filters.append(or_(Candidate.recruiter_id == user.id, Candidate.recruiter_id.is_(None)))
    if user.role.code == "candidate":
        filters.append(Candidate.user_id == user.id)
    if q:
        needle = f"%{q.strip()}%"
        filters.append(or_(Candidate.public_id.ilike(needle), Candidate.first_name.ilike(needle), Candidate.last_name.ilike(needle), Candidate.email.ilike(needle), Candidate.phone.ilike(needle)))
    if stage_id:
        filters.append(Candidate.stage_id == stage_id)
    if status:
        filters.append(Candidate.status == status)
    if recruiter_id:
        filters.append(Candidate.recruiter_id == recruiter_id)
    if state:
        filters.append(Candidate.state == state)
    query = query.where(*filters)
    count_query = count_query.where(*filters)
    sort_columns = {"created_at": Candidate.created_at, "updated_at": Candidate.updated_at, "last_name": Candidate.last_name, "public_id": Candidate.public_id}
    sort_column = sort_columns.get(sort.lstrip("-"), Candidate.created_at)
    query = query.order_by(sort_column.desc() if sort.startswith("-") else sort_column.asc()).offset((page - 1) * page_size).limit(page_size)
    return Page(items=list(db.scalars(query).all()), total=db.scalar(count_query) or 0, page=page, page_size=page_size)


@router.post("", response_model=CandidateView, status_code=201, dependencies=[Depends(check_csrf)])
def create_candidate(payload: CandidateCreate, request: Request, user: User = Depends(require_permission("candidates.create")), db: Session = Depends(get_db)):
    stage = db.scalar(select(WorkflowStage).order_by(WorkflowStage.position))
    if not stage:
        raise HTTPException(status_code=503, detail="Workflow не налаштовано")
    next_number = (db.scalar(select(func.count(Candidate.id))) or 0) + 1001
    data = payload.model_dump(exclude={"create_account", "email", "recruiter_id"})
    candidate = Candidate(**data, email=str(payload.email).lower(), public_id=f"C-{next_number:04d}", stage_id=stage.id, recruiter_id=payload.recruiter_id or (user.id if user.role.code == "recruiter" else None))
    db.add(candidate)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Кандидат з таким email або телефоном уже існує") from None
    db.add(CandidateStageHistory(candidate_id=candidate.id, to_stage_id=stage.id, author_id=user.id, comment="Кандидата зареєстровано"))
    write_audit(db, request, "candidate.created", f"Створено {candidate.public_id}", user, "candidate", str(candidate.id))
    db.commit()
    db.refresh(candidate)
    return candidate


@router.get("/by-id/{candidate_id}", response_model=CandidateView)
def get_candidate(candidate_id: uuid.UUID, user: User = Depends(require_permission("candidates.read")), db: Session = Depends(get_db)):
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Кандидата не знайдено")
    ensure_candidate_access(db, user, candidate)
    return candidate


@router.patch("/{candidate_id}", response_model=CandidateView, dependencies=[Depends(check_csrf)])
def update_candidate(candidate_id: uuid.UUID, payload: CandidateUpdate, request: Request, user: User = Depends(require_permission("candidates.update")), db: Session = Depends(get_db)):
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Кандидата не знайдено")
    ensure_candidate_access(db, user, candidate)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(candidate, key, str(value).lower() if key == "email" else value)
    write_audit(db, request, "candidate.updated", f"Оновлено {candidate.public_id}", user, "candidate", str(candidate.id))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email або телефон уже використовується") from None
    db.refresh(candidate)
    return candidate


@router.post("/{candidate_id}/archive", response_model=Message, dependencies=[Depends(check_csrf)])
def archive_candidate(candidate_id: uuid.UUID, request: Request, user: User = Depends(require_permission("candidates.archive")), db: Session = Depends(get_db)):
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Кандидата не знайдено")
    candidate.state = CandidateState.ARCHIVED
    candidate.archived_at = datetime.now(UTC)
    write_audit(db, request, "candidate.archived", f"Архівовано {candidate.public_id}", user, "candidate", str(candidate.id))
    db.commit()
    return Message(message="Кандидата архівовано")


@router.post("/{candidate_id}/restore", response_model=Message, dependencies=[Depends(check_csrf)])
def restore_candidate(candidate_id: uuid.UUID, request: Request, user: User = Depends(require_permission("candidates.archive")), db: Session = Depends(get_db)):
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Кандидата не знайдено")
    candidate.state = CandidateState.ACTIVE
    candidate.archived_at = None
    write_audit(db, request, "candidate.restored", f"Відновлено {candidate.public_id}", user, "candidate", str(candidate.id))
    db.commit()
    return Message(message="Кандидата відновлено")


@router.delete("/{candidate_id}", status_code=204, dependencies=[Depends(check_csrf)])
def delete_candidate(candidate_id: uuid.UUID, request: Request, user: User = Depends(require_permission("candidates.delete")), db: Session = Depends(get_db)):
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Кандидата не знайдено")
    if candidate.state != CandidateState.ARCHIVED:
        raise HTTPException(status_code=409, detail="Перед видаленням кандидата потрібно архівувати")
    write_audit(db, request, "candidate.deleted", f"Остаточно видалено {candidate.public_id}", user, "candidate", str(candidate.id))
    db.delete(candidate)
    db.commit()


@router.get("/{candidate_id}/history")
def candidate_history(candidate_id: uuid.UUID, user: User = Depends(require_permission("candidates.read")), db: Session = Depends(get_db)):
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Кандидата не знайдено")
    ensure_candidate_access(db, user, candidate)
    rows = db.execute(select(CandidateStageHistory, User.display_name, WorkflowStage.name).join(User, CandidateStageHistory.author_id == User.id).join(WorkflowStage, CandidateStageHistory.to_stage_id == WorkflowStage.id).where(CandidateStageHistory.candidate_id == candidate.id).order_by(CandidateStageHistory.created_at.desc())).all()
    return [{"id": str(item.id), "to_stage": stage, "author": author, "comment": item.comment, "rejection_reason": item.rejection_reason, "created_at": item.created_at} for item, author, stage in rows]


@router.get("/{candidate_id}/comments")
def comments(candidate_id: uuid.UUID, user: User = Depends(require_permission("candidates.read")), db: Session = Depends(get_db)):
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Кандидата не знайдено")
    ensure_candidate_access(db, user, candidate)
    rows = db.execute(select(CandidateComment, User.display_name).join(User, CandidateComment.author_id == User.id).where(CandidateComment.candidate_id == candidate.id).order_by(CandidateComment.created_at.desc())).all()
    return [{"id": str(item.id), "body": item.body, "author": author, "created_at": item.created_at} for item, author in rows]


@router.post("/{candidate_id}/comments", status_code=201, dependencies=[Depends(check_csrf)])
def add_comment(candidate_id: uuid.UUID, payload: CommentCreate, request: Request, user: User = Depends(require_permission("candidates.update")), db: Session = Depends(get_db)):
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Кандидата не знайдено")
    ensure_candidate_access(db, user, candidate)
    item = CandidateComment(candidate_id=candidate.id, author_id=user.id, body=payload.body)
    db.add(item)
    write_audit(db, request, "candidate.comment_added", f"Коментар до {candidate.public_id}", user, "candidate", str(candidate.id))
    db.commit()
    return {"id": str(item.id), "body": item.body, "created_at": item.created_at}


@router.put("/{candidate_id}/tags", dependencies=[Depends(check_csrf)])
def update_tags(candidate_id: uuid.UUID, payload: TagsUpdate, request: Request, user: User = Depends(require_permission("candidates.update")), db: Session = Depends(get_db)):
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Кандидата не знайдено")
    ensure_candidate_access(db, user, candidate)
    names = sorted({name.strip().lower() for name in payload.tags if name.strip()})
    existing = {tag.name: tag for tag in db.scalars(select(Tag).where(Tag.name.in_(names))).all()} if names else {}
    candidate.tags = [existing.get(name) or Tag(name=name) for name in names]
    write_audit(db, request, "candidate.tags_updated", f"Оновлено теги {candidate.public_id}", user, "candidate", str(candidate.id))
    db.commit()
    return {"tags": [tag.name for tag in candidate.tags]}


@router.get("/{candidate_id}/changes")
def candidate_changes(candidate_id: uuid.UUID, user: User = Depends(require_permission("candidates.read")), db: Session = Depends(get_db)):
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Кандидата не знайдено")
    ensure_candidate_access(db, user, candidate)
    rows = db.scalars(select(AuditLog).where(AuditLog.object_type == "candidate", AuditLog.object_id == str(candidate.id)).order_by(AuditLog.created_at.desc())).all()
    return [{"id": str(x.id), "action": x.action, "description": x.description, "created_at": x.created_at} for x in rows]


@router.post("/{candidate_id}/stage", response_model=CandidateView, dependencies=[Depends(check_csrf)])
def move_stage(candidate_id: uuid.UUID, payload: StageMove, request: Request, user: User = Depends(require_permission("stages.update")), db: Session = Depends(get_db)):
    candidate = db.get(Candidate, candidate_id)
    target = db.get(WorkflowStage, payload.stage_id)
    if not candidate or not target:
        raise HTTPException(status_code=404, detail="Кандидата або етап не знайдено")
    ensure_candidate_access(db, user, candidate)
    if abs(target.position - candidate.stage.position) > 1 and target.code not in {"rejected", "archived"}:
        raise HTTPException(status_code=409, detail="Недопустимий перехід між етапами")
    if target.code == "rejected" and not payload.rejection_reason:
        raise HTTPException(status_code=422, detail="Вкажіть причину відмови")
    previous = candidate.stage_id
    candidate.stage_id = target.id
    candidate.status = "rejected" if target.code == "rejected" else "accepted" if target.code == "accepted" else "in_progress"
    db.add(CandidateStageHistory(candidate_id=candidate.id, from_stage_id=previous, to_stage_id=target.id, author_id=user.id, comment=payload.comment, rejection_reason=payload.rejection_reason))
    if candidate.user_id:
        db.add(Notification(user_id=candidate.user_id, type="stage_changed", title="Змінено етап відбору", message=f"Новий етап: {target.name}", link="/cabinet/status"))
    write_audit(db, request, "candidate.stage_changed", f"{candidate.public_id}: {target.name}", user, "candidate", str(candidate.id))
    db.commit()
    db.refresh(candidate)
    return candidate


@router.get("/export/csv")
def export_csv(user: User = Depends(require_permission("candidates.export")), db: Session = Depends(get_db)):
    items = db.scalars(select(Candidate).order_by(Candidate.created_at.desc())).all()
    stream = io.StringIO()
    writer = csv.writer(stream)
    writer.writerow(["ID", "ПІБ", "Email", "Телефон", "Етап", "Статус"])
    for item in items:
        writer.writerow([item.public_id, f"{item.last_name} {item.first_name} {item.middle_name or ''}".strip(), item.email, item.phone, item.stage.name, item.status])
    return Response(content="\ufeff" + stream.getvalue(), media_type="text/csv; charset=utf-8", headers={"Content-Disposition": "attachment; filename=candidates.csv"})


@router.get("/workflow/stages", response_model=list[StageView])
def stages(_: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list(db.scalars(select(WorkflowStage).order_by(WorkflowStage.position)).all())
