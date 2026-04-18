#!/usr/bin/env bash
set -euo pipefail

uv run python -m backend.scripts.create_database
