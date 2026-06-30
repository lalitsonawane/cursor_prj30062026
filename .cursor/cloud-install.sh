#!/usr/bin/env bash
set -euo pipefail

# Idempotent dependency install for cloud agents. No-op until tooling exists.
if [[ -f package.json ]]; then
  if command -v pnpm >/dev/null 2>&1 && [[ -f pnpm-lock.yaml ]]; then
    pnpm install
  elif command -v npm >/dev/null 2>&1; then
    npm install
  fi
elif [[ -f pyproject.toml ]]; then
  pip install -e .
elif [[ -f requirements.txt ]]; then
  pip install -r requirements.txt
elif [[ -f Cargo.toml ]]; then
  cargo fetch
elif [[ -f go.mod ]]; then
  go mod download
fi
