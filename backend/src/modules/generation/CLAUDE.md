# Generation Module

The book-generation pipeline: one BullMQ job per story, five stages
**Planning → Moderation → Pictures → Binding → Ready**. Invariants to preserve when editing:

## Keep these true

- **`GenerationPipeline` must stay BullMQ-free.** No `bullmq`/`@nestjs/bullmq` imports in
  `generation.pipeline.ts`. It takes a `jobId`, loads from Postgres, and runs — that's what
  lets tests call `pipeline.run(jobId)` with the stub AI and no Redis. Queue wiring lives
  only in `generation.service.ts` (enqueue) and `generation.worker.ts` (consume).
- **`GenerationWorker` holds no business logic.** Its body is `pipeline.run(job.data.jobId)`.
  If you're adding logic to the worker, it belongs in the pipeline.
- **The PageTemplate config is the contract.** `../rendering/page-templates.config.ts` is the
  single source shared by the prompt builder, `StoryPlanValidator`, and the renderer. Change
  a template's zones/images/role there once — don't hardcode template assumptions elsewhere.
- **Validation has two classes, treated differently** (`story-plan.validator.ts`):
  _structural_ errors → one repair retry → FAIL; _length overflows_ → log only, CSS clips.
  **Do not add text truncation** — it was deliberately rejected (drops the story's payoff).
- **Provenance is written in Planning.** `Page.illustrationPrompt` is persisted during
  Planning so Pictures reads it off the DB row (no in-memory `plan.pages[i]` lookup) and
  page regeneration can reuse it. `Story.coverImageKey` is set in Pictures (it's page 1's
  illustration), not in Ready.
- **The LLM picks templates + writes text/prompt; it never emits sizes or char counts.**
  Image `size` comes from the template; char limits are measured by us.

## Conventions

- External calls (`AI_CLIENT`, `EMAIL_CLIENT`) are injected by Symbol token and swap to stubs
  under `USE_AI_STUBS`. Inject the interface, never `new` a client. Keep the full pipeline
  runnable offline — if you add an external dependency, give it a stub.
- Story/Job status transitions are the pipeline's job: `DRAFT → QUEUED → GENERATING →
COMPLETED | FAILED`. The top-level `catch` in `run()` owns the FAILED transition + failure
  notification; stage methods just throw.
