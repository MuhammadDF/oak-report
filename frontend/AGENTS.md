# Frontend Agent Guide

Use this guide when changing `frontend`.

## Stack and Commands

Frontend stack: React 18, Vite, TypeScript, Vitest, Testing Library.

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 5173
npm run build
npm run test
npm run test:coverage
```

From repo root, use `npm --prefix frontend ...`.

## Architecture

- `src/App.tsx`: top-level screen/auth orchestration.
- `src/screens`: route-level screens.
- `src/components`: reusable UI and screen sections.
- `src/hooks`: stateful behavior and browser APIs.
- `src/repositories`: API and mock data access.
- `src/types`: shared TypeScript contracts.

## Coding Standards

- Use "screen" terminology for route-level UI.
- Keep components focused on rendering and user events.
- Put shared async or browser behavior in hooks.
- Put backend calls and provider switching in repositories.
- Prefer user-visible assertions in component tests.
- Keep styles consistent with `src/styles.css` before adding new patterns.

## Constraints

- Do not edit `frontend/dist` for source changes.
- Do not scatter `fetch` calls through screens or components.
- Keep `VITE_GOOGLE_CLIENT_ID` and `VITE_DATA_PROVIDER` behavior explicit.
- Update `docs/frontend.md` when structure, commands, or workflows change.
