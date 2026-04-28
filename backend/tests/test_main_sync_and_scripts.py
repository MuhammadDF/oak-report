from __future__ import annotations

import asyncio
import runpy
import sys
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.main import (
    _pricing_catalog_scheduler_loop,
    _run_pricing_catalog_refresh_once,
    app,
    lifespan,
    shutdown_background_tasks,
    verify_database_connection,
)
from backend.repositories.pricing_catalog_repository import PricingCatalogRecord
from backend.scripts.create_database import (
    _create_database_if_missing,
    _normalized_postgres_url,
    _run_migrations,
)
from backend.scripts.reset_database import _reset_schema
from backend.scripts.seed_data import _parse_price, seed_dev_data
from backend.services.pricing_catalog_sync_service import (
    PricingCatalogSyncResult,
    _as_bool,
    _parse_catalog_csv,
    _parse_loose_price,
    get_pricing_catalog_sync_settings,
    refresh_pricing_catalog,
)


class _SessionContext:
    def __init__(self, session):
        self._session = session

    async def __aenter__(self):
        return self._session

    async def __aexit__(self, exc_type, exc, tb):
        _ = exc_type
        _ = exc
        _ = tb
        return False


class _FirstResult:
    def __init__(self, value):
        self._value = value

    def first(self):
        return self._value


class _SeedSession:
    def __init__(self, responses: list[object]):
        self.responses = list(responses)
        self.added: list[object] = []
        self.commits = 0

    async def exec(self, statement):
        _ = statement
        return _FirstResult(self.responses.pop(0))

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        self.commits += 1


@pytest.mark.asyncio
async def test_lifespan_runs_startup_and_shutdown_hooks() -> None:
    with patch("backend.main.verify_database_connection", new=AsyncMock()) as mock_startup, patch(
        "backend.main.shutdown_background_tasks",
        new=AsyncMock(),
    ) as mock_shutdown:
        async with lifespan(app):
            pass

    mock_startup.assert_awaited_once()
    mock_shutdown.assert_awaited_once()


@pytest.mark.asyncio
async def test_run_pricing_catalog_refresh_once_skips_when_locked() -> None:
    import backend.main as main_module

    await main_module._pricing_refresh_lock.acquire()
    try:
        with patch("backend.main.SessionLocal") as mock_session_local:
            result = await _run_pricing_catalog_refresh_once()
    finally:
        main_module._pricing_refresh_lock.release()

    assert result == PricingCatalogSyncResult(rows_loaded=0)
    mock_session_local.assert_not_called()


@pytest.mark.asyncio
async def test_run_pricing_catalog_refresh_once_refreshes_repository() -> None:
    session = MagicMock(name="session")
    repository = MagicMock(name="repository")
    sync_result = PricingCatalogSyncResult(rows_loaded=2)

    with patch("backend.main.SessionLocal", return_value=_SessionContext(session)), patch(
        "backend.main.get_pricing_catalog_repository",
        return_value=repository,
    ) as mock_get_repository, patch(
        "backend.main.refresh_pricing_catalog",
        new=AsyncMock(return_value=sync_result),
    ) as mock_refresh:
        result = await _run_pricing_catalog_refresh_once()

    assert result == sync_result
    mock_get_repository.assert_called_once_with(session)
    mock_refresh.assert_awaited_once_with(repository)


@pytest.mark.asyncio
async def test_pricing_catalog_scheduler_loop_logs_startup_and_periodic_failures() -> None:
    run_calls = {"count": 0}

    async def _mock_run_once():
        run_calls["count"] += 1
        if run_calls["count"] <= 2:
            raise RuntimeError("boom")
        raise asyncio.CancelledError

    async def _mock_sleep(_seconds: int):
        return None

    with patch("backend.main._run_pricing_catalog_refresh_once", new=AsyncMock(side_effect=_mock_run_once)), patch(
        "backend.main.asyncio.sleep",
        new=AsyncMock(side_effect=_mock_sleep),
    ), patch("backend.main.logger.exception") as mock_log_exception:
        with pytest.raises(asyncio.CancelledError):
            await _pricing_catalog_scheduler_loop(3600, run_on_startup=True)

    assert mock_log_exception.call_count == 2


@pytest.mark.asyncio
async def test_verify_database_connection_returns_early_for_non_postgres() -> None:
    with patch(
        "backend.main.get_database_settings",
        return_value=SimpleNamespace(data_provider="mock"),
    ), patch("backend.main.SessionLocal") as mock_session_local:
        await verify_database_connection()

    mock_session_local.assert_not_called()


@pytest.mark.asyncio
async def test_verify_database_connection_skips_scheduler_when_sync_disabled() -> None:
    session = MagicMock(name="session")
    session.exec = AsyncMock()

    with patch(
        "backend.main.get_database_settings",
        return_value=SimpleNamespace(data_provider="postgres"),
    ), patch("backend.main.SessionLocal", return_value=_SessionContext(session)), patch(
        "backend.main.get_pricing_catalog_sync_settings",
        return_value=SimpleNamespace(enabled=False, interval_seconds=3600, run_on_startup=False),
    ), patch("backend.main.asyncio.create_task") as mock_create_task:
        await verify_database_connection()

    session.exec.assert_awaited_once()
    mock_create_task.assert_not_called()


@pytest.mark.asyncio
async def test_verify_database_connection_starts_scheduler_when_enabled() -> None:
    session = MagicMock(name="session")
    session.exec = AsyncMock()
    created_task = MagicMock(name="task")
    created_coroutines: list[object] = []

    def _capture_task(coro):
        created_coroutines.append(coro)
        coro.close()
        return created_task

    with patch(
        "backend.main.get_database_settings",
        return_value=SimpleNamespace(data_provider="postgres"),
    ), patch("backend.main.SessionLocal", return_value=_SessionContext(session)), patch(
        "backend.main.get_pricing_catalog_sync_settings",
        return_value=SimpleNamespace(enabled=True, interval_seconds=7200, run_on_startup=True),
    ), patch("backend.main.asyncio.create_task", side_effect=_capture_task) as mock_create_task:
        await verify_database_connection()

    assert app.state.pricing_catalog_refresh_task is created_task
    mock_create_task.assert_called_once()


@pytest.mark.asyncio
async def test_shutdown_background_tasks_handles_missing_and_cancelled_task() -> None:
    if hasattr(app.state, "pricing_catalog_refresh_task"):
        delattr(app.state, "pricing_catalog_refresh_task")

    await shutdown_background_tasks()

    class _Task:
        def __init__(self) -> None:
            self.cancelled = False

        def cancel(self) -> None:
            self.cancelled = True

        def __await__(self):
            async def _wait():
                raise asyncio.CancelledError

            return _wait().__await__()

    task = _Task()
    app.state.pricing_catalog_refresh_task = task

    await shutdown_background_tasks()

    assert task.cancelled is True


@pytest.mark.asyncio
async def test_admin_patch_user_role_success(async_client) -> None:
    async def _mock_update_user_role(*, user_id, role, repository):
        _ = repository
        return {
            "id": user_id,
            "display_name": "Ash",
            "email": "ash@example.com",
            "role": role.value,
        }

    with patch("backend.api.admin_routes.update_user_role", new=MagicMock(side_effect=_mock_update_user_role)):
        response = await async_client.patch("/api/admin/users/user-1/role", json={"role": "collector"})

    assert response.status_code == 200
    assert response.json()["role"] == "collector"


def test_pricing_catalog_sync_settings_and_parse_helpers(monkeypatch: pytest.MonkeyPatch) -> None:
    assert _as_bool(None, default=True) is True
    assert _as_bool("on") is True
    assert _as_bool("off") is False
    assert _parse_loose_price(None) == 0.0
    assert _parse_loose_price("") == 0.0
    assert _parse_loose_price("$1,234.50") == 1234.5
    assert _parse_loose_price("oops") == 0.0

    monkeypatch.setenv("PRICING_CATALOG_REFRESH_ENABLED", "false")
    monkeypatch.setenv("PRICING_CATALOG_REFRESH_INTERVAL_SECONDS", "30")
    monkeypatch.setenv("PRICING_CATALOG_REFRESH_ON_STARTUP", "no")
    settings = get_pricing_catalog_sync_settings()
    assert settings.enabled is False
    assert settings.interval_seconds == 3600
    assert settings.run_on_startup is False

    monkeypatch.setenv("PRICING_CATALOG_REFRESH_INTERVAL_SECONDS", "oops")
    assert get_pricing_catalog_sync_settings().interval_seconds == 604800


def test_parse_catalog_csv_dedupes_records_and_builds_image_urls() -> None:
    csv_payload = """id,console-name,product-name,loose-price,tcg-id
,Pokemon Base Set,Missing,10,
pc-1,Pokemon Base Set,Charizard #4,$249.99,1234
pc-1,Pokemon Base Set,Charizard #4,10,1234
pc-2,Pokemon Jungle,Pikachu #25,, 
"""

    records = _parse_catalog_csv(csv_payload)

    assert records == [
        PricingCatalogRecord(
            id="pc-1",
            console_name="Pokemon Base Set",
            product_name="Charizard #4",
            loose_price=10.0,
            tcg_id="1234",
            image_url="https://tcgplayer-cdn.tcgplayer.com/product/1234_in_1000x1000.jpg",
        ),
        PricingCatalogRecord(
            id="pc-2",
            console_name="Pokemon Jungle",
            product_name="Pikachu #25",
            loose_price=0.0,
            tcg_id=None,
            image_url="",
        ),
    ]


@pytest.mark.asyncio
async def test_refresh_pricing_catalog_uses_background_fetch_and_repository() -> None:
    repository = MagicMock(name="repository")
    repository.replace_all_rows = AsyncMock(return_value=2)

    with patch(
        "backend.services.pricing_catalog_sync_service.asyncio.to_thread",
        new=AsyncMock(return_value="id,console-name,product-name,loose-price,tcg-id\npc-1,Set,Card,12,1\npc-2,Set,Card 2,4,\n"),
    ) as mock_to_thread:
        result = await refresh_pricing_catalog(repository)

    mock_to_thread.assert_awaited_once()
    repository.replace_all_rows.assert_awaited_once()
    assert result.rows_loaded == 2


def test_create_database_helpers_and_migration_runner(monkeypatch: pytest.MonkeyPatch) -> None:
    assert _normalized_postgres_url("postgresql+asyncpg://user:pass@host/db") == "postgresql://user:pass@host/db"

    with patch("backend.scripts.create_database.subprocess.run") as mock_run:
        _run_migrations()

    assert mock_run.call_args.args[0][2:] == ["alembic", "upgrade", "head"]


@pytest.mark.asyncio
async def test_create_database_if_missing_covers_error_existing_and_create_paths() -> None:
    connection = MagicMock(name="connection")
    connection.fetchval = AsyncMock(return_value=True)
    connection.execute = AsyncMock()
    connection.close = AsyncMock()

    with patch(
        "backend.scripts.create_database.get_database_settings",
        return_value=SimpleNamespace(database_url="postgresql+asyncpg://user:pass@host:5432/"),
    ):
        with pytest.raises(RuntimeError, match="DATABASE_URL must include a database name."):
            await _create_database_if_missing()

    with patch(
        "backend.scripts.create_database.get_database_settings",
        return_value=SimpleNamespace(database_url="postgresql+asyncpg://user:pass@host:5432/pokemon"),
    ), patch("backend.scripts.create_database.asyncpg.connect", AsyncMock(return_value=connection)):
        await _create_database_if_missing()

    connection.execute.assert_not_awaited()

    create_connection = MagicMock(name="create_connection")
    create_connection.fetchval = AsyncMock(return_value=False)
    create_connection.execute = AsyncMock()
    create_connection.close = AsyncMock()

    with patch(
        "backend.scripts.create_database.get_database_settings",
        return_value=SimpleNamespace(database_url="postgresql+asyncpg://user:pass@host:5432/pokemon"),
    ), patch("backend.scripts.create_database.asyncpg.connect", AsyncMock(return_value=create_connection)):
        await _create_database_if_missing()

    create_connection.execute.assert_awaited_once_with('CREATE DATABASE "pokemon"')


@pytest.mark.asyncio
async def test_reset_schema_executes_drop_and_create() -> None:
    connection = MagicMock(name="connection")
    connection.execute = AsyncMock()
    connection.close = AsyncMock()

    with patch(
        "backend.scripts.reset_database.get_database_settings",
        return_value=SimpleNamespace(database_url="postgresql+asyncpg://user:pass@host:5432/pokemon"),
    ), patch("backend.scripts.reset_database.asyncpg.connect", AsyncMock(return_value=connection)):
        await _reset_schema()

    assert connection.execute.await_args_list[0].args[0] == "DROP SCHEMA IF EXISTS public CASCADE"
    assert connection.execute.await_args_list[1].args[0] == "CREATE SCHEMA public"


@pytest.mark.asyncio
async def test_seed_dev_data_covers_existing_items_and_csv_seed(tmp_path: Path) -> None:
    existing_items_session = _SeedSession([None, object()])
    await seed_dev_data(existing_items_session)
    assert existing_items_session.commits == 1

    csv_path = tmp_path / "pokemon_cards.csv"
    rows = ["id,product-name,console-name,new-price"]
    rows.extend(f"pc-{index},Card {index},Set {index},{index}" for index in range(1, 15))
    rows[2] = "pc-2,Pikachu,Pokemon Jungle,not-a-price"
    csv_path.write_text("\n".join(rows) + "\n", encoding="utf-8")
    session = _SeedSession([None, None])

    with patch("backend.scripts.seed_data.CSV_PATH", csv_path):
        await seed_dev_data(session)

    assert _parse_price(None) == 0.0
    assert _parse_price("oops") == 0.0
    assert _parse_price("-5") == 0.0
    assert len(session.added) == 13
    assert session.added[0].id == "demo-user"
    assert session.added[1].card_id == "pc-1"
    assert session.added[2].price == 0.0
    assert session.commits == 1


@pytest.mark.asyncio
async def test_script_main_functions_and_entrypoints() -> None:
    with patch("backend.scripts.create_database.SessionLocal", return_value=_SessionContext(MagicMock())), patch(
        "backend.scripts.create_database.seed_dev_data",
        new=AsyncMock(),
    ) as mock_seed_dev_data:
        from backend.scripts.create_database import _seed

        await _seed()

    mock_seed_dev_data.assert_awaited_once()

    with patch("backend.scripts.create_database._create_database_if_missing", new=AsyncMock()), patch(
        "backend.scripts.create_database._run_migrations"
    ) as mock_run_migrations, patch(
        "backend.scripts.create_database._seed",
        new=AsyncMock(),
    ):
        from backend.scripts.create_database import _main as create_main

        await create_main()

    mock_run_migrations.assert_called_once()

    with patch("backend.scripts.reset_database._create_database_if_missing", new=AsyncMock()), patch(
        "backend.scripts.reset_database._reset_schema",
        new=AsyncMock(),
    ), patch("backend.scripts.reset_database._run_migrations") as mock_reset_run_migrations, patch(
        "backend.scripts.reset_database.SessionLocal",
        return_value=_SessionContext(MagicMock()),
    ), patch("backend.scripts.reset_database.seed_dev_data", new=AsyncMock()):
        from backend.scripts.reset_database import _main as reset_main

        await reset_main()

    mock_reset_run_migrations.assert_called_once()

    def _close_coro(coro):
        coro.close()

    create_database_module = sys.modules.pop("backend.scripts.create_database", None)
    try:
        with patch("asyncio.run", side_effect=_close_coro) as mock_asyncio_run:
            runpy.run_module("backend.scripts.create_database", run_name="__main__")
    finally:
        if create_database_module is not None:
            sys.modules["backend.scripts.create_database"] = create_database_module
    assert mock_asyncio_run.called

    reset_database_module = sys.modules.pop("backend.scripts.reset_database", None)
    try:
        with patch("asyncio.run", side_effect=_close_coro) as mock_asyncio_run:
            runpy.run_module("backend.scripts.reset_database", run_name="__main__")
    finally:
        if reset_database_module is not None:
            sys.modules["backend.scripts.reset_database"] = reset_database_module
    assert mock_asyncio_run.called
