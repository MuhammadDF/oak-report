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
- `frontend/src/repositories`: backend API and mock data access.
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

`VITE_DATA_PROVIDER` controls provider behavior where supported. `api` calls backend endpoints; mock modes should remain explicit and testable.

## Testing

Place focused tests near the behavior they cover. Prefer user-visible assertions for components and direct assertions for utilities, hooks, and repositories.
