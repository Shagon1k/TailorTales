# Decision: BullMQ for the generation queue

## Decision

Use **BullMQ** (Redis-backed) as the job queue for the generation pipeline.

## Context

Story generation is a long-running operation (text LLM call → image generation × N pages →
PDF rendering). It cannot complete within a single HTTP request — it must be decoupled from
the request/response cycle.

## Why BullMQ?

- **Redis-backed durability.** Jobs survive process restarts — the queue is in Redis, not
  in-memory.
- **Worker isolation.** `GenerationWorker` runs in the same process at MVP but is already
  separated from the HTTP handler. Scaling out means adding worker processes against the shared
  Redis queue with no code change.
- **BullMQ + NestJS fit.** `@nestjs/bullmq` provides `@Processor()`, `@InjectQueue()`, and
  `WorkerHost` — minimal boilerplate for the enqueue/process split.
- **One moving part.** We already run Redis for the queue; BullMQ adds no new infrastructure.

## Why not a managed queue (SQS, Cloud Tasks)?

Would add an external AWS/GCP dependency to the dev loop and complicate the "docker compose up
is enough" local setup. BullMQ + Redis achieves the same decoupling with a single container.

## Trade-offs / known gaps

- **No retry configuration at MVP.** `GenerationWorker` uses BullMQ's default (1 attempt).
  A worker crash mid-pipeline can leave a story in `GENERATING` permanently — manual
  intervention required (see [runbook.md](../guides/runbook.md)).
- **No dead-letter queue.** Failed jobs are visible in the BullMQ UI but not automatically
  routed for review or alerting.

## Revisit if

- Worker crash recovery and retry become a real operational problem.
- We move to multiple cloud services where a managed queue fits the broader pattern.
