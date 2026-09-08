# Deployment

> TailorTales deploys through **[Dokploy](https://dokploy.com)** as one Compose resource per
> environment. UAT and production use the same
> [`compose.deploy.yaml`](../../compose.deploy.yaml); only their Dokploy environment
> values and Git triggers differ.

## Compose topology

The root [`compose.local.yaml`](../../compose.local.yaml) defines the complete local stack,
including Postgres, Redis, and MinIO. Dokploy uses only `compose.deploy.yaml`.

```mermaid
flowchart LR
  T["Git trigger"] --> R["release<br/>migrate + idempotent seeds"]
  R -->|"exit 0"| B["backend"]
  B -->|"healthy /health"| F["frontend"]
  U["Browser /api/*"] --> F
  F -->|"rewrite"| B
  R -->|"non-zero exit"| X["deployment stops"]
```

`release` is a one-shot service built from `backend/Dockerfile.release`. On every deployment it
runs, in order:

```bash
pnpm --filter backend db:migrate:deploy
pnpm --filter backend seed:art-styles
pnpm --filter backend seed:pricing-tiers
pnpm --filter backend seed:story-blueprints
```

The shell exits on the first failure. Compose starts `backend` only after `release` succeeds,
then starts `frontend` only after the backend health check passes. This is automatic: nobody
manually runs migrations or presses a second deploy button.

The backend enables Nest shutdown hooks. On Docker `SIGTERM`, `@nestjs/bullmq` stops accepting
new generation jobs and waits for the active job before the application closes. Compose gives
that drain up to `stop_grace_period: 15m`; after the grace period Docker may force the process
down with `SIGKILL`.

The blueprint seed creates or reuses a non-login `TailorTales System` user solely as the
required audit owner for built-in blueprints. Therefore a clean environment receives the Book
and Comic blueprints on its first deployment; it does not need an OAuth user or an administrator
before story generation works.

UAT and production keep their Dokploy-managed PostgreSQL and Redis services; UAT also has a
persistent MinIO resource. Each Compose resource creates its own private application network for
the `backend` and `frontend`; the backend has an environment-specific alias there
(`backend-uat` or `backend-prod`). All services additionally join the external
`dokploy-network` where required to reach Dokploy-managed PostgreSQL/Redis, and the frontend
joins it so Dokploy/Traefik can route application domains to port `3000`. No application port is
published directly on the VPS. The frontend uses the unique private alias, never the shared
generic `backend` DNS name, so UAT and production cannot resolve each other's backend.

> A migration and application rollout cannot be globally atomic. Every schema migration shipped
> through this flow must therefore be backward-compatible with the currently running backend
> (expand first, deploy code, contract in a later release).

## Images

### Backend (`backend/Dockerfile`)

| Stage   | What it does                                                                                           |
| ------- | ------------------------------------------------------------------------------------------------------ |
| `deps`  | Installs production-only dependencies; skips Puppeteer's bundled-browser download.                     |
| `build` | Installs all dependencies, generates the Prisma client, then compiles it with the backend.             |
| `run`   | Copies runtime files and `newrelic.cjs`, installs Alpine Chromium for PDF rendering, and exposes 3001. |

The Prisma client is generated at build time with a non-secret dummy URL because Prisma 7
requires the variable while loading its config; no database connection is opened.
The real `DATABASE_URL` is required only by `release` and the running backend.

### Release (`backend/Dockerfile.release`)

Installs the backend tooling and source needed by Prisma migrations and idempotent seed scripts.
It is separate from the lean backend runtime image and never serves traffic.

### Frontend (`frontend/Dockerfile`)

Next.js `NEXT_PUBLIC_*` values are compiled into browser bundles during `next build`. The
Dockerfile therefore declares them as build arguments, while Compose also supplies them at
runtime for server-rendered code. Changing a public value requires a new image build.

`SENTRY_AUTH_TOKEN` is a build-only secret used to upload source maps. Compose exposes it to the
single `next build` instruction as a BuildKit secret; it is absent from image layers and the
frontend runtime environment. Compose also fixes `SENTRY_SOURCE_MAP_UPLOAD_REQUIRED=true`, so a
Dokploy build without the token fails instead of silently shipping minified stack traces. Direct
local image builds leave that build arg at its `false` default and may skip the upload.

## Environment contract

Paste a complete copy of [`deploy/.env.example`](../../deploy/.env.example) into each Dokploy
Compose environment and replace every `CHANGE_ME` value. Do not commit real values.

The Compose file deliberately reduces duplicate inputs:

| Dokploy input        | Backend use                           | Frontend use                     |
| -------------------- | ------------------------------------- | -------------------------------- |
| `BACKEND_URL`        | Public same-origin API base (`…/api`) | —                                |
| `FRONTEND_URL`       | CORS/frontend origin                  | `NEXT_PUBLIC_SITE_URL`           |
| `PADDLE_ENVIRONMENT` | Paddle server SDK                     | `NEXT_PUBLIC_PADDLE_ENV`         |
| `SENTRY_ENVIRONMENT` | Backend event tag                     | `NEXT_PUBLIC_SENTRY_ENVIRONMENT` |

Browser requests use the fixed same-origin `/api` base. Next.js rewrites those requests to the
private, environment-specific backend alias (`http://backend-uat:3001` or
`http://backend-prod:3001`); server-rendered code calls that internal URL directly and forwards
the incoming session cookie. This keeps the host-only auth cookie visible to both browser and SSR
without sharing it with sibling subdomains. `BACKEND_INTERNAL_URL` is derived from
`BACKEND_INTERNAL_HOST` in Compose and is not a direct Dokploy input.

Shared remote-runtime invariants (`NODE_ENV=production`, real-service stub flags off, Sentry on,
and the New Relic loader enabled) are fixed in Compose rather than copied into every Dokploy
environment.

`NODE_ENV=production` is correct for both remote profiles: it selects optimized framework
runtime behavior, not the business environment. These values select UAT versus production:

| Input                   | UAT                                   | Production                    |
| ----------------------- | ------------------------------------- | ----------------------------- |
| `BACKEND_URL`           | `https://uat.tailortales.app/api`     | `https://tailortales.app/api` |
| `FRONTEND_URL`          | `https://uat.tailortales.app`         | `https://tailortales.app`     |
| `BACKEND_INTERNAL_HOST` | `backend-uat`                         | `backend-prod`                |
| `DATABASE_URL`          | dedicated UAT database                | dedicated production database |
| `REDIS_URL`             | UAT database/index                    | production database/index     |
| `PADDLE_ENVIRONMENT`    | `sandbox`                             | `production`                  |
| `STORAGE_ENDPOINT`      | public UAT MinIO API origin           | absent; AWS regional endpoint |
| `STORAGE_BUCKET`        | MinIO `tailortales-uat`               | S3 `tailortales-prod`         |
| `SENTRY_ENVIRONMENT`    | `uat`                                 | `production`                  |
| `NEW_RELIC_APP_NAME`    | `TailorTales-UAT`                     | `TailorTales-Prod`            |
| `GA`                    | `NEXT_PUBLIC_GA_MEASUREMENT_ID` empty | production GA4 measurement ID |
| `E2E_TEST_SECRET`       | opaque UAT-only secret                | omit                          |

Credentials, OAuth clients, webhook secrets, and Paddle catalog IDs also use their
environment-specific values from the Phase 19 matrix.

When UAT uses `AUTH_ALLOWED_EMAILS`, configure an `app-uat` service-level override containing
the owner emails and `e2e-smoke@tailortales.invalid`. This is required because the JWT strategy
checks the allowlist for the authenticated smoke user on every request. Do not add that technical
email to production.

For UAT, `STORAGE_ENDPOINT=https://storage-uat.tailortales.app` and
`STORAGE_FORCE_PATH_STYLE=true`. That domain routes to the MinIO API on port `9000`; presigned
URLs embed this endpoint, so an internal Docker hostname would not work in browsers. Keep the
MinIO console on port `9001` private. In production, omit both variables so the AWS SDK uses the
regional S3 endpoint. The complete variable reference and build/runtime classification is in
[environment-variables.md](environment-variables.md).

## Dokploy resources and triggers

Create two Compose resources pointing to the root `compose.deploy.yaml`:

| Resource   | Git ref / trigger                                                              | Environment values |
| ---------- | ------------------------------------------------------------------------------ | ------------------ |
| UAT        | `main`; GitHub Actions deploys after every merge                               | UAT/sandbox values |
| Production | SemVer tag pinned by GitHub Actions; GitHub Actions then calls the Dokploy API | live values        |

Do not configure separate backend/frontend auto-deploy webhooks. The Compose resource owns the
ordered release and both application services as one deployment unit.

### Deployment availability at MVP

Standard Dokploy Compose replaces the current containers during deployment and can produce a
brief availability window. TailorTales accepts that trade-off at MVP scale: health checks prevent
an unready backend/frontend from being treated as ready, while graceful shutdown protects an
in-flight generation job. True rolling or blue-green deployment would require moving the app
services to a Swarm/registry topology and is deferred until real traffic justifies the added
operational complexity.

### Post-change UAT reliability verification

Run these checks after the hardening branch reaches UAT:

1. **Stable per-client rate limit:** wait 60 seconds for old counters to expire, then send six
   invalid contact requests from one machine. Validation runs after the throttle guard, so this
   does not send email. Expect five `400` responses followed by one `429`:

    ```bash
    for attempt in 1 2 3 4 5 6; do
      curl -sS -o /dev/null -w "%{http_code}\n" \
        -H 'content-type: application/json' \
        -d '{}' https://uat.tailortales.app/api/contact
    done
    ```

    After another clean 60-second window, request
    `https://uat.tailortales.app/api/auth/google` 11 times without following redirects. Expect ten
    `302` responses followed by one `429`. Confirm `X-RateLimit-Limit` remains `10` and
    `X-RateLimit-Remaining` decreases monotonically; a jump upward means requests are still
    reaching different in-memory buckets.

2. **Graceful generation drain:** start one UAT story generation, wait until it is actively
   generating pages, then trigger the normal UAT Compose deployment. In the old backend logs,
   confirm `SIGTERM` begins shutdown but the active BullMQ job reaches its terminal state before
   the container exits. Confirm the story is `COMPLETED` and downloadable after the new backend
   becomes healthy. If generation exceeds 15 minutes, Docker may use `SIGKILL`; capture that as a
   failed drill and increase the grace period only with measured evidence.

> **Phase 19 evidence (6 August 2026):** the owner completed both UAT drills. The contact and
> Google OAuth limits returned `429` at their configured thresholds; an in-flight generation
> drained successfully during a normal UAT deployment.

## Safe UAT cutover

Do not delete the existing `backend-uat` and `frontend-uat` applications before validation:

1. Disable their automatic deploy triggers, but leave the running containers and domains intact.
2. Provision persistent UAT MinIO, route `storage-uat.tailortales.app` to API port `9000`, and
   keep its console private.
3. Create the new UAT Compose resource from the same Git revision.
4. Add the full UAT env set and deploy with temporary backend/frontend domains.
5. Verify `release` exited `0`, `GET /api/health` is healthy, OAuth works through the
   same-origin callback, and one story reaches PDF generation.
6. Move the real UAT domains from the old applications to the Compose services.
7. Run the smoke checklist again through the real domains.
8. Delete the old `backend-uat` and `frontend-uat` applications only after the new route is
   proven. Keep the Dokploy PostgreSQL, Redis, and MinIO resources.

Rollback means redeploying a previously known-good Git revision. Because database migrations
remain applied, rollback is safe only while migrations follow the expand-contract rule.

## CI pipeline

`.github/workflows/ci.yml` runs on every push and pull request to `main`:

| Step                   | Command / action               | Notes                                                    |
| ---------------------- | ------------------------------ | -------------------------------------------------------- |
| Secret scan            | `gitleaks/gitleaks-action@v2`  | Full git history; any detected credential fails the job. |
| Install                | `pnpm install`                 | Frozen lockfile; uses `.nvmrc` for Node version.         |
| Deployment contract    | `pnpm compose:deploy:check`    | Renders synthetic UAT and production configurations.     |
| Generate Prisma client | `db:generate`                  | Uses a dummy `DATABASE_URL`; no live DB needed.          |
| Lint + format check    | `pnpm check`                   | ESLint + Prettier.                                       |
| Framework type-check   | `pnpm --filter frontend build` | Includes generated Next.js route types.                  |
| Test                   | `pnpm test`                    | Vitest with external-service stubs.                      |

CI does not deploy individual applications. Dokploy receives the configured Git trigger and
builds the Compose services from the repository.

## Post-deploy UAT gate

UAT browser smoke must run **after the deployment for the merged `main` revision has succeeded**.
It is a release gate, not a pull-request check: a PR does not yet exist on UAT, and a health check
alone does not prove that browser routing or the authenticated UI work.

```mermaid
sequenceDiagram
    participant GH as GitHub Actions
    participant D as Dokploy UAT Compose
    participant U as uat.tailortales.app

    GH->>D: deploy main SHA
    GH->>D: poll that deployment until succeeded
    GH->>U: Playwright public + authenticated smoke
    alt smoke passes
        GH-->>GH: mark main SHA `UAT E2E` successful
        GH-->>GH: release promotion may create production tag
    else deploy or smoke fails
        GH-->>GH: fail deploy-verified; no production promotion
    end
```

Use one deploy owner. GitHub Actions owns UAT: `.github/workflows/deploy-uat.yml` runs on every
push to `main`, calls the Dokploy Compose deploy API, and polls the deployment before starting
browser smoke. Dokploy's UAT `On Push` trigger must remain disabled; otherwise its webhook races
the workflow and may cause the smoke suite to test the wrong revision.

The workflow requires these GitHub repository secrets/variables:

| Name                      | Kind     | Purpose                                                                           |
| ------------------------- | -------- | --------------------------------------------------------------------------------- |
| `DOKPLOY_URL`             | Variable | `https://dokploy.shagon1k.win`; API base for the workflow.                        |
| `DOKPLOY_API_TOKEN`       | Secret   | Calls the Dokploy API; never expose in logs.                                      |
| `DOKPLOY_UAT_COMPOSE_ID`  | Variable | Identifies the UAT Compose resource.                                              |
| `CF_ACCESS_CLIENT_ID`     | Secret   | Cloudflare Access service-token client ID for the protected Dokploy API.          |
| `CF_ACCESS_CLIENT_SECRET` | Secret   | Cloudflare Access service-token secret for the protected Dokploy API.             |
| `E2E_TEST_SECRET`         | Secret   | Authenticates the UAT-only test-session endpoint. Must equal UAT Dokploy's value. |
| `PLAYWRIGHT_BASE_URL`     | Variable | `https://uat.tailortales.app`.                                                    |

`deploy-uat.yml` also supports `workflow_dispatch`. It refuses to deploy if another UAT deployment
is already running or `main` has advanced beyond the selected SHA. It then calls `compose.deploy`,
waits for Dokploy's Compose status to transition through `running` to `done`, and probes the
authenticated smoke-session endpoint for up to 90 seconds before running `pnpm test:e2e`. The
probe retries transient route/startup responses (`000`, `404`, `502`, `503`, `504`) but fails
immediately on `401`, which means the UAT runtime and GitHub `E2E_TEST_SECRET` values differ. On
failure it uploads the Playwright report, trace, and screenshots.

`deploy-prod.yml` is a manual promotion workflow named **Promote to Production**. Its only input is the
release type (`patch`, `minor`, or `major`). It resolves the current `main` SHA, increments the
latest stable `vX.Y.Z` tag, verifies the `UAT E2E` check for that SHA, then creates the annotated
tag. It pins the production Compose resource to that immutable tag through the Dokploy API,
disables its auto-deploy setting, starts the deployment, and waits for Dokploy to report `done`.
This deliberately does **not** rely on Dokploy's UI `On Tag` trigger.

The workflow needs `DOKPLOY_PROD_COMPOSE_ID` as a GitHub repository variable, alongside the
existing `DOKPLOY_URL`, `DOKPLOY_API_TOKEN`, and Cloudflare Access service-token secrets. Do not
create production tags directly from a developer machine. GitHub repository settings must allow
workflows to have **Read and write permissions**, otherwise the workflow cannot create the tag.
