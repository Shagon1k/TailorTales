# Environment Variables

> Complete reference for all backend environment variables. The authoritative source is
> [`backend/src/config/env.validation.ts`](../../backend/src/config/env.validation.ts);
> this document is derived from it.
>
> The frontend has one variable: `NEXT_PUBLIC_BACKEND_URL` (default `http://localhost:3001`),
> already set correctly in `frontend/.env.example`.

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

| Variable       | Required | Default | Notes                                                        |
| -------------- | -------- | ------- | ------------------------------------------------------------ |
| `BACKEND_URL`  | yes      | —       | The backend's own public URL. Used in email links and OAuth. |
| `FRONTEND_URL` | yes      | —       | The frontend's public URL. Set as the CORS origin.           |

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
| `OPENROUTER_TEXT_MODEL`  | yes      | —       | Model used for the Planning stage (e.g. `google/gemini-2.0-flash`).                                                      |
| `OPENROUTER_IMAGE_MODEL` | yes      | —       | Model used for the Pictures stage (e.g. `google/gemini-flash-1.5-8b`).                                                   |
| `USE_AI_STUBS`           | no       | `false` | `true` → `AiStubClient` (canned plan + placeholder PNG, no API calls). Required in CI.                                   |

### Email (Resend)

| Variable              | Required | Default | Notes                                                                                          |
| --------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`      | yes      | —       | Required even if `USE_EMAIL_STUBS=true`. An empty string satisfies validation for offline dev. |
| `RESEND_FROM`         | yes      | —       | Sender address, e.g. `TailorTales <stories@tailortales.app>`. Must be a verified domain.       |
| `CONTACT_INBOX_EMAIL` | yes      | —       | Contact-form submissions are forwarded here.                                                   |
| `USE_EMAIL_STUBS`     | no       | `false` | `true` → `EmailStubClient` (logs emails, no Resend calls). Required in CI.                     |

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

## Minimal CI / offline config

```bash
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
```

> CI sets `DATABASE_URL` explicitly for Prisma client generation (no live DB connection
> needed for that step). Tests run with `USE_AI_STUBS=true` and `USE_EMAIL_STUBS=true` —
> no external API calls are made.
