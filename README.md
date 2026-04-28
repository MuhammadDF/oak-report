# Oak Report

Oak Report is a Pokemon TCG appraisal web app for identifying cards, estimating value, and managing a personal collection. The current vertical slice includes a FastAPI backend, Postgres persistence for auth and collection data, a React/Vite frontend, and staged mock adapters for scan, search, and library flows.

This README is the project hub. Detailed setup, architecture, operations, and contribution guidance live in the linked docs.

## Table of Contents

- [Stack](#stack)
- [Quick Start](#quick-start)
- [Usage Examples](#usage-examples)
- [Documentation](#documentation)
- [Quality and CI/CD](#quality-and-cicd)
- [Contributing](#contributing)
- [Current Scope](#current-scope)

## Stack

| Area | Technology |
| --- | --- |
| Backend | Python 3.12, FastAPI, SQLModel, SQLAlchemy async, Pydantic |
| Database | Postgres 16, Alembic migrations, seeded Pokemon card data |
| Frontend | React 18, Vite, TypeScript, Vitest, Testing Library |
| Tooling | uv, npm, Docker Compose, VS Code Dev Containers |
| Integrations | Google OAuth, JWT auth, Gemini API, PriceCharting catalog sync |

## Quick Start

1. Copy environment defaults and fill in local secrets:

   ```bash
   cp .env.example .env
   ```

2. Install backend and frontend dependencies:

   ```bash
   uv sync
   npm --prefix frontend install
   ```

3. Start Postgres and initialize the database:

   ```bash
   docker compose up -d postgres
   ./scripts/create_database.sh
   ```

4. Run the backend:

   ```bash
   uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```

5. Run the frontend in another shell:

   ```bash
   npm --prefix frontend run dev -- --host 0.0.0.0 --port 5173
   ```

Open the app at `https://localhost:5173`. The API is available at `http://localhost:8000`, with Swagger docs at `http://localhost:8000/docs`.

For full local, Docker Compose, and dev container setup details, see [Getting Started](docs/getting-started.md).

## Usage Examples

Start the complete containerized stack:

```bash
docker compose up --build
```

Reset local database state and reseed baseline card data:

```bash
./scripts/reset_database.sh
```

Run the full QA suite:

```bash
./scripts/run_qa.sh
```

Run focused test suites:

```bash
uv run pytest backend/tests
npm --prefix frontend run test:coverage
```

## Documentation

- [Docs index](docs/README.md) - reading paths and documentation map.
- [Getting started](docs/getting-started.md) - local, Docker Compose, and dev container setup.
- [Architecture](docs/architecture.md) - system shape, boundaries, and current implementation state.
- [Operations](docs/operations.md) - environment behavior, database switching, sync jobs, and reset workflows.
- [Backend guide](docs/backend.md) - FastAPI routes, services, repositories, auth, and tests.
- [Frontend guide](docs/frontend.md) - React/Vite screens, components, hooks, repositories, and tests.
- [Database guide](docs/database.md) - Postgres, SQLModel tables, Alembic, and seed data.
- [Testing guide](docs/testing.md) - backend, frontend, coverage, and full-stack QA.
- [Contributing](CONTRIBUTING.md) - contribution workflow and standards.
- [Agent guides](AGENTS.md) - actionable context for AI coding agents and human contributors.

Product and planning context lives under [docs/context](docs/context/README.md).

## Quality and CI/CD

There are no GitHub Actions workflows in this checkout yet, so the project does not publish a CI badge. The canonical verification command for local development and future automation is:

```bash
./scripts/run_qa.sh
```

That script starts the local Postgres service, runs backend pytest with coverage, and runs frontend Vitest with coverage.

## Contributing

Start with [CONTRIBUTING.md](CONTRIBUTING.md). For area-specific guidance, read the nearest `AGENTS.md` before editing:

- [Root guide](AGENTS.md)
- [Backend guide](backend/AGENTS.md)
- [Frontend guide](frontend/AGENTS.md)
- [Database guide](backend/db/AGENTS.md)
- [Migration guide](alembic/AGENTS.md)
- [Scripts guide](scripts/AGENTS.md)

## Current Scope

Implemented today:

- Google OAuth-backed auth flow with JWT session handling.
- Postgres persistence for users, roles, collection items, and pricing catalog data.
- React screens for sign-in, appraise, collection, admin, profile, and access-required states.
- PriceCharting catalog refresh support and admin status visibility.
- Scan returns a stable appraisal-shaped response while full image reasoning is evolving.

Staged or mocked today:

- CI/CD workflow automation is not yet committed.
