# Architecture

Oak Report is a full-stack web app with a FastAPI backend, a React/Vite frontend, and Postgres-backed persistence for the domains that have moved beyond mock data.

## System Shape

- The frontend runs as a Vite app and proxies `/api` calls to the backend during development.
- The backend exposes FastAPI routers under `/api`.
- Postgres stores users, collection items, and pricing catalog rows.
- Alembic owns schema migrations.
- Repository factories isolate provider selection from routes and screens.

## Backend Boundaries

FastAPI route modules live in `backend/api`:

- `/api/auth`
- `/api/collection`
- `/api/admin`
- `/api/search`
- `/api/scan`
- `/api/library`

Routes should stay thin. Business behavior belongs in `backend/services`, and persistence access belongs in `backend/repositories`.

Auth and collection flows use FastAPI dependency injection with request-scoped async sessions. Scan, search, and library flows currently use service-level factory calls and cached mock repositories.

## Frontend Boundaries

The frontend entry point is `frontend/src/App.tsx`. It composes:

- `src/screens` for route-level UI states.
- `src/components` for reusable screen sections and layout pieces.
- `src/hooks` for stateful browser/API behavior.
- `src/repositories` for backend or mock data access.
- `src/types` for shared TypeScript contracts.

Use "screen" terminology for current route-level views. The older top-level `frontend/pages` directory is retained only as legacy documentation context.

## Database Boundaries

SQLModel table definitions live in `backend/db/models.py`. Database configuration lives in `backend/db/config.py`, and session wiring lives in `backend/db/session.py` and `backend/db/dependencies.py`.

Current persisted tables include:

- `users`
- `collection_items`
- `pricing_catalog`

Alembic migrations live under `alembic/versions`. Model changes that alter schema must include a reviewed migration revision.

## Provider State

`DATA_PROVIDER` is read by backend repository factories.

- Auth, collection, and pricing catalog repositories require Postgres.
- Search, library, and scan catalog repositories return mock implementations for both `mock` and `postgres`.

`VITE_DATA_PROVIDER` controls frontend repository behavior for areas that support mock/API switching.

See [Repository Injection Summary](context/repository_injection.md) for more detail.

## Current vs Roadmap

Current implementation includes auth, collection persistence, pricing catalog sync, and stable scan/search/library contracts. Product context documents describe broader goals such as live marketplace grounding, richer visual reasoning, and deployment targets; those are roadmap context unless reflected in current code.
