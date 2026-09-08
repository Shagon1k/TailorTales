# Decision: MinIO (dev/UAT) + AWS S3 (prod) for Object Storage

## Decision

Use **MinIO** locally (via `compose.local.yaml`) and on UAT (as a persistent Dokploy resource), and use
**AWS S3** only in production. All profiles use the same `@aws-sdk/client-s3` client — the only
difference is the endpoint, credentials, and `forcePathStyle` env vars.

## Why not just use S3 everywhere?

Real S3 in dev is a valid option (and eliminates any parity risk), but it requires:

- An AWS account and credentials to develop locally
- Internet connectivity during development
- A dedicated dev bucket that accumulates test files (PDFs, images)
- Small but real AWS costs

For a project where one `docker compose --file compose.local.yaml up` command should run the stack,
adding an external cloud dependency to the dev loop is friction we'd rather avoid.

## Why not filesystem for dev?

Two different code paths — filesystem locally, S3 in prod — means S3-specific behaviour
(pre-signed URLs, key structure, ACL handling) is never exercised during development.
Bugs surface in prod, not in dev. Parity breaks are worse than dev setup friction.

## Why MinIO over LocalStack?

LocalStack emulates the full AWS surface (SQS, SNS, Lambda, etc.). We only need S3-compatible
object storage. MinIO is purpose-built for this, lighter, and simpler to operate.

## Compatibility risk

MinIO has minor gaps vs real S3 in advanced features (object lock, replication policies, some
ACL modes). The operations TailorTales uses — `PutObject`, `GetObject`, `DeleteObject`,
pre-signed URLs — are fully compatible and well-tested in MinIO.

## Environment variables

The same `StorageService` reads different env vars in each environment:

| Variable                   | Dev (MinIO)                    | UAT (MinIO)                           | Prod (AWS S3)            |
| -------------------------- | ------------------------------ | ------------------------------------- | ------------------------ |
| `STORAGE_REGION`           | `us-east-1` (MinIO ignores it) | `us-east-1`                           | real AWS region          |
| `STORAGE_ACCESS_KEY`       | `minioadmin`                   | UAT MinIO access key                  | IAM access key           |
| `STORAGE_SECRET_KEY`       | `minioadmin`                   | UAT MinIO secret                      | IAM secret key           |
| `STORAGE_BUCKET`           | `tailortales`                  | `tailortales-uat`                     | `tailortales-prod`       |
| `STORAGE_ENDPOINT`         | `http://localhost:9000`        | `https://storage-uat.tailortales.app` | _unset_ (AWS default)    |
| `STORAGE_FORCE_PATH_STYLE` | `true`                         | `true`                                | _unset_ (defaults false) |

The UAT endpoint must be the public MinIO API origin because presigned URLs are returned to
browsers; an internal Docker hostname would produce unusable links. Route only MinIO port `9000`
through Dokploy/Traefik. Keep the admin console on port `9001` private.

In production, leave `STORAGE_ENDPOINT` and `STORAGE_FORCE_PATH_STYLE` unset. The SDK resolves
the correct regional S3 endpoint automatically.

## Revisit if

- The team moves to multiple AWS services and LocalStack becomes a better fit.
- MinIO compatibility causes a real prod divergence
- The decision is made to require an AWS account as a dev prerequisite.
