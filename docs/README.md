# Oak Report Documentation

Use this directory as the project handbook. The root README stays concise; the files here hold the detailed runbooks and design context.

## Start Here

- [Getting started](getting-started.md) - install dependencies, configure environment, and run the app.
- [Architecture](architecture.md) - understand frontend, backend, database, and provider boundaries.
- [Testing](testing.md) - run focused or full-stack verification.
- [Contributing](../CONTRIBUTING.md) - contribution workflow and review expectations.

## Deep Dives

- [Backend](backend.md) - FastAPI routes, services, repositories, auth, and backend tests.
- [Frontend](frontend.md) - React/Vite structure, screens, components, hooks, repositories, and tests.
- [Database](database.md) - Postgres, SQLModel tables, Alembic migrations, seed data, and reset workflows.
- [Operations](operations.md) - environment precedence, database switching, PriceCharting sync, and dev operations.

## Product Context

The files in [context](context/README.md) capture project intent and historical planning. Treat them as background and roadmap context, while the implementation docs above describe the current repo.
