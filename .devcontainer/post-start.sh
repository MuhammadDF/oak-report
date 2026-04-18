#!/usr/bin/env bash
set -euo pipefail

# Ensure postgres service is running.
docker compose up -d postgres

# Find the compose network used by the postgres service.
postgres_cid="$(docker compose ps -q postgres)"
postgres_net="$(docker inspect "$postgres_cid" --format '{{range $k, $v := .NetworkSettings.Networks}}{{println $k}}{{end}}' | head -n1)"

# Attach this devcontainer to that network so "postgres" DNS resolves.
docker network connect "$postgres_net" "$HOSTNAME" >/dev/null 2>&1 || true

postgres_user="${POSTGRES_USER:-postgres}"
postgres_db="${POSTGRES_DB:-pokemon}"

# Wait for postgres readiness.
until docker compose exec -T postgres pg_isready -U "$postgres_user" -d "$postgres_db" >/dev/null 2>&1; do
  sleep 1
done
