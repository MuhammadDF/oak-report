# Testing Guide

Oak Report has backend pytest coverage, frontend Vitest coverage, and one full-stack QA command.

For the course-style two-part test plan, including the ideal strategy and the concrete tests currently present in the repository, see [Oak Report Test Plan](test-plan.md).

## Full QA

Run:

```bash
./scripts/run_qa.sh
```

The script:

- Removes local coverage artifacts from prior runs.
- Starts the `postgres` Compose service.
- Waits for Postgres health.
- Runs backend pytest with coverage.
- Runs frontend Vitest with coverage, with `VITE_API_BASE_URL` cleared so frontend tests assert relative `/api` URLs.

## GitHub Actions

Deployment workflows also run automated tests before deploying:

- Backend workflow: `uv run pytest backend/tests` against a Postgres service container.
- Frontend workflow: `npm test -- --run`.

The local full QA command remains broader than the deploy workflows because it runs both backend and frontend coverage in one command.

## Backend

Run backend tests:

```bash
uv run pytest backend/tests
```

Run backend tests with coverage:

```bash
uv run pytest backend/tests --cov=backend --cov-report=term-missing
```

The backend suite uses a Postgres test database derived from `DATABASE_URL`.

## Frontend

Run frontend tests in watch mode:

```bash
npm --prefix frontend run test
```

Run frontend coverage:

```bash
npm --prefix frontend run test:coverage
```

Vitest uses jsdom and `frontend/src/test/setup.ts`.

Frontend API tests expect relative `/api` URLs. If your shell exports `VITE_API_BASE_URL`, run coverage with the same environment used by `./scripts/run_qa.sh`:

```bash
VITE_API_BASE_URL= npm --prefix frontend run test:coverage
```

## Documentation Changes

Docs-only changes do not require the application test suite. Before committing docs, verify:

- Commands match `pyproject.toml`, `frontend/package.json`, and `scripts`.
- Links resolve within the repo.
- README stays concise and points to detailed docs instead of duplicating them.
