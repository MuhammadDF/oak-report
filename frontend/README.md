# Oak Report Frontend

This directory contains the React/Vite presentation layer for Oak Report.

For the full frontend guide, see [../docs/frontend.md](../docs/frontend.md).

## Commands

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

Build:

```bash
npm run build
```

Run tests:

```bash
npm run test
npm run test:coverage
```

## Structure

- `src/screens`: route-level screen components.
- `src/components`: reusable UI and screen sections.
- `src/hooks`: shared stateful behavior.
- `src/repositories`: API/mock data access boundaries.
- `src/types`: shared TypeScript contracts.
- `src/test`: Vitest setup and helpers.

The current implementation uses "screens" rather than the older top-level `pages` pattern.
