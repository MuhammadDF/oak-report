# Oak Report

Oak Report is a Pokemon TCG appraisal web app for identifying cards, estimating value, and managing a personal collection. The current vertical slice includes a FastAPI backend, Postgres persistence for auth, collection, and pricing catalog data, Vertex AI-backed scan identity extraction, pricing-catalog search on the appraise page, and a React/Vite frontend.

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

| Area         | Technology                                                    |
| ------------ | ------------------------------------------------------------- |
| Backend      | Python 3.12, FastAPI, SQLModel, SQLAlchemy async, Pydantic    |
| Database     | Postgres 16, Alembic migrations, seeded Pokemon card data     |
| Frontend     | React 18, Vite, TypeScript, Vitest, Testing Library           |
| Tooling      | uv, npm, Docker Compose, VS Code Dev Containers               |
| Deployment   | GitHub Actions, Cloud Run backend, Firebase Hosting frontend  |
| Integrations | Google OAuth, JWT auth, Vertex AI, PriceCharting catalog sync |

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

## Google Cloud ADC (local Docker / Vertex AI)

If you need to run Vertex AI operations locally or let Docker Compose mount Application Default Credentials (ADC), perform the following steps with your personal Google account.

1. Auth gcloud as your personal Google account:

   ```bash
   gcloud auth login --no-launch-browser
   ```

2. Create the Application Default Credentials file:

   ```bash
   gcloud auth application-default login --no-launch-browser
   ```

3. Pin the project (replace `oak-report` with your project if different):

   ```bash
   gcloud config set project oak-report
   ```

4. Copy the ADC file into the workspace where Docker Compose can mount it:

   ```bash
   cp ~/.config/gcloud/application_default_credentials.json gcp-adc.json
   ```

The repository expects `gcp-adc.json` at the workspace root for local container mounts; do not commit your personal ADC file to source control.

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
- [CI/CD guide](docs/cicd.md) - GitHub Actions, Cloud Run backend deploys, and Firebase Hosting frontend deploys.
- [GCP deployment guide](docs/gcp-deployment.md) - first-time Google Cloud setup and manual backend deploy.
- [Contributing](CONTRIBUTING.md) - contribution workflow and standards.
- [Agent guides](AGENTS.md) - actionable context for AI coding agents and human contributors.

Product and planning context lives under [docs/context](docs/context/README.md).

## Quality and CI/CD

The canonical local verification command is:

```bash
./scripts/run_qa.sh
```

That script starts the local Postgres service, runs backend pytest with coverage, and runs frontend Vitest with coverage. The frontend test step clears `VITE_API_BASE_URL` so tests exercise the same relative `/api` contract used by local Vite proxying and Firebase Hosting rewrites.

GitHub Actions are configured for deployment:

- [Deploy backend](.github/workflows/deploy-backend.yml) runs backend tests for backend-relevant changes, builds the backend image, pushes it to Artifact Registry, and deploys it to Cloud Run.
- [Deploy frontend](.github/workflows/deploy-frontend.yml) runs frontend tests for frontend-relevant changes, builds with relative `/api` URLs, and deploys `frontend/dist` to Firebase Hosting.

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
- GitHub Actions deployment workflows for Cloud Run backend updates and Firebase Hosting frontend updates.

Scratched feature:

- The standalone library feature is not part of the current product. Search on the appraise page covers the intended card lookup workflow. Some library code remains in the repo for possible future work, but it should not be treated as an active feature.
