# Deployment

> How TailorTales is built and deployed to production. The deployment platform is
> **[Dokploy](https://dokploy.com)** (a self-hosted PaaS). Each app has its own Dockerfile
> in the repo root — `backend/Dockerfile` and `frontend/Dockerfile`.

## Docker images

Both images use a **3-stage build** (`deps` → `build` → `run`) on `node:24-alpine`:

### Backend (`backend/Dockerfile`)

| Stage   | What it does                                                                                        |
| ------- | --------------------------------------------------------------------------------------------------- |
| `deps`  | Installs production-only dependencies (`pnpm install --prod`).                                      |
| `build` | Installs all deps, compiles TypeScript (`pnpm build`), generates the Prisma client.                 |
| `run`   | Copies prod deps + compiled output; exposes port **3001**; starts with `node backend/dist/main.js`. |

The Prisma client is generated **at build time** (`pnpm --filter backend db:generate`), so no
database connection is required during the Docker build — only `DATABASE_URL` at runtime.

### Frontend (`frontend/Dockerfile`)

| Stage   | What it does                                                                                           |
| ------- | ------------------------------------------------------------------------------------------------------ |
| `deps`  | Installs production-only dependencies.                                                                 |
| `build` | Installs all deps, runs `next build` with `NEXT_TELEMETRY_DISABLED=1`.                                 |
| `run`   | Copies prod deps + `.next/` build output + `public/`; exposes port **3000**; starts with `next start`. |

> `NEXT_TELEMETRY_DISABLED=1` is set in the Dockerfile to suppress Next.js telemetry in CI and production builds.

## Environment variables

All backend env vars must be injected at container start — there is no bundled `.env` file.
Full reference: **[environment-variables.md](environment-variables.md)**.

Critical production differences from dev:

| Variable                   | Prod value                                     |
| -------------------------- | ---------------------------------------------- |
| `NODE_ENV`                 | `production`                                   |
| `STORAGE_ENDPOINT`         | **Unset** (use AWS S3, not MinIO)              |
| `STORAGE_FORCE_PATH_STYLE` | **Unset** (defaults false)                     |
| `USE_AI_STUBS`             | `false`                                        |
| `USE_EMAIL_STUBS`          | `false`                                        |
| `JWT_SECRET`               | A long, random secret — never reuse dev values |
| `BACKEND_URL`              | Your production backend domain                 |
| `FRONTEND_URL`             | Your production frontend domain                |

## Database migrations

Migrations must be applied **before** deploying a new backend version. The command:

```bash
pnpm --filter backend db:migrate:deploy
```

This runs `prisma migrate deploy` — it applies only pending migrations (idempotent; safe to
re-run). It requires a live `DATABASE_URL`.

**Recommended deployment order:**

1. Apply migrations against the production database.
2. Deploy the new backend image.
3. Deploy the new frontend image.

> There is no automated migration step in the Docker image itself — migrations are a pre-deploy
> operation, not a startup side-effect.

## CI pipeline

`.github/workflows/ci.yml` runs on every push and PR to `main`:

| Step                   | Command           | Notes                                                            |
| ---------------------- | ----------------- | ---------------------------------------------------------------- |
| Install                | `pnpm install`    | Frozen lockfile; uses `.nvmrc` for Node version.                 |
| Generate Prisma client | `db:generate`     | Uses a dummy `DATABASE_URL` — no live DB needed.                 |
| Lint + format check    | `pnpm check`      | ESLint + Prettier.                                               |
| Type-check             | `pnpm type-check` | `tsc --noEmit` in both packages.                                 |
| Test                   | `pnpm test`       | Vitest (backend + frontend). Must pass with `USE_AI_STUBS=true`. |

The CI workflow does **not** build Docker images or push to a registry — that step is handled
by Dokploy, which is configured to build and deploy on a new commit to `main`.
