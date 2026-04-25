# CI/CD: GitHub Actions → Cloud Run

This doc walks through the **one-time** setup required to enable automatic deploys, then describes how the pipeline behaves day-to-day.

Companion to [gcp-deployment.md](gcp-deployment.md), which covers the manual first-time deploy.

---

## What it does

On every push to `main`:

- Changes under `backend/`, `alembic/`, `pyproject.toml`, `uv.lock`, `data/`, or `backend.Dockerfile` → `deploy-backend.yml` runs.
- Changes under `frontend/` or `frontend.prod.Dockerfile` → `deploy-frontend.yml` runs.
- A change touching both runs both workflows in parallel.
- A change touching neither (e.g. only docs) runs nothing.

Each workflow: builds the image, pushes it to Artifact Registry tagged with the commit SHA, then `gcloud run deploy <service> --image=<sha>`. **No other deploy flags are passed**, so existing Cloud Run config (CloudSQL connection, env vars, Secret Manager bindings, service account) is preserved from the initial manual deploy.

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
   docker build --platform linux/amd64
          │                          │
          ▼                          ▼
   docker push us-central1-docker.pkg.dev/oak-report/pokemon-images/{backend|frontend}
          │                          │
          ▼                          ▼
   gcloud run deploy --image=<sha>
```

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

# Push images to Artifact Registry
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_SA}" \
  --role="roles/artifactregistry.writer"

# Act as the runtime SA (required to deploy a service that runs *as* the compute SA)
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --member="serviceAccount:${DEPLOYER_SA}" \
  --role="roles/iam.serviceAccountUser"
```

### 3. Create the Workload Identity Pool + GitHub OIDC provider

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

### 4. Allow the GitHub repo to impersonate the deployer SA

```bash
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_SA" \
  --project="$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/${REPO}"
```

### 5. Get the WIF provider resource name (for GitHub config below)

```bash
echo "projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
```

Copy this value — it goes into the `WIF_PROVIDER` GitHub variable in the next section.

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
| `FRONTEND_SERVICE` | `pokemon-frontend` |
| `WIF_PROVIDER` | `projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github-pool/providers/github-provider` (from step 5 above) |
| `DEPLOY_SA` | `github-deployer@oak-report.iam.gserviceaccount.com` |
| `VITE_API_BASE_URL` | The deployed backend URL, e.g. `https://pokemon-backend-XXXXX-uc.a.run.app` (no trailing slash) |

### Secrets (Secrets tab — masked in logs)

| Name | Value |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | The Google OAuth Client ID used at build time |

> Both values end up in the public JS bundle, so neither is truly secret. `VITE_GOOGLE_CLIENT_ID` is stored as a GitHub secret only to keep it out of Action logs.

---

## First run

Path filters mean a docs-only merge won't trigger anything. Manually dispatch each workflow once: **Actions** tab → pick the workflow → "Run workflow" → branch `main`. The "Deploy to Cloud Run" step prints the new revision URL on success.

---

## Day-to-day

- **Normal change:** branch off `main`, open a PR, merge. CI auto-deploys.
- **Frontend change that needs a different backend URL:** update the `VITE_API_BASE_URL` GitHub variable, then re-run the frontend workflow manually.
- **Rotate `VITE_GOOGLE_CLIENT_ID`:** update the secret, re-run the frontend workflow.

### Rolling back

Same flow as the manual deploy doc — list revisions and shift traffic:

```bash
gcloud run revisions list --service=pokemon-backend --region=us-central1
gcloud run services update-traffic pokemon-backend \
  --to-revisions=pokemon-backend-00012-abc=100 \
  --region=us-central1
```

This is instant (no rebuild) because every CI deploy creates a new immutable revision tagged with the commit SHA.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Error: google-github-actions/auth failed with: the GitHub Actions OIDC token...` | `WIF_PROVIDER` typo or `attribute-condition` doesn't match this repo | Double-check the value from step 5 and that step 3's condition has `organized-nick/pokemon` |
| `Permission 'iam.serviceaccounts.getAccessToken' denied` | Step 4 (workloadIdentityUser binding) not run, or `principalSet` repo path is wrong | Re-run step 4 with the right `${REPO}` |
| `denied: Permission "artifactregistry.repositories.uploadArtifacts" denied` | Deployer SA missing `roles/artifactregistry.writer` | Re-run step 2 |
| Deploy step fails with `Permission 'run.services.update' denied` | Deployer SA missing `roles/run.admin` | Re-run step 2 |
| Deploy step fails with `iam.serviceaccounts.actAs` on the compute SA | Step 2's `roles/iam.serviceAccountUser` binding missing | Re-run that command |
| `exec format error` on container start | (Shouldn't happen — runner is x86) but if you ever drop the `--platform linux/amd64` flag, multi-arch builds may surface this | Restore `--platform linux/amd64` in the workflow |
| Pipeline didn't trigger after a merge | None of the changed files matched the workflow's `paths:` filter | Either expand the filter or merge a change in a watched path |

---

## What is *not* automated

- **First-time deploy of a service** still goes through [gcp-deployment.md](gcp-deployment.md) — CI only updates the image, it doesn't create the initial CloudSQL connection, env vars, secret bindings, or service.
- **Schema-altering migrations** still run on container startup ([backend.Dockerfile](../backend.Dockerfile) `CMD`). For long-running migrations, run them out-of-band before the deploy.
- **Tests / linting** — none configured in this repo today. Frontend's `npm run build` runs `tsc -b` inside the Docker build, so type errors will fail CI naturally; pure runtime regressions won't be caught until you hit the deployed service.
