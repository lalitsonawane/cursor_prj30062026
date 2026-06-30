# cursor_prj30062026

Greenfield project repository. Application code and tooling are not configured yet.

## Status

This repo is in early setup. It includes agent guidance for coding assistants; application structure, dependencies, and commands will be added as the project evolves.

## Repository contents

| Path | Purpose |
|------|---------|
| [`AGENTS.md`](AGENTS.md) | Instructions for coding agents (Cursor, Codex, Claude Code, etc.) |
| [`.cursor/environment.json`](.cursor/environment.json) | Cursor Cloud environment configuration |
| [`.cursor/cloud-install.sh`](.cursor/cloud-install.sh) | Idempotent dependency install for cloud agents |
| `README.md` | Human-facing project overview (this file) |

## Cursor Cloud (mobile and web)

This repo is configured for [Cursor Cloud Agents](https://cursor.com/docs/cloud-agent). Use it from your phone or browser at [cursor.com/agents](https://cursor.com/agents).

1. Connect GitHub in [Cursor Dashboard → Cloud Agents](https://cursor.com/dashboard/cloud-agents) and grant access to this repository.
2. Open [cursor.com/agents](https://cursor.com/agents), select `lalitsonawane/cursor_prj30062026`, and start an agent.
3. Optional: add the site to your home screen for a native-like mobile experience.

Cloud agents run `.cursor/cloud-install.sh` on startup. It is a no-op until tooling manifests are added. See [`AGENTS.md`](AGENTS.md) for full cloud setup details.

## Getting started

No install or run steps yet. Once tooling is added, update this section with:

- Prerequisites
- Install command
- Dev server / local run command
- Test and lint commands

## For coding agents

See [`AGENTS.md`](AGENTS.md) for discovery workflow, conventions, verification checklist, and boundaries. Do not assume a tech stack until manifests exist in the repo.

## License

Not specified yet.
