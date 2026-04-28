# Frontend Guide

The frontend is a React 18, Vite, and TypeScript app. It uses Vitest and Testing Library for unit and component tests.

## Commands

Install dependencies:

```bash
npm --prefix frontend install
```

Run the dev server:

```bash
npm --prefix frontend run dev -- --host 0.0.0.0 --port 5173
```

Build:

```bash
npm --prefix frontend run build
```

The production build typechecks with `tsc -b` before Vite emits `frontend/dist`.

Run tests:

```bash
npm --prefix frontend run test
```

Run tests with coverage:

```bash
npm --prefix frontend run test:coverage
```

## Structure

- `frontend/src/App.tsx`: top-level screen state and auth/session orchestration.
- `frontend/src/screens`: route-level screen components.
- `frontend/src/components`: reusable UI and screen sections.
- `frontend/src/hooks`: stateful behavior and browser/API integration.
- `frontend/src/repositories`: backend API data access.
- `frontend/src/constants`: shared constants.
- `frontend/src/types`: TypeScript types.
- `frontend/src/test`: shared test setup and utilities.

## Screens

Current screens include sign-in, appraise, collection, admin, profile, and access-required states. Use "screen" terminology for route-level UI. The older `frontend/pages` folder is not the current implementation pattern.

## Appraise Flow

`AppraiseScreen` supports two card capture modes:

- Upload mode uses file input and desktop drag/drop.
- Live camera mode uses browser `getUserMedia`, captures a frame to canvas, and sends it through shared appraisal handling.

Key files:

- `src/components/appraise/UploadPanel.tsx`
- `src/components/appraise/LiveCameraPanel.tsx`
- `src/hooks/useAppraisal.ts`

## Repository Pattern

Frontend repositories isolate data access from screens and components. Prefer adding behavior there instead of scattering `fetch` calls through UI components.

Frontend repositories call backend API endpoints. There is no frontend mock provider switch in the current implementation; component and hook tests still use test doubles to isolate UI behavior.

## API Base URL

Frontend API callers use `frontend/src/constants/api.ts`.

- Local dev default: leave `VITE_API_BASE_URL` unset or blank so requests stay relative, such as `/api/auth/me`, and pass through the Vite dev-server proxy.
- Firebase Hosting default: the deployed frontend is built with `VITE_API_BASE_URL=""`; Firebase rewrites `/api/**` to the Cloud Run backend.
- Absolute backend URL builds: set `VITE_API_BASE_URL` only when intentionally bypassing same-origin rewrites, such as a one-off static deployment that calls the backend directly.

Vitest assertions expect relative `/api` URLs. The full QA script clears `VITE_API_BASE_URL` for frontend coverage so local shell or legacy dev-container values do not leak into tests.

## Deployment

The primary production frontend target is Firebase Hosting. The [deploy frontend workflow](../.github/workflows/deploy-frontend.yml) runs frontend tests, builds with relative `/api` URLs, and deploys `frontend/dist` with `firebase deploy --only hosting`.

`firebase.json` rewrites `/api/**` to the `pokemon-backend` Cloud Run service and falls back all other paths to `index.html` for the single-page app.

## Testing

Place focused tests near the behavior they cover. Prefer user-visible assertions for components and direct assertions for utilities, hooks, and repositories.
