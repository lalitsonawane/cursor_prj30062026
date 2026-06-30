#!/usr/bin/env bash
set -euo pipefail

# Idempotent dependency install for cloud agents.
if [[ -f backend/requirements-dev.txt ]]; then
  pip install -r backend/requirements-dev.txt || pip install -r backend/requirements.txt
fi

if [[ -f mobile/package.json ]]; then
  if command -v pnpm >/dev/null 2>&1 && [[ -f mobile/pnpm-lock.yaml ]]; then
    (cd mobile && pnpm install)
  elif command -v npm >/dev/null 2>&1; then
    (cd mobile && npm install)
  fi
fi
