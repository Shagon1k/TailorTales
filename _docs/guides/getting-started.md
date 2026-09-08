# Getting Started

> Clone → run the full stack locally → make your first change.
> Verified against the repo's current state (Node 24.15, pnpm 10.33, Docker 29).

## Prerequisites

| Tool    | Version          | Notes                                                  |
| ------- | ---------------- | ------------------------------------------------------ |
| Node.js | **24.15.0**      | Pinned in [`.nvmrc`](../../.nvmrc) — `nvm use`.        |
| pnpm    | **≥ 10** (10.33) | `corepack enable` or install standalone.               |
| Docker  | Any recent       | Runs either the complete stack or infrastructure only. |

The repo is a **pnpm-workspace monorepo** — install once at the root, and root scripts fan
out to `backend/` and `frontend/`.

## 1. Clone and install

```bash
git clone https://github.com/Shagon1k/TailorTales.git
cd TailorTales
pnpm install          # installs all workspaces + Husky commit hooks (via `prepare`)
```

## 2. Choose a workflow

### Complete containerized stack

Build and start PostgreSQL, Redis, MinIO, the release job, backend, and frontend:

```bash
docker compose --file compose.local.yaml up --build -d
docker compose --file compose.local.yaml ps -a
```

The one-shot `release` service waits for PostgreSQL, applies migrations, and seeds art styles,
pricing tiers, and story blueprints before the backend starts. The backend then creates the S3
bucket automatically. A successful release appears as `Exited (0)`; the five long-running
services should become `healthy`.

Compose supplies local-only placeholder values, enables the AI, email, and Paddle stubs, and
disables Sentry, New Relic, source-map upload, and analytics. No backend or frontend `.env` files
or real external-service credentials are needed. Google OAuth is intentionally disabled by the
default placeholder client values.

To enable real Google OAuth in the complete containerized stack, keep the real client values and
local JWT secret in the uncommitted `backend/.env`, then use it only for Compose interpolation:

```bash
docker compose --env-file backend/.env --file compose.local.yaml up --build -d
```

Never commit `backend/.env`. The Google OAuth authorized redirect URI must match the published
backend port: `http://localhost:3001/auth/google/callback` by default, or
`http://localhost:<BACKEND_HOST_PORT>/auth/google/callback` when `BACKEND_HOST_PORT` is
overridden.

Default URLs:

| Service        | URL                            |
| -------------- | ------------------------------ |
| Frontend       | `http://localhost:3000`        |
| Backend health | `http://localhost:3001/health` |
| MinIO API      | `http://localhost:9000`        |
| MinIO console  | `http://localhost:9001`        |

### Hot-reload development

Start only the infrastructure services in Compose:

```bash
docker compose --file compose.local.yaml up -d postgres redis minio
docker compose --file compose.local.yaml ps postgres redis minio
```

Then configure and run the backend and frontend on the host as described below. This workflow
keeps NestJS and Next.js hot reload active.

## 3. Configure hot-reload environment

```bash
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env
```

The frontend's `BACKEND_INTERNAL_URL` defaults to `http://localhost:3001`. Browser requests use
`/api`, which Next.js rewrites to that URL.

The example lists every variable, but deliberately leaves secrets and external-service values
empty. For a credential-free boot, use clearly local-only placeholders and enable all stubs:

```bash
# backend/.env
GOOGLE_CLIENT_ID=local-disabled
GOOGLE_CLIENT_SECRET=local-disabled
JWT_SECRET=tailortales-local-development-only-jwt-secret
OPENROUTER_API_KEY=local-disabled
RESEND_API_KEY=local-disabled
RESEND_FROM="TailorTales Local <noreply@tailortales.invalid>"
CONTACT_INBOX_EMAIL=local@tailortales.invalid
USE_AI_STUBS=true        # canned story plan + placeholder images, no OpenRouter calls
USE_EMAIL_STUBS=true     # logs emails instead of sending via Resend
USE_PADDLE_STUBS=true    # local billing responses, no Paddle API calls
```

The backend validates these values at startup through
[`env.validation.ts`](../../backend/src/config/env.validation.ts); the local JWT value above is
long enough for validation but must never be used outside local development.

What you need real values for, and when:

| You want to…                                         | Set                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Just boot + browse the UI / run the pipeline offline | Set all three `USE_*_STUBS` variables above to `true`                                       |
| Actually **sign in**                                 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a non-empty `JWT_SECRET`                    |
| Generate a **real** illustrated book                 | `OPENROUTER_API_KEY` (+ `USE_AI_STUBS=false`)                                               |
| Send real completion/contact **emails**              | `RESEND_API_KEY`, verified `RESEND_FROM`, `CONTACT_INBOX_EMAIL` (+ `USE_EMAIL_STUBS=false`) |

Full var reference: [`backend/.env.example`](../../backend/.env.example). Getting credentials
for Google OAuth, OpenRouter, and Resend: [external-services.md](external-services.md).

## 4. Prepare the hot-reload database

The complete containerized workflow performs these steps in `release`; run them manually only
for hot-reload development:

```bash
pnpm --filter ./backend db:migrate:deploy   # apply migrations (idempotent)
pnpm --filter ./backend db:generate         # generate the Prisma client

# Required — the pipeline cannot run without these
pnpm --filter ./backend seed:art-styles               # 8 art styles (Workshop grid)
pnpm --filter ./backend seed:pricing-tiers             # free + paid tier definitions
pnpm --filter ./backend seed:story-blueprints         # 1 BOOK + 1 COMIC blueprint

# Optional
pnpm --filter ./backend seed:admin you@example.com    # promote a user to ADMIN
```

> `seed:admin` **promotes an existing user** — sign in via Google once so the user row
> exists, then run it to set `role = ADMIN` ([`seed-admin.ts`](../../backend/src/scripts/seed-admin.ts)).
> `db:migrate` (no `:deploy`) is the interactive dev variant — use it when you change the schema.

## 5. Run with hot reload

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

## Health verification

For the complete stack, verify dependency state and both HTTP applications without starting any
extra processes:

```bash
docker compose --file compose.local.yaml ps -a
curl -fsS "http://localhost:${BACKEND_HOST_PORT:-3001}/health"
curl -fsS -o /dev/null "http://localhost:${FRONTEND_HOST_PORT:-3000}/en"
```

Expected: `release` is `Exited (0)`, the long-running services are `healthy`, the backend returns
`{"status":"ok"}`, and the frontend command exits successfully.

## Configurable ports

Every published port is bound to `127.0.0.1` and can be overridden for the complete stack:

| Variable                  | Default | Published service                         |
| ------------------------- | ------- | ----------------------------------------- |
| `POSTGRES_HOST_PORT`      | `5433`  | PostgreSQL                                |
| `REDIS_HOST_PORT`         | `6380`  | Redis                                     |
| `MINIO_API_HOST_PORT`     | `9000`  | MinIO API and browser-facing storage URLs |
| `MINIO_CONSOLE_HOST_PORT` | `9001`  | MinIO console                             |
| `BACKEND_HOST_PORT`       | `3001`  | Backend and its public URL                |
| `FRONTEND_HOST_PORT`      | `3000`  | Frontend and its canonical/public URL     |

For example:

```bash
BACKEND_HOST_PORT=3101 FRONTEND_HOST_PORT=3100 MINIO_API_HOST_PORT=9100 \
    docker compose --file compose.local.yaml up --build -d
```

Compose derives `BACKEND_URL`, `FRONTEND_URL`, `STORAGE_PUBLIC_ENDPOINT`,
`NEXT_PUBLIC_SITE_URL`, and `NEXT_PUBLIC_STORAGE_URL` from these values. In hot-reload mode,
infrastructure port overrides must also be reflected in `backend/.env` and `frontend/.env`.

Compose does not set fixed container, network, or volume names. Use a project name when isolated
preview stacks are useful:

```bash
docker compose --project-name tailortales-preview-1 --file compose.local.yaml up --build -d
```

Each project name gets its own default network and named-volume instances.
Use the same `--project-name` value for later `ps`, `logs`, and `down` commands.

## Stop or reset

```bash
docker compose --file compose.local.yaml down    # stop containers/network; preserve data
docker compose --file compose.local.yaml down -v # DESTRUCTIVE: also delete named volumes
```

Use `down -v` only when an intentional clean reset is worth losing all local data.

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
docker compose --file compose.local.yaml down # stop services (data persists in volumes)
```

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

| Symptom                                           | Fix                                                                                                                                       |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Backend exits at boot with a validation error     | A required env var is missing entirely — copy `.env.example` again.                                                                       |
| `Browser was not found` during generation/PDF     | Puppeteer's Chromium didn't install — re-run `pnpm install` (the build is allow-listed in root `package.json`).                           |
| `Cannot connect` to Postgres/Redis/MinIO          | Start the chosen workflow and check `docker compose --file compose.local.yaml ps -a` for dependency health.                               |
| Services stuck in a bad state after schema churn  | If data loss is acceptable, use the destructive `docker compose --file compose.local.yaml down -v`, then start the chosen workflow again. |
| Prisma client types missing after a schema change | `pnpm --filter ./backend db:generate`.                                                                                                    |
| Login redirect fails                              | Real `GOOGLE_CLIENT_*` + `JWT_SECRET` required (step 3).                                                                                  |
