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
- Runs frontend Vitest with coverage.

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

## Documentation Changes

Docs-only changes do not require the application test suite. Before committing docs, verify:

- Commands match `pyproject.toml`, `frontend/package.json`, and `scripts`.
- Links resolve within the repo.
- README stays concise and points to detailed docs instead of duplicating them.
