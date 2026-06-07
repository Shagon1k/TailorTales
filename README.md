# TailorTales

Personalized, AI-generated PDF storybooks for curious kids. A parent answers their child's
question in the **Workshop**; TailorTales writes and illustrates a book or comic and returns
a downloadable PDF.

> **Status:** MVP in active development (book generation works end-to-end). See
> [ROADMAP.md](ROADMAP.md) for scope and phase progress.

## Quick start

```bash
pnpm install
docker compose up -d                          # Postgres + Redis + MinIO
cp backend/.env.example backend/.env          # set USE_AI_STUBS=true for offline dev
cp frontend/.env.example frontend/.env
pnpm --filter ./backend db:migrate:deploy
pnpm --filter ./backend db:generate
pnpm --filter ./backend seed:art-styles       # required — Workshop grid
pnpm --filter ./backend seed:story-blueprints # required — pipeline needs these
pnpm dev                                       # backend :3001, frontend :3000
```

Full setup (env vars, seeds, Google OAuth, troubleshooting):
**[\_docs/guides/getting-started.md](_docs/guides/getting-started.md)**.

## Documentation

| If you want to…             | Go to                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------- |
| Run it locally / contribute | [\_docs/guides/getting-started.md](_docs/guides/getting-started.md)                     |
| Understand the architecture | [\_docs/architecture/](_docs/architecture/README.md)                                    |
| See how generation works    | [\_docs/architecture/generation-pipeline.md](_docs/architecture/generation-pipeline.md) |
| Use the HTTP API            | [\_docs/api/](_docs/api/README.md)                                                      |
| Read the full doc index     | [\_docs/README.md](_docs/README.md)                                                     |
| See the plan & decisions    | [ROADMAP.md](ROADMAP.md) · [DESIGN.md](DESIGN.md)                                       |

## Repository

```
backend/    NestJS REST API + BullMQ generation worker
frontend/   Next.js (App Router) + Mantine
_docs/      Architecture, API, guides, decisions
```

Monorepo via pnpm workspaces. Contribution workflow: [CONTRIBUTING.md](CONTRIBUTING.md).

**Docs split:** `_docs/` is **human** documentation (read it). Coding conventions for AI
agents live in `CLAUDE.md` (root + per-package/module) and `.claude/rules/`.
