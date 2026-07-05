# AGENTS.md

Instructions for coding agents working in this repository.

## Project overview

This is a greenfield repository with no application code or tooling configured yet. The primary goal is to bootstrap and evolve the project following instructions in this file and in the user's chat. Do not assume a tech stack until evidence exists in the repo.

## Setup and discovery

Inspect before assuming:

1. List root files and check for manifests (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Dockerfile`, etc.) before choosing a stack.
2. Read `README.md` if present. Do not duplicate README content here.
3. Ask the user before introducing a major framework if none is present.

## Commands

- Backend install: `cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements-dev.txt`
- Backend dev: `cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- Backend test: `cd backend && source .venv/bin/activate && PYTHONPATH=. pytest tests/ -q`
- Mobile install: `cd mobile && npm install`
- Mobile dev: `cd mobile && npx expo start`
- Mobile test: `cd mobile && npm test`
- Mobile typecheck: `cd mobile && npm run typecheck`
- Profile install: `cd profile && npm install`
- Profile dev: `cd profile && npm run dev`
- Profile build: `cd profile && npm run build`
- Profile lint: `cd profile && npm run lint`

## Agent workflow

On every task:

1. Explore the repo structure first (read-only discovery).
2. Match existing conventions. If none exist, prefer simple defaults and document choices sparingly.
3. Keep diffs minimal and scoped to the request.
4. Run verification commands when they exist. If none exist yet, state what was checked manually.
5. Do not commit unless the user explicitly asks.

## Code conventions

Until project-specific rules exist, follow these defaults:

- Prefer clear names over abbreviations.
- Add tests when a test runner is configured. Skip boilerplate tests for trivial changes.
- Never commit secrets (`.env`, keys, tokens, credentials).
- Include `createdAt` and `updatedAt` (or equivalent) on persisted models when adding a database layer.
- If Prisma is introduced: define both sides of relations, use `@id @default(autoincrement())` or `@default(cuid())`, add `@@index` on frequently queried fields.

## Verification

A task is done when:

- [ ] Changes match the requested scope
- [ ] No secrets are committed
- [ ] Lint, test, and build commands run successfully if configured
- [ ] New dependencies are justified and recorded in the appropriate manifest

## Boundaries

### Do

- Use absolute paths in tool commands when possible.
- Prefer editing existing files over creating parallel abstractions.
- Update this `AGENTS.md` when recurring agent mistakes reveal missing guidance.

### Don't

- Assume Next.js, React, Python, or other stacks without evidence in the repo.
- Add large frameworks or infrastructure without user direction on a greenfield project.
- Create commits, pull requests, or deploys unless asked.

## Cursor Cloud specific instructions

This repository is configured for [Cursor Cloud Agents](https://cursor.com/docs/cloud-agent) so it can be used from mobile and the web at [cursor.com/agents](https://cursor.com/agents).

### Environment

- Cloud config lives in `.cursor/environment.json`, whose `install` runs `.cursor/cloud-install.sh` (the source of truth for dependency setup). Edit that script when changing how deps are installed.
- `.cursor/cloud-install.sh` creates the backend virtualenv at `backend/.venv`, installs the lightweight FastAPI + test deps (not the heavy GPU deps), and runs `npm install` for `mobile/` and `profile/`. It is idempotent.
- System requirement: creating the backend venv needs the `python3.12-venv` apt package (already present in the base image/snapshot).

### Running the services

- **Backend** (`backend/`, FastAPI): runs in MOCK inference mode on CPU — `MOCK_INFERENCE=true` in `backend/.env` (copy from `.env.example` on first run). Heavy GPU deps in `backend/requirements.txt` (torch, transformers, etc.) are intentionally NOT installed in the cloud VM; real LocateAnything-3B inference needs a CUDA GPU + gated model download. Run with `source backend/.venv/bin/activate` then `PYTHONPATH=. uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` (run from `backend/`). Protected endpoints require the `X-API-Key` header (default `dev-key-change-me` from `.env`); `/health` is open. Tests: `cd backend && source .venv/bin/activate && PYTHONPATH=. pytest tests/ -q`.
- **Profile** (`profile/`, Next.js 16): `npm run dev` serves on port 3000. `npm run lint` and `npm run build` (Turbopack) both work in the VM.
- **Mobile** (`mobile/`, Expo): the app CANNOT be launched in the cloud VM — it targets iOS/Android dev clients and depends on `react-native-vision-camera` native modules (Expo web is not supported). Only `npm test` (jest) and `npm run typecheck` (tsc) are runnable here.

### Mobile access

1. Connect GitHub in [Cursor Dashboard → Cloud Agents](https://cursor.com/dashboard/cloud-agents) and grant access to `lalitsonawane/cursor_prj30062026`.
2. Open [cursor.com/agents](https://cursor.com/agents) on your phone.
3. Select this repository and branch, then start an agent.
4. Optional: add the site to your home screen (Safari → Share → Add to Home Screen on iOS; Chrome → Install App on Android).

### Secrets

Add API keys and credentials in the Cloud Agents Secrets tab on the dashboard. Do not commit secrets to the repository.

## Maintenance

As the project gains a stack:

1. Replace `TODO` entries in the Commands section with real commands.
2. Add stack-specific sections (API patterns, database migrations, deploy target).
3. For monorepos, add nested `AGENTS.md` files in subpackages; the nearest file takes precedence.
