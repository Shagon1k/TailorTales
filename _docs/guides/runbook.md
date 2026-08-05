# Operational Runbook

> Quick reference for diagnosing and recovering from common production issues.

## Story stuck in GENERATING

**Symptom:** A story has `status = GENERATING` but the generation job is no longer running and
no progress updates appear in the SSE stream.

**Cause:** The BullMQ worker has no retry configuration (1 attempt, no automatic retry). If the
worker process crashes mid-pipeline — before the pipeline's own catch block can set
`Story.status = FAILED` — the story is left in `GENERATING` permanently.

**Recovery:**

1. Confirm the story is orphaned (no active job):

```sql
SELECT s.id, s.status, j.id AS job_id, j.status AS job_status, j.stage, j.error
FROM "Story" s
LEFT JOIN "Job" j ON j."storyId" = s.id
WHERE s.status = 'GENERATING'
ORDER BY s."updatedAt" DESC;
```

2. If the `Job` row shows `status = FAILED` (BullMQ recorded the failure but the story row
   wasn't updated), or the job is missing/orphaned, reset the story manually:

```sql
UPDATE "Story" SET status = 'FAILED', "updatedAt" = NOW()
WHERE id = '<story-id>' AND status = 'GENERATING';

UPDATE "Job" SET status = 'FAILED', "updatedAt" = NOW()
WHERE "storyId" = '<story-id>' AND status IN ('PENDING', 'ACTIVE');
```

3. The user can then retry via the Workshop. The form accepts `?storyId=<failedId>`,
   pre-fills the fields from the failed story, and `POST /stories/:id/retry` resets that
   same story in place back to `DRAFT` after purging its old pages and generated assets.

---

## Story S3 objects orphaned after deletion

**Symptom:** S3 bucket grows over time even as individual stories are deleted.

**Current behavior:** `DELETE /stories/:id` first enumerates and deletes story-owned assets
(`coverImageKey`, `pdfKey`, `Page.illustrations[].key`), then removes the DB row
(cascading to `Page` + `Job`). Full account deletion (`DELETE /me`) still performs a broader
prefix cleanup as a final safety net.

**Recovery (manual):** if you still see orphaned files, inspect the delete-path logs for the
story id. `StoriesService` now logs `expected=<n> deleted=<n>` after each purge; a mismatch
means some keys were missing or the storage delete partially failed. Re-run cleanup by the
recorded keys, or delete by S3 prefix `<userId>/<storyId>/`.

> Note: the daily retention cleanup cron (`0 4 * * *`) still handles **expired** assets
> automatically based on `PricingTier.retentionDays`. The story delete path now cleans up
> manual deletions immediately instead of leaving them for cron.

---

## Backend exits at startup

**Symptom:** The backend process exits immediately with a validation error listing missing
env vars.

**Fix:** Ensure all required env vars are set. Full reference:
[environment-variables.md](environment-variables.md).

The most common omissions in production:

- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — required by BullMQ even if no jobs are enqueued
- `JWT_SECRET` — must be non-empty
- `OPENROUTER_API_KEY` / `RESEND_API_KEY` — required even when stubs are enabled

---

## Database migrations

UAT and production migrations run automatically in the Compose `release` service before the new
backend starts:

```bash
pnpm --filter backend db:migrate:deploy
```

Do not run this manually before a normal deployment. If the release service fails, inspect its
Dokploy logs and fix the underlying migration or environment error; a failed release prevents the
new backend from starting. The command is idempotent and may be re-run manually only as an
explicit recovery step after the failure is understood.

---

## Paddle webhook not updating subscription tier

**Symptom:** Checkout overlay closed successfully, but the user's tier did not change.

**Diagnosis:**

1. Paddle dashboard → **Developer tools → Notifications → your destination → Logs**:
    - **No events:** tunnel/URL wrong, or destination not subscribed to the right events
      (required: `subscription.created`, `.activated`, `.updated`, `.canceled`, `.past_due`,
      `transaction.payment_failed`).
    - **400 responses:** bad webhook signature — `PADDLE_WEBHOOK_SECRET` is stale. Re-copy from
      the destination's Edit page.
    - **200 but no DB change:** check backend logs for:
        - `No PricingTier matches Paddle price pri_…` → fix env vars + re-run `seed:pricing-tiers`.
        - `Subscription event for unknown userId` → `customData.userId` missing from checkout.

2. Replay with the offline fixture:
    ```bash
    curl -X POST localhost:3001/webhooks/paddle \
      -H 'Content-Type: application/json' -H 'paddle-signature: stub' \
      -d @backend/src/modules/billing/__fixtures__/subscription-activated.json
    ```

---

## Notification bell badge not updating in real-time

**Symptom:** Bell badge does not update after a story completes or a subscription event fires.

**Architecture note:** The SSE bell stream uses an **in-memory `Map<userId, Subject>`** per
backend process. A missed push delays the badge until the next page load — the REST
`GET /notifications/unread-count` endpoint is fetched on first render as a fallback.
`EventSource` reconnects automatically.

In a **multi-instance** deployment, the push only reaches the in-memory map of the process that
handled the event — the user may be connected to a different instance. A shared pub/sub
(e.g. Redis) would fix this; it is out of scope at MVP.

**Quick check:** DevTools → Network → confirm `GET /notifications/stream` is open (status 200,
no error). If missing, the `access_token` cookie may have expired.

---

## Retention cleanup cron failures

**Symptom:** Expired PDFs/images are not being removed; `retentionDays` not enforced.

- Cron schedule: `0 4 * * *` (4 AM server time).
- Check backend logs for `RetentionCleanupCron: deleted N assets` or errors near that time.
- The `pdfKey IS NOT NULL` column is the "not yet purged" marker — rows with a null `pdfKey`
  are skipped.
- Verify NestJS scheduler is running: startup log should include `ScheduleModule initialized`.

---

## PDF fonts rendering as fallback system fonts

**Symptom:** Generated PDFs show incorrect fonts (Arial instead of Nunito/Comfortaa).

**Cause:** Puppeteer fetches fonts from `BACKEND_URL/static/fonts/*.woff2` at render time. If
`BACKEND_URL` is wrong or unreachable from the server process, Puppeteer falls back to system
fonts.

```bash
# Verify font endpoint is reachable from the server:
curl -I ${BACKEND_URL}/static/fonts/Nunito-Regular.woff2   # Expected: 200 OK
```

In production `BACKEND_URL` must be the real public domain, not `localhost`.

---

## Rotating JWT_SECRET

Rotating `JWT_SECRET` immediately invalidates **all active sessions** — every logged-in user is
signed out on their next API call. This is the only way to force a full token revocation at MVP
(no server-side blocklist exists). Use it if a token leak is suspected.

Steps:

1. Update `JWT_SECRET` in your environment/secrets manager.
2. Restart the backend container.
3. All existing cookies immediately return 401; users must sign in again.
