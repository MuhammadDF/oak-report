# Oak Report Test Plan

This plan updates the original course test plan to match the current Oak Report repository. It has two parts:

- The ideal plan: what we would test with unlimited time and resources.
- The practical plan: what Team C actually plans to run and maintain in this repository.

Usability testing is intentionally omitted, per the assignment option.

## Part 1: Ideal Test Plan

If we had all the time and resources we needed, Oak Report would be tested across backend behavior, frontend behavior, database behavior, browser workflows, security, reliability, and real collector acceptance.

### Unit Testing

Backend unit tests would cover every service, repository mapper, auth helper, configuration helper, and error branch using `pytest`, `pytest-asyncio`, and `pytest-cov`. External providers such as Google OAuth, Gemini image reasoning, PriceCharting catalog refreshes, and any future card-pricing APIs would be mocked with deterministic responses so timeout, invalid payload, unavailable provider, and malformed data paths could be tested repeatedly.

Frontend unit tests would cover every React component, custom hook, repository function, formatter, and navigation helper using Vitest, React Testing Library, jsdom, and `@testing-library/user-event`. The suite would include loading, empty, success, auth-required, forbidden, and error states for every screen.

### Integration and System Testing

API integration tests would exercise FastAPI routes through HTTP clients, dependency injection, SQLModel models, Alembic-created schema, and real Postgres test databases. These tests would verify auth requirements, role-based access, request validation, collection persistence, pricing catalog search, admin workflows, and scan/search behavior at the route boundary.

Full UI end-to-end tests would use Playwright to launch the React app and backend together. The suite would script real user journeys such as signing in, searching pricing catalog cards, scanning or uploading a card image, selecting a pricing match, adding a card to a collection, editing quantity, removing a card, and using admin screens. These tests would assert visible DOM output, network behavior, and user-facing error messages.

Cross-browser and device coverage would run the Playwright suite on Chromium, Firefox, WebKit/Safari, Edge, desktop viewports, tablet viewports, and mobile viewports through a service such as BrowserStack.

### Tools Used

- `pytest`, `pytest-asyncio`, `pytest-cov`: backend unit, async, route, repository, and coverage tests.
- `httpx`: FastAPI ASGI route integration tests.
- `Vitest`, React Testing Library, jsdom, `@testing-library/user-event`: frontend unit and component interaction tests.
- Playwright: browser-based end-to-end tests.
- Docker Compose and Postgres: integrated local database and service testing.
- Alembic: schema migration verification.
- Locust or k6: backend load and stress testing.
- OWASP ZAP, `pip-audit`, `npm audit`: security and dependency vulnerability testing.
- GitHub Actions or equivalent CI/CD: automated regression runs on deploy-relevant main-branch updates before deployment.

### End Users Considered

- Casual collectors: users who want quick card identification, rough value estimates, and a simple personal collection.
- Power traders: users who appraise many cards quickly, compare pricing matches, and update quantities during trades or events.
- Admins: users who review catalog sync status, manage user roles, and need clear operational signals.
- Developers and maintainers: users modifying the code who need reliable regression tests, clear failure output, and repeatable setup.

### Performance, Reliability, and Security Testing

Load tests would simulate both normal and peak usage against the scan, search, auth, collection, and admin endpoints. Scenarios would include high-volume card search, repeated collection mutations, and concurrent authenticated users. We would measure response time, error rate, database connection behavior, and memory use.

Reliability tests would inject database restarts, provider timeouts, malformed external responses, missing environment variables, expired JWTs, invalid Google tokens, and interrupted catalog refreshes. The expected result would be graceful API errors, no data corruption, clear logs, and recoverable service state.

Security tests would include dependency audits, route authorization checks, JWT validation checks, role escalation attempts, request-size and file-type checks for uploads, SQL injection probes against search endpoints, and XSS checks against user-visible frontend rendering.

### Acceptance Testing

Acceptance testing would be performed by Team C, course reviewers, at least one future engineer, and representative Pokemon TCG collectors. Testers would use known card examples and expected market-value ranges to confirm that the app supports the intended workflow: sign in, search or scan a card, review pricing matches, add a card to a collection, and manage collection quantities.

## Part 2: Practical Test Plan

This section is the concrete guide for what we actually test today. Anything listed here should be runnable from this repository.

### Who Tests and When

Team C runs the automated suite locally before commits that change backend, frontend, database, auth, route, service, repository, or UI behavior. Future engineers should run the same commands before submitting pull requests or merging major feature work.

Manual system tests are run by Team C before demos, deployments, or major merges that affect user-visible workflows. Course reviewers or future maintainers can repeat the manual tests using the steps and expected outputs below.

GitHub Actions workflows are committed for deploy-relevant changes on `main`. Backend changes run backend tests before a Cloud Run deploy, and frontend changes run Vitest before a Firebase Hosting deploy. The local full QA command remains `./scripts/run_qa.sh`.

### Test Environments

Primary automated test environment:

- OS: Linux dev container.
- Python: 3.12.11 in the current workspace; project requires Python `>=3.12`.
- Backend dependency manager: `uv` 0.11.7 in the current workspace.
- Backend framework and test libraries: FastAPI 0.115.12, pytest 8.3.5, pytest-asyncio 0.26.0, pytest-cov 6.1.1, httpx 0.28.1.
- Database: Postgres 16 through the `postgres:16-bookworm` Docker image in `docker-compose.yml`.
- Database libraries: SQLModel 0.0.22, SQLAlchemy 2.0.40, asyncpg 0.29.0, Alembic 1.13.2.
- Node.js: 20.20.2 in the current workspace.
- npm: 10.8.2 in the current workspace.
- Frontend framework and test libraries: React 18.3.1, Vite 5.4.17, TypeScript 5.8.2, Vitest 3.2.4, jsdom 26.1.0, React Testing Library 16.3.0.
- Docker Compose: v2.33.0 in the current workspace.

Manual system test environment:

- Run the complete app with `docker compose up --build`.
- Open the frontend at the mapped Vite port, normally `https://localhost:5173`.
- Use latest stable Chromium. The repo does not currently include automated Firefox, Safari, Edge, or mobile-device testing.

### Automated Test Commands

Run the full local QA suite:

```bash
./scripts/run_qa.sh
```

This command removes prior coverage artifacts, starts the Postgres Compose service, waits for Postgres health, runs backend pytest with coverage, and runs frontend Vitest coverage.

Run backend tests only:

```bash
uv run pytest backend/tests
```

Run backend tests with coverage:

```bash
uv run pytest backend/tests --cov=backend --cov-report=term-missing
```

Run frontend tests in watch mode:

```bash
npm --prefix frontend run test
```

Run frontend tests with coverage:

```bash
npm --prefix frontend run test:coverage
```

If the shell exports `VITE_API_BASE_URL`, use the same deterministic frontend test environment as the full QA script:

```bash
VITE_API_BASE_URL= npm --prefix frontend run test:coverage
```

### CI/CD Test Commands

The backend deployment workflow runs:

```bash
uv run pytest backend/tests
```

against a Postgres service container.

The frontend deployment workflow runs:

```bash
npm test -- --run
```

before building and deploying `frontend/dist`.

### Current Backend Automated Coverage

The backend tests live in `backend/tests`. They use pytest, pytest-asyncio, httpx ASGI transport, dependency overrides, and a Postgres test database derived from `DATABASE_URL`. The test database name is the configured database name with `_test` appended, such as `pokemon_test`.

The suite currently covers:

- Route behavior for auth, scan, search, collection, and admin endpoints.
- Request validation errors such as missing fields, invalid payloads, invalid query length, unsupported file types, and empty upload bodies.
- Role and authorization behavior for collector, admin, and unauthenticated/unauthorized flows.
- Service behavior for scan, search, pricing, collection, auth, and admin workflows.
- Repository behavior for Postgres repositories.
- Postgres persistence for users, roles, collection items, and pricing catalog rows.
- JWT and Google OAuth helper behavior using mocked token and environment conditions.
- Database configuration, test database helper behavior, startup database verification, and script helper behavior.
- Price catalog sync helper logic and migration runner invocation behavior through mocks.

Backend oracles include:

- `POST /api/scan` with a supported non-empty image file returns `200 OK` and a scan-result-shaped JSON payload.
- `POST /api/scan` with an unsupported content type returns `415 Unsupported Media Type` with the message `Only JPEG, PNG, WebP, or HEIC images are supported.`
- `POST /api/scan` with an empty supported image upload returns `400 Bad Request` with the message `Uploaded image is empty.`
- `GET /api/cards?query=charizard` returns `200 OK` and a JSON object with a `results` array when the search service returns matches.
- `GET /api/cards` without a valid query returns FastAPI/Pydantic validation errors.
- Collection routes return `403 Forbidden` for users without collector or admin roles.
- Adding a valid collection item returns a collection summary containing the added card.
- Updating or deleting a missing collection item returns `404 Not Found` with `Collection item not found.`
- Postgres repository tests verify that inserted users, collection items, and pricing rows can be read back from a separate database session.

### Current Frontend Automated Coverage

The frontend tests live under `frontend/src` next to the code they verify. They use Vitest, jsdom, React Testing Library, jest-dom matchers, and mocked `fetch` calls.

The suite currently covers:

- App shell, sidebar, mobile navigation, basic screens, and screen header rendering.
- Appraise, collection, admin, sign-in, profile, and access-required screen behavior.
- Appraise UI components including upload, camera, results, empty report, identity report, collection selection, and search result panels.
- Collection components including grids, stats, and search controls.
- Custom hooks for appraisal, card search, auth session, mobile checks, and media query behavior.
- Frontend repository modules for collection and admin API access.
- Formatting utilities and navigation constants.

Frontend oracles include:

- Repository tests assert exact `fetch` URLs, methods, headers, auth tokens, request bodies, and thrown error messages.
- Component tests assert that expected card names, prices, headings, controls, loading states, empty states, and error states appear in the DOM.
- Hook tests assert that state changes correctly when API calls succeed, fail, or require authentication.
- Screen tests assert expected user flows using mocked child components and mocked hooks.

The frontend automated suite does not currently launch a real browser or call the real backend. Network calls are mocked.

### Practical Integration and System Testing

Automated backend integration exists at two levels:

- Route-level integration uses FastAPI, dependency injection, auth overrides, Pydantic validation, and httpx ASGI transport.
- Database integration uses a real Postgres test database with SQLModel metadata and async sessions.

Full browser-to-backend E2E testing is manual today. The repo does not currently include Playwright, Cypress, BrowserStack, Locust, k6, OWASP ZAP, or `pip-audit`. GitHub Actions provide deploy-gated backend and frontend regression runs, but not full E2E, load, cross-browser, or security automation.

Manual system test setup:

```bash
cp .env.example .env
uv sync
npm --prefix frontend install
docker compose up --build
```

Manual test case 1: App loads.

- Input: Open `https://localhost:5173`.
- Expected output: The React app loads without a blank page. Primary navigation and the default screen are visible. Browser console should not show uncaught runtime errors.

Manual test case 2: Auth-gated access.

- Input: Open a protected workflow such as collection or admin while not signed in.
- Expected output: The app shows the sign-in or access-required state instead of protected data.

Manual test case 3: Search/appraise flow.

- Input: Sign in using the configured local auth/OAuth path if credentials are available, then use the appraise/search UI with a valid card query such as `Pikachu` or `Charizard`.
- Expected output: The app displays pricing/search results from the pricing catalog and appraisal results from the current scan service. Loading indicators clear after the request. No uncaught browser errors appear.

Manual test case 4: Scan upload validation.

- Input: Use the scan/upload UI with a supported image file type: JPEG, PNG, WebP, or HEIC.
- Expected output: The backend accepts the upload and returns a scan result. The frontend displays a card identity/pricing result.

Manual test case 5: Scan upload error.

- Input: Upload a non-image file such as a `.txt` file.
- Expected output: The backend rejects it with `415 Unsupported Media Type`; the frontend should show an error state rather than crashing.

Manual test case 6: Collection mutation.

- Input: Add a card result to the collection, change its quantity, and remove it.
- Expected output: The collection screen reflects the added card, updated quantity, and removal. Refreshing the page should preserve persisted Postgres-backed collection state for the same user.

Manual test case 7: API unavailable.

- Input: Stop the backend container or disconnect the frontend from the API, then attempt a search, scan, or collection action.
- Expected output: The frontend displays an error state and remains usable. It should not show a blank page or uncaught runtime exception.

### Error and Data-Specific Conditions We Actually Cover

The current automated and manual plan specifically covers:

- Empty or invalid image uploads to `/api/scan`.
- Unsupported scan file types.
- Missing or invalid request fields that should produce Pydantic `422` validation errors.
- Search query validation, including too-short or missing queries.
- Missing collection items on update and delete.
- Forbidden collection/admin access for users with insufficient roles.
- Auth token creation and validation helpers.
- Invalid Google token situations through mocked helper tests.
- Empty repository data and repository not-found behavior.
- Postgres create/read/update/delete paths for users, collections, and pricing catalog records.
- Frontend API failures, unauthenticated repository calls, and rendered empty/error states.

### Current Limitations

The current practical plan does not claim automated browser E2E coverage, cross-browser automation, load testing, or automated security scanning. Those remain ideal-plan items or future work. The strongest current coverage is automated backend route/service/repository coverage, real Postgres repository integration, frontend unit/component/hook/repository coverage, and deploy-gated GitHub Actions test runs.
