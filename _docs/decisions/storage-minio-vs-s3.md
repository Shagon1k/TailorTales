# Decision: MinIO (dev) + AWS S3 (prod) for Object Storage

> Captured during Phase 4. Reference this in Phase 6 mid-point documentation.

## Decision

Use **MinIO** locally (via docker-compose) and **AWS S3** in production. Both are accessed through
the same `@aws-sdk/client-s3` client — the only difference is the endpoint and `forcePathStyle` env vars.

## Why not just use S3 everywhere?

Real S3 in dev is a valid option (and eliminates any parity risk), but it requires:

- An AWS account and credentials to develop locally
- Internet connectivity during development
- A dedicated dev bucket that accumulates test files (PDFs, images)
- Small but real AWS costs

For a project where `docker-compose up` should be the only requirement to run the full stack,
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

## Revisit if

- The team moves to multiple AWS services and LocalStack becomes a better fit.
- MinIO compatibility causes a real prod divergence (track in Deferred Decisions).
- The decision is made to require an AWS account as a dev prerequisite.
