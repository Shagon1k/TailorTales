# Monitoring & Alerting

> How to observe a running TailorTales instance. Three layers:
>
> 1. **Sentry** — error tracking (backend exceptions + frontend JS errors) and an uptime monitor.
> 2. **New Relic** — APM: request latency, throughput, BullMQ job durations (backend only).
> 3. **Pino structured logs** — the durable, queryable record of everything that happened.
>
> Sentry and New Relic are enabled on UAT/prod only; **local dev runs on logs alone** (both
> agents stay dormant — see [environment-variables.md](environment-variables.md)). Registration
> and credentials are covered in [external-services.md](external-services.md).

## Observability stack

### Sentry — error tracking

Captures unhandled exceptions and sends them with an `environment` tag (`uat` / `production`)
so issues are filtered per environment.

| Side     | How it loads                                                                    | Gate                         |
| -------- | ------------------------------------------------------------------------------- | ---------------------------- |
| Backend  | `src/instrument.ts` (imported first in `main.ts`) + `SentryModule.forRoot()`    | `SENTRY_ENABLED=true`        |
| Frontend | `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` | `NEXT_PUBLIC_SENTRY_ENABLED` |

- **Backend capture path:** `AllExceptionsFilter` is decorated with `@SentryExceptionCaptured()`,
  so every exception that reaches the global filter is reported. 4xx client errors are filtered
  the same way they are in logs (the filter only logs 5xx).
- **Frontend capture path:** the Next.js instrumentation hooks plus `global-error.tsx`
  (`Sentry.captureException`) catch render/runtime errors. No PII is sent (`sendDefaultPii` is off).
- **Source maps:** uploaded during `next build` via `withSentryConfig` using `SENTRY_AUTH_TOKEN`
  (a Dokploy Compose input mounted only as a BuildKit secret, never an image layer or runtime
  var). Without it, stack traces show minified frames.

### Sentry — uptime monitor

A single Sentry uptime monitor pings `GET https://tailortales.app/api/health` and alerts (email)
when the backend is down. `/health` returns `{ "status": "ok" }` and is `@Public()`. Configured
in the Sentry UI — no app env vars.

### New Relic — APM (backend only)

The agent loads via the **ESM loader** (`NODE_OPTIONS="--import newrelic/esm-loader.mjs"`) because
the backend is ESM (`"type": "module"`); the CJS `require('newrelic')` pattern does not apply.
There is **no `NEW_RELIC_ENABLED` flag** — the presence of `NODE_OPTIONS` is the gate, so dev
(where it is unset) never starts the agent. Config lives in `backend/newrelic.cjs`; the app name
comes from `NEW_RELIC_APP_NAME` (`TailorTales-UAT` / `TailorTales-Prod`). `cookie` and
`authorization` headers are excluded from captured attributes.

Recommended alerts (set up once UAT data flows): error rate > 5%, p95 latency > 1s, Apdex < 0.7.

## Log structure (Pino / NestJS)

Every log line is a JSON object:

```json
{
    "level": 30,
    "time": 1718000000000,
    "pid": 1,
    "hostname": "backend-pod",
    "context": "GenerationPipeline",
    "message": "Stage pictures complete — 8/8 pages illustrated",
    "storyId": "cm_abc123",
    "userId": "cm_user456"
}
```

| Field             | Notes                                                                           |
| ----------------- | ------------------------------------------------------------------------------- |
| `level`           | Pino numeric: 10=trace, 20=debug, 30=info, 40=warn, 50=error, 60=fatal          |
| `context`         | NestJS logger context — the class name or module                                |
| `message`         | Human-readable description                                                      |
| Additional fields | Structured data attached by the logger call (e.g. `storyId`, `userId`, `count`) |

**5xx errors** are logged at `level=50` with a `stack` field. **4xx errors** are intentionally
not logged (expected client errors). The `AllExceptionsFilter` enforces this.

## Key log events

### Generation pipeline

| Context              | Message pattern                                   | Meaning                          |
| -------------------- | ------------------------------------------------- | -------------------------------- |
| `GenerationPipeline` | `Starting generation for story …`                 | Pipeline entered                 |
| `GenerationPipeline` | `Stage planning complete`                         | LLM plan validated and persisted |
| `GenerationPipeline` | `Stage moderation complete`                       | Text passed moderation           |
| `GenerationPipeline` | `Stage pictures complete — N/N pages illustrated` | All images generated             |
| `GenerationPipeline` | `Stage binding complete`                          | PDF stitched                     |
| `GenerationPipeline` | `Generation completed for story …`                | PDF uploaded, story COMPLETED    |
| `GenerationPipeline` | `Generation FAILED for story …`                   | Any stage error; story FAILED    |
| `GenerationPipeline` | `Moderation rejected story …: <reason>`           | Content moderation block         |

### Billing / Paddle

| Context                 | Message pattern                                        | Meaning                       |
| ----------------------- | ------------------------------------------------------ | ----------------------------- |
| `BillingWebhookService` | `Subscription sub_… activated for user … (Story Hour)` | Tier upgrade successful       |
| `BillingWebhookService` | `No PricingTier matches Paddle price pri_…`            | Seed/catalog mismatch         |
| `BillingWebhookService` | `Subscription event for unknown userId: …`             | Webhook with no matching user |
| `BillingWebhookService` | `Invalid webhook signature`                            | Bad `PADDLE_WEBHOOK_SECRET`   |
| `BillingWebhookService` | `Subscription … reverted to free tier`                 | Cancellation processed        |

### Storage

| Context                  | Message pattern                                            | Meaning                   |
| ------------------------ | ---------------------------------------------------------- | ------------------------- |
| `AccountDeletionService` | `Account deletion — expected(DB)=N listed(S3)=M deleted=K` | GDPR delete audit         |
| `RetentionCleanupCron`   | `RetentionCleanupCron: deleted N assets`                   | Daily retention run       |
| `RetentionCleanupCron`   | `RetentionCleanupCron: error`                              | Cron failed — check stack |

### Notifications

| Context                      | Message pattern                                 | Meaning                          |
| ---------------------------- | ----------------------------------------------- | -------------------------------- |
| `NotificationEmitterService` | `Email send failed for … — bell record created` | Email delivery error (non-fatal) |

## What to watch in production

### Must alert on (errors that need human action)

| Signal                         | How to detect                                                            | Impact                      |
| ------------------------------ | ------------------------------------------------------------------------ | --------------------------- |
| Generation `FAILED` rate spike | `level=50` + context `GenerationPipeline` message contains `FAILED`      | Users losing stories        |
| Paddle webhook 400s            | `Invalid webhook signature` or Paddle → Notifications → Logs showing 400 | Tier changes not processing |
| Backend startup failure        | Process exits immediately; container restarts in a loop                  | Full outage                 |
| S3 operation errors            | `level=50` in `StorageService` context                                   | PDFs not accessible         |
| Postgres connection errors     | `level=50` in `PrismaService` context                                    | Full outage                 |

### Should investigate (warnings that compound over time)

| Signal                               | How to detect                                                              | Impact                                            |
| ------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------- |
| Story stuck in `GENERATING` > 15 min | SQL: `WHERE status='GENERATING' AND "updatedAt" < NOW()-interval '15 min'` | User experience; manual recovery needed           |
| Email delivery failures              | `Email send failed` log lines                                              | Users not receiving notifications                 |
| Retention cleanup not running        | No `RetentionCleanupCron` log entry around 4 AM daily                      | Storage cost growing; tier retention not enforced |
| Orphaned `GENERATING` stories        | Count of `GENERATING` status stories > active BullMQ jobs                  | Worker crash recovery needed                      |

## Diagnosing a generation failure

1. Find the failed story ID from the user report or:

    ```sql
    SELECT id, "updatedAt", (SELECT error FROM "Job" WHERE "storyId" = s.id ORDER BY "createdAt" DESC LIMIT 1)
    FROM "Story" s WHERE status = 'FAILED' ORDER BY "updatedAt" DESC LIMIT 10;
    ```

2. Grep logs for the story ID:

    ```bash
    grep '"storyId":"<id>"' /var/log/backend.log | jq '{level, context, message, stage: .stage}'
    ```

3. Common root causes by stage:
    - **Planning:** OpenRouter API error (rate limit, model unavailable) or Story Plan validation
      failed twice (LLM output too malformed to repair).
    - **Moderation:** content safety block — check the `reason` field in the error.
    - **Pictures:** image model error, S3 upload failure, or concurrency throttle hit.
    - **Binding/Ready:** Puppeteer crash (OOM), PDF-lib error, or S3 upload failure.

## Useful ad-hoc queries

```sql
-- Active jobs (should be zero between stories)
SELECT j.id, s.id AS story_id, j.stage, j.status, j."updatedAt"
FROM "Job" j JOIN "Story" s ON s.id = j."storyId"
WHERE j.status IN ('PENDING', 'ACTIVE')
ORDER BY j."updatedAt" DESC;

-- Subscription tier distribution
SELECT pt.name, COUNT(sub.id) AS count
FROM "Subscription" sub JOIN "PricingTier" pt ON pt.id = sub."pricingTierId"
GROUP BY pt.name ORDER BY count DESC;

-- Stories generated today
SELECT COUNT(*) FROM "Story"
WHERE status = 'COMPLETED' AND "updatedAt" > NOW() - interval '24 hours';

-- Unread notification backlog
SELECT u.email, COUNT(n.id) AS unread
FROM "Notification" n JOIN "User" u ON u.id = n."userId"
WHERE n."readAt" IS NULL
GROUP BY u.email ORDER BY unread DESC LIMIT 20;
```
