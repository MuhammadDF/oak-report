# Backend Guide

The backend is a Python 3.12 FastAPI application using SQLModel, async SQLAlchemy sessions, Alembic migrations, and repository boundaries around persistence.

## Commands

Install dependencies:

```bash
uv sync
```

Run the API:

```bash
uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Run backend tests:

```bash
uv run pytest backend/tests
```

Run backend tests with coverage:

```bash
uv run pytest backend/tests --cov=backend --cov-report=term-missing
```

## Application Structure

- `backend/main.py`: FastAPI app, CORS, router registration, database startup check, catalog scheduler.
- `backend/api`: HTTP route modules.
- `backend/services`: business behavior and orchestration.
- `backend/repositories`: persistence and provider adapters.
- `backend/auth`: Google auth, JWT handling, auth dependencies.
- `backend/db`: database config, sessions, dependencies, SQLModel tables.
- `backend/tests`: pytest suite.

## Route and Service Conventions

Keep route handlers small. They should validate HTTP-level inputs, receive dependencies, and delegate business behavior to services.

Services should avoid direct database session construction. Use repository interfaces or FastAPI dependencies so behavior stays testable.

Repository factory behavior is centralized in `backend/repositories/factory.py`. Collection, user, and pricing catalog repositories require an async session when using Postgres.

## Auth

Google sign-in depends on `GOOGLE_CLIENT_ID`. JWT creation depends on `JWT_SECRET`.

Route tests commonly override auth dependencies, so preserve explicit dependency wiring instead of hiding auth checks inside unrelated helper code.

## Testing

Backend tests use pytest, pytest-asyncio, HTTPX ASGI transport, and a Postgres test database derived from `DATABASE_URL`.

When adding backend behavior:

- Add service-level tests for business logic.
- Add route tests for HTTP behavior and dependency integration.
- Add repository or DB tests when schema, SQLModel tables, or persistence behavior changes.
