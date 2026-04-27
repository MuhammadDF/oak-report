# Scripts Agent Guide

Use this guide when changing `scripts`.

## Current Scripts

- `create_database.sh`: runs `python -m backend.scripts.create_database` through `uv`.
- `reset_database.sh`: runs `python -m backend.scripts.reset_database` through `uv`.
- `run_qa.sh`: starts Postgres, waits for health, runs backend coverage, then frontend coverage.

## Standards

- Use `#!/usr/bin/env bash` and `set -euo pipefail`.
- Resolve repo-relative paths instead of assuming the caller's current directory.
- Keep scripts idempotent where practical.
- Keep destructive behavior explicit in naming and documentation.
- Update docs when commands, side effects, or environment requirements change.

## Constraints

- Do not hide database drops or resets behind vague script names.
- Do not require secrets beyond the documented `.env.example` variables.
- Keep QA behavior aligned with `docs/testing.md` and `README.md`.
