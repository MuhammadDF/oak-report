# Deploying to Google Cloud Run

This document walks through deploying the Pokemon app to Google Cloud Platform using Cloud Run.

**Architecture:** Two separate Cloud Run services (backend + frontend) with a Cloud SQL Postgres database. Secrets live in Google Secret Manager.

**Expected time:** 2–4 hours the first time.

---

## Architecture overview

```
┌──────────────────┐         ┌──────────────────┐
│ pokemon-frontend │  HTTPS  │ pokemon-backend  │
│   (Cloud Run)    │ ──────▶ │   (Cloud Run)    │
│   nginx + Vite   │         │  FastAPI/uvicorn │
│   build output   │         │                  │
└──────────────────┘         └────────┬─────────┘
                                      │ Cloud SQL
                                      │ Unix socket
                                      ▼
                             ┌──────────────────┐
                             │   Cloud SQL      │
                             │   Postgres 16    │
                             └──────────────────┘

Secrets (JWT_SECRET, GOOGLE_CLIENT_ID, PRICE_CHARTING,
GEMINI_API_KEY, db-password) → Secret Manager
```

**Why two services instead of one?** Clean separation, independent scaling, easier to iterate on the frontend without rebuilding the backend. The tradeoff is dealing with CORS and two URLs.

---

## Conventions used in this doc

- Commands are meant to be run from the **devcontainer shell**, inside `/workspaces/pokemon`.
- Placeholders like `$PROJECT_ID`, `$INSTANCE_CONNECTION_NAME`, `$BACKEND_URL`, `$FRONTEND_URL` should be replaced with your actual values. You can also `export` them as shell variables.
- Region used throughout: `us-central1`. Change consistently if you pick a different one.

---

## Prerequisites

- A Google Cloud account with billing enabled.
- A GCP project already created (you need the **project ID**, not the name).
- The repo checked out and the devcontainer running.
- Google OAuth 2.0 Client ID already provisioned (reused from local development).

---

## Phase 0 — Configure `gcloud` in the devcontainer

`gcloud` is preinstalled in the devcontainer image (see `.devcontainer/Dockerfile`). Verify:

```bash
gcloud --version
```

If the command is missing, you're likely on an older devcontainer image — rebuild it via the VS Code command palette → "Dev Containers: Rebuild Container".

### 0.1 Authenticate (no-browser flow, required inside a container)

```bash
gcloud auth login --no-launch-browser
gcloud auth application-default login --no-launch-browser
```

Each command prints a URL. Open it in your host browser, complete the flow, paste the verification code back into the container terminal.

### 0.2 Set your project and default region

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud config set run/region us-central1
gcloud config set compute/region us-central1
```

### 0.3 Enable required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

**✅ Success check:** `gcloud services list --enabled` lists all 5 APIs.

---

## Phase 1 — Cloud SQL Postgres

### 1.1 Create the instance

```bash
gcloud sql instances create pokemon-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-size=10GB \
  --storage-type=HDD
```

Takes 5–10 minutes. `db-f1-micro` is the smallest/cheapest tier (~$7/month).

### 1.2 Set the `postgres` user password

```bash
gcloud sql users set-password postgres \
  --instance=pokemon-db \
  --password='YOUR_STRONG_PASSWORD'
```

Save this password. It goes into Secret Manager in Phase 2.

### 1.3 Create the application database

```bash
gcloud sql databases create pokemon --instance=pokemon-db
```

### 1.4 Record the instance connection name

```bash
gcloud sql instances describe pokemon-db --format="value(connectionName)"
```

Output format: `YOUR_PROJECT_ID:us-central1:pokemon-db`. Save this as `$INSTANCE_CONNECTION_NAME` — it's used by Cloud Run to open a Unix socket to Cloud SQL.

**✅ Success check:** `gcloud sql instances list` shows `pokemon-db` with status `RUNNABLE`.

### 1.5 Grant Cloud Run access to the instance

Cloud Run's runtime service account (`PROJECT_NUMBER-compute@developer.gserviceaccount.com`) needs `roles/cloudsql.client` to open connections through the Cloud SQL Auth Proxy. Without this, the backend container will start but crash on the first DB query with `ConnectionRefusedError [Errno 111]`.

```bash
PROJECT_NUMBER='YOUR_PROJECT_NUMBER'   # gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

> Note: this is the *runtime* SA's permission to talk to Cloud SQL at the GCP level. The DB username/password (Phase 1.2) is a separate, database-level credential — both are required.

---

## Phase 2 — Secret Manager

Store all sensitive values as secrets. Cloud Run will read them at container start.

```bash
# Database password (from 1.2)
echo -n 'YOUR_DB_PASSWORD' | gcloud secrets create db-password --data-file=-

# JWT signing secret — generate a fresh random value for production
echo -n "$(openssl rand -hex 32)" | gcloud secrets create jwt-secret --data-file=-

# Google OAuth Client ID
echo -n 'YOUR_GOOGLE_CLIENT_ID' | gcloud secrets create google-client-id --data-file=-

# PriceCharting API key
echo -n 'YOUR_PRICECHARTING_KEY' | gcloud secrets create price-charting --data-file=-

# Gemini API key
echo -n 'YOUR_GEMINI_KEY' | gcloud secrets create gemini-api-key --data-file=-
```

The `-n` flag on `echo` prevents a trailing newline from being stored with the secret value — a common source of bugs.

**✅ Success check:** `gcloud secrets list` shows all 5 secrets.

### 2.1 Grant Cloud Run access to these secrets

Cloud Run uses a default service account: `PROJECT_NUMBER-compute@developer.gserviceaccount.com`. Get your project number:

```bash
gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)"
```

Grant secret accessor to each secret:

```bash
PROJECT_NUMBER='YOUR_PROJECT_NUMBER'
for SECRET in db-password jwt-secret google-client-id price-charting gemini-api-key; do
  gcloud secrets add-iam-policy-binding "$SECRET" \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

---

## Phase 3 — Artifact Registry

Artifact Registry hosts the container images Cloud Run will pull.

```bash
gcloud artifacts repositories create pokemon-images \
  --repository-format=docker \
  --location=us-central1 \
  --description="Pokemon app images"

gcloud auth configure-docker us-central1-docker.pkg.dev
```

The second command writes Docker auth config so `docker push` works against the registry.

**✅ Success check:** `gcloud artifacts repositories list` shows `pokemon-images`.

---

## Phase 4 — Code changes required for production

The local dev setup relies on Vite's proxy and hard-coded localhost URLs. For production we need 4 changes:

### 4.1 Make the frontend API base URL configurable

File: `frontend/src/constants/api.ts`

Read from a Vite env var at build time, falling back to `""` so the dev proxy still works locally.

```ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
```

### 4.2 Production frontend Dockerfile (multi-stage: build + nginx)

A separate file `frontend.prod.Dockerfile` exists alongside the dev `frontend.Dockerfile` (which `docker-compose` still uses for hot reload). Stage 1 runs `npm run build` with the API URL baked in. Stage 2 serves the static output via nginx on the port Cloud Run provides.

```dockerfile
# Stage 1 — build
FROM node:20-bookworm-slim AS build
WORKDIR /app
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2 — serve
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/templates/default.conf.template
ENV PORT=8080
EXPOSE 8080
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
```

### 4.3 Nginx config for the frontend

File: `frontend/nginx.conf`

SPA fallback so client-side routes (React Router) work on refresh. `$PORT` is templated at container start from Cloud Run's injected `PORT` env var.

```nginx
server {
  listen       ${PORT};
  server_name  _;
  root         /usr/share/nginx/html;
  index        index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

### 4.4 Backend CORS — allow the frontend's Cloud Run URL

File: `backend/main.py` (around line 92)

Read an `ALLOWED_ORIGINS` env var (comma-separated) and append to the existing localhost entries.

```python
import os

_extra_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", *_extra_origins],
    allow_origin_regex=r"^https?://(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+):5173$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4.5 Run Alembic migrations on backend startup

File: `backend.Dockerfile`

Change the `CMD` to run migrations before uvicorn boots:

```dockerfile
CMD ["sh", "-c", "uv run alembic upgrade head && uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000"]
```

> ⚠️ This is the simplest approach and fine for small/fast migrations. For larger migrations, run them separately (via Cloud SQL Proxy or a dedicated Cloud Run Job) so they don't block container startup and trigger a Cloud Run health-check timeout.

---

## Phase 5 — Build and deploy the backend

### 5.1 Build and push the backend image

From `/workspaces/pokemon`:

```bash
PROJECT_ID='YOUR_PROJECT_ID'
IMAGE_BACKEND="us-central1-docker.pkg.dev/${PROJECT_ID}/pokemon-images/backend:v1"

docker build -f backend.Dockerfile --platform linux/amd64 -t "$IMAGE_BACKEND" .
docker push "$IMAGE_BACKEND"
```

`--platform linux/amd64` is required when building on Apple Silicon — Cloud Run only runs x86-64.

### 5.2 Deploy backend to Cloud Run

```bash
INSTANCE_CONNECTION_NAME='YOUR_PROJECT_ID:us-central1:pokemon-db'
DB_PASSWORD='YOUR_DB_PASSWORD'  # same value you put in Secret Manager

gcloud run deploy pokemon-backend \
  --image="$IMAGE_BACKEND" \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8000 \
  --add-cloudsql-instances="$INSTANCE_CONNECTION_NAME" \
  --set-env-vars="DATA_PROVIDER=postgres,POSTGRES_USER=postgres,POSTGRES_DB=pokemon,DATABASE_URL=postgresql+asyncpg://postgres:${DB_PASSWORD}@/pokemon?host=/cloudsql/${INSTANCE_CONNECTION_NAME},ALLOWED_ORIGINS=PLACEHOLDER" \
  --set-secrets="JWT_SECRET=jwt-secret:latest,GOOGLE_CLIENT_ID=google-client-id:latest,PRICE_CHARTING=price-charting:latest,GEMINI_API_KEY=gemini-api-key:latest"
```

**What each flag does:**

- `--allow-unauthenticated` — public service (anyone can hit the URL; your app handles auth). If your org enforces Domain Restricted Sharing, this flag silently fails and the service stays IAM-locked — you'll need an org admin to override the policy for this project before public access works.
- `--port=8000` — tells Cloud Run which port the container listens on.
- `--add-cloudsql-instances` — mounts a Unix socket at `/cloudsql/INSTANCE_CONNECTION_NAME` inside the container.
- `--set-env-vars` — plaintext env vars. The `DATABASE_URL` uses the socket host.
- `--set-secrets` — pulls values from Secret Manager at container start and exposes them as env vars.
- `ALLOWED_ORIGINS=PLACEHOLDER` — we'll set this properly in Phase 7 once we have the frontend URL.

> ⚠️ The DB password appearing in plaintext inside `DATABASE_URL` is a known weak spot here. A better setup constructs `DATABASE_URL` in code from separate `POSTGRES_PASSWORD` (from Secret Manager) + host/db env vars. Worth cleaning up on a second pass.

### 5.3 Capture the backend URL

```bash
gcloud run services describe pokemon-backend --region=us-central1 --format="value(status.url)"
```

Output: `https://pokemon-backend-XXXXX-uc.a.run.app`. Save as `$BACKEND_URL`.

**✅ Success check:** Visit `$BACKEND_URL/docs` — FastAPI Swagger UI loads.

---

## Phase 6 — Build and deploy the frontend

> ⚠️ **Superseded.** The frontend is now hosted on **Firebase Hosting**, not Cloud Run. See [cicd.md](cicd.md) for the current setup (one-time GCP/IAM steps + the GitHub Actions workflow that builds and runs `firebase deploy`). The Cloud Run flow below is preserved for historical reference and as a fallback if you ever need to revert.
>
> If you're following this doc top-to-bottom for a fresh deploy, **skip Phase 6** entirely. After Phase 5 (backend deploy) and Phase 7 (CORS — set `ALLOWED_ORIGINS` to the Firebase URL instead), jump to [cicd.md](cicd.md) for the frontend.

### 6.1 Build with the backend URL baked in

```bash
IMAGE_FRONTEND="us-central1-docker.pkg.dev/${PROJECT_ID}/pokemon-images/frontend:v1"
BACKEND_URL='https://pokemon-backend-XXXXX-uc.a.run.app'
GOOGLE_CLIENT_ID='YOUR_GOOGLE_CLIENT_ID'

docker build -f frontend.prod.Dockerfile \
  --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL="$BACKEND_URL" \
  --build-arg VITE_GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
  -t "$IMAGE_FRONTEND" .

docker push "$IMAGE_FRONTEND"
```

Vite inlines `import.meta.env.VITE_*` values at build time. If you ever change `BACKEND_URL` you must rebuild and redeploy the frontend image.

### 6.2 Deploy frontend to Cloud Run

```bash
gcloud run deploy pokemon-frontend \
  --image="$IMAGE_FRONTEND" \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated
```

Nginx listens on Cloud Run's `PORT` env var (defaulted to 8080 in the Dockerfile).

### 6.3 Capture the frontend URL

```bash
gcloud run services describe pokemon-frontend --region=us-central1 --format="value(status.url)"
```

Save as `$FRONTEND_URL`.

---

## Phase 7 — Wire up CORS

Update the backend's `ALLOWED_ORIGINS` with the Firebase Hosting URLs:

```bash
gcloud run services update pokemon-backend \
  --region=us-central1 \
  --update-env-vars="ALLOWED_ORIGINS=https://oak-report.web.app,https://oak-report.firebaseapp.com"
```

Same-origin traffic via Firebase Hosting's `/api/**` rewrite doesn't actually need CORS — the request reaches Cloud Run already authenticated by Firebase's managed SA, no browser preflight involved. `ALLOWED_ORIGINS` is still useful for direct calls to the backend's `*.run.app` URL (e.g. local dev tools hitting prod) and as a guardrail if you ever expose the backend more broadly.

This triggers a new backend revision without rebuilding the image.

---

## Phase 8 — Update Google OAuth

1. Open https://console.cloud.google.com/apis/credentials.
2. Click the OAuth 2.0 Client ID used by this app.
3. **Authorized JavaScript origins** → add `$FRONTEND_URL`.
4. **Authorized redirect URIs** → add `$FRONTEND_URL` if the auth flow uses a redirect (check `useAuthSession.ts`).
5. Save. OAuth changes take ~5 minutes to propagate.

---

## Phase 9 — Verify

1. Open `$FRONTEND_URL` in a browser.
2. Open DevTools → Network. Confirm:
   - Static assets load from `$FRONTEND_URL`.
   - `/api/*` calls hit `$BACKEND_URL` and return 200s (not CORS errors).
3. Log in with Google — verify the OAuth flow completes.
4. Exercise a few features that read and write the database.

### Tailing logs

```bash
gcloud run services logs tail pokemon-backend  --region=us-central1
gcloud run services logs tail pokemon-frontend --region=us-central1
```

---

## Redeploying after a code change

> 🤖 **Day-to-day redeploys are automated.** Once the GitHub Actions pipeline is set up (see [cicd.md](cicd.md)), a push to `main` rebuilds and redeploys the affected service automatically. The manual commands below are kept for the *first* deploy of a brand-new service and for emergency hotfixes when CI is unavailable.

### Backend only

```bash
docker build -f backend.Dockerfile --platform linux/amd64 -t "$IMAGE_BACKEND" .
docker push "$IMAGE_BACKEND"
gcloud run deploy pokemon-backend --image="$IMAGE_BACKEND" --region=us-central1
```

### Frontend only

```bash
docker build -f frontend.prod.Dockerfile --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL="$BACKEND_URL" \
  --build-arg VITE_GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
  -t "$IMAGE_FRONTEND" .
docker push "$IMAGE_FRONTEND"
gcloud run deploy pokemon-frontend --image="$IMAGE_FRONTEND" --region=us-central1
```

### Rolling back

```bash
gcloud run revisions list --service=pokemon-backend --region=us-central1
gcloud run services update-traffic pokemon-backend --to-revisions=pokemon-backend-00002-abc=100 --region=us-central1
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `403 Forbidden` pulling image | Docker not authed to Artifact Registry | `gcloud auth configure-docker us-central1-docker.pkg.dev` |
| Backend container exits, logs show `sqlalchemy` connection error | DB creds wrong, or Cloud SQL connector not attached | Verify `--add-cloudsql-instances` flag and that `DATABASE_URL` uses `host=/cloudsql/...` |
| Backend logs show `ConnectionRefusedError [Errno 111]` on the Unix socket | Runtime SA missing `roles/cloudsql.client` | Re-run Phase 1.5 |
| Frontend loads but API calls CORS-fail | `ALLOWED_ORIGINS` not set or wrong | Re-run Phase 7 with exact frontend URL (no trailing slash) |
| OAuth error: `redirect_uri_mismatch` | OAuth authorized origins not updated | Re-check Phase 8 |
| `exec format error` at container start | Built for arm64 on Apple Silicon | Add `--platform linux/amd64` to `docker build` |
| Alembic migration times out on startup | Migration too slow for health check | Move migrations to a separate Cloud Run Job |
| Secrets missing at runtime | Service account lacks `secretAccessor` | Re-run the IAM loop in Phase 2.1 |

---

## Costs to watch

- **Cloud SQL `db-f1-micro`:** ~$7/month, runs 24/7.
- **Cloud Run:** scales to zero — pay only for requests (free tier covers hobby usage).
- **Artifact Registry:** first 0.5 GB storage free; old image versions add up.
- **Secret Manager:** free up to 6 active secrets + 10k access ops/month.

To minimize cost during development, consider stopping the Cloud SQL instance when not in use:

```bash
gcloud sql instances patch pokemon-db --activation-policy=NEVER   # stop
gcloud sql instances patch pokemon-db --activation-policy=ALWAYS  # start
```
