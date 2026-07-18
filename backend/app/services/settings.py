from sqlalchemy.orm import Session

from app.models import SystemSetting


def get_int_setting(db: Session, key: str, default: int, minimum: int, maximum: int) -> int:
    item = db.get(SystemSetting, key)
    if not item:
        return default
    try:
        return min(max(int(item.value), minimum), maximum)
    except ValueError:
        return default
