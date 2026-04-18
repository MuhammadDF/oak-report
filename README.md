# Oak Report

This repository now contains a first vertical slice of the Pokemon appraisal app:

- A FastAPI backend with a mocked `POST /api/scan/scan` workflow
- A React/Vite frontend for uploading a card image and viewing appraisal results
- Product context docs under `docs/context/`

## Local backend with uv

1. Install `uv` if you do not already have it.
2. Create the environment with `uv sync`.
3. Start FastAPI with `uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload`.

The API will be available at `http://localhost:8000` and Swagger at `http://localhost:8000/docs`.

## Frontend

1. Copy `.env.example` values into your local environment if needed.
2. From `frontend/`, install dependencies with `npm install`.
3. Start the frontend with `npm run dev`.

The Vite app runs at `http://localhost:5173` and is already allowed by backend CORS.

## Containers

Start the full stack with:

```bash
docker compose up --build
```

This launches:

- FastAPI backend on `http://localhost:8000`
- React/Vite frontend on `http://localhost:5173`

The backend image uses `uv` and `pyproject.toml` for Python dependency management.

## Dev Container

This repo also includes a VS Code dev container in [.devcontainer/devcontainer.json](/Users/muhammadfouly/COMP523/pokemon/.devcontainer/devcontainer.json).

It provides:

- Python 3.12
- `uv` for backend dependency management
- Node 20 and npm for the frontend

From VS Code:

1. Open the repository.
2. Run `Dev Containers: Reopen in Container`.
3. Wait for the `postCreateCommand` to finish `uv sync` and `npm install`.

Then inside the dev container you can either run the apps directly:

```bash
uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
cd frontend && npm run dev -- --host 0.0.0.0 --port 5173
```

## Current scope

The scan flow is intentionally mocked. It returns:

- normalized card identity
- condition snapshot
- estimated market value
- sample pricing sources

This gives you a stable contract to build around before wiring in Vertex AI, Postgres, and live market providers.

## Data provider boundaries (Postgres-ready)

Mock-backed data now sits behind repository adapters so Postgres can be introduced
without changing routes or screens:

- Backend provider switch:
  - `DATA_PROVIDER=mock` (default)
  - `DATA_PROVIDER=postgres` (placeholder, adapter not implemented yet)
- Backend repository boundaries:
  - `backend/repositories/collection_repository.py`
  - `backend/repositories/search_repository.py`
  - `backend/repositories/scan_catalog_repository.py`
  - `backend/repositories/factory.py`
- Frontend provider switch:
  - `VITE_DATA_PROVIDER=mock` (default)
  - `VITE_DATA_PROVIDER=api` (calls backend endpoints)
- Frontend repository boundaries:
  - `frontend/src/repositories/collectionRepository.ts`
  - `frontend/src/repositories/libraryRepository.ts`

To migrate to Postgres later, add Postgres repository implementations and register
them in the provider factories while keeping existing service and UI call sites unchanged.
