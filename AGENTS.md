# AGENTS.md

This file gives AI coding agents and human contributors concise project context. Read the nearest nested `AGENTS.md` before editing a subdirectory.

## Project Snapshot

Oak Report is a Pokemon TCG appraisal app with:

- FastAPI backend in `backend`.
- React/Vite frontend in `frontend`.
- Postgres persistence through SQLModel and Alembic.
- Docker Compose for local services.
- Real scan/search flows backed by Gemini and the pricing catalog. The standalone library feature is scratched; leftover code exists only for possible future work.

## Key Commands

```bash
cp .env.example .env
uv sync
npm --prefix frontend install
docker compose up -d postgres
./scripts/create_database.sh
uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
npm --prefix frontend run dev -- --host 0.0.0.0 --port 5173
./scripts/run_qa.sh
```

## Architecture Rules

- Keep HTTP behavior in `backend/api`, business behavior in `backend/services`, and data access in `backend/repositories`.
- Keep frontend data access in `frontend/src/repositories`, not scattered through components.
- Keep SQLModel table definitions and Alembic migrations aligned.
- Preserve current provider boundaries. Do not revive or expand leftover library code unless the task explicitly reinstates that feature.
- Treat `docs/context` as product/roadmap context; implementation truth lives in code and current guides.

## Constraints

- Do not commit secrets or local `.env` values.
- Do not edit generated/build output such as `frontend/dist`, coverage folders, caches, or `__pycache__`.
- Do not change runtime behavior for documentation-only tasks.
- For schema changes, include and review Alembic migration files.
- Prefer focused tests near changed behavior.

## Documentation Expectations

- Keep `README.md` concise and navigational.
- Put detailed runbooks in `docs/`.
- Update `CONTRIBUTING.md` and nested `AGENTS.md` files when workflow expectations change.
