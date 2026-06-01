# Phase 5 — Generation Pipeline (Book)

> Status: ✅ Completed on 2026-06-01
> Related ROADMAP section: Phase 5

## Summary

Phase 5 brings the system to life: a user submits the workshop form, the story
moves `DRAFT → QUEUED → GENERATING → COMPLETED`, and the parent receives an email
with a downloadable A5 PDF. Generation runs as a five-stage BullMQ-backed pipeline
(Planning → Moderation → Pictures → Binding → Ready), driven by a single
OpenRouter-based AI client for both text and images. The frontend opens an SSE
stream during generation so the workshop progress page animates per-page
illustration completions in real time. Watermarks are always-on (free-tier
behaviour comes in Phase 9), and the engine is built **comic-ready** —
templates, types, and the pipeline contract accept the comic seams without
refactor, but the comic path itself is deferred.

This phase also ships transactional email (Resend), the `POST /contact` endpoint
that resolves Deferred Decision #4, and the `Notification` data model that
Phase 10 will build the bell UI and preferences on top of.

---

## What Was Added

### Backend — generation core

- **Modules:** `AiModule`, `RenderingModule`, `GenerationModule`, `EmailModule`,
  `NotificationsModule`, `ContactModule`.
- **`AiClient`** — OpenRouter via native `fetch`. Exponential-backoff retries
  (3 attempts), 4xx fails immediately, 5xx retries. Supports
  `generateStoryPlan` (JSON-schema-constrained), `generateImage` (handles both
  `image_url[]` and raw `data:` URL response shapes), and `moderateText`.
- **`AiStubClient`** — deterministic stub used when `USE_AI_STUBS=true`.
  Canned story plan + a placeholder PNG. No network calls. CI runs the full
  pipeline against this.
- **`PdfRendererService`** — Puppeteer + Handlebars + pdf-lib. Each page renders
  to an A5 PDF via a layout template; pages are stitched into one document.
  Free-tier watermark overlay is always applied in Phase 5.
- **`GenerationService`** — enqueue endpoint. Enforces one active generation per
  user (`PENDING + ACTIVE` join through `Story.userId`) and creates the `Job`
  row. Exposes `getActiveJob` and `streamProgress` (the SSE source).
- **`GenerationPipeline`** — plain service, **no BullMQ dependency**. Owns the
  five stages: Planning, Moderation, Pictures, Binding, Ready. Designed so
  tests run it directly under the stub AI without Redis.
- **`GenerationWorker`** — thin `@Processor('generation')` wrapper. Pulls the
  `jobId` off the BullMQ payload and delegates to `pipeline.run(jobId)`.
- **`StoryPromptBuilder`** — composes the system prompt (blueprint + house
  rules) and the user prompt (child name, age, language, question, art style,
  per-template `narrativePurpose` + `maxChars` constraints).
- **`StoryPlanValidator`** — two-class failure model:
    - **Structural** (unknown template, wrong type, cover/final invariants,
      wrong page count) → one repair retry → if still broken, story FAILED.
    - **Length overflow** → logged, never blocks. CSS `overflow: hidden` clips
      visually.
- **Zod schemas** — `storyPlanSchema` and `moderationResultSchema` are the
  single source of truth: both the TypeScript types AND the OpenRouter
  `json_schema` `response_format` are derived from them via `z.toJSONSchema()`.

### Backend — rendering

- **`page-templates.config.ts`** — single source of truth for the prompt
  builder, validator, and PDF renderer. Each template carries:
  `htmlFile`, `type` (BOOK/COMIC), `role` (cover/interior/final),
  `narrativePurpose`, `maxChars` (zone → limit map), `images`
  (`[{ name, aspect, size }]` with concrete pixel dimensions per template).
- **5 book templates:** `book-cover` (1024×1536), `book-text-image`
  (1536×1024), `book-text`, `book-full-image` (1024×1536), `book-final`
  (1024×1024 round inset).
- **5 comic templates:** Post-MVP stubs in place — `comic-cover`,
  `comic-2-panel`, `comic-3-panel`, `comic-4-panel`, `comic-splash`.
- **Fonts:** self-hosted woff2, no CDN at render time:
  **Nunito** (titles/labels) + **Literata** (body prose). Latin + Cyrillic
  subsets for EN/RU. The renderer waits for `document.fonts.ready` before
  printing so PDFs are deterministic.

### Backend — email & notifications

- **`ResendClient`** wraps the Resend SDK. `EmailStubClient` activates when
  `USE_AI_STUBS=true` (same flag controls both AI and email stubs).
- **Templates:** `story-completed`, `story-failed`, `contact-form` — all
  produce HTML + plain-text.
- **`NotificationsService`** — creates a `Notification` DB row AND sends
  email. Email failures are swallowed so a successful generation isn't
  undone by a Resend hiccup.
- **`ContactModule`** — `POST /contact` (public, no auth), validates DTO,
  routes to `CONTACT_INBOX_EMAIL` with the sender's address as `replyTo`.

### Endpoints

| Method | Path                    | Auth   | Description                                                                 |
| ------ | ----------------------- | ------ | --------------------------------------------------------------------------- |
| `POST` | `/stories/:id/generate` | user   | Enqueues generation, returns `{ jobId, storyId }`, 409 if active job exists |
| `GET`  | `/stories/active-job`   | user   | Returns current user's PENDING/ACTIVE job or null                           |
| `GET`  | `/stories/:id/progress` | user   | SSE stream: snapshot, page_complete, completed, failed events               |
| `POST` | `/contact`              | public | Routes to `CONTACT_INBOX_EMAIL`, returns 202                                |

### Frontend

- **`/workshop`** — server-side check for active job, redirects to
  `/workshop/[storyId]` if one exists.
- **`/workshop/[storyId]`** — the in-progress page. Status-aware: COMPLETED
  redirects to `/library/[id]`. Composed of:
    - `WorkshopProgress` orchestrator
    - `useGenerationStream` hook — owns the EventSource + state machine
    - `ProgressHero` — native `<progress>` element (a11y) + fox mascot
    - `StageRow` — 5 cosmetic steps (Outline, Words, Pictures, Binding, Ready)
    - `PagesGrid` — thumbnails light up on each `page_complete` event
    - `WorkshopLog` — live entry list
    - `SafetyBanner` — "email when ready" reminder
- **Workshop form:** create → generate → redirect to progress page. Comic
  option shown as **"Comic — coming soon"** and disabled.
- **Story reader:** Download PDF button wired to signed-URL `<a download>`
  when `pdfKey` exists.
- **Contact form:** Server Action now talks to real backend with
  status-aware error messages.

### Database

- **`Job`** model — `id`, `storyId`, `type` (GENERATION | REGENERATION),
  `status` (PENDING | ACTIVE | COMPLETED | FAILED), `stage` (string),
  `error?`, `attempts`, timestamps. Story has `Job[]` because Phase 8
  regeneration creates additional rows per page regen.
- **`Notification`** model — `id`, `userId`, `type` (STORY_COMPLETED |
  STORY_FAILED), `payload` (Json), `readAt?`, `createdAt`. Phase 10 wires
  the bell UI on top of this.
- **`Story.styleAnchor`** — recurring-character + style description for
  cross-page image consistency.
- **`Page.illustrationPrompt`** — prompt used to paint the page. Source for
  Phase 8 regeneration.

---

## Resulting Structure

```
backend/src/modules/
  ai/
    ai.types.ts                 # Zod-derived IStoryPlan + JSON schemas
    ai.client.ts                # OpenRouter HTTP client
    ai-stub.client.ts           # Deterministic stub
    ai.module.ts                # Factory switches via USE_AI_STUBS
  rendering/
    page-templates.config.ts    # Record<string, IPageTemplate> contract
    pdf-renderer.service.ts     # Puppeteer + pdf-lib
    rendering.types.ts
    templates/                  # _base.hbs + 5 book + 5 comic stubs
    assets/fonts/               # Nunito + Literata woff2 (latin + cyrillic)
  generation/
    generation.constants.ts     # Queue name, IMAGE_CONCURRENCY, computeMaxTokens
    generation.prompts.ts       # Centralised LLM prompt strings
    generation.service.ts       # enqueue, getActiveJob, streamProgress
    generation.pipeline.ts      # 5-stage runner (plain service, no BullMQ)
    generation.worker.ts        # @Processor wrapper
    story-prompt-builder.ts
    story-plan.validator.ts
  email/
    email.types.ts              # IEmailClient + EMAIL_CLIENT symbol
    resend.client.ts
    email-stub.client.ts
    templates/                  # story-completed, story-failed, contact-form
  notifications/
    notifications.service.ts
  contact/
    contact.controller.ts       # POST /contact (public)
    contact.service.ts
    contact.constants.ts
    dto/contact.dto.ts

frontend/src/app/(private)/workshop/[storyId]/
  page.tsx                      # status-aware redirect to /library if COMPLETED
  _components/WorkshopProgress/
    WorkshopProgress.tsx        # orchestrator
    hooks/useGenerationStream.ts
    utils/stage.utils.ts
    components/
      ProgressHero/             # native <progress> for a11y
      StageRow/
      PagesGrid/
      WorkshopLog/
      SafetyBanner/
```

---

## Commands

```bash
# Run the backend with stubbed AI (no real API spend)
USE_AI_STUBS=true pnpm --filter ./backend dev

# Real generation (requires valid OpenRouter + Resend keys)
pnpm --filter ./backend dev

# Tests — full pipeline runs under stubs, no network
pnpm --filter ./backend test
```

---

## Configuration / Environment Variables

| Variable                 | Example                                 | Required | Description                                                  |
| ------------------------ | --------------------------------------- | -------- | ------------------------------------------------------------ |
| `REDIS_URL`              | `redis://localhost:6379`                | yes      | BullMQ connection                                            |
| `OPENROUTER_API_KEY`     | `sk-or-...`                             | yes      | OpenRouter credentials                                       |
| `OPENROUTER_TEXT_MODEL`  | `google/gemini-2.0-flash-001`           | yes      | LLM for story plan + moderation (must support `json_schema`) |
| `OPENROUTER_IMAGE_MODEL` | `google/gemini-flash-1.5-8b`            | yes      | Image model returning base64                                 |
| `USE_AI_STUBS`           | `false`                                 | no       | Switches both AI and email to stub clients                   |
| `RESEND_API_KEY`         | `re_...`                                | yes      | Resend credentials                                           |
| `RESEND_FROM`            | `TailorTales <stories@tailortales.app>` | yes      | Verified sending identity                                    |
| `CONTACT_INBOX_EMAIL`    | `hello@tailortales.app`                 | yes      | Where contact-form submissions are routed                    |

---

## External Services

- **OpenRouter** — single provider for both text and image generation.
  Sign up at [openrouter.ai](https://openrouter.ai/keys). Pay-as-you-go;
  expect a few cents per generated book at MVP scale. Models are
  configurable per env var so we can swap without code change.
- **Resend** — transactional email. Sign up at
  [resend.com](https://resend.com). Free tier covers 3K emails/month.
  Verify your sending domain before going to prod (DKIM, SPF records).
- **Redis** — BullMQ backend. Local dev runs the docker-compose service
  from Phase 0; prod is provisioned in Phase 15.

---

## Database Migrations

- `20260601082258_phase_5_generation_foundation` — adds `Job` model,
  `Notification` model, `Story.styleAnchor`, `Page.illustrationPrompt`,
  and the supporting enums (`JobType`, `JobStatus`, `NotificationType`).
- `20260601082851_phase_5_drop_job_progress` — removes the originally
  proposed `Job.progress` column; progress is **derived** at serve time
  from `count(Page WHERE illustrations != [])`.
- `20260601084226_phase_5_fix_enum_casing` — renames enum values to
  SCREAMING_SNAKE_CASE for consistency with existing enums. Hand-written
  SQL because Prisma `migrate dev` blocks on enum renames in non-TTY mode.

---

## Tests

- **Backend:** 99 tests across 21 files. The full pipeline runs end-to-end
  under `AiStubClient` so CI is offline and free.
    - `generation.pipeline.spec.ts` — 5-stage happy path + structural failure
    - `generation.service.spec.ts` — enqueue + 1-per-user 409
    - `story-plan.validator.spec.ts` — structural and length-overflow cases
    - `notifications.service.spec.ts` — DB row + email + swallowed errors
    - `contact.service.spec.ts` — Resend invocation + error propagation
    - `pdf-renderer.service.spec.ts` — real Puppeteer renders a 5-page fixture
    - `ai.client.spec.ts` — OpenRouter retry semantics, image response parsing
- **Frontend:** 169 tests. Workshop form now asserts redirect to
  `/workshop/[storyId]` after submission and the new "Comic — coming soon"
  disabled state.

Run with:

```bash
pnpm test
```

---

## Gotchas & Known Limitations

- **Puppeteer pulls Chromium on install (~200 MB).** Build allowed
  via `pnpm.onlyBuiltDependencies` in root `package.json`. CI / Docker
  needs the build script to run, or you'll get "Browser was not found"
  at runtime.
- **JSON Schema mode requires a capable model.** Gemini 2.0 Flash and
  GPT-4o-class models on OpenRouter support `response_format: json_schema`.
  If you swap to a model that doesn't, structured output silently falls
  back to plain JSON and the Zod parse becomes the only guard.
- **Image response format varies by model.** Some models return
  `content: [{ type: 'image_url', image_url: { url: 'data:...' } }]`,
  others return a plain `data:` URL string. `AiClient.extractImageBuffer`
  handles both — adding a new model may need a third branch.
- **SSE uses 800 ms polling against Postgres.** One `$queryRaw` per poll
  per connection (ownership cached at stream start). Fine at MVP scale;
  for scale, replace with BullMQ `QueueEvents` or Redis Pub/Sub.
- **Watermark is always-on.** Phase 5 hard-codes `watermark: true` in the
  binding stage. Phase 9 wires `PricingTier.watermark`.
- **Comic generation is deferred.** The data model, templates, and
  Story.type='COMIC' branch all exist, but the workshop Comic option is
  disabled. The `comic-*.hbs` files render a "coming soon" placeholder.
- **Default Gemini model output is English-leaning.** If `language=RU`,
  the prompt builder still produces an English instruction frame; Phase 13
  will localize the prompt itself.

---

## FAQ — Architecture decisions

These came up repeatedly during implementation; capture here so we don't
re-litigate them.

### Why is `AI_CLIENT` a `Symbol`, not a class?

`IAiClient` is a TypeScript **interface** — it disappears at runtime.
NestJS DI binds providers by token. We have two implementations
(`AiClient`, `AiStubClient`); we need a runtime token to register
"whichever one the factory chose" under. A symbol gives us that token
without conflicting with anything else. Consumers do
`@Inject(AI_CLIENT) ai: IAiClient`. Same pattern used for `EMAIL_CLIENT`.

### Why does a Story have `Job[]` and not just one Job?

Phase 8 regeneration creates a new `Job` row per page-regeneration
request, on the same BullMQ queue. So over a story's lifetime you have
one `GENERATION` job and zero-or-more `REGENERATION` jobs. The relation
lets us query "all jobs for this story" or "current active job" without
extra plumbing.

### Why is there a "Words" step if the backend has no `words` stage?

It's intentionally **cosmetic**. The backend's `planning` stage produces
both the outline (chapter structure) and the prose words in a single LLM
call. The UI shows them as separate visual sub-steps because that matches
the design mockup and reads better to a parent watching progress. When
`stage` transitions from `planning` to `pictures`, both Outline and Words
flip to `done` together.

### How is an image matched to the correct page?

Each `Page` row stores its own `illustrationPrompt` during the Planning
stage. The Pictures stage reads `page.illustrationPrompt` directly off
the DB row — no `plan.pages[i]` array lookup. Storage key is
`StorageKeys.pageIllustration(userId, storyId, order)` — `order` is
unique per story.

### Why store images in S3 if we just generated them in memory?

Three reasons:

1. The in-browser **story reader** (Phase 4) renders pages from S3 via
   signed URLs.
2. **Phase 8 regeneration** needs to know what was there to replace it.
3. **PDF re-stitching** after regeneration needs all illustrations
   addressable, not just freshly-generated ones.

On the _first_ generation we don't round-trip through S3 — we keep the
buffers in memory through Binding and pass them straight to the renderer.

### How do we guarantee the LLM returns the right JSON shape?

Two layers:

1. **JSON Schema response format** — `response_format: { type: 'json_schema',
json_schema: STORY_PLAN_JSON_SCHEMA }`. Capable models physically
   cannot return malformed output.
2. **Zod parse** as defense-in-depth — `storyPlanSchema.safeParse(...)`
   runs regardless. If a model is swapped to one that doesn't honor JSON
   Schema, this still catches drift.

`storyPlanSchema` is the single source of truth: the TypeScript type
(`IStoryPlan`) AND the OpenRouter JSON schema are both derived from it
via `z.toJSONSchema()`. Update the schema → both stay in sync.

### Why polling for SSE instead of pushing from the worker?

Phase 5 uses 800 ms DB polling because the pipeline runs in a separate
process (the BullMQ worker) from the HTTP handler that owns the SSE
connection — they only share the database. Push-based delivery would
need Redis Pub/Sub or BullMQ `QueueEvents`, which is more code for
latency improvement that's invisible at MVP scale (a few hundred ms on a
2-minute generation). Marked as Phase 7+ tech debt.

### Why is the SSE endpoint `GET /stories/:id/progress` in `StoriesController` instead of a new `GenerationController`?

NestJS controllers describe **URL ownership**, not service ownership.
The progress stream is logically _part of a story_ — the URL says so.
`StoriesModule` imports `GenerationModule` to inject `GenerationService`.
If we accrete more job-specific endpoints (`GET /jobs/:id`,
`DELETE /jobs/:id`), then a dedicated `JobsController` makes sense.

### What's the failure model when the LLM returns garbage?

Two classes:

- **Structural** (wrong page count, cover not at position 1, unknown
  template name) → **one repair retry** with the error embedded in the
  prompt. If still broken, story FAILED.
- **Length overflow** (text > zone `maxChars`) → **logged, never blocks**.
  CSS `overflow: hidden` + `word-break: break-word` clip visually.
  Truncating mid-narrative on a children's story page was rejected —
  it loses the punchline.

### Why a separate `EmailModule` instead of inlining Resend calls?

Same reasoning as `AiModule`: an interface (`IEmailClient`) +
stub-vs-real factory means CI runs the full notification + contact paths
offline. Email failures in `NotificationsService` are swallowed so a
successful generation isn't undone by Resend being down.

### Why is `USE_AI_STUBS` shared between AI and Email modules?

Pragmatic. Both are "third-party external calls we want to skip in
CI / local". Splitting into `USE_AI_STUBS` + `USE_EMAIL_STUBS` adds
two env vars for marginal value. Easy to split later if the use cases
diverge.

---

## Follow-ups / Open Items

- **Comic generation** — Post-MVP. Engine is comic-ready; needs panel
  contract (`panels: [{ imagePrompt, dialogue, speaker }]`),
  speech-bubble HTML/CSS, multi-image-per-page fan-out, and removal of
  the "coming soon" guard on the Comic option.
- **SSE push instead of polling** — replace 800 ms `$queryRaw` polling
  with BullMQ `QueueEvents` once load makes it worth the complexity.
  Tracked as Phase 7+ tech debt.
- **Phase 10 bell UI** — `Notification` model + writes ship in Phase 5;
  Phase 10 adds the dropdown, mark-as-read endpoints, and the
  preferences pane.
- **Real credit balance** — workshop summary still shows
  `STUB_REMAINING = 12`. Phase 9 (Paddle + PricingTier) wires the real
  values.
- **Prompt localization** — when `language=RU` is selected, the story
  text comes back in Russian, but the _prompt frame_ is still English.
  Phase 13 localizes the prompt itself.
- **Image moderation** — text moderation runs in-pipeline via
  `moderateText`. Image safety relies on OpenRouter provider flags
  today; a dedicated image moderation provider is TBD if coverage
  proves insufficient.
