#!/usr/bin/env bash
set -euo pipefail

uv run python -m backend.scripts.reset_database
