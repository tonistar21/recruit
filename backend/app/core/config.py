from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "АСУ Рекрут+"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://recruit:recruit@postgres:5432/recruit"
    secret_key: str = "development-only-change-me-please-32-characters"
    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    storage_path: Path = Path("storage")
    access_token_minutes: int = 15
    refresh_token_days: int = 7
    max_login_attempts: int = 5
    lockout_minutes: int = 15
    max_upload_bytes: int = 10 * 1024 * 1024
    cookie_secure: bool = False
    seed_admin_password: str = "DemoAdmin123!"

    model_config = SettingsConfigDict(env_file=".env", env_prefix="RECRUIT_", extra="ignore")

    @field_validator("secret_key")
    @classmethod
    def validate_secret(cls, value: str) -> str:
        if len(value) < 32:
            raise ValueError("SECRET_KEY must contain at least 32 characters")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
