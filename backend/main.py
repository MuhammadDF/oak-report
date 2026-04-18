from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
import asyncio
from contextlib import suppress
import logging

from .db.config import get_database_settings
from .db.session import SessionLocal
from .repositories.factory import get_pricing_catalog_repository
from .services.pricing_catalog_sync_service import (
    get_pricing_catalog_sync_settings,
    refresh_pricing_catalog,
)
from .api import (
    admin_routes,
    auth_routes,
    collection_routes,
    library_routes,
    scan_routes,
    search_routes,
)

app = FastAPI()
logger = logging.getLogger(__name__)
_pricing_refresh_lock = asyncio.Lock()


async def _run_pricing_catalog_refresh_once() -> None:
    if _pricing_refresh_lock.locked():
        logger.info("Skipping PriceCharting catalog refresh because a run is already in progress")
        return

    async with _pricing_refresh_lock:
        async with SessionLocal() as session:
            repository = get_pricing_catalog_repository(session)
            await refresh_pricing_catalog(repository)


async def _pricing_catalog_scheduler_loop(
    interval_seconds: int,
    *,
    run_on_startup: bool,
) -> None:
    if run_on_startup:
        try:
            await _run_pricing_catalog_refresh_once()
        except Exception:
            logger.exception("Initial PriceCharting catalog refresh failed")

    while True:
        await asyncio.sleep(interval_seconds)
        try:
            await _run_pricing_catalog_refresh_once()
        except Exception:
            logger.exception("Weekly PriceCharting catalog refresh failed")


@app.on_event("startup")
async def verify_database_connection() -> None:
    """Fail fast on startup if postgres provider cannot reach the database."""

    settings = get_database_settings()
    if settings.data_provider != "postgres":
        return

    async with SessionLocal() as session:
        await session.exec(text("SELECT 1"))

    sync_settings = get_pricing_catalog_sync_settings()
    if not sync_settings.enabled:
        return

    app.state.pricing_catalog_refresh_task = asyncio.create_task(
        _pricing_catalog_scheduler_loop(
            sync_settings.interval_seconds,
            run_on_startup=sync_settings.run_on_startup,
        )
    )


@app.on_event("shutdown")
async def shutdown_background_tasks() -> None:
    task = getattr(app.state, "pricing_catalog_refresh_task", None)
    if task is None:
        return

    task.cancel()
    with suppress(asyncio.CancelledError):
        await task

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"^https?://(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+):5173$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include API route modules
app.include_router(scan_routes.router, prefix="/api/scan")
app.include_router(collection_routes.router, prefix="/api/collection")
app.include_router(admin_routes.router, prefix="/api/admin")
app.include_router(search_routes.router, prefix="/api/search")
app.include_router(auth_routes.router, prefix="/api/auth")
app.include_router(library_routes.router, prefix="/api/library")
