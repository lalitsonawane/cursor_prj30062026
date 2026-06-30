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

<!-- Fill in once tooling exists -->

- Install: `TODO`
- Dev: `TODO`
- Test: `TODO`
- Lint: `TODO`
- Build: `TODO`

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

## Maintenance

As the project gains a stack:

1. Replace `TODO` entries in the Commands section with real commands.
2. Add stack-specific sections (API patterns, database migrations, deploy target).
3. For monorepos, add nested `AGENTS.md` files in subpackages; the nearest file takes precedence.
