import logging
import mimetypes
import re
import uuid
from datetime import UTC, datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import check_csrf, ensure_candidate_access, require_permission
from app.core.config import settings
from app.core.database import get_db
from app.models import Candidate, Document, DocumentStatusHistory, User
from app.services.audit import write_audit
from app.services.settings import get_int_setting

router = APIRouter(prefix="/documents", tags=["documents"])
logger = logging.getLogger(__name__)
ALLOWED_MIME = {"application/pdf", "image/jpeg", "image/png", "text/plain"}
ALLOWED_STATUSES = {"uploaded", "under_review", "verified", "needs_clarification", "rejected"}


class DocumentReview(BaseModel):
    status: str
    comment: str | None = Field(default=None, max_length=1000)


def document_view(item: Document) -> dict:
    return {"id": str(item.id), "candidate_id": str(item.candidate_id), "category": item.category, "original_name": item.original_name, "mime_type": item.mime_type, "size_bytes": item.size_bytes, "status": item.status, "reviewer_comment": item.reviewer_comment, "created_at": item.created_at}


@router.get("")
def list_documents(candidate_id: uuid.UUID | None = None, user: User = Depends(require_permission("documents.read")), db: Session = Depends(get_db)):
    query = select(Document).where(Document.deleted_at.is_(None))
    if candidate_id:
        candidate = db.get(Candidate, candidate_id)
        if not candidate:
            raise HTTPException(status_code=404, detail="Кандидата не знайдено")
        ensure_candidate_access(db, user, candidate)
        query = query.where(Document.candidate_id == candidate_id)
    elif user.role.code == "candidate":
        query = query.join(Candidate).where(Candidate.user_id == user.id)
    return [document_view(item) for item in db.scalars(query.order_by(Document.created_at.desc())).all()]


@router.post("", status_code=201, dependencies=[Depends(check_csrf)])
async def upload_document(request: Request, candidate_id: uuid.UUID = Form(), category: str = Form(), file: UploadFile = File(), user: User = Depends(require_permission("documents.upload")), db: Session = Depends(get_db)):
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Кандидата не знайдено")
    ensure_candidate_access(db, user, candidate)
    max_upload_bytes = get_int_setting(db, "max_upload_mb", settings.max_upload_bytes // (1024 * 1024), 1, 50) * 1024 * 1024
    content = await file.read(max_upload_bytes + 1)
    if len(content) > max_upload_bytes:
        raise HTTPException(status_code=413, detail="Файл перевищує допустимий розмір")
    mime = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"
    if mime not in ALLOWED_MIME:
        raise HTTPException(status_code=422, detail="Тип файлу не дозволено")
    safe_name = re.sub(r"[^\w. -]", "_", Path(file.filename or "document").name)[:255]
    suffix = Path(safe_name).suffix.lower()
    storage_name = f"{uuid.uuid4()}{suffix}"
    try:
        settings.storage_path.mkdir(parents=True, exist_ok=True)
    except OSError:
        logger.exception("Document storage directory is not writable")
        raise HTTPException(status_code=500, detail="Не вдалося підготувати файлове сховище. Перевірте права доступу") from None
    path = (settings.storage_path / storage_name).resolve()
    if settings.storage_path.resolve() not in path.parents:
        raise HTTPException(status_code=422, detail="Некоректне ім'я файлу")
    try:
        path.write_bytes(content)
    except OSError:
        logger.exception("Document file could not be written")
        raise HTTPException(status_code=500, detail="Не вдалося зберегти файл. Перевірте права доступу до файлового сховища") from None
    item = Document(candidate_id=candidate.id, uploaded_by_id=user.id, category=category[:80], original_name=safe_name, storage_name=storage_name, mime_type=mime, size_bytes=len(content))
    db.add(item)
    db.flush()
    db.add(DocumentStatusHistory(document_id=item.id, author_id=user.id, from_status=None, to_status="uploaded", comment="Файл завантажено"))
    write_audit(db, request, "document.uploaded", f"Завантажено {safe_name}", user, "document", str(item.id))
    db.commit()
    db.refresh(item)
    return document_view(item)


@router.get("/{document_id}/download")
def download_document(document_id: uuid.UUID, user: User = Depends(require_permission("documents.read")), db: Session = Depends(get_db)):
    item = db.get(Document, document_id)
    if not item or item.deleted_at:
        raise HTTPException(status_code=404, detail="Документ не знайдено")
    candidate = db.get(Candidate, item.candidate_id)
    ensure_candidate_access(db, user, candidate)
    path = settings.storage_path / item.storage_name
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Фізичний файл не знайдено")
    return FileResponse(path, media_type=item.mime_type, filename=item.original_name)


@router.patch("/{document_id}/review", dependencies=[Depends(check_csrf)])
def review_document(document_id: uuid.UUID, payload: DocumentReview, request: Request, user: User = Depends(require_permission("documents.verify")), db: Session = Depends(get_db)):
    item = db.get(Document, document_id)
    if not item or item.deleted_at:
        raise HTTPException(status_code=404, detail="Документ не знайдено")
    if payload.status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=422, detail="Некоректний статус документа")
    old = item.status
    item.status = payload.status
    item.reviewer_comment = payload.comment
    db.add(DocumentStatusHistory(document_id=item.id, author_id=user.id, from_status=old, to_status=payload.status, comment=payload.comment))
    write_audit(db, request, "document.reviewed", f"Статус документа: {payload.status}", user, "document", str(item.id))
    db.commit()
    return document_view(item)


@router.get("/{document_id}/history")
def document_history(document_id: uuid.UUID, user: User = Depends(require_permission("documents.read")), db: Session = Depends(get_db)):
    item = db.get(Document, document_id)
    if not item:
        raise HTTPException(status_code=404, detail="Документ не знайдено")
    ensure_candidate_access(db, user, db.get(Candidate, item.candidate_id))
    rows = db.execute(select(DocumentStatusHistory, User.display_name).join(User, DocumentStatusHistory.author_id == User.id).where(DocumentStatusHistory.document_id == item.id).order_by(DocumentStatusHistory.created_at.desc())).all()
    return [{"id": str(row.id), "from_status": row.from_status, "to_status": row.to_status, "comment": row.comment, "author": author, "created_at": row.created_at} for row, author in rows]


@router.delete("/{document_id}", status_code=204, dependencies=[Depends(check_csrf)])
def delete_document(document_id: uuid.UUID, request: Request, user: User = Depends(require_permission("documents.upload")), db: Session = Depends(get_db)):
    item = db.get(Document, document_id)
    if not item or item.deleted_at:
        raise HTTPException(status_code=404, detail="Документ не знайдено")
    ensure_candidate_access(db, user, db.get(Candidate, item.candidate_id))
    item.deleted_at = datetime.now(UTC)
    path = settings.storage_path / item.storage_name
    if path.is_file():
        path.unlink()
    write_audit(db, request, "document.deleted", f"Видалено {item.original_name}", user, "document", str(item.id))
    db.commit()
