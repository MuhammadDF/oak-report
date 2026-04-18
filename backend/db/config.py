"""Environment-backed database settings."""

from __future__ import annotations

from dataclasses import dataclass
import os

from dotenv import load_dotenv


load_dotenv()


@dataclass(frozen=True)
class DatabaseSettings:
    data_provider: str
    database_url: str
    db_echo: bool


def _as_bool(raw: str | None, *, default: bool = False) -> bool:
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _build_default_database_url() -> str:
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "password")
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    database = os.getenv("POSTGRES_DB", "pokemon")
    return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{database}"


def get_database_settings() -> DatabaseSettings:
    data_provider = os.getenv("DATA_PROVIDER", "postgres").strip().lower()
    database_url_raw = os.getenv("DATABASE_URL")
    if database_url_raw is not None and database_url_raw.strip():
        database_url = database_url_raw.strip()
    else:
        database_url = _build_default_database_url()
    db_echo = _as_bool(os.getenv("DB_ECHO"), default=False)
    return DatabaseSettings(
        data_provider=data_provider,
        database_url=database_url,
        db_echo=db_echo,
    )
