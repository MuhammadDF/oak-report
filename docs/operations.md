# Operations

This guide covers local operational behavior: environment variables, database switching, catalog sync, and reset workflows.

## Environment Files

Start from:

```bash
cp .env.example .env
```

Important values:

- `DATA_PROVIDER`: backend provider selector. `postgres` is the primary current mode.
- `DATABASE_URL`: direct backend/Alembic database URL for local non-Compose runs.
- `APP_DATABASE_URL`: Compose-facing override that becomes backend `DATABASE_URL`.
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`: Compose database values.
- `GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_ID`: Google sign-in client IDs.
- `JWT_SECRET`: backend JWT signing secret.
- `PRICE_CHARTING`: PriceCharting CSV/API token.
- `GEMINI_API_KEY`: Gemini API key for scan behavior.

## Compose Environment Precedence

Docker Compose resolves values from exported shell variables before `.env`. Exported `DB_*` or `APP_DATABASE_URL` values can make the backend point somewhere other than the `.env` file suggests.

Check active overrides:

```bash
env | grep -E '^(APP_DATABASE_URL|DB_NAME|DB_USER|DB_PASSWORD|DB_HOST|DB_PORT)='
```

Unset them for the current shell:

```bash
unset APP_DATABASE_URL DB_NAME DB_USER DB_PASSWORD DB_HOST DB_PORT
```

Run Compose once while ignoring exported DB values:

```bash
env -u APP_DATABASE_URL -u DB_NAME -u DB_USER -u DB_PASSWORD -u DB_HOST -u DB_PORT docker compose up --build
```

Preview resolved Compose config:

```bash
docker compose config
```

## Database Switching

Use stack Postgres:

- Leave `APP_DATABASE_URL` empty.
- Set `DB_HOST=postgres` and `DB_PORT=5432` in `.env` for Compose.
- For local non-Compose backend runs, use `DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/pokemon`.

Use external Postgres:

- Set `APP_DATABASE_URL` to a full async Postgres URL for Compose.
- Keep matching `DB_*` values for Postgres service configuration where needed.

## Database Lifecycle

Create, migrate, and seed:

```bash
./scripts/create_database.sh
```

Reset schema, re-run migrations, and reseed:

```bash
./scripts/reset_database.sh
```

The seed source is `data/pokemon_cards.csv`.

## PriceCharting Catalog Sync

The backend maintains `pricing_catalog` from the PriceCharting custom CSV endpoint.

Settings:

- `PRICING_CATALOG_REFRESH_ENABLED`, default `true`
- `PRICING_CATALOG_REFRESH_INTERVAL_SECONDS`, default `604800`
- `PRICING_CATALOG_REFRESH_ON_STARTUP`, default `true`

Refresh behavior:

- Full replace on each run.
- Optional startup refresh runs asynchronously.
- Scheduled refresh defaults to weekly.

Admin status endpoint:

```text
GET /api/admin/pricing-catalog/status
```

The endpoint reports scheduler settings, row count, and last refresh timestamp.
