# Database Agent Guide

Use this guide when changing `backend/db`.

## Stack and Commands

Database stack: Postgres, SQLModel, SQLAlchemy async, asyncpg, Alembic.

```bash
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "describe_change"
uv run alembic current
uv run pytest backend/tests
```

## Architecture

- `config.py`: environment-backed database settings.
- `session.py`: async engine and session factory.
- `dependencies.py`: FastAPI database/repository dependencies.
- `models.py`: SQLModel table definitions.

## Coding Standards

- Keep table definitions explicit and migration-friendly.
- Use timezone-aware timestamps where existing models do.
- Keep async sessions request-scoped through dependencies.
- Prefer structured SQLAlchemy/SQLModel APIs over ad hoc SQL unless needed.
- Add or update repository tests when persistence behavior changes.

## Constraints

- Schema changes require Alembic migrations.
- Keep `DATABASE_URL` fallback behavior compatible with `POSTGRES_*` values.
- Do not change environment precedence without updating `.env.example`, `docs/operations.md`, and tests.
- Coordinate with `alembic/AGENTS.md` for migration edits.
