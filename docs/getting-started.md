# Getting Started

This guide covers the fastest paths to a working Oak Report development environment.

## Prerequisites

- Python 3.12
- `uv`
- Node 20 and npm
- Docker and Docker Compose

The VS Code dev container provides these tools automatically.

## Environment

Create a local environment file:

```bash
cp .env.example .env
```

Fill in real values for secrets when needed:

- `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` for Google sign-in.
- `JWT_SECRET` for backend JWT signing.
- `PRICE_CHARTING` for catalog refreshes.
- `GEMINI_API_KEY` for Gemini-backed scan behavior.

See [Operations](operations.md) for the full environment model and database switching details.

For local development, leave `VITE_API_BASE_URL` unset or blank when you want the frontend to call relative `/api/...` URLs through the Vite proxy. Production Firebase Hosting also uses relative `/api` URLs and rewrites them to the Cloud Run backend. Set `VITE_API_BASE_URL` only when intentionally building a frontend that calls an absolute backend URL.

## Local Backend and Frontend

Install dependencies:

```bash
uv sync
npm --prefix frontend install
```

Start Postgres:

```bash
docker compose up -d postgres
```

Create, migrate, and seed the database:

```bash
./scripts/create_database.sh
```

Run the backend:

```bash
uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Run the frontend:

```bash
npm --prefix frontend run dev -- --host 0.0.0.0 --port 5173
```

Open:

- Frontend: `https://localhost:5173`
- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`

## Docker Compose

Start the full stack:

```bash
docker compose up --build
```

Compose launches:

- Postgres on `localhost:5432`
- FastAPI on `http://localhost:8000`
- Vite on `https://localhost:5173`

Compose requires the DB values from `.env`: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, and `DATA_PROVIDER`.

## Dev Container

The dev container in `.devcontainer/devcontainer.json` installs backend and frontend dependencies with:

```bash
uv sync
cd frontend && npm install
```

It forwards ports `5173` and `8000`, starts the local Postgres service on container startup, and configures default Postgres environment values for development.

The dev container does not set `VITE_API_BASE_URL`; this keeps browser requests on relative `/api` paths so Vite can proxy them to the backend. If an older container session still has `VITE_API_BASE_URL=http://localhost:8000` exported, rebuild/recreate the container or unset it before running frontend tests.

## Deployment Starting Points

- Day-to-day deploys after merge to `main` are handled by GitHub Actions; see [CI/CD](cicd.md).
- First-time Google Cloud setup and backend service creation are covered in [GCP deployment](gcp-deployment.md).
