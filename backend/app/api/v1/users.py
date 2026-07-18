import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.api.deps import check_csrf, require_permission
from app.core.database import get_db
from app.core.security import hash_password
from app.models import RefreshSession, Role, User, UserStatus
from app.services.audit import write_audit

router = APIRouter(prefix="/users", tags=["users"])


def user_view(user: User) -> dict:
    return {"id": str(user.id), "email": user.email, "display_name": user.display_name, "role": user.role.code, "role_name": user.role.name, "status": user.status.value, "last_login_at": user.last_login_at, "must_change_password": user.must_change_password}


class UserInput(BaseModel):
    email: EmailStr
    display_name: str = Field(min_length=2, max_length=160)
    role_code: str
    temporary_password: str = Field(min_length=10, max_length=128)


@router.get("")
def users(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), _: User = Depends(require_permission("users.manage")), db: Session = Depends(get_db)):
    return {"items": [user_view(x) for x in db.scalars(select(User).order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()], "total": db.scalar(select(func.count(User.id))) or 0, "page": page, "page_size": page_size}


@router.post("", status_code=201, dependencies=[Depends(check_csrf)])
def create_user(payload: UserInput, request: Request, actor: User = Depends(require_permission("users.manage")), db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == str(payload.email).lower())):
        raise HTTPException(status_code=409, detail="Email уже використовується")
    role = db.scalar(select(Role).where(Role.code == payload.role_code))
    if not role:
        raise HTTPException(status_code=422, detail="Роль не знайдено")
    user = User(email=str(payload.email).lower(), display_name=payload.display_name, role_id=role.id, password_hash=hash_password(payload.temporary_password), must_change_password=True)
    db.add(user)
    db.flush()
    write_audit(db, request, "user.created", f"Створено {user.email}", actor, "user", str(user.id))
    db.commit()
    db.refresh(user)
    return user_view(user)


@router.post("/{user_id}/block", dependencies=[Depends(check_csrf)])
def block_user(user_id: uuid.UUID, request: Request, actor: User = Depends(require_permission("users.manage")), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user or user.id == actor.id:
        raise HTTPException(status_code=422, detail="Користувача неможливо заблокувати")
    user.status = UserStatus.BLOCKED
    db.execute(update(RefreshSession).where(RefreshSession.user_id == user.id, RefreshSession.revoked_at.is_(None)).values(revoked_at=datetime.now(UTC)))
    write_audit(db, request, "user.blocked", f"Заблоковано {user.email}", actor, "user", str(user.id))
    db.commit()
    return {"message": "Користувача заблоковано"}


@router.post("/{user_id}/unblock", dependencies=[Depends(check_csrf)])
def unblock_user(user_id: uuid.UUID, request: Request, actor: User = Depends(require_permission("users.manage")), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")
    user.status = UserStatus.ACTIVE
    user.failed_login_attempts = 0
    user.locked_until = None
    write_audit(db, request, "user.unblocked", f"Розблоковано {user.email}", actor, "user", str(user.id))
    db.commit()
    return {"message": "Користувача розблоковано"}


@router.post("/{user_id}/reset-password", dependencies=[Depends(check_csrf)])
def reset_user_password(user_id: uuid.UUID, request: Request, actor: User = Depends(require_permission("users.manage")), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")
    temporary = "Temporary123!"
    user.password_hash = hash_password(temporary)
    user.must_change_password = True
    db.execute(update(RefreshSession).where(RefreshSession.user_id == user.id, RefreshSession.revoked_at.is_(None)).values(revoked_at=datetime.now(UTC)))
    write_audit(db, request, "user.password_reset", f"Скинуто пароль {user.email}", actor, "user", str(user.id))
    db.commit()
    return {"message": "Тимчасовий пароль встановлено", "temporary_password": temporary}
