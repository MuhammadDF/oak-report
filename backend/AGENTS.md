# Backend Agent Guide

Use this guide when changing `backend`.

## Stack and Commands

Backend stack: Python 3.12, FastAPI, Pydantic, SQLModel, SQLAlchemy async, asyncpg, pytest.

```bash
uv sync
uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
uv run pytest backend/tests
uv run pytest backend/tests --cov=backend --cov-report=term-missing
```

## Architecture

- `backend/api`: route modules and HTTP boundaries.
- `backend/services`: business logic.
- `backend/repositories`: provider-backed data access.
- `backend/auth`: Google auth, JWTs, auth dependencies.
- `backend/db`: database config, sessions, dependencies, tables.
- `backend/tests`: backend test suite.

## Coding Standards

- Keep routes thin and typed.
- Put business rules in services.
- Use repository interfaces instead of direct DB access from routes.
- Use FastAPI dependencies for request-scoped database repositories.
- Keep async database behavior async all the way through.
- Preserve explicit auth dependency wiring so tests can override it.

## Constraints

- `DATA_PROVIDER=postgres` is required for user, collection, and pricing catalog repositories.
- Search, library, and scan catalog repositories are still mock-backed.
- Do not add hidden global state unless it matches the existing factory pattern and is test-covered.
- Update docs and tests when routes, environment variables, or provider behavior change.
