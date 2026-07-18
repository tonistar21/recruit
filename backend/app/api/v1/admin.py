from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import check_csrf, get_current_user, require_permission
from app.core.database import get_db
from app.models import Permission, Role, SystemSetting, User
from app.services.audit import write_audit

router = APIRouter(tags=["administration"])


class PermissionView(BaseModel):
    code: str
    description: str


class RoleView(BaseModel):
    code: str
    name: str
    system: bool
    permissions: list[str]


class RolePermissionsUpdate(BaseModel):
    permissions: list[str]


class SystemSettingsUpdate(BaseModel):
    system_name: str = Field(min_length=2, max_length=120)
    max_upload_mb: int = Field(ge=1, le=50)
    allowed_mime_types: list[Literal["application/pdf", "image/jpeg", "image/png", "text/plain"]]
    access_token_minutes: int = Field(ge=5, le=120)
    max_login_attempts: int = Field(ge=3, le=10)
    lockout_minutes: int = Field(ge=1, le=120)


class ProfileUpdate(BaseModel):
    display_name: str = Field(min_length=2, max_length=160)
    notifications_enabled: bool


SYSTEM_DEFAULTS = {
    "system_name": "АСУ Рекрут+",
    "max_upload_mb": "10",
    "allowed_mime_types": "application/pdf,image/jpeg,image/png,text/plain",
    "access_token_minutes": "15",
    "max_login_attempts": "5",
    "lockout_minutes": "15",
}


@router.get("/permissions", response_model=list[PermissionView])
def permissions(_: User = Depends(require_permission("roles.manage")), db: Session = Depends(get_db)):
    return [PermissionView(code=p.code, description=p.description) for p in db.scalars(select(Permission).order_by(Permission.code)).all()]


@router.get("/roles", response_model=list[RoleView])
def roles(_: User = Depends(require_permission("roles.manage")), db: Session = Depends(get_db)):
    return [RoleView(code=r.code, name=r.name, system=r.system, permissions=sorted(p.code for p in r.permissions)) for r in db.scalars(select(Role).order_by(Role.id)).all()]


@router.put("/roles/{role_code}/permissions", response_model=RoleView, dependencies=[Depends(check_csrf)])
def update_role_permissions(role_code: str, payload: RolePermissionsUpdate, request: Request, actor: User = Depends(require_permission("roles.manage")), db: Session = Depends(get_db)):
    role = db.scalar(select(Role).where(Role.code == role_code))
    if not role:
        raise HTTPException(status_code=404, detail="Роль не знайдено")
    if role.code == "admin":
        raise HTTPException(status_code=409, detail="Системну роль адміністратора змінювати заборонено")
    requested = set(payload.permissions)
    found = list(db.scalars(select(Permission).where(Permission.code.in_(requested))).all()) if requested else []
    if len(found) != len(requested):
        raise HTTPException(status_code=422, detail="Передано невідоме право")
    role.permissions = found
    write_audit(db, request, "role.permissions_updated", f"Оновлено права ролі {role.name}", actor, "role", role.code)
    db.commit()
    db.refresh(role)
    return RoleView(code=role.code, name=role.name, system=role.system, permissions=sorted(p.code for p in role.permissions))


@router.get("/settings/system")
def system_settings(_: User = Depends(require_permission("settings.manage")), db: Session = Depends(get_db)):
    values = {**SYSTEM_DEFAULTS, **{x.key: x.value for x in db.scalars(select(SystemSetting).where(SystemSetting.key.in_(SYSTEM_DEFAULTS))).all()}}
    return {**values, "max_upload_mb": int(values["max_upload_mb"]), "access_token_minutes": int(values["access_token_minutes"]), "max_login_attempts": int(values["max_login_attempts"]), "lockout_minutes": int(values["lockout_minutes"]), "allowed_mime_types": values["allowed_mime_types"].split(",")}


@router.put("/settings/system", dependencies=[Depends(check_csrf)])
def update_system_settings(payload: SystemSettingsUpdate, request: Request, actor: User = Depends(require_permission("settings.manage")), db: Session = Depends(get_db)):
    values = payload.model_dump()
    values["allowed_mime_types"] = ",".join(values["allowed_mime_types"])
    for key, value in values.items():
        item = db.get(SystemSetting, key)
        if item:
            item.value = str(value)
        else:
            db.add(SystemSetting(key=key, value=str(value)))
    write_audit(db, request, "settings.updated", "Оновлено системні налаштування", actor, "settings", "system")
    db.commit()
    return system_settings(actor, db)


@router.get("/settings/profile")
def profile_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.get(SystemSetting, f"user:{user.id}:notifications")
    return {"display_name": user.display_name, "notifications_enabled": item is None or item.value == "true"}


@router.put("/settings/profile", dependencies=[Depends(check_csrf)])
def update_profile(payload: ProfileUpdate, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.display_name = payload.display_name
    key = f"user:{user.id}:notifications"
    item = db.get(SystemSetting, key)
    if item:
        item.value = str(payload.notifications_enabled).lower()
    else:
        db.add(SystemSetting(key=key, value=str(payload.notifications_enabled).lower()))
    write_audit(db, request, "profile.updated", "Оновлено профіль користувача", user, "user", str(user.id))
    db.commit()
    return profile_settings(user, db)
