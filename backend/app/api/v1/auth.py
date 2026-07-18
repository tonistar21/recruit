from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.api.deps import check_csrf, get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import enforce
from app.core.security import create_access_token, hash_password, new_csrf_token, new_opaque_token, token_hash, verify_password
from app.models import PasswordResetToken, RefreshSession, User, UserStatus
from app.schemas.auth import ChangePasswordRequest, CurrentUser, ForgotPasswordRequest, LoginRequest, ResetPasswordRequest
from app.schemas.common import Message
from app.services.audit import write_audit
from app.services.settings import get_int_setting

router = APIRouter(prefix="/auth", tags=["auth"])


def set_auth_cookies(response: Response, access: str, refresh: str, csrf: str, remember: bool = True, access_minutes: int | None = None) -> None:
    common = {"secure": settings.cookie_secure, "samesite": "lax", "path": "/"}
    response.set_cookie("access_token", access, httponly=True, max_age=(access_minutes or settings.access_token_minutes) * 60, **common)
    response.set_cookie("refresh_token", refresh, httponly=True, max_age=settings.refresh_token_days * 86400 if remember else None, **common)
    response.set_cookie("csrf_token", csrf, httponly=False, max_age=settings.refresh_token_days * 86400, **common)


@router.post("/login", response_model=CurrentUser)
def login(payload: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    enforce(request, "login", 10, 60, str(payload.email))
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    now = datetime.now(UTC)
    max_attempts = get_int_setting(db, "max_login_attempts", settings.max_login_attempts, 3, 10)
    lockout_minutes = get_int_setting(db, "lockout_minutes", settings.lockout_minutes, 1, 120)
    if not user or user.status != UserStatus.ACTIVE or (user.locked_until and user.locked_until > now) or not verify_password(payload.password, user.password_hash):
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= max_attempts:
                user.locked_until = now + timedelta(minutes=lockout_minutes)
            write_audit(db, request, "auth.login_failed", "Невдала спроба входу", user)
            db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неправильний email або пароль")
    refresh = new_opaque_token()
    session = RefreshSession(user_id=user.id, token_hash=token_hash(refresh), expires_at=now + timedelta(days=settings.refresh_token_days), ip_address=request.client.host if request.client else None, user_agent=request.headers.get("user-agent", "")[:500])
    db.add(session)
    db.flush()
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = now
    csrf = new_csrf_token()
    access_minutes = get_int_setting(db, "access_token_minutes", settings.access_token_minutes, 5, 120)
    set_auth_cookies(response, create_access_token(str(user.id), str(session.id), access_minutes), refresh, csrf, payload.remember_me, access_minutes)
    write_audit(db, request, "auth.login", "Успішний вхід", user)
    db.commit()
    return current_user_payload(user)


def current_user_payload(user: User) -> CurrentUser:
    return CurrentUser(id=user.id, email=user.email, display_name=user.display_name, role=user.role.code, role_name=user.role.name, permissions=[p.code for p in user.role.permissions], must_change_password=user.must_change_password, candidate_id=user.candidate.id if user.candidate else None)


@router.get("/me", response_model=CurrentUser)
def me(user: User = Depends(get_current_user)):
    return current_user_payload(user)


@router.post("/refresh", response_model=Message)
def refresh(request: Request, response: Response, refresh_token: str | None = None, db: Session = Depends(get_db)):
    enforce(request, "refresh", 30, 60)
    token = refresh_token or request.cookies.get("refresh_token")
    session = db.scalar(select(RefreshSession).where(RefreshSession.token_hash == token_hash(token or "")))
    if not session or session.revoked_at or session.expires_at < datetime.now(UTC):
        raise HTTPException(status_code=401, detail="Refresh-сесію завершено")
    user = db.get(User, session.user_id)
    if not user or user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=401, detail="Користувача заблоковано")
    new_refresh = new_opaque_token()
    session.token_hash = token_hash(new_refresh)
    csrf = new_csrf_token()
    access_minutes = get_int_setting(db, "access_token_minutes", settings.access_token_minutes, 5, 120)
    set_auth_cookies(response, create_access_token(str(user.id), str(session.id), access_minutes), new_refresh, csrf, access_minutes=access_minutes)
    db.commit()
    return Message(message="Сесію оновлено")


@router.post("/logout", response_model=Message, dependencies=[Depends(check_csrf)])
def logout(request: Request, response: Response, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    token = request.cookies.get("refresh_token")
    session = db.scalar(select(RefreshSession).where(RefreshSession.token_hash == token_hash(token or "")))
    if session:
        session.revoked_at = datetime.now(UTC)
    write_audit(db, request, "auth.logout", "Вихід із системи", user)
    db.commit()
    for name in ("access_token", "refresh_token", "csrf_token"):
        response.delete_cookie(name, path="/")
    return Message(message="Сесію завершено")


@router.post("/logout-all", response_model=Message, dependencies=[Depends(check_csrf)])
def logout_all(request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.execute(update(RefreshSession).where(RefreshSession.user_id == user.id, RefreshSession.revoked_at.is_(None)).values(revoked_at=datetime.now(UTC)))
    write_audit(db, request, "auth.logout_all", "Завершено всі сесії", user)
    db.commit()
    return Message(message="Усі сесії завершено")


@router.post("/change-password", response_model=Message, dependencies=[Depends(check_csrf)])
def change_password(payload: ChangePasswordRequest, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=422, detail="Поточний пароль неправильний")
    user.password_hash = hash_password(payload.new_password)
    user.must_change_password = False
    write_audit(db, request, "auth.password_changed", "Пароль змінено", user)
    db.commit()
    return Message(message="Пароль змінено")


@router.post("/forgot-password", response_model=Message)
def forgot_password(payload: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    enforce(request, "forgot-password", 5, 300, str(payload.email))
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user:
        raw = new_opaque_token()
        db.add(PasswordResetToken(user_id=user.id, token_hash=token_hash(raw), expires_at=datetime.now(UTC) + timedelta(minutes=30)))
        write_audit(db, request, "auth.password_reset_requested", f"DEV reset token: {raw}", user)
        db.commit()
    return Message(message="Якщо обліковий запис існує, інструкцію сформовано")


@router.post("/reset-password", response_model=Message)
def reset_password(payload: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    enforce(request, "reset-password", 5, 300)
    item = db.scalar(select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash(payload.token), PasswordResetToken.used_at.is_(None)))
    if not item or item.expires_at < datetime.now(UTC):
        raise HTTPException(status_code=422, detail="Токен недійсний або прострочений")
    user = db.get(User, item.user_id)
    user.password_hash = hash_password(payload.new_password)
    user.must_change_password = False
    item.used_at = datetime.now(UTC)
    write_audit(db, request, "auth.password_reset", "Пароль відновлено", user)
    db.commit()
    return Message(message="Пароль відновлено")
