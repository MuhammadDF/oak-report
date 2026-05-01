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

Repository factory behavior is centralized in `backend/repositories/factory.py`. Collection, user, and pricing catalog repositories require an async session and `DATA_PROVIDER=postgres`. Scan and search use service logic backed by Gemini and/or the pricing catalog rather than mock repositories. Standalone library code is dormant and should not be treated as an active feature.

## Auth

Google sign-in depends on `GOOGLE_CLIENT_ID`. JWT creation depends on `JWT_SECRET`.

Route tests commonly override auth dependencies, so preserve explicit dependency wiring instead of hiding auth checks inside unrelated helper code.

## OpenAPI / Swagger UI

- The FastAPI app exposes OpenAPI at `/openapi.json` and a Swagger UI at `/docs`.
- Endpoints are organized in the Swagger UI by *tags* (functional groups). This repository assigns tags on each router so endpoints appear under groups such as `Scan`, `Collection`, `Search`, `Auth`, `Library`, and admin subgroups like `Admin - Pricing Catalog` and `Admin - Users`.
- Security metadata in the OpenAPI spec is produced when route dependencies use FastAPI security helpers (for example, `fastapi.security.HTTPBearer`). The UI shows a lock icon for endpoints that declare a security dependency.

- Protection model: routes are protected by dependencies. A typical pattern in this codebase is:

	- `bearer_scheme = HTTPBearer(auto_error=True)` — parses the `Authorization: Bearer ...` header and returns credentials.
	- `get_current_user()` — a dependency that calls `verify_auth_token(...)` to validate the JWT and raises `HTTPException(401)` for invalid/expired tokens.
	- `require_roles(...)` — a dependency factory that wraps `get_current_user()` and raises `HTTPException(403)` if the role is not permitted.

- Router-level protection: to apply a dependency to every route in a router, use `APIRouter(dependencies=[Depends(...)] )` or pass `dependencies=[Depends(...)]` to `app.include_router(...)`. For OpenAPI to include the security requirement in the generated spec, prefer `Security` or route-level security dependencies when necessary.

## Testing

Backend tests use pytest, pytest-asyncio, HTTPX ASGI transport, and a Postgres test database derived from `DATABASE_URL`.

When adding backend behavior:

- Add service-level tests for business logic.
- Add route tests for HTTP behavior and dependency integration.
- Add repository or DB tests when schema, SQLModel tables, or persistence behavior changes.
