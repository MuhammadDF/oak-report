# Architecture

Oak Report is a full-stack web app with a FastAPI backend, a React/Vite frontend, and Postgres-backed persistence for the domains that have moved beyond mock data.

## System Shape

- The frontend runs as a Vite app and proxies `/api` calls to the backend during development.
- In production, Firebase Hosting serves the frontend and rewrites `/api/**` to the Cloud Run backend.
- The backend exposes FastAPI routers under `/api`.
- Postgres stores users, collection items, and pricing catalog rows.
- Alembic owns schema migrations.
- Repository factories isolate provider selection from routes and screens.
- GitHub Actions deploy backend and frontend changes after merges to `main`.

## Backend Boundaries

FastAPI route modules live in `backend/api`:

- `/api/auth`
- `/api/collection`
- `/api/admin`
- `/api/search`
- `/api/scan`
Routes should stay thin. Business behavior belongs in `backend/services`, and persistence access belongs in `backend/repositories`.

Auth, collection, admin user management, and pricing catalog flows use FastAPI dependency injection with request-scoped async sessions. Scan and search are service flows backed by Gemini and/or the pricing catalog. The standalone library feature was scratched because appraise-page search covers the card lookup workflow; leftover library code is retained only for possible future work.

## Frontend Boundaries

The frontend entry point is `frontend/src/App.tsx`. It composes:

- `src/screens` for route-level UI states.
- `src/components` for reusable screen sections and layout pieces.
- `src/hooks` for stateful browser/API behavior.
- `src/repositories` for backend API data access.
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

`DATA_PROVIDER` is read by backend repository factories for repository-backed domains.

- Auth, collection, and pricing catalog repositories require Postgres.
- Scan uses Gemini identity extraction and pricing catalog lookup directly through its service.
- Search parses user queries into card identities and returns pricing catalog matches.
- Standalone library code is dormant and not part of the active product.

See [Repository Injection Summary](context/repository_injection.md) for more detail.

## Deployment Shape

Production deployment is split by runtime:

- Backend: a FastAPI container built from `backend.Dockerfile`, pushed to Artifact Registry, and deployed to Cloud Run.
- Frontend: a static Vite build deployed to Firebase Hosting.
- API routing: the browser calls same-origin `/api/...`; Firebase Hosting rewrites that traffic to the Cloud Run backend.
- Database: the deployed backend uses Postgres through Cloud SQL as described in the GCP deployment runbook.

The backend workflow preserves existing Cloud Run service configuration such as Cloud SQL attachment, secrets, environment variables, and runtime service account. The frontend workflow builds with `VITE_API_BASE_URL=""` so same-origin rewrites remain the default production path.

## Current vs Roadmap

Current implementation includes auth, collection persistence, pricing catalog sync, GitHub Actions deployment workflows, and stable scan/search contracts. Product context documents describe broader goals such as live marketplace grounding and richer visual reasoning; those are roadmap context unless reflected in current code.
