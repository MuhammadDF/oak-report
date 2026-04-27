# CI/CD: GitHub Actions → Cloud Run + Firebase Hosting

This doc walks through the **one-time** setup required to enable automatic deploys, then describes how the pipeline behaves day-to-day.

Companion to [gcp-deployment.md](gcp-deployment.md), which covers the manual first-time deploy of the backend.

---

## What it does

On every push to `main`:

- Changes under `backend/`, `alembic/`, `pyproject.toml`, `uv.lock`, `data/`, or `backend.Dockerfile` → `deploy-backend.yml` runs.
- Changes under `frontend/`, `firebase.json`, or `.firebaserc` → `deploy-frontend.yml` runs.
- A change touching both runs both workflows in parallel.
- A change touching neither (e.g. only docs) runs nothing.

**Backend** workflow: builds a Docker image, pushes it to Artifact Registry tagged with the commit SHA, then `gcloud run deploy <service> --image=<sha>`. **No other deploy flags are passed**, so existing Cloud Run config (CloudSQL connection, env vars, Secret Manager bindings, service account) is preserved from the initial manual deploy.

**Frontend** workflow: runs `npm ci && npm run build` to produce `frontend/dist/`, then `firebase deploy --only hosting`. Firebase Hosting handles static asset serving + a same-origin rewrite from `/api/**` to the Cloud Run backend.

```
GitHub push to main
        │
        ▼
┌─────────────────────┐    ┌─────────────────────┐
│ deploy-backend.yml  │    │ deploy-frontend.yml │
└─────────┬───────────┘    └─────────┬───────────┘
          │                          │
          ▼                          ▼
   gcloud auth via Workload Identity Federation (no JSON keys)
          │                          │
          ▼                          ▼
   docker build → push to        npm ci && npm run build
   Artifact Registry             (VITE_API_BASE_URL="" → relative URLs)
          │                          │
          ▼                          ▼
   gcloud run deploy             firebase deploy --only hosting
   pokemon-backend               → oak-report.web.app
```

At runtime, the browser hits `https://oak-report.web.app/api/...` → Firebase Hosting rewrites it to the private `pokemon-backend` Cloud Run service. Same-origin, no CORS for normal traffic.

---

## One-time GCP setup

Run these commands **once** from the devcontainer shell. They create a service account that GitHub can impersonate via Workload Identity Federation (WIF) — no long-lived JSON keys touch the repo.

Set these locally first:

```bash
PROJECT_ID="oak-report"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
REPO="organized-nick/pokemon"   # GitHub <org>/<repo>
DEPLOYER_SA="github-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
HOSTING_SA="service-${PROJECT_NUMBER}@gcp-sa-firebasehosting.iam.gserviceaccount.com"
```

### 1. Create the deployer service account

```bash
gcloud iam service-accounts create github-deployer \
  --project="$PROJECT_ID" \
  --display-name="GitHub Actions deployer"
```

### 2. Grant it the minimum roles

```bash
# Update Cloud Run services
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_SA}" \
  --role="roles/run.admin"

# Push backend images to Artifact Registry
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_SA}" \
  --role="roles/artifactregistry.writer"

# Publish to Firebase Hosting
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_SA}" \
  --role="roles/firebasehosting.admin"

# Act as the runtime SA (required to deploy a service that runs *as* the compute SA)
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --member="serviceAccount:${DEPLOYER_SA}" \
  --role="roles/iam.serviceAccountUser"
```

### 3. Wire Firebase Hosting to invoke the private backend

The Firebase rewrite proxies `/api/**` to Cloud Run as a Google-managed service account. The backend stays private; Firebase is the only authorized caller from the browser path.

```bash
# Make sure the backend isn't publicly reachable (best-effort cleanup)
gcloud run services remove-iam-policy-binding pokemon-backend \
  --region=us-central1 \
  --member=allUsers --role=roles/run.invoker || true

# Allow Firebase Hosting's managed SA to invoke pokemon-backend
gcloud run services add-iam-policy-binding pokemon-backend \
  --region=us-central1 \
  --member="serviceAccount:${HOSTING_SA}" \
  --role="roles/run.invoker"
```

> The Firebase Hosting SA is auto-created the first time Hosting is used on the project. If the second command fails with "service account does not exist," do an initial manual `firebase deploy --only hosting` from the devcontainer first to provision it, then re-run.

### 4. Create the Workload Identity Pool + GitHub OIDC provider

```bash
gcloud iam workload-identity-pools create github-pool \
  --project="$PROJECT_ID" \
  --location=global \
  --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc github-provider \
  --project="$PROJECT_ID" \
  --location=global \
  --workload-identity-pool=github-pool \
  --display-name="GitHub provider" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository == '${REPO}'"
```

The `attribute-condition` locks the federation to this repo only. Without it, any GitHub repo could authenticate as `github-deployer` — Google requires this restriction since 2023.

### 5. Allow the GitHub repo to impersonate the deployer SA

```bash
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_SA" \
  --project="$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/${REPO}"
```

### 6. Print the WIF provider resource name (for GitHub config below)

```bash
echo "projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
```

Copy this value — it goes into the `WIF_PROVIDER` GitHub variable.

---

## One-time GitHub repo setup

Repo Settings → **Secrets and variables** → **Actions**.

### Variables (Variables tab — visible in logs, fine for non-sensitive)

| Name | Value |
|---|---|
| `GCP_PROJECT_ID` | `oak-report` |
| `GCP_REGION` | `us-central1` |
| `ARTIFACT_REPO` | `pokemon-images` |
| `BACKEND_SERVICE` | `pokemon-backend` |
| `WIF_PROVIDER` | `projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github-pool/providers/github-provider` (from step 6) |
| `DEPLOY_SA` | `github-deployer@oak-report.iam.gserviceaccount.com` |

### Secrets (Secrets tab — masked in logs)

| Name | Value |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | The Google OAuth Client ID used at build time |

> The client ID ends up in the public JS bundle, so it's not truly secret. It's stored as a GitHub secret only to keep it out of Action logs.

### OAuth origins

Console → APIs & Credentials → OAuth Client → **Authorized JavaScript origins**:
- `https://oak-report.web.app`
- `https://oak-report.firebaseapp.com`

(Plus any custom domain you map later.)

---

## First run

Path filters mean a docs-only merge won't trigger anything. Manually dispatch each workflow once: **Actions** tab → pick the workflow → "Run workflow" → branch `main`.

- Backend: succeeds when the Cloud Run revision URL prints in the deploy step.
- Frontend: succeeds when `firebase deploy` prints the Hosting URL (`https://oak-report.web.app`).

---

## Day-to-day

- **Normal change:** branch off `main`, open a PR, merge. CI auto-deploys.
- **Rotate `VITE_GOOGLE_CLIENT_ID`:** update the GitHub secret, re-run the frontend workflow.

### Rolling back

**Backend (Cloud Run):**
```bash
gcloud run revisions list --service=pokemon-backend --region=us-central1
gcloud run services update-traffic pokemon-backend \
  --to-revisions=pokemon-backend-00012-abc=100 \
  --region=us-central1
```

**Frontend (Firebase Hosting):**
```bash
# In the devcontainer
firebase hosting:releases:list
firebase hosting:rollback     # rolls back to the previous release
```
Or use the Firebase Console → Hosting → Release history → "Rollback" on any prior release. Both are instant — every release is immutable on Firebase's CDN.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Error: google-github-actions/auth failed with: the GitHub Actions OIDC token...` | `WIF_PROVIDER` typo or `attribute-condition` doesn't match this repo | Double-check the value from step 6 and that step 4's condition has `organized-nick/pokemon` |
| `Permission 'iam.serviceaccounts.getAccessToken' denied` | Step 5 (workloadIdentityUser binding) not run, or `principalSet` repo path is wrong | Re-run step 5 with the right `${REPO}` |
| Backend: `denied: Permission "artifactregistry.repositories.uploadArtifacts" denied` | Deployer SA missing `roles/artifactregistry.writer` | Re-run step 2 |
| Backend deploy: `Permission 'run.services.update' denied` | Deployer SA missing `roles/run.admin` | Re-run step 2 |
| Backend deploy: `iam.serviceaccounts.actAs` on the compute SA | Step 2's `roles/iam.serviceAccountUser` binding missing | Re-run that command |
| Frontend: `HTTP Error: 403, The caller does not have permission` from `firebase deploy` | Deployer SA missing `roles/firebasehosting.admin` | Re-run step 2 |
| Frontend deploys, but `/api/*` calls return 403 from the browser | Firebase Hosting SA missing `roles/run.invoker` on `pokemon-backend` | Re-run step 3 |
| Frontend deploys, but `/api/*` calls return 404 | Wrong `serviceId` or `region` in `firebase.json` rewrites | Confirm both match the actual Cloud Run service |
| Pipeline didn't trigger after a merge | None of the changed files matched the workflow's `paths:` filter | Either expand the filter or merge a change in a watched path |

---

## What is *not* automated

- **First-time deploy of the backend** still goes through [gcp-deployment.md](gcp-deployment.md) — CI only updates the image, it doesn't create the initial CloudSQL connection, env vars, secret bindings, or service.
- **Schema-altering migrations** still run on container startup ([backend.Dockerfile](../backend.Dockerfile) `CMD`). For long-running migrations, run them out-of-band before the deploy.
- **Tests / linting** — none configured in this repo today. The frontend's `npm run build` runs `tsc -b` (typecheck) before bundling, so type errors fail CI naturally; runtime regressions won't be caught until you hit the deployed service.
