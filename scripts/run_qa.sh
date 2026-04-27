#!/bin/bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$REPO_ROOT"

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
