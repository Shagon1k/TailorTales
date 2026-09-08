# Environment Variables

> Complete reference for all environment variables across the stack. The backend's
> authoritative source is
> [`backend/src/config/env.validation.ts`](../../backend/src/config/env.validation.ts).

For UAT and production, configure the deployment inputs from
[`deploy/.env.example`](../../deploy/.env.example) in the Dokploy Compose environment panel.
[`compose.deploy.yaml`](../../compose.deploy.yaml) maps those inputs to the build-time and runtime
names documented below.

## Backend variables

**Required** variables must be present at startup or the process exits with a validation error.
**Optional** variables have defaults and can be omitted.

### Database

| Variable       | Required | Default | Notes                                                                        |
| -------------- | -------- | ------- | ---------------------------------------------------------------------------- |
| `DATABASE_URL` | yes      | —       | PostgreSQL connection string. Local Docker uses host port `5433` by default. |

### Auth

| Variable               | Required | Default | Notes                                                                                                                                                 |
| ---------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GOOGLE_CLIENT_ID`     | yes      | —       | Google OAuth 2.0 client ID.                                                                                                                           |
| `GOOGLE_CLIENT_SECRET` | yes      | —       | Google OAuth 2.0 client secret.                                                                                                                       |
| `JWT_SECRET`           | yes      | —       | Signs and verifies JWTs. **Minimum 32 characters** (enforced at startup). Generate with `openssl rand -base64 48`. Rotate to invalidate all sessions. |
| `JWT_EXPIRY_DAYS`      | no       | `7`     | How long an issued JWT is valid. Clearing the cookie does not revoke the token — see [auth.md](../architecture/auth.md#logout-and-jwt-lifetime).      |
| `AUTH_ALLOWED_EMAILS`  | no       | —       | Comma-separated exact email allowlist. Empty/unset allows everyone. Intended for UAT; matching ignores case and surrounding whitespace.               |

### URLs

| Variable                | Required | Default | Notes                                                                                    |
| ----------------------- | -------- | ------- | ---------------------------------------------------------------------------------------- |
| `BACKEND_URL`           | yes      | —       | The backend's own public URL. Used in email links, OAuth callback, and PDF font serving. |
| `FRONTEND_URL`          | yes      | —       | The frontend's public URL. Set as the CORS origin.                                       |
| `BACKEND_INTERNAL_HOST` | remote   | —       | Unique private Docker alias: `backend-uat` on UAT, `backend-prod` on production.         |

### Runtime

| Variable   | Required | Default       | Notes                                                      |
| ---------- | -------- | ------------- | ---------------------------------------------------------- |
| `NODE_ENV` | no       | `development` | `production` enables secure cookies and disables dev aids. |
| `PORT`     | no       | `3001`        | HTTP listen port.                                          |

### Queue

| Variable    | Required | Default | Notes                 |
| ----------- | -------- | ------- | --------------------- |
| `REDIS_URL` | yes      | —       | Redis URL for BullMQ. |

### AI (OpenRouter)

| Variable                 | Required | Default | Notes                                                                                                                    |
| ------------------------ | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `OPENROUTER_API_KEY`     | yes      | —       | Required even if `USE_AI_STUBS=true` (validation runs at startup). An empty string satisfies validation for offline dev. |
| `OPENROUTER_TEXT_MODEL`  | yes      | —       | Model used for Planning stage (e.g. `google/gemini-2.0-flash`). Must support `response_format: json_schema`.             |
| `OPENROUTER_IMAGE_MODEL` | yes      | —       | Model used for Pictures stage (e.g. `google/gemini-flash-1.5-8b`).                                                       |
| `USE_AI_STUBS`           | no       | `false` | `true` → `AiStubClient` (canned plan + placeholder PNG, no API calls). Required in CI.                                   |

### Email (Resend)

| Variable              | Required | Default | Notes                                                                                           |
| --------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`      | yes      | —       | Required even if `USE_EMAIL_STUBS=true`. An empty string satisfies validation for offline dev.  |
| `RESEND_FROM`         | yes      | —       | Sender address, e.g. `TailorTales <stories@tailortales.app>`. Must be a Resend-verified domain. |
| `CONTACT_INBOX_EMAIL` | yes      | —       | Contact-form submissions are forwarded here.                                                    |
| `USE_EMAIL_STUBS`     | no       | `false` | `true` → `EmailStubClient` (logs emails, no Resend calls). Required in CI.                      |

### Storage (MinIO / AWS S3)

| Variable                   | Required | Default            | Dev (MinIO)                                                           | UAT (MinIO)                           | Prod (AWS S3)      |
| -------------------------- | -------- | ------------------ | --------------------------------------------------------------------- | ------------------------------------- | ------------------ |
| `STORAGE_REGION`           | yes      | —                  | `us-east-1`                                                           | `us-east-1`                           | Real AWS region    |
| `STORAGE_ACCESS_KEY`       | yes      | —                  | `minioadmin`                                                          | UAT MinIO access key                  | IAM access key     |
| `STORAGE_SECRET_KEY`       | yes      | —                  | `minioadmin`                                                          | UAT MinIO secret                      | IAM secret key     |
| `STORAGE_BUCKET`           | yes      | —                  | `tailortales`                                                         | `tailortales-uat`                     | `tailortales-prod` |
| `STORAGE_ENDPOINT`         | no       | AWS SDK resolution | Host backend: `http://localhost:9000`; container: `http://minio:9000` | `https://storage-uat.tailortales.app` | **Unset**          |
| `STORAGE_PUBLIC_ENDPOINT`  | no       | `STORAGE_ENDPOINT` | Host backend: **unset**; container: `http://localhost:9000`           | **Unset**                             | **Unset**          |
| `STORAGE_FORCE_PATH_STYLE` | no       | `false`            | `true`                                                                | `true`                                | **Unset**          |

`STORAGE_ENDPOINT` is used for backend bucket and object operations. Presigned browser URLs use
`STORAGE_PUBLIC_ENDPOINT` when it is set and otherwise fall back to `STORAGE_ENDPOINT`. This
fallback preserves the host-run local setup and UAT, where one endpoint is reachable by both the
backend and browsers. In a fully containerized local stack, use the Docker service address
(`http://minio:9000`) for `STORAGE_ENDPOINT` and the host-mapped address
(`http://localhost:9000`) for `STORAGE_PUBLIC_ENDPOINT`. Both clients share the same region,
credentials, and path-style setting.

UAT uses a persistent MinIO resource outside the application Compose. Route its public API port
`9000`; keep the console on `9001` private. In production, omit both endpoint variables and the
path-style variable so the AWS SDK resolves the regional S3 endpoint.

### Paddle (subscriptions)

| Variable                            | Required       | Default   | Notes                                                                                     |
| ----------------------------------- | -------------- | --------- | ----------------------------------------------------------------------------------------- |
| `USE_PADDLE_STUBS`                  | no             | `false`   | `true` → `PaddleStubClient` (parses fixture files, no Paddle calls). Required in CI.      |
| `PADDLE_API_KEY`                    | when stubs off | —         | Paddle Billing API key. Sandbox keys contain `_sdbx`; live keys do not.                   |
| `PADDLE_WEBHOOK_SECRET`             | when stubs off | —         | Webhook destination signing secret (`pdl_ntfset_…`). Each destination has its own secret. |
| `PADDLE_ENVIRONMENT`                | no             | `sandbox` | `sandbox` \| `production`. Flip to `production` only for the live Paddle account.         |
| `PADDLE_PRODUCT_ID_STORY_HOUR`      | seed only      | —         | Paddle product ID for Story Hour tier. Used by `pnpm seed:pricing-tiers`.                 |
| `PADDLE_PRICE_ID_STORY_HOUR`        | seed only      | —         | Paddle monthly price ID for Story Hour.                                                   |
| `PADDLE_PRODUCT_ID_FAMILY_WORKSHOP` | seed only      | —         | Paddle product ID for Family Workshop tier.                                               |
| `PADDLE_PRICE_ID_FAMILY_WORKSHOP`   | seed only      | —         | Paddle monthly price ID for Family Workshop.                                              |

> "Seed only" variables are read by `seed-pricing-tiers.ts` and are not validated at server
> startup. The Dokploy `release` service requires them because it runs the idempotent pricing
> seed on every UAT/production deployment.

### Monitoring (Sentry + New Relic)

Enabled on UAT/prod only; leave unset in dev. See
[external-services.md](external-services.md#sentry--error-tracking--uptime) for how to obtain
each value and [monitoring.md](monitoring.md) for how they're wired.

| Variable                | Required | Default | Notes                                                                                                                                                                                              |
| ----------------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SENTRY_ENABLED`        | no       | `false` | `true` → `instrument.ts` initialises Sentry. Dev stays silent.                                                                                                                                     |
| `SENTRY_DSN`            | no       | —       | Backend project (`tailortales-be`) DSN. Write-only ingest key, safe to expose.                                                                                                                     |
| `SENTRY_ENVIRONMENT`    | no       | —       | `uat` \| `production` — tags every event for per-environment filtering.                                                                                                                            |
| `NODE_OPTIONS`          | no       | —       | Set to `--import newrelic/esm-loader.mjs --require newrelic`: the loader supports ESM and `--require` starts the agent. Its **presence is the gate** — unset → no agent. Not validated at startup. |
| `NEW_RELIC_LICENSE_KEY` | no       | —       | New Relic ingest license key. Read by `newrelic.cjs` (not validated at startup). **Secret.**                                                                                                       |
| `NEW_RELIC_APP_NAME`    | no       | —       | `TailorTales-UAT` \| `TailorTales-Prod`. Read by `newrelic.cjs` (not validated at startup).                                                                                                        |

> Sentry vars are validated by `env.validation.ts` (all optional). New Relic vars and
> `NODE_OPTIONS` are consumed by the runtime / `newrelic.cjs` directly and are **not** part of the
> startup schema.

## Frontend variables

All `NEXT_PUBLIC_*` values are build-time inputs because Next.js embeds them in browser bundles.
Compose also supplies them at runtime for server-rendered code. A value change therefore requires
a rebuild; restarting an existing frontend container is insufficient. Browser API calls use the
fixed same-origin `/api` path; `BACKEND_INTERNAL_URL` is a server-only value derived from
`BACKEND_INTERNAL_HOST` by `compose.deploy.yaml` and set directly to the `backend` service by
`compose.local.yaml`.

| Variable                          | UAT/prod input           | Runtime | Notes                                                                                                                                                                                     |
| --------------------------------- | ------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`            | `FRONTEND_URL`           | yes     | Canonical public frontend origin. Must be non-www with no trailing slash. See [seo.md](seo.md).                                                                                           |
| `BACKEND_INTERNAL_URL`            | derived                  | yes     | Server-only backend origin (`http://backend-uat:3001` or `http://backend-prod:3001` remotely; `http://backend:3001` in full local Compose; `http://localhost:3001` with host hot reload). |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | same name                | yes     | Paddle.js client token: sandbox `test_…`, production `live_…`.                                                                                                                            |
| `NEXT_PUBLIC_PADDLE_ENV`          | `PADDLE_ENVIRONMENT`     | yes     | `sandbox` or `production`; shared input prevents frontend/backend drift.                                                                                                                  |
| `NEXT_PUBLIC_STORAGE_URL`         | same name                | yes     | Public MinIO API origin on UAT; public S3/CloudFront asset base URL on production.                                                                                                        |
| `NEXT_PUBLIC_SENTRY_ENABLED`      | fixed to `true` by       | yes     | Enables Sentry in browser, edge, and server runtimes.                                                                                                                                     |
| `NEXT_PUBLIC_SENTRY_DSN`          | same name                | yes     | Frontend project (`tailortales-fe`) DSN.                                                                                                                                                  |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT`  | `SENTRY_ENVIRONMENT`     | yes     | `uat` or `production`; shared input prevents frontend/backend drift.                                                                                                                      |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`   | same name; empty allowed | yes     | GA4 ID. Empty on UAT; set on production.                                                                                                                                                  |
| `SENTRY_AUTH_TOKEN`               | same name                | **no**  | BuildKit secret for source-map upload. Compose mounts it only for `next build`; it is absent from image layers and the runtime environment.                                               |

## Minimal CI / offline config

```bash
# Backend
DATABASE_URL=postgresql://localhost/ci
GOOGLE_CLIENT_ID=stub
GOOGLE_CLIENT_SECRET=stub
JWT_SECRET=ci-secret
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
REDIS_URL=redis://localhost:6380
OPENROUTER_API_KEY=stub
OPENROUTER_TEXT_MODEL=stub
OPENROUTER_IMAGE_MODEL=stub
RESEND_API_KEY=stub
RESEND_FROM=stub@example.com
CONTACT_INBOX_EMAIL=stub@example.com
STORAGE_REGION=eu-west-1
STORAGE_ACCESS_KEY=stub
STORAGE_SECRET_KEY=stub
STORAGE_BUCKET=tailortales
USE_AI_STUBS=true
USE_EMAIL_STUBS=true
USE_PADDLE_STUBS=true
```

> CI sets `DATABASE_URL` explicitly for Prisma client generation (no live DB connection needed
> for that step). Tests run with all three stub flags on — no external API calls are made.

## Production-critical differences from dev

| Variable                   | Prod value                                            |
| -------------------------- | ----------------------------------------------------- |
| `NODE_ENV`                 | `production`                                          |
| `STORAGE_ENDPOINT`         | **Unset** (use AWS S3, not MinIO)                     |
| `STORAGE_PUBLIC_ENDPOINT`  | **Unset** (presign against AWS S3)                    |
| `STORAGE_FORCE_PATH_STYLE` | **Unset** (defaults false)                            |
| `USE_AI_STUBS`             | `false`                                               |
| `USE_EMAIL_STUBS`          | `false`                                               |
| `USE_PADDLE_STUBS`         | `false`                                               |
| `PADDLE_ENVIRONMENT`       | `production`                                          |
| `JWT_SECRET`               | Long random secret ≥32 chars — never reuse dev values |
| `NEXT_PUBLIC_SITE_URL`     | `https://tailortales.app` (canonical non-www origin)  |
| `BACKEND_URL`              | Your production backend domain                        |
| `FRONTEND_URL`             | Your production frontend domain                       |
