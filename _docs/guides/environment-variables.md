# Environment Variables

> Complete reference for all environment variables across the stack. The backend's
> authoritative source is
> [`backend/src/config/env.validation.ts`](../../backend/src/config/env.validation.ts).

## Backend variables

**Required** variables must be present at startup or the process exits with a validation error.
**Optional** variables have defaults and can be omitted.

### Database

| Variable       | Required | Default | Notes                         |
| -------------- | -------- | ------- | ----------------------------- |
| `DATABASE_URL` | yes      | —       | PostgreSQL connection string. |

### Auth

| Variable               | Required | Default | Notes                                                                                                                                            |
| ---------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GOOGLE_CLIENT_ID`     | yes      | —       | Google OAuth 2.0 client ID.                                                                                                                      |
| `GOOGLE_CLIENT_SECRET` | yes      | —       | Google OAuth 2.0 client secret.                                                                                                                  |
| `JWT_SECRET`           | yes      | —       | Signs and verifies JWTs. Rotate to invalidate all active sessions.                                                                               |
| `JWT_EXPIRY_DAYS`      | no       | `7`     | How long an issued JWT is valid. Clearing the cookie does not revoke the token — see [auth.md](../architecture/auth.md#logout-and-jwt-lifetime). |

### URLs

| Variable       | Required | Default | Notes                                                                                    |
| -------------- | -------- | ------- | ---------------------------------------------------------------------------------------- |
| `BACKEND_URL`  | yes      | —       | The backend's own public URL. Used in email links, OAuth callback, and PDF font serving. |
| `FRONTEND_URL` | yes      | —       | The frontend's public URL. Set as the CORS origin.                                       |

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

| Variable                   | Required | Default | Dev (MinIO)                    | Prod (AWS S3)              |
| -------------------------- | -------- | ------- | ------------------------------ | -------------------------- |
| `STORAGE_REGION`           | yes      | —       | `eu-west-1` (MinIO ignores it) | Real AWS region            |
| `STORAGE_ACCESS_KEY`       | yes      | —       | `minioadmin`                   | IAM access key             |
| `STORAGE_SECRET_KEY`       | yes      | —       | `minioadmin`                   | IAM secret key             |
| `STORAGE_BUCKET`           | yes      | —       | `tailortales`                  | Your S3 bucket name        |
| `STORAGE_ENDPOINT`         | no       | —       | `http://localhost:9000`        | **Unset** (AWS default)    |
| `STORAGE_FORCE_PATH_STYLE` | no       | `false` | `true`                         | **Unset** (defaults false) |

> In production, leave `STORAGE_ENDPOINT` and `STORAGE_FORCE_PATH_STYLE` unset. The AWS SDK
> resolves the correct regional endpoint automatically.

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
> startup. They only need to be set when running `pnpm seed:pricing-tiers`.

### Monitoring (Sentry + New Relic)

Enabled on UAT/prod only; leave unset in dev. See
[external-services.md](external-services.md#sentry--error-tracking--uptime) for how to obtain
each value and [monitoring.md](monitoring.md) for how they're wired.

| Variable                | Required | Default | Notes                                                                                                                                                 |
| ----------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SENTRY_ENABLED`        | no       | `false` | `true` → `instrument.ts` initialises Sentry. Dev stays silent.                                                                                        |
| `SENTRY_DSN`            | no       | —       | Backend project (`tailortales-be`) DSN. Write-only ingest key, safe to expose.                                                                        |
| `SENTRY_ENVIRONMENT`    | no       | —       | `uat` \| `production` — tags every event for per-environment filtering.                                                                               |
| `NODE_OPTIONS`          | no       | —       | Set to `--import newrelic/esm-loader.mjs` to load the New Relic ESM agent. Its **presence is the gate** — unset → no agent. Not validated at startup. |
| `NEW_RELIC_LICENSE_KEY` | no       | —       | New Relic ingest license key. Read by `newrelic.js` (not validated at startup). **Secret.**                                                           |
| `NEW_RELIC_APP_NAME`    | no       | —       | `TailorTales-UAT` \| `TailorTales-Prod`. Read by `newrelic.js` (not validated at startup).                                                            |

> Sentry vars are validated by `env.validation.ts` (all optional). New Relic vars and
> `NODE_OPTIONS` are consumed by the runtime / `newrelic.js` directly and are **not** part of the
> startup schema.

## Frontend variables

| Variable                          | Required          | Default                 | Notes                                                                                                                                                    |
| --------------------------------- | ----------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_BACKEND_URL`         | no                | `http://localhost:3001` | Backend origin. Set in `frontend/.env.example`.                                                                                                          |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | for live checkout | —                       | Paddle.js client-side token. Sandbox tokens start with `test_`; live tokens start with `live_`. The pricing CTA degrades gracefully when this is absent. |
| `NEXT_PUBLIC_PADDLE_ENV`          | no                | `sandbox`               | `sandbox` \| `production`. Must match the backend's `PADDLE_ENVIRONMENT`.                                                                                |
| `NEXT_PUBLIC_STORAGE_URL`         | for prod          | —                       | Public S3 / CloudFront base URL. Used to construct public asset URLs (e.g. art-style thumbnails). In dev, MinIO is accessed directly.                    |
| `NEXT_PUBLIC_SENTRY_ENABLED`      | no                | `false`                 | `true` → Sentry initialises in the browser/edge/server runtimes. Dev stays silent.                                                                       |
| `NEXT_PUBLIC_SENTRY_DSN`          | no                | —                       | Frontend project (`tailortales-fe`) DSN. Write-only ingest key, safe to expose.                                                                          |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT`  | no                | —                       | `uat` \| `production` — tags frontend events.                                                                                                            |
| `SENTRY_AUTH_TOKEN`               | CI build only     | —                       | Source-map upload at build time (`withSentryConfig`). **Secret** — set as a CI secret, not a runtime var.                                                |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`   | prod only         | —                       | GA4 Measurement ID (`G-XXXXXXXXXX`). Set on prod only. Unset → cookie banner still renders but no analytics loads.                                       |

## Minimal CI / offline config

```bash
# Backend
DATABASE_URL=postgresql://localhost/ci
GOOGLE_CLIENT_ID=stub
GOOGLE_CLIENT_SECRET=stub
JWT_SECRET=ci-secret
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
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

| Variable                   | Prod value                                   |
| -------------------------- | -------------------------------------------- |
| `NODE_ENV`                 | `production`                                 |
| `STORAGE_ENDPOINT`         | **Unset** (use AWS S3, not MinIO)            |
| `STORAGE_FORCE_PATH_STYLE` | **Unset** (defaults false)                   |
| `USE_AI_STUBS`             | `false`                                      |
| `USE_EMAIL_STUBS`          | `false`                                      |
| `USE_PADDLE_STUBS`         | `false`                                      |
| `PADDLE_ENVIRONMENT`       | `production`                                 |
| `JWT_SECRET`               | Long, random secret — never reuse dev values |
| `BACKEND_URL`              | Your production backend domain               |
| `FRONTEND_URL`             | Your production frontend domain              |
