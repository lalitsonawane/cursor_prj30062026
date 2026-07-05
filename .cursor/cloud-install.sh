#!/usr/bin/env bash
set -euo pipefail

# Idempotent dependency install for cloud agents.
#
# The backend runs in MOCK inference mode for CPU/dev (MOCK_INFERENCE=true), so
# only the lightweight FastAPI runtime + test deps are installed here. The heavy
# GPU inference deps in backend/requirements.txt (torch, transformers, etc.) are
# NOT installed automatically — install them manually on a CUDA machine when
# running real LocateAnything-3B inference.

# Backend: FastAPI service in a virtualenv.
if [[ -f backend/requirements.txt ]]; then
  if [[ ! -d backend/.venv ]]; then
    python3 -m venv backend/.venv
  fi
  backend/.venv/bin/pip install --upgrade pip
  backend/.venv/bin/pip install \
    fastapi "uvicorn[standard]" python-multipart pydantic pydantic-settings \
    Pillow numpy httpx pytest pytest-asyncio
fi

# Mobile (Expo) deps.
if [[ -f mobile/package.json ]]; then
  if command -v pnpm >/dev/null 2>&1 && [[ -f mobile/pnpm-lock.yaml ]]; then
    (cd mobile && pnpm install)
  elif command -v npm >/dev/null 2>&1; then
    (cd mobile && npm install)
  fi
fi

# Profile (Next.js) deps.
if [[ -f profile/package.json ]]; then
  if command -v pnpm >/dev/null 2>&1 && [[ -f profile/pnpm-lock.yaml ]]; then
    (cd profile && pnpm install)
  elif command -v npm >/dev/null 2>&1; then
    (cd profile && npm install)
  fi
fi
