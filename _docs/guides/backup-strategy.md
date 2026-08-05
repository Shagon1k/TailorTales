# Backup Strategy

> Data backup and restore approach for the production database and object storage.

## What needs to be backed up

| Data                                                                | Store      | Criticality  | Notes                                                     |
| ------------------------------------------------------------------- | ---------- | ------------ | --------------------------------------------------------- |
| All entities (users, children, stories, pages, subscriptions, etc.) | PostgreSQL | **Critical** | Loss = user data loss                                     |
| Generated PDFs                                                      | S3         | High         | Reproducible from pages + AI, but expensive to regenerate |
| Page illustration images                                            | S3         | Medium       | Same; used by the in-browser reader                       |
| Character preview images                                            | S3         | Low          | Cosmetic; user can regenerate                             |
| ArtStyle thumbnails                                                 | S3         | Low          | Admin can regenerate via the admin panel                  |

## PostgreSQL

### Approach

Production PostgreSQL is self-hosted on the Dokploy VPS. Dokploy's database backup job creates a
compressed SQL dump every day and uploads it to separate S3 storage so a VPS failure does not
take the database and its backup together:

| Setting     | Production value                                                        |
| ----------- | ----------------------------------------------------------------------- |
| Schedule    | `30 2 * * *` (Dokploy/server timezone)                                  |
| Format      | Timestamped `.sql.gz`                                                   |
| Destination | `s3://tailortales-backups/tailortales-db-postgres-prod-wjoq7z/db/prod/` |
| Retention   | Versioned S3 lifecycle with a conservative 14-day maximum               |

The observed S3 objects confirm daily uploads. Retention is enforced in S3 rather than by a
VPS-local cleanup command; this keeps cleanup working even if the database server is unavailable.

### Restore procedure

```bash
# 1. Obtain the backup file
aws s3 cp \
  s3://tailortales-backups/tailortales-db-postgres-prod-wjoq7z/db/prod/<TIMESTAMP>.sql.gz \
  ./restore.sql.gz

# 2. Decompress
gunzip restore.sql.gz

# 3. Restore to target DB (will overwrite — run against a fresh DB)
psql "$DATABASE_URL" < restore.sql

# 4. Apply any migrations that ran after the backup date
pnpm --filter backend db:migrate:deploy
```

> **Warning:** restoring a DB backup older than the current schema will leave the schema behind.
> Always run `db:migrate:deploy` after restore to bring the schema up to date.

### Verify after restore

```sql
-- Sanity-check row counts
SELECT 'User' AS entity, COUNT(*) FROM "User"
UNION ALL SELECT 'Story', COUNT(*) FROM "Story"
UNION ALL SELECT 'Subscription', COUNT(*) FROM "Subscription"
UNION ALL SELECT 'Page', COUNT(*) FROM "Page";
```

## S3 / Object storage

### Approach

Enable **S3 versioning** on the production bucket (`tailortales-prod`). Versioning protects
against accidental overwrites and deletions — deleted objects become "delete markers" and can
be restored.

Cross-Region Replication is intentionally **not configured** at MVP. The current design protects
against accidental object changes through versioning, but does not provide automated recovery
from a full regional or AWS-account loss. See [Deferred Decision #20](../../ROADMAP.md) before
adding CRR: it needs a second bucket/region, IAM role, monitoring, cost ownership, and a deliberate
disaster-recovery design.

### Lifecycle rules (cost control)

Configure the following rules on `tailortales-backups`, scoped to the production database prefix:

| Rule                               | Target                                         | Action                                                                                                                    |
| ---------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `expire-prod-db-backups`           | `tailortales-db-postgres-prod-wjoq7z/db/prod/` | Expire current after 12 days; permanently delete non-current after 1 day; abort incomplete multipart uploads after 7 days |
| `remove-expired-db-delete-markers` | Same prefix                                    | Remove expired object delete markers                                                                                      |

The backup bucket has versioning enabled. S3 rounds lifecycle eligibility to the next midnight
UTC, so the 12-day current-version expiry plus 1 non-current day leaves a conservative buffer
under the published 14-day maximum. Leave “number of newer non-current versions to retain” blank.
AWS does not allow a days-based current expiration and expired-delete-marker cleanup in the same
rule, so marker cleanup is a second prefix-scoped rule. Do not add storage-class transitions for
this short retention window.

> **Verified 5 August 2026:** the two production-database prefix rules and the
> `tailortales-prod` non-current-version rule are enabled in AWS. The public 14-day retention
> statement now matches the live configuration.

On `tailortales-prod`, configure:

| Rule                        | Target                            | Action                                    |
| --------------------------- | --------------------------------- | ----------------------------------------- |
| `prune-noncurrent-versions` | All objects, non-current versions | Permanently delete after 14 days          |
| `abort-incomplete-uploads`  | All objects                       | Abort multipart uploads older than 7 days |

The application's retention cleanup cron (`RetentionCleanupCron`) handles application-level
retention (deleting PDFs past `PricingTier.retentionDays`). S3 lifecycle rules are a safety net
for orphaned versions and incomplete uploads, not a replacement.

### Restore procedure

**Recover an accidentally deleted object:**

1. In the AWS Console, navigate to the bucket → find the deleted object.
2. Toggle "Show versions" → locate the version just before the delete marker.
3. Select that version and restore it by copying or removing the delete marker.

**Full bucket loss:** there is no automated replica restore at MVP. Treat this as an incident:
preserve the database backup, assess which generated assets can be recreated, and do not invent an
S3 sync source. Add a tested replica restore procedure only when CRR is deliberately adopted.

## Backup schedule summary

| What                        | Frequency               | Retention                      | Where                               |
| --------------------------- | ----------------------- | ------------------------------ | ----------------------------------- |
| Postgres (Dokploy SQL dump) | Daily (`30 2 * * *`)    | 14 days                        | S3 `tailortales-backups/…/db/prod/` |
| S3 generated assets         | Continuous (versioning) | 14 days (non-current versions) | S3 versioning                       |
| S3 Cross-Region Replication | —                       | Not configured                 | Deferred Decision #20               |

## Restore drill (quarterly)

Run a restore drill each quarter to confirm backups are usable:

1. Spin up a temporary Postgres database.
2. Restore the latest daily dump.
3. Run `db:migrate:deploy` to apply any outstanding migrations.
4. Run the sanity-check query above.
5. Verify that a known story's `pdfKey` exists in S3.
6. Tear down the temporary database.

Record the outcome (success / issues found) and update this document if the procedure changed.

### Drill history

| Period  | Result | Evidence                                                                                    |
| ------- | ------ | ------------------------------------------------------------------------------------------- |
| 2026 Q3 | Passed | Owner-confirmed during Phase 19 closeout; the original detailed drill log was not retained. |

> Production policy is now **14 days** for database dumps and non-current S3 versions, matching
> the public Privacy Notice. Verify the live cron/lifecycle configuration whenever this policy
> changes; editing this guide alone does not change provider-side retention.
