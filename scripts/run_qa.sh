#!/bin/bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$REPO_ROOT"

cleanup_qa_artifacts() {
  rm -f .coverage
  rm -rf frontend/coverage
}

trap cleanup_qa_artifacts EXIT

cleanup_qa_artifacts

docker compose up -d postgres >/dev/null

POSTGRES_CONTAINER_ID="$(docker compose ps -q postgres)"
if [[ -n "${POSTGRES_CONTAINER_ID}" ]]; then
  for _ in {1..30}; do
    POSTGRES_HEALTH="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${POSTGRES_CONTAINER_ID}")"
    if [[ "${POSTGRES_HEALTH}" == "healthy" || "${POSTGRES_HEALTH}" == "running" ]]; then
      break
    fi
    sleep 1
  done
fi

uv run pytest backend/tests --cov=backend --cov-report=term-missing
VITE_API_BASE_URL= npm --prefix frontend run test:coverage
