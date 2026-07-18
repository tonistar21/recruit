import secrets
import uuid

import jwt
from fastapi import Cookie, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import Candidate, RefreshSession, User, UserStatus


def get_current_user(access_token: str | None = Cookie(default=None), db: Session = Depends(get_db)) -> User:
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Потрібна авторизація")
    try:
        payload = decode_access_token(access_token)
        user_id = uuid.UUID(payload["sub"])
        session_id = uuid.UUID(payload["sid"])
    except (jwt.PyJWTError, ValueError, KeyError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Недійсна сесія") from None
    session = db.get(RefreshSession, session_id)
    user = db.get(User, user_id)
    if not session or session.revoked_at or not user or user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Сесію завершено")
    return user


def require_permission(code: str):
    def dependency(user: User = Depends(get_current_user)) -> User:
        if code not in {permission.code for permission in user.role.permissions}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостатньо прав")
        return user
    return dependency


def check_csrf(request: Request, csrf_token: str | None = Cookie(default=None)) -> None:
    header = request.headers.get("x-csrf-token")
    if not csrf_token or not header or not secrets.compare_digest(csrf_token, header):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF-перевірку не пройдено")


def ensure_candidate_access(db: Session, user: User, candidate: Candidate) -> None:
    if user.role.code == "candidate" and candidate.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Немає доступу до кандидата")
    if user.role.code == "recruiter" and candidate.recruiter_id not in (None, user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Кандидат призначений іншому рекрутеру")
