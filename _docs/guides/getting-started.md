# Getting Started

> Clone → run the full stack locally → make your first change.
> Verified against the repo's current state (Node 24.15, pnpm 10.33, Docker 29).

## Prerequisites

| Tool    | Version          | Notes                                           |
| ------- | ---------------- | ----------------------------------------------- |
| Node.js | **24.15.0**      | Pinned in [`.nvmrc`](../../.nvmrc) — `nvm use`. |
| pnpm    | **≥ 10** (10.33) | `corepack enable` or install standalone.        |
| Docker  | Any recent       | For Postgres, Redis, MinIO via Compose.         |

The repo is a **pnpm-workspace monorepo** — install once at the root, and root scripts fan
out to `backend/` and `frontend/`.

## 1. Clone and install

```bash
git clone https://github.com/Shagon1k/TailorTales.git
cd TailorTales
pnpm install          # installs all workspaces + Husky commit hooks (via `prepare`)
```

## 2. Start local services

Postgres, Redis, and MinIO run in Docker:

```bash
docker compose up -d
docker compose ps     # all three should be "healthy"
```

| Service  | Port(s)                        | Credentials (dev)           |
| -------- | ------------------------------ | --------------------------- |
| Postgres | `5433` host → `5432` container | `postgres` / `postgres`     |
| Redis    | `6380` host → `6379` container | —                           |
| MinIO    | `9000` (API), `9001` (console) | `minioadmin` / `minioadmin` |

> The S3 bucket is **created automatically** on backend startup
> (`StorageService.onModuleInit`) — no manual MinIO setup needed.

## 3. Configure environment

```bash
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env
```

The frontend's `BACKEND_INTERNAL_URL` defaults to `http://localhost:3001` in `.env.example`.
Browser requests use `/api`, which Next.js rewrites to that internal URL — no changes are needed
for local dev.

**To boot, every backend var must be _present_** (env is validated at startup by
[`env.validation.ts`](../../backend/src/config/env.validation.ts)). The example file already
satisfies this — most third-party keys are present-but-empty, which is enough to start. To
run **offline with zero AI/email spend**, set:

```bash
# backend/.env
USE_AI_STUBS=true        # canned story plan + placeholder images, no OpenRouter calls
USE_EMAIL_STUBS=true     # logs emails instead of sending via Resend
```

What you need real values for, and when:

| You want to…                                         | Set                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Just boot + browse the UI / run the pipeline offline | `USE_AI_STUBS=true`, `USE_EMAIL_STUBS=true` (defaults in `.env.example` otherwise fine)     |
| Actually **sign in**                                 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a non-empty `JWT_SECRET`                    |
| Generate a **real** illustrated book                 | `OPENROUTER_API_KEY` (+ `USE_AI_STUBS=false`)                                               |
| Send real completion/contact **emails**              | `RESEND_API_KEY`, verified `RESEND_FROM`, `CONTACT_INBOX_EMAIL` (+ `USE_EMAIL_STUBS=false`) |

Full var reference: [`backend/.env.example`](../../backend/.env.example). Getting credentials
for Google OAuth, OpenRouter, and Resend: [external-services.md](external-services.md).

## 4. Database: migrate, generate, seed

```bash
pnpm --filter ./backend db:migrate:deploy   # apply migrations (idempotent)
pnpm --filter ./backend db:generate         # generate the Prisma client

# Required — the pipeline cannot run without these
pnpm --filter ./backend seed:art-styles               # 8 art styles (Workshop grid)
pnpm --filter ./backend seed:story-blueprints         # 1 BOOK + 1 COMIC blueprint

# Optional
pnpm --filter ./backend seed:admin you@example.com    # promote a user to ADMIN
```

> `seed:admin` **promotes an existing user** — sign in via Google once so the user row
> exists, then run it to set `role = ADMIN` ([`seed-admin.ts`](../../backend/src/scripts/seed-admin.ts)).
> `db:migrate` (no `:deploy`) is the interactive dev variant — use it when you change the schema.

## 5. Run

```bash
pnpm dev      # backend on :3001, frontend on :3000 (parallel)
```

Verify:

```bash
curl http://localhost:3001/health      # → {"status":"ok"}
open  http://localhost:3000            # landing page
```

For a full offline generation run, ensure `USE_AI_STUBS=true`, sign in, add a child, and
submit the Workshop form — the pipeline completes in seconds with placeholder art.

## Everyday commands

All run from the repo root unless noted:

```bash
pnpm dev            # run both apps
pnpm build          # build both
pnpm test           # all tests (backend Vitest + frontend RTL)
pnpm type-check     # tsc --noEmit in both
pnpm lint           # eslint both
pnpm check          # lint + prettier format check
pnpm format         # prettier --write .

pnpm --filter ./backend db:studio    # Prisma Studio (browse the DB)
docker compose down                  # stop services (data persists in volumes)
```

Postgres and Redis use non-default host ports by default to avoid colliding with other local
apps:

| Service  | Override                                         | Backend env to match |
| -------- | ------------------------------------------------ | -------------------- |
| Postgres | `POSTGRES_HOST_PORT=<port> docker compose up -d` | `DATABASE_URL`       |
| Redis    | `REDIS_HOST_PORT=<port> docker compose up -d`    | `REDIS_URL`          |

## First contribution checklist

1. **Branch** off `main`: `TT-<type>-<short-descriptor>` (e.g. `TT-feat-rating-panel`).
2. **Follow the project conventions.** Start with `AGENTS.md`, then read the relevant file in
   `.agent-docs/rules/` (TypeScript, testing, CSS, Prisma, git). Harness-specific adapters such
   as `.claude/rules/` may load the same source rules automatically.
3. **Understand the area** — start at [architecture/](../architecture/README.md), then the
   relevant module.
4. **Write tests** next to the code (`__tests__/`, Given-When-Then naming).
5. **Green before commit**: `pnpm type-check && pnpm lint && pnpm test`.
   Tests must pass with `USE_AI_STUBS=true` and `USE_EMAIL_STUBS=true` (no external calls in CI).
6. **Commit** with Conventional Commits (`commitlint` enforces it — never `--no-verify`).
7. **Open a PR** with a Conventional Commits title; squash-merge to `main`.

## Troubleshooting

| Symptom                                           | Fix                                                                                                             |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Backend exits at boot with a validation error     | A required env var is missing entirely — copy `.env.example` again.                                             |
| `Browser was not found` during generation/PDF     | Puppeteer's Chromium didn't install — re-run `pnpm install` (the build is allow-listed in root `package.json`). |
| `Cannot connect` to Postgres/Redis/MinIO          | `docker compose up -d`; check `docker compose ps` is healthy.                                                   |
| Services stuck in a bad state after schema churn  | `docker compose down -v && docker compose up -d` — removes volumes and starts fresh (destroys local data).      |
| Prisma client types missing after a schema change | `pnpm --filter ./backend db:generate`.                                                                          |
| Login redirect fails                              | Real `GOOGLE_CLIENT_*` + `JWT_SECRET` required (step 3).                                                        |
