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

Use your managed database provider's **automated daily backups** as the baseline. Both
Neon and Supabase (recommended providers) include point-in-time recovery (PITR) on paid plans.

If using a self-hosted database on the Dokploy server, set up `pg_dump` via cron:

```bash
# Run as a cron job on the DB server (daily at 2 AM):
0 2 * * * pg_dump "$DATABASE_URL" | gzip > /backups/tailortales-$(date +\%Y\%m\%d).sql.gz

# Retain last 30 days, delete older:
find /backups -name "tailortales-*.sql.gz" -mtime +30 -delete
```

Upload the dump to a separate S3 bucket (or cloud storage) so it survives a server failure:

```bash
aws s3 cp /backups/tailortales-$(date +\%Y\%m\%d).sql.gz s3://tailortales-backups/db/
```

### Restore procedure

```bash
# 1. Obtain the backup file
aws s3 cp s3://tailortales-backups/db/tailortales-<YYYYMMDD>.sql.gz ./restore.sql.gz

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

Additionally, use **S3 Cross-Region Replication (CRR)** or **S3 Replication** to a second
bucket in a different region for disaster recovery:

```
tailortales-prod  (eu-west-1, primary)
      │ replication
      ▼
tailortales-prod-backup  (us-east-1, replica)
```

### Lifecycle rules (cost control)

Configure the following lifecycle rules on `tailortales-prod`:

| Rule                       | Target                            | Action                                    |
| -------------------------- | --------------------------------- | ----------------------------------------- |
| `expire-old-versions`      | All objects, non-current versions | Expire after 30 days                      |
| `abort-incomplete-uploads` | All objects                       | Abort multipart uploads older than 7 days |

The application's retention cleanup cron (`RetentionCleanupCron`) handles application-level
retention (deleting PDFs past `PricingTier.retentionDays`). S3 lifecycle rules are a safety net
for orphaned versions and incomplete uploads, not a replacement.

### Restore procedure

**Recover an accidentally deleted object:**

1. In the AWS Console, navigate to the bucket → find the deleted object.
2. Toggle "Show versions" → locate the version just before the delete marker.
3. Select that version and restore it by copying or removing the delete marker.

**Recover from a corrupted bucket (full restore):**

```bash
# Sync from the replica to the primary bucket
aws s3 sync s3://tailortales-prod-backup/ s3://tailortales-prod/ --source-region us-east-1
```

> After a full S3 restore, generated signed URLs in the DB (`pdfKey`, `coverImageKey`,
> `Page.illustrations`) remain valid — they reference by key, and the keys are the same
> after a sync.

## Backup schedule summary

| What                     | Frequency               | Retention                      | Where                        |
| ------------------------ | ----------------------- | ------------------------------ | ---------------------------- |
| Postgres (managed PITR)  | Continuous              | 7 days (PITR window)           | Provider-managed             |
| Postgres (daily pg_dump) | Daily 2 AM              | 30 days                        | S3 `tailortales-backups/db/` |
| S3 generated assets      | Continuous (versioning) | 30 days (non-current versions) | S3 versioning                |
| S3 replication           | Continuous              | Same as primary                | Replica bucket               |

## Restore drill (quarterly)

Run a restore drill each quarter to confirm backups are usable:

1. Spin up a temporary Postgres database.
2. Restore the latest daily dump.
3. Run `db:migrate:deploy` to apply any outstanding migrations.
4. Run the sanity-check query above.
5. Verify that a known story's `pdfKey` exists in S3.
6. Tear down the temporary database.

Record the outcome (success / issues found) and update this document if the procedure changed.
