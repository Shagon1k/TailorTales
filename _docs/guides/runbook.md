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

3. Notify the affected user manually or wait for the planned "Try again" flow to ship
   (which re-opens generation from `FAILED`).

**Root cause fix:** configure BullMQ retries and add a worker-crash recovery mechanism — see ROADMAP.

---

## Story orphaning S3 objects after deletion

**Symptom:** S3 bucket grows over time even as stories are deleted.

**Cause:** `StoriesService.remove()` deletes the Story DB row (which cascades to `Page` and
`Job` rows via `onDelete: Cascade`) but does **not** delete the associated S3 objects
(`coverImageKey`, `pdfKey`, `Page.illustrations[].key`). This is a known gap (Phase 5 deferral).

**Recovery (manual):** identify orphaned S3 keys by comparing DB keys against bucket objects.
Automated cleanup is planned — see ROADMAP.

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

**Before deploying a new backend version**, apply pending migrations:

```bash
pnpm --filter backend db:migrate:deploy
```

This is idempotent — safe to re-run. A new backend that expects a schema column that doesn't
exist yet will fail at runtime, not at startup.

---

## Rotating JWT_SECRET

Rotating `JWT_SECRET` immediately invalidates **all active sessions** — every logged-in user is
signed out on their next API call. This is the only way to force a full token revocation at MVP
(no server-side blocklist exists). Use it if a token leak is suspected.

Steps:

1. Update `JWT_SECRET` in your environment/secrets manager.
2. Restart the backend container.
3. All existing cookies immediately return 401; users must sign in again.
