# Frontend Components

Current production components live in `frontend/src/components`.

Key groups:

- `appraise`: upload, live camera, search results, collection selection, and appraisal report sections.
- `collection`: collection grid, search, and stats sections.
- `common`: shared UI building blocks.
- `layout`: app shell, sidebar, and mobile navigation.
- `library`: library search and table components.

Keep components focused on presentation and user interaction. Put shared stateful behavior in `src/hooks` and API/mock access in `src/repositories`.

See [../../docs/frontend.md](../../docs/frontend.md) for the full frontend guide.
