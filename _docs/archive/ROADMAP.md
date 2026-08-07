# TailorTales — Roadmap (Archived)

> Historical record of the original phased delivery plan, archived on 7 August 2026.
> It is not a source of current or deferred scope. Use
> [GitHub Project 2](https://github.com/users/Shagon1k/projects/2) for all ongoing work.

---

## 1. Project Overview

**TailorTales** is a SaaS service that generates short (5–20 page), customized PDF books and comics for children. Target audience: parents who want to create personalized educational content that answers their child's "Why?" / "How?" questions in an age-appropriate, engaging way.

### Output formats

- **Book** — page-based; the LLM composes from a set of page layouts (cover, text-only, text + illustration, full-page illustration, final) chosen for narrative pacing. Most pages carry one illustration.
- **Comic** — panels with speech bubbles, multiple illustrations per page. _(Generation deferred to Post-MVP — see Deferred Decision #6.)_

### Customization inputs (per generation)

- **Required:** child question, child age, output format (book/comic), length (5/8/12/16/20 pages), art style, language.
- **Optional:** child interests/hobbies, Character description for visual consistency.
- **Future (Post-MVP):** child photo / parent photo reference images for character likeness, with explicit guardian consent and retention controls.

---

## 2. Stack & Architecture Decisions

| Area                  | Decision                                                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repo layout           | Monorepo: `frontend/` + `backend/`, **pnpm workspaces** (no Turborepo for now)                                                                            |
| Backend               | Nest.js (TypeScript), REST API with OpenAPI auto-generation                                                                                               |
| Frontend              | Next.js (React, TypeScript), CSS Modules, **Mantine** UI library                                                                                          |
| State management (FE) | React Query (server state) + Zustand (UI state)                                                                                                           |
| Database              | PostgreSQL via **Prisma** ORM                                                                                                                             |
| Queue                 | **BullMQ** (Redis-backed)                                                                                                                                 |
| Object storage        | **MinIO** for dev/local and UAT, **AWS S3** for production                                                                                                |
| LLM (text)            | **OpenRouter** — model configurable via `OPENROUTER_TEXT_MODEL`; local/CI default to stub providers (`USE_AI_STUBS`) to avoid spend                       |
| Image generation      | **OpenRouter** (unified with text) — `google/gemini-3.1-flash-image` or `openai/gpt-5.4-image-2`, configurable via env; base64 output uploaded to storage |
| PDF generation        | **Puppeteer** (HTML → PDF)                                                                                                                                |
| Auth                  | **Google OAuth only** at MVP                                                                                                                              |
| Payments              | **Paddle**                                                                                                                                                |
| Email                 | **Resend** (decided in Phase 5 — story completion notification)                                                                                           |
| Real-time progress    | **SSE** (Server-Sent Events)                                                                                                                              |
| Notifications         | Email + in-app (bell + toast)                                                                                                                             |
| Testing               | Vitest + React Testing Library                                                                                                                            |
| Containerization      | Docker + docker-compose for dev; Dockerfiles deployed via **dokploy**                                                                                     |
| CI/CD                 | GitHub Actions (lint + `next build` + test) — `next build` type-checks Next.js route types that `tsc` alone misses                                        |
| Observability         | Pino logs only at MVP (no Sentry/OTel for now)                                                                                                            |
| Compliance            | GDPR (EU-only target audience at MVP)                                                                                                                     |

---

## 3. Glossary

> Several concepts have similar names. This table is the canonical disambiguation — use these exact terms in code, docs, API, and UI.

| Term               | What it is                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Story**          | DB entity. A book or comic (by `type`), owned by a User, referencing a Child. Owns ordered `Page` rows.                                                                                                                                                                                                                                                                                                                                                                |
| **Page**           | DB row. One page of a Story. The **materialized, validated Story Plan** and the source the PDF is rendered from (the PDF is a derived artifact).                                                                                                                                                                                                                                                                                                                       |
| **PageTemplate**   | Typed **code** config in `page-templates.config.ts` (no DB model). The contract shared by prompt builder, validator, and renderer. Each entry: `htmlFile`, `type`, `role (cover\|interior\|final)`, `narrativePurpose`, `maxChars` (plain object keyed by zone name), `images` (array of `{ name, aspect, size }` — pixel dimensions for the image generation API). Config is a plain `Record<string, IPageTemplate>` keyed by template name. Named e.g. `book-cover`. |
| **Story Plan**     | The structured JSON the **LLM returns** during generation: `title`, `styleAnchor`, and per page `{ template, text, illustration.prompt }`. Validated, then persisted as `Page` rows. Not a DB entity, not stored as a blob.                                                                                                                                                                                                                                            |
| **StoryBlueprint** | DB entity. Admin-authored **narrative DNA** (`systemPrompt` with XML markers). Auto-selected by story `type` to guide planning. Distinct from "Story Plan" — the blueprint shapes the prompt; the plan is the output.                                                                                                                                                                                                                                                  |
| **Character**      | DB entity. A reusable visual identity owned by a User, usually linked to a Child. MVP source is text description/manual generation; Post-MVP source may include reference images. Used to produce a stable per-story `styleAnchor`.                                                                                                                                                                                                                                    |
| **styleAnchor**    | Text description of recurring characters + style, generated once and prepended to every image prompt for cross-page consistency. Stored on `Story`.                                                                                                                                                                                                                                                                                                                    |
| **ArtStyle**       | DB entity. The visual style (`promptPrefix`) the parent picks in the workshop (e.g. Watercolour).                                                                                                                                                                                                                                                                                                                                                                      |
| **PricingTier**    | DB entity. A subscription tier (Phase 9). Named `PricingTier`, **not `Plan`**, to avoid collision with "Story Plan" / "Phase Plan".                                                                                                                                                                                                                                                                                                                                    |
| **Job**            | DB entity + BullMQ job. Tracks generation pipeline `stage`/`status` for SSE. `type` = `generation \| regeneration`. Progress is derived at serve-time from completed page count — no stored `progress` field.                                                                                                                                                                                                                                                          |
| **AiClient**       | The single OpenRouter wrapper for both text and images. `AiStubClient` is the offline/CI stand-in (`USE_AI_STUBS`).                                                                                                                                                                                                                                                                                                                                                    |

---

## 4. Domain Model (high level)

| Entity             | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| **User**           | Google OAuth identity, role (USER / ADMIN).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Child**          | Belongs to User. Fields: name, birthdate, gender, interests, optional avatarUrl for UI avatar/display only. Character likeness belongs to `Character`, not `Child`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Character**      | Belongs to User, optionally references Child. Fields: name, description, source (`MANUAL_DESCRIPTION` at MVP; `REFERENCE_IMAGE` Post-MVP), referenceImageKey? (Post-MVP), generatedPreviewImageKey?, consentAt? (required before storing child/person reference images Post-MVP), createdAt, updatedAt. Story creation selects the child's default Character; the generation pipeline snapshots it into `Story.styleAnchor` so older stories stay stable if the Character changes later.                                                                                                                                                                                                                                                                                                                                  |
| **ArtStyle**       | Admin-managed. Fields: id, name, slug, thumbnailUrl, promptPrefix, isActive, order. Seeded with 8 styles.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Story**          | Unified entity for books AND comics, distinguished by `type` field. Belongs to User, references Child and optionally the Character snapshot used at creation time. Key fields: `question`, `pageCount`, `artStyleId`, `language (Language enum — EN\|RU)`, `title?` (LLM-generated, Phase 5), `styleAnchor?` (recurring-character + style description for cross-page image consistency, Phase 5; generated from Character when present), `coverImageKey?`, `pdfKey?` (S3 keys — never URLs; signed at serve time via StorageService). `isPublic boolean (default false)` — set via opt-in in rating flow.                                                                                                                                                                                                                 |
| **Page**           | Belongs to Story, ordered. `text` is optional — both book and comic pages may be illustration-only. Contains illustration key(s) + chapter title + `illustrationPrompt?` (prompt used to paint the page; reused by Phase 8 regeneration). `layout` stores the PageTemplate name (e.g. `book-cover`). Page rows are the materialized Story Plan and the source the PDF renders from. Composite unique on `(storyId, order)`.                                                                                                                                                                                                                                                                                                                                                                                               |
| **StoryBlueprint** | Pre-defined story blueprint created by Admin (previously named `Template`). `systemPrompt` carries structured LLM guidance using XML markers (e.g. `<intro_prompt>`, `<climax_prompt>`). `coverImageKey` + `previewPageKeys` are S3 keys reserved for user-facing preview (Post-MVP). Auto-selected by the generation pipeline based on `StoryType`; user-facing selection deferred to Post-MVP.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **PageTemplate**   | Typed page layout specification — single source of truth for the LLM prompt builder, the response validator, and the PDF renderer. Defines A5 page (148×210 mm = 1748×2480 px at 300 DPI), `role (cover \| interior \| final)`, `narrativePurpose` (when the LLM should pick it), text zones (`maxChars` per named zone, type: `body \| caption \| speech-bubble \| narration-box`), and image zones — each carries a layout `zonePx` (PDF placement) plus an `aspectRatio` + `sizeTier` used for image generation (the LLM never emits these). Lives in `page-templates.config.ts` — no DB model. **Book layouts (MVP):** `book-cover`, `book-text`, `book-text-image`, `book-full-image`, `book-final`. **Comic layouts (Post-MVP):** `comic-cover`, `comic-2-panel`, `comic-3-panel`, `comic-4-panel`, `comic-splash`. |
| **PricingTier**    | Subscription tier definition (named `PricingTier`, not `Plan`, to avoid collision with "Story Plan" and "Phase Plan"). Fields: id, name, paddleProductId, paddlePriceId (Paddle.js checkout opens with a price id), priceMonthly (euro cents), pagesPerMonth, regenerationsPerMonth, childrenLimit (null = unlimited), retentionDays (null = forever), watermark, order.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Subscription**   | Paddle-backed. Fields: id, userId (unique — every user owns exactly one row, free tier by default), pricingTierId, paddleSubscriptionId, paddleCustomerId (kept after cancel for portal/invoices), status (ACTIVE                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | PAST_DUE | CANCELED), cancelAtPeriodEnd, currentPeriodEnd, pagesUsed, regenerationsUsed. |
| **Rating**         | Belongs to Story + User. Fields: score (1–5), comment (optional). One per user per story (upsert).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Job**            | Tracks generation pipeline state and progress for SSE. One BullMQ job per story; per-page image generation fans out inside the job (capped concurrency). `stage` field drives the progress UI.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Notification**   | In-app notification per User. Fields: id, userId, type, payload (JSON), readAt?, createdAt.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

**Unified naming:** `Story` covers both book and comic.

---

## 5. Business Rules & Policies

- **Pricing model:** page credits. 1 book page = 1 credit. 1 comic page = 2 credits.
- **Tiers:** Free Chapter (€0 · 1 tale/month up to 12 pages · watermarked) · Story Hour (€5 · 60 pages/month) · Family Workshop (€10 · 150 pages/month). Decided Phase 6 after AI cost analysis.
- **Generation:** fully automated end-to-end. User submits customization → receives final PDF.
- **Concurrent generation:** 1 active generation job per user at MVP.
- **Character consistency:** every generated story uses a per-story `styleAnchor`; when a Child has a Character, that Character is the canonical source for recurring visual identity.
- **Regeneration:** user can regenerate specific pages (text / illustration / both) with an optional prompt. Limited per subscription tier.
- **Free tier:** PDFs are watermarked. Retention policies differ per tier (free PDFs may expire).
- **Content safety:** strict — text and image moderation pre-delivery. Child-friendly only.
- **Age-adaptive content:** LLM adapts vocabulary and complexity based on child's age.
- **Localization:** UI + generated content in EN and RU.
- **Subscriptions only for registered users.**
- **Public stories:** opt-in only. Parent explicitly agrees when rating a story. Appears on landing page.
- **Admin:** seeded via DB or admin-only invite flow. Has a dedicated admin panel.

---

## 6. MVP Scope

### IN

- ✅ Google OAuth, USER + ADMIN roles
- ✅ Multiple children per user (capped by PricingTier's `childrenLimit`)
- ✅ Stories: single entity with `type` (BOOK | COMIC); **book generation only** at MVP — see comic note below
- ✅ StoryBlueprints (admin-created; auto-selected during generation by StoryType; user-facing selection Post-MVP)
- ✅ Character entity for repeatable visual identity across pages/stories; MVP supports text-description/manual generation, not photo likeness
- ✅ Generation pipeline — **book** (text + images both via OpenRouter, one provider)
- ✅ Customization: question, age, format, length, art style (from DB), language
- ✅ 6 static question suggestion chips in workshop form ("the jar")
- ✅ 1 concurrent generation per user; workshop nav routes to generation page if job active
- ✅ Real-time generation progress via SSE (per-page completion events)
- ✅ Limited page regeneration per tier (with optional user prompt)
- ✅ Paddle subscriptions (page credits model, 3 tiers)
- ✅ Ratings (score + comment) + opt-in public sharing (`Story.isPublic`)
- ✅ Toast (transient) + bell (persistent inbox) notifications
- ✅ Email notifications (story completed, story failed, subscription events) via Resend
- ✅ Admin panel (users, stories review, templates, art styles, ratings, basic stats)
- ✅ Content moderation (text + image)
- ✅ GDPR baseline: privacy/data page, data export, account deletion, S3 object cleanup, retention cleanup, and launch copy/legal review gate
- ✅ Watermark on free tier
- ✅ EN + RU localization
- ✅ `/account` settings page (Profile, Children, Subscription, Notifications, Language, Privacy & data)
- ✅ Delete account (GDPR) including generated PDFs/images and reference-image objects where present
- ✅ Schema reserved for reference-image input — Character can gain `referenceImageKey` later without changing the story-generation contract
- ✅ Mobile/tablet web support with app-style footer navigation, mobile reader/library/account layouts, and touch-safe modals

### OUT (Post-MVP)

All intentionally unshipped scope is normalized once in [Post-MVP](#9-post-mvp). That section
keeps the historical rationale and is the source from which issues are deliberately created in
GitHub Project 2; it is not an executable checklist.

---

## 7. Navigation Decisions

### Desktop header

Desktop (`>=1024px`) keeps the header as the primary navigation surface.

- **Public / unauthenticated:** `[Logo] TailorTales` · How it works · Pricing · `Sign in` · **Begin a tale →** (CTA button)
- **Private / authenticated:** `[Logo] TailorTales` · **Library** · **Workshop** · Pricing · `[Locale]` · `[🔔]` · `[Avatar] Name / Plan`

### Mobile/tablet footer dock

Mobile and tablet (`<1024px`) use an application-style fixed footer dock instead of a
hamburger in the header.

| User state | Dock items                              | Secondary access                                                                  |
| ---------- | --------------------------------------- | --------------------------------------------------------------------------------- |
| Guest      | How it works · Pricing · Sign in · More | `More` opens contact/privacy and other public helper links.                       |
| Signed in  | Library · Workshop · Account · More     | `Account` opens account subsections; `More` opens language + public helper links. |

The regular text footer is hidden on mobile/tablet because the dock owns those links.

---

## 8. Process & Documentation Rules

- **GitHub Project 2 is the canonical tracker for active scope.** `ROADMAP.md` preserves phase
  history, decision rationale, and explicit revisit triggers; link promoted work to its issue
  rather than maintaining a second executable checklist here.
- **DESIGN.md** documents all UI/UX decisions from design screen reviews. Update after each design review session.
- **Per-phase docs (staging) → durable docs (lasting).** While a phase is in progress, capture what it built in `_docs/phase-N-<name>.md` following `TEMPLATE.md` (summary, what was added, structure, commands, env/migrations, gotchas). These are temporary working notes. At documentation phases (7, 14, …) the accumulated phase docs are **consolidated into the durable docs** (`architecture/`, `api/`, `guides/`, `decisions/`) and the `phase-N` files removed. Durable docs are **phase-agnostic** and human-facing — the lasting source of truth; anything unbuilt is "planned (see ROADMAP)".
- **Rules revision:** after each phase, review and propose updates to `AGENTS.md` and `.agent-docs/rules/*.md` based on what was learned. **Each revision requires developer approval before commit.**
- **Phase completion gate:** a phase is NOT complete until acceptance checks pass AND its `_docs/phase-N-<name>.md` is written. No half-finished phases in `main`.

---

## 9. Post-MVP

> This is the historical record of the Post-MVP migration. Every actionable or trigger-based
> item is linked to its GitHub issue; GitHub Project 2 is the only current task tracker. Items
> with an unmet activation trigger are parked in `Deferred`, outside autonomous-AI backlog.

### Decision records, technical debt, and trigger-based work

> Items explicitly deferred during development. Each entry records **what**, **why it was deferred**, and **when to revisit**.
> New entries require developer approval before being added.

| #   | Item                                                                                           | Deferred reason                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Revisit at               |
| --- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 1   | [Refresh tokens + server-side logout](https://github.com/Shagon1k/TailorTales/issues/57)       | httpOnly + SameSite:lax sufficient for MVP; Google re-login is frictionless; current logout is client-side only (JWT stays valid up to 7d after cookie deletion). Refresh tokens require DB/Redis storage, rotation endpoint, and frontend handling — complexity not justified at MVP.                                                                                                                                                                                                                                                                                                                                                                                                                      | Post-MVP                 |
| 2   | [Magic email link auth](https://github.com/Shagon1k/TailorTales/issues/58)                     | Requires email provider (already decided: Resend in Phase 5). Added as Post-MVP auth option alongside Apple OAuth.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Post-MVP                 |
| 3   | ~~Exact comic credit rate~~ ✅ Phase 9                                                         | Confirmed: 2 credits/page (`CREDITS_PER_PAGE` in `subscriptions.constants.ts`); comics still post-MVP.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Phase 9                  |
| 4   | ~~Contact form backend (`POST /contact`)~~ ✅ Phase 5 Increment 7b                             | Backend `ContactModule` sends submissions to `CONTACT_INBOX_EMAIL` via Resend. Frontend Server Action wired in `actions.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | _Resolved_               |
| 5   | ~~Static page copy finalization~~ ✅ Phases 17/19                                              | Public-page copy was accepted during the owner-led Phase 17 review; the full localized Privacy Notice and Terms shipped in Phase 19.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | _Resolved_               |
| 6   | [Comic generation](https://github.com/Shagon1k/TailorTales/issues/60)                          | **Moved to Post-MVP.** Phase 5 ships **book** generation end-to-end. Comics are genuinely heavier (multi-panel pages, speech bubbles + positioning, multiple image-gen calls per page, harder panel-to-panel consistency). The Phase 5 engine (queue, renderer, validator, contract) is built comic-ready so comics slot in additively — add `comic-*` templates + a panel contract (`panels: [{ imagePrompt, dialogue, speaker }]`). Existing comic scaffolding (`Story.type`, comic blueprint seed, "coming soon" toggle) is **kept as-is**. Keep this constraint in mind during Phase 5 architecture/code so the seams stay clean.                                                                       | Post-MVP                 |
| 7   | [BullMQ multi-worker / FlowProducer](https://github.com/Shagon1k/TailorTales/issues/81)        | MVP uses one in-process BullMQ worker with internal capped image concurrency. Single server is fine — generation is I/O-bound (waiting on OpenRouter), so one box handles many concurrent stories; the "1 active job per user" cap is a business rule, not a capacity limit. Horizontal scale = add worker processes against the shared Redis queue (no code change). FlowProducer (cross-job per-page fan-out/fan-in) only needed if true distributed parallelism is required.                                                                                                                                                                                                                             | Deferred in Project      |
| 8   | ~~FAILED stories visible in library~~ ✅ Phase 8                                               | TaleCard now renders a dark overlay badge + "Try again →" CTA for FAILED stories; library filter includes FAILED alongside COMPLETED; workshop pre-fills all form fields from the failed story when `?storyId=` is present.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | _Resolved_               |
| 9   | ~~Story reader: iframe-based page preview~~ ✅ Phase 8                                         | `GET /stories/:id/pages/:order/html` returns the Handlebars-rendered page HTML; `StoryPageIframe` replaces `StoryPage` — fetches HTML on demand, caches visited pages, scales a fixed A5 stage via `ResizeObserver`. Fonts served from `GET /static/fonts/*` with `ACAO: *`. One renderer, two consumers (Puppeteer + browser), zero drift.                                                                                                                                                                                                                                                                                                                                                                 | _Resolved_               |
| 10  | [Photo-based character creation](https://github.com/Shagon1k/TailorTales/issues/61)            | Parents could upload a photo of their child as a visual reference: a vision LLM extracts appearance traits and pre-fills `Character.description`. Technically feasible via OpenRouter vision models. Blocked on legal review before any implementation: children's photos are biometric/sensitive data under GDPR Art. 9 and COPPA, requiring explicit parental consent, strict retention limits, and guaranteed deletion. Generating synthetic images from real children's likenesses raises additional right-of-publicity concerns and misuse risk. Requires a dedicated privacy policy section and legal sign-off. Connected to Open Question: "GDPR launch readiness — child/reference-image handling". | Post-MVP                 |
| 11  | ~~Character preview image as visual reference in image generation~~ ✅ Shipped                 | When `Character.previewKey` exists, the generation pipeline loads the portrait and passes it as `referenceImageUrls` to `AiClient.generateImage()`. The client sends it to the configured image model as `input_references`; `styleAnchor` remains the text-only fallback when no preview exists. This gives the visual consistency seen in generated stories.                                                                                                                                                                                                                                                                                                                                              | _Resolved_               |
| 12  | Paid-tier naming                                                                               | Moved into [MoR discovery #55](https://github.com/Shagon1k/TailorTales/issues/55): approve names alongside the selected provider and create any required migration work only after that decision.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Tracked in Project       |
| 13  | [Global page transitions](https://github.com/Shagon1k/TailorTales/issues/62)                   | Next.js 16 supports `experimental: { viewTransition: true }`, while Phase 13 currently uses `document.startViewTransition` only for locale switching. The issue requires a stable supported mechanism, motion rules, accessibility, and design QA.                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Tracked in Project       |
| 14  | [Custom product analytics](https://github.com/Shagon1k/TailorTales/issues/80)                  | Phase 15 ships only the GA4 script + cookie consent gate (page views + Enhanced Measurement auto-tracking). Custom events via `sendGAEvent()` — e.g. `story_created`, `signup_completed`, `plan_upgraded` — require real user traffic to know which funnels are worth instrumenting. Add after first users arrive. Use `@next/third-parties/google` `sendGAEvent` at call sites; no new dependencies needed.                                                                                                                                                                                                                                                                                                | Deferred in Project      |
| 15  | [ThrottlerModule Redis storage](https://github.com/Shagon1k/TailorTales/issues/83)             | Current `@nestjs/throttler` uses in-memory storage — counters reset on restart and are not shared across instances. Upgrade to `@nestjs-throttler-storage-redis` (using the existing BullMQ Redis connection) when horizontal scaling is introduced. No code change needed until multi-instance deploy.                                                                                                                                                                                                                                                                                                                                                                                                     | Deferred in Project      |
| 16  | [SEO audit and prioritization](https://github.com/Shagon1k/TailorTales/issues/64)              | SEO foundation shipped (sitemap, robots, hreflang/canonical, OG/Twitter, JSON-LD, per-page EN/DE/RU descriptions). The discovery distinguishes immediate fixes from work that needs live GSC data; `<meta keywords>` remains intentionally omitted.                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Tracked in Project       |
| 17  | [Per-child character entitlements](https://github.com/Shagon1k/TailorTales/issues/63)          | Replace `childrenLimit` with a per-child character allowance (1/3/5 by plan), preserving but locking excess characters after downgrade/cancellation. Generation quotas remain separate.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Tracked in Project       |
| 18  | ~~Character-as-protagonist — wave 2~~ ✅ Decomposed                                            | Quiz-guided creation, prompt-to-character, and per-child management shipped. Photo reference is [discovery #61](https://github.com/Shagon1k/TailorTales/issues/61); visual reference input shipped (Deferred #11); making a character mandatory for every story is not planned and has no active scope.                                                                                                                                                                                                                                                                                                                                                                                                     | _Resolved / not planned_ |
| 19  | [Landing "Try a sample" demo story](https://github.com/Shagon1k/TailorTales/issues/65)         | A landing CTA opens one curated, safe sample in an unauthenticated reader. Content selection and final presentation require owner approval.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Tracked in Project       |
| 20  | [Regional object-storage disaster recovery](https://github.com/Shagon1k/TailorTales/issues/84) | Production S3 versioning protects against accidental object changes but not full regional or AWS-account loss. A second region/account, replication IAM, monitoring, recovery objectives, and cost ownership require an evidence-backed disaster-recovery decision.                                                                                                                                                                                                                                                                                                                                                                                                                                         | Deferred in Project      |

### Product scope decisions

Historical product candidates are classified below as a linked Project issue, explicitly not
planned, or waiting for a concrete revisit signal.

- ~~User-facing StoryBlueprint selection in workshop~~ — **Not planned:** user-facing
  `genre` and `writing style` controls already express the meaningful narrative choice.
  StoryBlueprint remains an internal generation-quality mechanism; adding its own chooser
  would duplicate the Workshop UI.
- [Referral programme MVP](https://github.com/Shagon1k/TailorTales/issues/66): discovery
  covers reward economics, abuse controls, qualification, and whether rewards are a separate
  credit balance or expire with the next usage reset.
- ~~Public story gallery at `/tales`~~ — **Not planned for now:** the landing already shows
  opt-in 4–5-star stories. Reconsider only after the curated public sample in
  [#65](https://github.com/Shagon1k/TailorTales/issues/65) ships and there is enough safe,
  opt-in content to justify a real gallery; audit personalized PDF/reader privacy first.
- [Download library as a ZIP archive](https://github.com/Shagon1k/TailorTales/issues/67):
  one convenience download of currently retained, owned story PDFs, with a manifest for
  unavailable files. Separate from the GDPR JSON export.
- [Personalised Wonder Jar question suggestions](https://github.com/Shagon1k/TailorTales/issues/68):
  opt-in Workshop chips, 3 personalised + 3 generic after 6 completed stories; persisted
  locale sets refresh only after 7 days and 3 new stories, with English fallback for a new locale.
- [Moderated “From page X” excerpts during generation](https://github.com/Shagon1k/TailorTales/issues/69):
  short interior-page text previews enrich the existing progress screen only after moderation,
  with bounded plain text and the current UI as fallback.
- ~~Reader: per-page “About this page” generation-context panel~~ — **Not planned:** raw
  generation provenance is retained for regeneration and diagnostics but is not useful as
  default parent-facing reader content.
- [Guided page-regeneration UX](https://github.com/Shagon1k/TailorTales/issues/70): discovery
  defines reliable quick actions such as character, scene, colours, composition, and wording,
  while keeping an optional custom instruction and the quota cost visible.
- ~~Native mobile applications~~ — **Not planned:** the installable web app covers the
  current scope. [Contextual PWA installation promotion](https://github.com/Shagon1k/TailorTales/issues/71)
  will help engaged mobile users add it to their Home Screen.
- [Audio narration MVP](https://github.com/Shagon1k/TailorTales/issues/72): discovery
  bounds the Reader experience, voice/language quality, provider choice, cost, entitlements,
  storage, and regeneration lifecycle before implementation.
- ~~Print-on-demand integration~~ — **Not planned for now:** physical fulfilment, shipping,
  unit economics, and content-policy scope are premature without demonstrated demand.
- [French language support](https://github.com/Shagon1k/TailorTales/issues/73) is planned
  alongside Spanish (#41) and Italian (#43).
- ~~Further application languages~~ — **Not planned until demand:** create one focused
  language issue when usage or user requests justify it.
- ~~Public API for third-party integrations~~ — **Not planned until demand:** define an API
  only when a concrete consumer and integration contract exist.
- [Critical E2E smoke coverage](https://github.com/Shagon1k/TailorTales/issues/75): expand
  the bounded Playwright suite from its current public-navigation and authenticated-render checks.
- [Storybook component catalog](https://github.com/Shagon1k/TailorTales/issues/74): expose
  reusable UI and shared-component variants for discovery and isolated development.
- ~~A/B testing~~ — **Not planned until demand:** introduce experimentation only when traffic,
  a measurable product question, and a decision threshold justify it.
- ~~Advanced observability beyond the MVP baseline~~ — **Not planned until demand:** consider
  OpenTelemetry only when traffic or a concrete operational blind spot justifies the added
  system and maintenance cost. Trigger-based product analytics discovery is tracked in
  [#80](https://github.com/Shagon1k/TailorTales/issues/80).

### Human-control scope

These require an owner decision, external evidence, or content/legal judgement. Active work is
linked to its Project issue and uses `human-control` where continuous owner involvement applies.

- Merchant-of-Record replacement for Paddle — tracked in [#55](https://github.com/Shagon1k/TailorTales/issues/55).
- Sign in with Apple — tracked in [#59](https://github.com/Shagon1k/TailorTales/issues/59).
- Complete post-launch GDPR follow-up — tracked with human control in
  [#76](https://github.com/Shagon1k/TailorTales/issues/76): provider DPAs/contractual coverage,
  qualified legal review, real-account export/delete/public-share checks, and breach tabletop.
- ~~Dedicated image-moderation provider~~ — **Not planned unless evidence reveals a gap:**
  keep the current OpenRouter safety flags and evaluate another provider only after observed
  insufficient coverage.
- Photo/reference-image character likeness — tracked with human control in
  [#61](https://github.com/Shagon1k/TailorTales/issues/61): obtain legal approval, then define
  guardian consent, upload/delete UX, retention, and policy changes before implementation.
- Curated landing-page “Try a sample” story — tracked with human control in
  [#65](https://github.com/Shagon1k/TailorTales/issues/65): choose and approve the public sample
  before adding the unauthenticated reader route.

### Deferred scope

- [Email/password authentication](https://github.com/Shagon1k/TailorTales/issues/82) remains
  intentionally deferred. It introduces password storage, recovery, credential-stuffing
  protection, and a larger support/security surface. Reconsider only if product evidence shows
  that Google OAuth, magic links, and Apple OAuth do not cover the required parent login paths.

### Idea decisions

Historical ideas are classified below as a linked Project issue, folded into existing scope, or
explicitly not planned until evidence justifies reconsideration.

- ~~Workshop step-by-step wizard pagination~~ — **Not planned until evidence:** reconsider
  only if mobile usability testing or funnel data shows meaningful Workshop drop-off.
- ~~Family-plan upsell card in the readers dashboard~~ — **Not planned:** there is no separate
  family-plan product; entitlement and upgrade messaging should follow the plan model defined
  by [#63](https://github.com/Shagon1k/TailorTales/issues/63).
- ~~AI-flavoured workshop log descriptions during generation~~ — folded into
  [#69](https://github.com/Shagon1k/TailorTales/issues/69) as localized, stage-aware fallback
  copy before a moderated story excerpt becomes available; no extra AI call is used.
- [Approximate generation-time range](https://github.com/Shagon1k/TailorTales/issues/77):
  set expectations in Workshop Summary from the selected page count; the existing stage/page
  progress remains authoritative after generation starts.
- [Private family story links](https://github.com/Shagon1k/TailorTales/issues/78): one
  time-bounded, revocable, unlisted read-only link per completed story, kept separate from the
  public showcase opt-in.
- [Personalized-story competitor landscape](https://github.com/Shagon1k/TailorTales/issues/79):
  discovery delivers a dated, source-backed research artifact for owner review before pricing
  or feature-gap recommendations become active scope.

### In-code TODO history

> Historical lookup for TODO comments. No active source-code TODO/FIXME marker remains; the one
> uncompleted product idea is folded into the public-story-gallery candidate above.

| File                                                     | TODO summary                                                                                                                                            | Resolves in   |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| ~~`contact/_components/ContactSection/actions.ts`~~      | ~~Wire `submitContact` to real `POST /contact` endpoint~~ ✅ Phase 5 Increment 7b                                                                       | _Resolved_    |
| ~~`pricing/page.tsx`~~                                   | ~~Replace hardcoded plan data with `GET /pricing` (real PricingTier records)~~ ✅ Phase 9                                                               | _Resolved_    |
| ~~`(public)/_components/TalesSection/TalesSection.tsx`~~ | ~~Replace `MOCK_TALES` with public stories from `GET /stories/public`~~ ✅ Phase 11                                                                     | _Resolved_    |
| ~~`(public)/_components/TalesSection/TalesSection.tsx`~~ | ~~Add link to `/tales` (public story library page)~~ → Not planned: landing showcase exists; revisit only after #65 and sufficient safe opt-in content. | _Not planned_ |

---

## 10. Resolved historical questions

- ~~Backup strategy specifics for Postgres + S3 — confirm in Phase 15.~~ **Resolved (Phase 19):** daily external PostgreSQL dumps plus S3 versioning, a live 14-day retention policy matching the Privacy Notice, and a completed restore drill. Regional replication is outside the current backup strategy.
- ~~Notification preferences storage — `User` JSON field vs separate `NotificationPreference` model — decide in Phase 10.~~ **Resolved (Phase 10):** `User.notificationPreferences` JSON column; defaults merged in code.
- ~~Static page copy finalization.~~ **Resolved (Phases 17/19):** owner-reviewed public copy plus localized Privacy Notice and Terms are live.

---

## 11. Phase Plan

> Each phase below lists: **Goals → Sub-tasks → Acceptance Check → Deliverables**.
> Use the checkboxes for progress tracking.

---

### Phase 0 — Infrastructure & Foundation ✅

**Goal:** working dev environment, empty FE + BE skeletons, Docker-ready.

**Sub-tasks:**

- [x] Initialize monorepo: root `package.json`, `pnpm-workspace.yaml`
- [x] Create `backend/` (Nest.js scaffold), `frontend/` (Next.js scaffold)
- [x] Root scripts for `dev`, `build`, `lint`, `test` orchestrating both apps
- [x] `docker-compose.yml`: PostgreSQL, Redis, MinIO services with persistent volumes
- [x] `.env.example` files at root and per-app
- [x] `backend/Dockerfile` (multi-stage Node build, production-ready for dokploy)
- [x] `frontend/Dockerfile` (multi-stage Next build, production-ready for dokploy)
- [x] Prisma init in `backend/`, connect to PostgreSQL
- [x] Shared ESLint + Prettier config at root
- [x] Vitest setup in both `backend/` and `frontend/`
- [x] **Husky + commitlint** — pre-commit hook enforces Conventional Commits per [`.agent-docs/rules/git.md`](../../.agent-docs/rules/git.md). `prepare` script installs hooks on `pnpm install`.
- [x] Basic health-check endpoint in Nest (`GET /health`)
- [x] Basic landing page in Next
- [x] GitHub Actions workflow: install + lint + type-check + test on PR

**Acceptance Check:**

- `docker-compose up` brings up PG, Redis, MinIO without errors
- `pnpm dev` starts both Nest (default :3001) and Next (:3000) without errors
- `GET /health` returns 200
- `pnpm test` runs (even with empty suites) and exits clean
- Commit with invalid message is rejected by commitlint; valid Conventional Commit is accepted
- CI green on a no-op PR

**Deliverables:** durable-doc updates (architecture / api / guides, as relevant) + ROADMAP progress.

---

### Phase 1 — Users & Authentication ✅

**Goal:** users can sign in with Google, sessions work, admin role exists.

**Sub-tasks:**

- [x] Prisma `User` model: `id`, `email`, `googleId`, `name`, `avatarUrl`, `role (USER | ADMIN)`, `createdAt`, `updatedAt`
- [x] Prisma migration
- [x] Nest Auth module: Google OAuth strategy (Passport), callback handler, JWT issuance
- [x] Session via httpOnly cookies
- [x] Auth guard + `@CurrentUser()` decorator
- [x] Endpoints: `GET /auth/google`, `GET /auth/google/callback`, `POST /auth/logout`, `GET /me`, `PATCH /me`
- [x] Admin seed script (`pnpm seed:admin <email>`)
- [x] Frontend: login page with "Sign in with Google" button
- [x] Frontend: session context seeded from RSC (root layout fetches user server-side; no React Query needed at this phase)
- [x] Frontend: protected route wrapper, redirect to login if unauthenticated
- [x] Frontend: profile page (view + edit name)
- [x] Backend tests: auth flow, guards, user CRUD
- [x] Frontend tests: login button renders, protected route redirects

**Acceptance Check:**

- User can sign in via Google, lands on profile page
- Protected routes redirect unauthenticated visitors
- Logout clears session
- Admin role can be assigned via seed script
- Tests pass

**Deliverables:** durable-doc updates (architecture / api / guides, as relevant) + ROADMAP progress.

---

### Phase 2 — Children Management ✅

**Goal:** parents can manage multiple child profiles.

**Sub-tasks:**

- [x] Prisma `Child` model: `id`, `userId`, `name`, `birthdate`, `gender`, `interests (string[])`, `avatarUrl?` (reserved for Post-MVP), `createdAt`, `updatedAt`
- [x] Prisma migration
- [x] Children module: CRUD endpoints scoped to current user (`/children`)
- [x] Authorization: user can only access own children
- [x] DTO validation (name length, birthdate range, etc.)
- [x] Frontend: children dashboard (list)
- [x] Frontend: add/edit/delete child forms (Mantine)
- [x] Tests: ownership scoping, validation, full CRUD

**Acceptance Check:**

- User can add, edit, delete children
- Other users cannot access another user's children
- Validation blocks invalid input
- Tests pass

**Deliverables:** durable-doc updates (architecture / api / guides, as relevant) + ROADMAP progress.

---

### Phase 3 — Design System & Base Layout

**Goal:** establish the visual foundation — design tokens, Mantine theme, atom library, route-group layouts, static pages, account shell, and the `ArtStyle` entity — so all subsequent phases build on a consistent base.

> All TypeScript follows `.agent-docs/rules/typescript.md` (e.g. `IComponentNameProps`, explicit return types, no `React.FC`).
> All CSS follows `.agent-docs/rules/frontend-css.md` (tokens → Mantine theme → CSS Modules; semantic tokens only; `m-` modifiers).
> The "promotion rule" governs component location: start co-located, lift only when a second consumer needs the component.

**Sub-tasks:**

**Dependencies**

- [x] `@mantine/notifications@^9.2.1` — installed and in use (Toast atom)

**CSS architecture setup**

- [x] Migrate existing `src/app/globals.css` → `src/styles/globals.css`; update root layout import
- [x] `src/styles/tokens.css` — CSS custom properties: all primitives, semantic aliases, spacing, radii, shadows, gradients, motion tokens (`--duration-base`, `--ease-out`, `--focus-ring-color`, `--hit-min: 44px`)
- [x] `src/styles/globals.css` — imports `tokens.css`; global reset (existing); `prefers-reduced-motion` collapse rule; `:focus-visible` ring via `--focus-ring-color`
- [x] `src/theme/mantine.ts` — `createTheme()`: color scale from tokens, font families (Newsreader, Plus Jakarta Sans, Caveat, Geist Mono), border-radius scale, shadows, focus ring from `--focus-ring-color`
- [x] Wire theme into `src/app/providers.tsx` — `<MantineProvider theme={theme}>` (currently uses default theme)
- [x] Verify CSS cascade order: Mantine's `@mantine/core/styles.css` < `tokens.css` < CSS Module overrides via `classNames` (manual visual check on Button + Input)

**Route restructure (foundation for co-location)**

- [x] Rename `src/app/(auth-guard)/` → `src/app/(private)/` (matches `(public)` paired group; symmetry + intent-based naming)
- [x] Create `src/app/(public)/` route group with `layout.tsx` (imports `Header` + `Footer` from `shared/`)
- [x] Create `src/app/(private)/layout.tsx` (imports `Header` + `Footer` from `shared/`, wraps children with `AuthGuard`)
- [x] Create `src/app/(private)/account/layout.tsx` (sidebar shell — `_components/AccountSidebar/`)
- [x] `/login` stays at `src/app/login/page.tsx` (outside groups — no chrome, full-bleed split layout)
- [x] Migrate existing routes: move `(auth-guard)/profile/` → `(private)/account/profile/`, `(auth-guard)/children/` → `(private)/account/children/`

**Existing component migrations**

- [x] `src/components/Tag/` → `src/components/ui/Badge/` (rename + update imports — corresponds to Mantine `Badge` plan)
- [x] `src/components/AuthGuard/` → `src/app/(private)/_components/AuthGuard/` (only consumer is the private layout)
- [x] `src/components/ChildCard/` → `src/app/(private)/account/children/_components/ChildCard/`
- [x] `src/components/ChildForm/` → `src/app/(private)/account/children/_components/ChildForm/`
- [x] After all migrations: `src/components/` contains only `ui/` and `shared/`

**Shared structural components** (`src/components/shared/`)

- [x] `Header` — adapts nav links based on auth state (auth from `UserContext`); public: How it works · Pricing · Sign in · "Begin a tale →" CTA; private: Library · Workshop · `NotificationBell` · Avatar + plan name
- [x] `Footer` — BrandMark + tagline + "Privacy · Contact" links; identical across public and private layouts

**Mantine-based atoms** (`src/components/ui/`) — override visually via `classNames` + CSS Module:

- [x] `Button` — variants: `m-primary` (fox bevel gradient), `m-secondary` (outlined), `m-quiet` (text-only), `m-on-card` (cream on dark card); all hit-target compliant (44px)
- [x] `Card` (`Paper` base) — variants: `m-gradient` (warm cream, `--gradient-page`), `m-dark` (twilight, `--gradient-card-twilight`)
- [x] `Badge` — variants: `m-filled`, `m-warm` (ember), `m-gold`
- [x] `Rating` — star rating 1–5; uses `--accent-gold`
- [x] `Divider` — variants: `m-dashed`, `m-needle`
- [x] `Progress` — fill via `--gradient-progress` (ember → fox → gold)
- [x] `Avatar` — circular; fox bevel gradient border (`--gradient-fox-bevel`); 44px min
- [x] `Modal` — wraps Mantine Modal; dark overlay, `--bg-elevated` surface, focus trap
- [x] `Link` (`Anchor` base) — variants: `m-quiet`, `m-on-card`
- [x] `Toast` (`Notification` + `@mantine/notifications`) — variants: `m-success`, `m-error`, `m-warning`, `m-info`; auto-dismiss; glyph per variant; `notifications.show()` helper wrapper

**Form atoms** (`src/components/ui/`) — Mantine base, `classNames` slot override:

- [x] `Input` (`TextInput`) — label, input, helper, error slots; `aria-describedby` wired
- [x] `Textarea` (`Textarea`) — same slot pattern
- [x] `Select` (`Select`) — same slot pattern
- [x] `TagsInput` (`TagsInput`) — same slot pattern

**Custom CSS Module atoms** (`src/components/ui/`) — no Mantine base:

- [x] `CapsLabel` — `font: var(--font-mono)`, 11px, all-caps; variants: `m-on-card`, `m-gold`
- [x] `BrandMark` — SVG logo + wordmark lockup; consumer passes `href` so it stays domain-free
- [x] `StatCard` — stat value + label + delta; variants: `m-positive`, `m-negative`
- [x] `NotificationBell` — icon + unread count badge; visual shell at Phase 3 (no data wiring); full dropdown UI wires in Phase 10
- [x] `SuggestionChip` — pill-shaped tappable chip for workshop question suggestions (delivered in Phase 4)

**Static pages** (placed inside route groups — chrome comes from group's `layout.tsx`)

- [x] `src/app/(public)/page.tsx` — landing: hero, Three lanterns explainer (3-step cards), public stories grid (empty — wired in Phase 11), bottom CTA strip
- [x] `src/app/login/page.tsx` (existing — restyle): split layout (illustration left, auth card right); "Continue with Google" primary button; legal note
- [x] `src/app/(public)/how-it-works/page.tsx` — placeholder content
- [x] `src/app/(public)/pricing/page.tsx` — plan cards (Free Chapter, Story Hour, Family Workshop) + feature comparison table + FAQ section; monthly/yearly toggle; static/hardcoded data (wired to Paddle in Phase 9)
- [x] `src/app/(public)/privacy/page.tsx` — static
- [x] `src/app/(public)/contact/page.tsx` — static

**Account shell** (sub-pages placeholder until their respective phases)

- [x] `src/app/(private)/account/_components/AccountSidebar/` — sidebar nav with all sections (Profile [Phase 1 — existing], Children [Phase 2 — existing], Subscription [Phase 9], Notifications [Phase 10], Language [Phase 13], Privacy & data [Phase 9], Sign out [existing], Delete account [Phase 9])
- [x] `src/app/(private)/account/page.tsx` — redirects to `/account/profile` (or shows overview)
- [x] `src/app/(private)/account/subscription/page.tsx` — placeholder
- [x] `src/app/(private)/account/notifications/page.tsx` — placeholder
- [x] `src/app/(private)/account/language/page.tsx` — placeholder
- [x] `src/app/(private)/account/privacy/page.tsx` — placeholder

**Backend — ArtStyle entity**

- [x] Prisma `ArtStyle` model: `id`, `name`, `slug`, `thumbnailUrl`, `promptPrefix`, `isActive`, `order`, `createdAt`
- [x] Prisma migration for `ArtStyle`
- [x] Seed script: 8 art styles (Storybook, Watercolour, Crayon, Ink line, Felt-pen, Cut-paper, Soft 3D, Comic ink) with placeholder thumbnail URLs

**Tests**

Baseline rule: every atom ships with at least — render test, one test per variant, disabled / loading / error state where applicable. Layouts ship with nav link rendering test.

- [x] All atoms in `src/components/ui/` — apply the baseline above
- [x] `Header` — renders public links when unauthenticated, private links when authenticated, `NotificationBell` visible only when authenticated
- [x] `Footer` — renders Privacy + Contact links
- [x] `(public)/layout.tsx` and `(private)/layout.tsx` — render header + footer + children slot
- [x] `AccountSidebar` — renders all sidebar items in correct order
- [x] Migrated components (`Badge`, `AuthGuard`, `ChildCard`, `ChildForm`) — existing tests pass after path change
- [x] ArtStyle seed: 8 rows with correct slugs
- [x] Static pages (`/how-it-works`, `/pricing`, `/contact`, `/privacy`) — render smoke test: correct heading present, key elements render, no broken imports

**Acceptance Check:**

- `pnpm dev` runs frontend with new theme applied; no Mantine default colors visible
- Public routes (`/`, `/how-it-works`, `/pricing`, `/privacy`, `/contact`) render via `(public)` layout with Header + Footer
- Private routes (`/account/*`) render via `(private)` layout with private Header + Footer
- `/login` renders full-bleed split layout (no public/private chrome)
- Account sidebar shows all sections — each non-wired section displays a placeholder
- All 4 existing components migrated to new locations; their existing tests still pass
- ArtStyle seed populates 8 styles
- `pnpm test` passes; `pnpm type-check` passes; `pnpm lint` passes

**Deliverables:** durable-doc updates (architecture / api / guides, as relevant) + ROADMAP progress.

**Out of scope (explicit):** Mobile responsiveness — design system targets desktop at MVP; mobile breakpoints are post-MVP.

---

### Phase 4 — Story Entity & StoryBlueprints

**Goal:** data model for stories + StoryBlueprints, draft creation, workshop form, story reader (read-only), library grid. No generation yet.

**Sub-tasks:**

- [x] Prisma `Story` model: `id`, `userId`, `childId`, `type (BOOK | COMIC)`, `status (DRAFT | QUEUED | GENERATING | COMPLETED | FAILED)`, `blueprintId?`, `question`, `pageCount`, `artStyleId`, `language (Language enum)`, `title?` (LLM-generated), `isPublic (default false)`, `coverImageKey?`, `pdfKey?`, `createdAt`, `updatedAt`
- [x] Prisma `Page` model: `id`, `storyId`, `order`, `chapterTitle?`, `text?` (optional — book and comic pages may be illustration-only), `illustrations (JSON — array of { key, position }; stores S3 **keys**, never URLs — API maps key → signed URL at serve time, like `pdfKey`)`, `layout?`
- [x] Prisma `StoryBlueprint` model: `id`, `name`, `description`, `type`, `systemPrompt` (structured with XML markers e.g. `<intro_prompt>`, `<climax_prompt>` for multi-stage LLM guidance), `coverImageKey?`, `previewPageKeys (String[] default [])`, `createdById`, `createdAt`, `updatedAt`
- [x] Prisma migrations
- [x] Storage module: S3 abstraction (MinIO for dev/UAT, AWS S3 for prod) — upload, get signed URL, delete
- [x] Stories module: CRUD (draft create, list user's stories, get by id, delete)
- [x] StoryBlueprints module: list (public to all users), CRUD (admin only)
- [x] `SuggestionChip` atom — pill-shaped tappable chip for workshop question suggestions
- [x] Frontend types: `story.types.ts`, `story-blueprint.types.ts`, `art-style.types.ts`
- [x] Frontend API layer: `stories.ts`, `stories.server.ts`, `story-blueprints.ts`, `art-styles.ts`
- [x] Seed script: at least 1 BOOK and 1 COMIC StoryBlueprint (required by Phase 5 auto-selection; coverImageKey + previewPageKeys left null/empty until Post-MVP upload flow)
- [x] Frontend: `/workshop` — single scrollable creation form (NOT a wizard):
    - Child reader selector (loads user's children)
    - Question text input + 6 static suggestion chips
    - Format selector (Book / Comic) with credit cost display
    - Length selector (5 / 8 / 12 / 16 / 20 pp) with credit cost and remaining balance
    - Art style grid (loaded from `ArtStyle` DB, thumbnails displayed)
    - Language selector (EN active; RU active; others "coming soon")
    - Sticky right panel: live summary (Reader, Format, Length, Style, Language, Credits X/Y) + "Light the lantern →" CTA + "Save as draft" link
- [x] Frontend: `/library` dashboard page (partial):
    - Greeting + tonight's tale (one static suggestion)
    - "Your readers" child cards with "+ New tale" quick action
    - "Your library" tale grid with filter chips (All / For [Child] / Books / Comics)
    - Stats bar stubbed (zeros until Phase 9 wires subscription data)
    - "In the Workshop" strip placeholder (wired in Phase 5)
- [x] Frontend: `/library/[storyId]` story reader (read-only at this stage):
    - Breadcrumb + page header (title, subtitle, Download PDF stub)
    - Chapter list (left panel)
    - Spread viewer with navigation (center)
    - Details panel (right — created, reader, format, style, language, file size)
    - Regeneration and rating panels rendered but inactive (wired in Phases 8 and 11)
- [x] Admin frontend: StoryBlueprint CRUD UI
- [x] Tests: Story CRUD, scoping, draft lifecycle, StoryBlueprint admin-only create, workshop form renders and submits

**Acceptance Check:**

- User can save a DRAFT story via the workshop form
- Art styles load from DB in the form
- Admin can CRUD StoryBlueprints
- Stories scoped per user; StoryBlueprints publicly listable
- Story reader renders chapter list and spread viewer
- Tests pass

**Deliverables:** durable-doc updates (architecture / api / guides, as relevant) + ROADMAP progress.

---

### Phase 5 — Generation Pipeline (Book)

**Goal:** end-to-end **book** generation from DRAFT to downloadable PDF with real-time per-page progress. Comic generation is deferred (see Deferred Decision #6) — the engine is built so comics slot in additively (comic templates + a panel contract), no refactor.

> **Architecture decisions locked in planning (2026-05-29):**
>
> - **Single AI provider — OpenRouter for both text and images.** One `AiClient`, one `OPENROUTER_API_KEY`, two configurable models (`OPENROUTER_TEXT_MODEL`, `OPENROUTER_IMAGE_MODEL`). Images are requested via the chat-completions endpoint with `modalities: ["image"]` and returned as base64 → we upload the bytes to storage ourselves. **DALL-E / OpenAI SDK dropped.**
> - **Default text model: `google/gemini-2.0-flash-001`** — chosen for cost-effectiveness (~$0.075/M input tokens), speed, strong Russian support, and native JSON Schema structured output via OpenRouter. Not Anthropic by preference. Model is overridable via `OPENROUTER_TEXT_MODEL`. Story plan generation uses `response_format: { type: 'json_schema' }` so the model is structurally constrained to return `IStoryPlan` — no guessing, no unstructured repair needed. Zod-free manual validation in the pipeline acts as a second layer.
> - **The PageTemplate config is the contract.** `page-templates.config.ts` is the single source of truth for the prompt builder, the response validator, and the PDF renderer. Image `size` (pixel dimensions) and `maxChars` are **per-template**, never global, never emitted by the LLM.
> - **The LLM is a dramaturge, not a typesetter.** It returns a **Story Plan**: per page it picks a `template` (a narrative choice — each template carries a `narrativePurpose` that guides _when_ to use it), writes the `text`, and writes the `illustration.prompt`. It does **not** emit size/aspect (looked up from the template) or character counts (measured by us).
> - **Constrained template choice.** Code fixes invariants (page 1 = a `cover` template, last = a `final` template, total count = requested); the LLM picks interior templates from the allowed set; the validator enforces the walls.
> - **Bounded text-length policy (no infinite loops).** Prompt states per-template limits → `max_tokens` ceiling computed from a per-language chars/token config (EN ≈ 4, RU ≈ 2) as a runaway guard → validate → **one** repair retry on overflow → else truncate at sentence boundary → CSS auto-fit safety net. Max 2 LLM calls, then deterministic.
> - **One BullMQ job per story**, internal per-page **image** fan-out capped at ~3–4 concurrent (text is a single structured call, so only images parallelize). Multi-worker / FlowProducer deferred (Deferred Decision #7).
> - **Stub AI providers** (`USE_AI_STUBS=true`) return canned text + placeholder images so the full pipeline (and CI) runs offline with zero spend.
> - **Pages stay in the DB.** Page rows are the materialized, validated Story Plan and the source the PDF is rendered from — required for Phase 8 single-page regeneration + PDF re-stitch and for the in-browser reader. The PDF is a derived artifact.
> - **StoryBlueprint** (already built + seeded) is auto-selected by story type to supply the narrative system prompt. User-facing blueprint selection stays Post-MVP.
> - **Watermark is always-on in Phase 5.** No `Subscription` / `PricingTier` exists until Phase 9, so every PDF is treated as free-tier and watermarked. Phase 9 wires the real `PricingTier.watermark` flag.
> - **`Job.type` = `generation | regeneration`** (regeneration jobs arrive in Phase 8, same queue). **Story status transitions** the pipeline drives: `DRAFT → QUEUED` (on enqueue) `→ GENERATING` (worker picks up) `→ COMPLETED` (PDF stored) or `→ FAILED` (any stage error).

**Schema deltas (minimal):**

- [x] Prisma `Job` model: `id`, `storyId`, `type (generation | regeneration)`, `status`, `progress`, `stage`, `error?`, `attempts`, `createdAt`, `updatedAt`
- [x] Prisma `Notification` model: `id`, `userId`, `type`, `payload (Json)`, `readAt?`, `createdAt` (created here; Phase 10 builds the UI + preferences on top)
- [x] `Page.illustrationPrompt String?` — prompt used to paint the page (provenance now, Phase 8 regen later)
- [x] `Story.styleAnchor String?` — recurring-character + style description, for consistent images across pages and on regeneration
- [x] Prisma migrations for all of the above

**Increment 1 — Foundation (verify: boots + Redis connects):**

- [x] Install deps: `bullmq`, `@nestjs/bullmq`, `handlebars`, `puppeteer`, `pdf-lib`, `resend` (no `openai` SDK — OpenRouter via native `fetch`)
- [x] BullMQ module wired to Redis (`REDIS_URL`)
- [x] Env: `OPENROUTER_API_KEY`, `OPENROUTER_TEXT_MODEL`, `OPENROUTER_IMAGE_MODEL`, `RESEND_API_KEY`, `RESEND_FROM`, `USE_AI_STUBS`, `REDIS_URL`

**Increment 2 — PDF renderer, no AI (verify: a fixture Story Plan → real A5 PDF):**

- [x] `rendering/page-templates.config.ts` — `Record<string, IPageTemplate>` keyed by template name. Per entry: `htmlFile`, `type`, `role (cover|interior|final)`, `narrativePurpose`, `maxChars` (plain object keyed by zone name), `images: [{ name, aspect, size }]` with pixel dimensions matched to each template's display area. `book-*` defined; `comic-*` Post-MVP stubs.
- [x] Handlebars **base partial** (`_base.hbs`): `<!DOCTYPE>`, `@page { size: 148mm 210mm }`, reset, shared CSS vars; templates include the base and define only their unique layout
- [x] 5 `book-*` Handlebars templates (`book-cover`, `book-text`, `book-text-image`, `book-full-image`, `book-final`) with CSS auto-fit overflow safety net
- [x] **Self-host fonts** (Nunito, Comfortaa `.woff2`) locally in the repo — no CDN fetch at render time; wait for `document.fonts.ready` before printing (deterministic PDFs)
- [x] `PdfRendererService` — resolve template by `Page.layout`, inject data via Handlebars, Puppeteer renders each page to A5 PDF, pdf-lib stitches; free-tier watermark overlay
- [x] 2–3 placeholder illustrations + 3 canned Story Plan fixtures (drive validator + renderer tests offline)

**Increment 3 — AI client + stubs:**

- [x] `ai/AiClient` — `generateStoryPlan()` (JSON output) + `generateImage({ prompt, styleAnchor, referenceImageKeys? })` (reference-image param is a Post-MVP seam, unimplemented). OpenRouter via `fetch`; exponential backoff, 3 retries, 4xx fails immediately
- [x] `ai/AiStubClient` behind `USE_AI_STUBS` — deterministic text + placeholder images
- [x] Tests for both (mocked transport)

**Increment 4 — Pipeline + Job service (verify: stub run → stored PDF, status COMPLETED):**

- [x] 1-concurrent-story enforcement: active job check before enqueue → 409 if one exists
- [x] **Stage: Planning** — auto-select StoryBlueprint by type → build prompt (artStyle.promptPrefix + styleAnchor + per-template constraints + dramaturgy guidance + **child age** for age-adaptive vocabulary/complexity + **target language** so the story text is written in EN/RU; language handling refined in Phase 13) → `generateStoryPlan()`
- [x] **Validation** — template exists + allowed for type, structural invariants (cover/final/count), per-template text limits (bounded repair → truncate), image count per template; persist as `Story.title`, `Story.styleAnchor`, `Page` rows
- [x] **Stage: Moderation (silent)** — LLM text moderation immediately after planning, _before_ spending on images; image safety via provider flags. Unsafe → FAILED with reason
- [x] **Stage: Pictures** — per-page image generation, capped concurrency; upload bytes → store key on `Page.illustrations`
- [x] **Stage: Binding** — `PdfRendererService` stitches the document
- [x] **Stage: Ready** — upload PDF, store `pdfKey` + `coverImageKey`; Story → COMPLETED
- [x] Failure handling: any stage error → Story FAILED, error stored on Job, surfaced to user

**Increment 5 — SSE + workshop routing:**

- [x] `GET /stories/:id/progress` — streams stage transitions + **one event per page as its image completes** (drives the per-page UI)
- [x] `/workshop` routing: active job → redirect to `/workshop/[jobId]`; else show form

**Increment 6 — Frontend:**

- [x] `/workshop/[jobId]` progress page: fox + progress bar; stage row **Planning → Pictures → Binding → Ready** (Outline/Words shown as cosmetic sub-ticks inside Planning); "Pages so far" grid (thumbnail lights up per image-completion event, active page glows); workshop log (LIVE); "Close safely" email banner
- [x] "In the Workshop" strip on `/library` (active job)
- [x] Download PDF button on reader for COMPLETED stories
- [x] Workshop Book/Comic toggle: **Comic shows "coming soon"** (disabled path) until comic generation ships
- [x] Workshop summary credit cost/balance: **stays stubbed** (`CREDIT_COST = 5` / `STUB_REMAINING = 60`) — real balance is Phase 9

**Increment 7 — Notifications + contact + docs:**

- [x] Email on `story_completed` (Resend) + bell `Notification` record
- [x] Bell `Notification` on `story_failed` (+ email)
- [x] `ResendClient` module (expanded in Phase 10)
- [x] `POST /contact` endpoint — resolves Deferred Decision #4; wire the Phase 3 frontend Server Action stub
- [x] Tests: planning/validation/moderation/pictures/binding stages (stubbed AI), SSE events, 1-concurrent 409, failure handling

**Acceptance Check:**

- User submits workshop form → redirected to generation page → sees per-page real-time progress → story completes → PDF downloadable
- Second generation attempt while one is active returns 409
- Failed stories surface error to user
- Free-tier PDFs are watermarked
- User receives email on completion (+ bell record)
- Comic option is visibly "coming soon", not selectable
- Tests pass (full pipeline runs under `USE_AI_STUBS` in CI)

> **Stub vs. live verification:** CI and local runs use `USE_AI_STUBS` — the full pipeline, 409, failure handling, watermarking, and PDF assembly are all verifiable offline, but stub generation completes near-instantly (the per-page progress UX is best _observed_ against real generation). The two checks that require live credentials are **real story generation** (OpenRouter key) and **email on completion** (Resend key) — these are manual/integration checks, not CI.

**Deliverables:** durable-doc updates (architecture / api / guides, as relevant) + ROADMAP progress.

**Out of scope (explicit):** Comic generation (Deferred #6); real credit balance (Phase 9); photo/reference-image character likeness (Post-MVP); notification preferences + bell UI (Phase 10).

---

### Phase 6 — Human Verification & Bug Fixing

**Goal:** the developer runs the full app end-to-end and exercises everything built in Phases 1–5 (UI + backend + generation pipeline) against real usage. Bugs found are logged, triaged, and fixed before the system is documented. This is a **human-driven QA gate**, deliberately placed _before_ Mid-point Documentation so the docs describe a verified, stable system rather than a buggy snapshot.

> Why before documentation: documenting first means every bug fix afterward forces a doc edit. Verify → fix → then document the stable state. This phase is the natural checkpoint where the core happy path (auth → children → workshop → generation → PDF) is exercised as a whole for the first time.

**Sub-tasks:**

- [x] Developer walkthrough of the full happy path: sign in → add child → workshop form → generate a book (real OpenRouter + Resend keys) → live progress → download PDF → read in-browser → rate/regenerate panels present
- [x] Cross-cutting UI review: every page/route renders, navigation (public + private headers, account sidebar), responsive-at-desktop, focus states, toasts, empty/loading/error states
- [x] Backend review: error responses + status codes, ownership scoping (cross-user access blocked), 1-concurrent 409, SSE stream behavior, failure handling (FAILED stories surface errors), signed-URL expiry
- [x] Generated-output quality pass: PDF layout per template (fonts, margins, image fit, text overflow safety net), watermark present, cover/final pages, age/language adaptation sanity check
- [x] Log every issue in a triage list with severity (blocker / major / minor / polish) and area (FE / BE / pipeline / content)
- [x] Fix all blocker + major issues; defer minor/polish to a tracked list (propose ROADMAP Deferred entries for anything not fixed, with developer approval)
- [x] Each fix is a focused commit referencing the issue; add a regression test where the bug had test-coverage value
- [x] Re-run the full automated suite (`pnpm test`, `type-check`, `lint`) green after fixes

**Acceptance Check:**

- The full happy path completes against the real app with no blocker/major bugs open
- Every triaged issue is either fixed or explicitly deferred with developer sign-off
- Automated suite green after fixes
- The QA triage (issues found, fixes applied, deferrals with rationale) is captured in the Phase 6 commit history and the ROADMAP Deferred entries (#8)

**Deliverables:** durable-doc updates (architecture / api / guides, as relevant) + ROADMAP progress.

---

### Phase 7 — Mid-point Documentation

**Goal:** consolidate what was built in Phases 1–6 into coherent, durable documentation for both developers and AI. The core happy path is built and verified at this point — good moment to document the system as a whole before adding complexity.

**Sub-tasks:**

- [x] Establish the durable-docs structure
- [x] Architecture overview docs
- [x] API reference
- [x] Developer onboarding + external-services guides
- [x] Remove per-phase `_docs/phase-N-*.md` scaffolding
- [x] Sweep `AGENTS.md` + `.agent-docs/rules/*.md`
- [x] Verify `DESIGN.md` and `ROADMAP.md`

**Acceptance Check:**

- A new developer can clone the repo, follow the onboarding guide, and run the full stack locally without assistance
- The durable docs (`architecture/`, `api/`, `guides/`) accurately describe the system as built; no `phase-N` docs remain in `_docs/`
- `AGENTS.md` and rules files updated with any new conventions discovered
- Architecture overview covers all major system components

**Deliverables:** durable-doc updates (architecture / api / guides, as relevant) + ROADMAP progress.

---

### Phase 8 — Character Consistency & Page Regeneration ✅

**Goal:** users get consistent character appearance across generated pages/stories, and can regenerate specific pages within tier limits with an optional prompt.

**Sub-tasks:**

- [x] Prisma `Character` model: `id`, `userId`, `childId?`, `name`, `description`, `source (MANUAL_DESCRIPTION at MVP)`, `generatedPreviewImageKey?`, `createdAt`, `updatedAt`
- [x] Prisma migration; add `Story.characterId?` for provenance while keeping `Story.styleAnchor` as the immutable per-story visual snapshot
- [x] Character module: CRUD endpoints scoped to current user; child default character lookup for story creation
- [x] Frontend: `/account/children` character description field/section
- [x] Frontend: workshop summary shows the selected child's Character and lets the user edit/confirm the description before generation
- [x] Generation prompt: build `Story.styleAnchor` from Character + ArtStyle + story context; store the snapshot once and prepend it to every image prompt, including regenerated pages
- [x] Optional preview generation: `POST /characters/:id/preview`
- [x] Endpoint: `POST /stories/:id/pages/:order/regenerate` with body `{ what: 'text' | 'illustration' | 'both', prompt?: string }`
- [x] Track regenerations per User per month; enforce free-tier placeholder limit (Phase 9 migrates to `Subscription`)
- [x] Re-render PDF after page regeneration, replace S3 file
- [x] Frontend: `RegenerationPanel` in story reader — Regenerate text / Repaint illustration / Remake everything, optional author note; quota count stubbed (Phase 9)
- [x] Tests: `regeneration.service.spec.ts` — flow, optional prompt, quota enforcement
- [x] Tests: `characters.service.spec.ts` — CRUD, ownership, child default Character selection, `styleAnchor` snapshot stability
- [x] FAILED stories surfaced in library with badge + "Try again →" link _(resolves Deferred #8)_
- [x] Iframe-based page preview: `GET /stories/:id/pages/:order/html` + `StoryPageIframe` component _(resolves Deferred #9)_
- [x] Workshop pre-fills all fields when retrying a failed story via `?storyId=`

**Acceptance Check:**

- A story generated for the same child uses the child's Character description as the canonical recurring visual identity
- Editing a Character after story creation does not mutate existing stories; new stories use the updated Character
- User can regenerate text / illustration / both for a page
- Optional prompt is respected in regenerated output
- Quota tracked and enforced (at least with free-tier placeholder)
- PDF updates correctly
- Tests pass

**Deliverables:** `_docs/phase-8-character-regeneration.md` + ROADMAP progress.

---

### Phase 9 — Subscriptions (Paddle) 🟡

**Goal:** users can subscribe, quotas are enforced per plan, billing details visible in account settings, account deletion supported.

**Sub-tasks:**

- [x] Prisma `PricingTier` model: `id`, `name`, `paddleProductId`, `priceMonthly`, `pagesPerMonth`, `regenerationsPerMonth`, `childrenLimit`, `retentionDays`, `watermark (bool)`
- [x] Prisma `Subscription` model: `id`, `userId`, `pricingTierId`, `paddleSubscriptionId`, `status`, `currentPeriodEnd`, `pagesUsed`, `regenerationsUsed`
- [x] Prisma migrations
- [x] Paddle integration: checkout link generation, webhook handler (created, updated, canceled, payment_failed)
- [x] Quota service: validate pages + regenerations against subscription before allowing operations
- [x] Quota service: deduct page credits on generation completion (1 per book page, 2 per comic page)
- [x] Migrate regeneration quota from `User` MVP fields to `Subscription`: replace `User.regenerationsInWindow` + `User.regenerationWindowStartedAt` + `FREE_TIER_REGENERATION_LIMIT` with `Subscription.regenerationsUsed` + `PricingTier.regenerationsPerMonth`; window-reset logic in `RegenerationService` disappears — Paddle webhook owns the cycle. Drop the two `User` columns in a migration.
- [x] Children limit enforcement: `childrenLimit` from PricingTier enforced in children endpoint (backfills Phase 2's uncapped endpoint)
- [x] GDPR data export endpoint: `GET /me/export` returns user profile, children, characters, stories metadata, pages, ratings, notifications, subscription state, and signed links to generated PDFs/images that still exist
- [x] `DELETE /me`: cancel active Paddle subscription (if any), delete DB rows, and delete all owned S3 objects (`coverImageKey`, `pdfKey`, page illustrations, Character previews/reference images when present)
- [x] Storage cleanup audit: hard-delete orphaned generated assets when a Story/Child/User is deleted; log expected vs actual object delete counts
- [x] Retention cleanup job (cron): delete PDFs and generated images past tier `retentionDays`; preserve metadata only when legally/operationally needed and documented
- [x] Privacy & data copy: state what personal/child data is collected, why it is processed, sub-processors, retention, export/delete rights, and reference-image handling policy before the feature exists
- [x] Frontend: `/account` → Subscription section wired:
    - Current plan card (name, billing, description, next renewal, VAT breakdown)
    - Usage bars: pages painted X/Y · regenerations X/Y · children profiles X/Y
    - Payment details section (card "Change" → Paddle billing portal; billing email / address / Tax ID displayed from Paddle API)
    - Past parcels list (invoice history from Paddle API)
    - Upgrade / Cancel subscription actions
- [x] Frontend: `/account` → Privacy & data section: GDPR info, "Export my data", and "Delete account" flow with explicit irreversible-delete confirmation
- [x] Frontend: stats bar on `/library` dashboard wired (pages this month / left / regenerations / tales count)
- [x] Frontend: regeneration quota count wired in story reader (was stubbed in Phase 8)
- [x] Frontend: workshop length section helper text wired ("N pages will use N of your N remaining credits this month." — depends on subscription quota API; currently absent from UI)
- [x] Frontend: `/pricing` page wired to real PricingTier data (replaces Phase 3 static hardcoded data — ships in Phase 9)
- [x] Tests: webhook handling, quota enforcement, children limit, retention cleanup, account export, account deletion DB + S3 cleanup flow

**Acceptance Check:**

- User can subscribe via Paddle
- Quotas enforced before generation and regeneration
- Children limit enforced per plan
- Account export returns the user's structured data and links to retained files
- Account deletion cancels subscription and removes all user data plus owned generated assets
- Free-tier PDFs expire per retention policy
- Tests pass

**Deliverables:** `_docs/phase-9-subscriptions.md` + ROADMAP progress.

---

### Phase 10 — Notifications

**Goal:** full notification preferences UI, in-app bell wiring, subscription event emails.

> Note: story_completed and story_failed notifications (email + bell record) already ship in Phase 5.
> This phase adds: all remaining event types, user preferences, and the bell UI.
>
> **Phase 6 shim (remove in this phase):** `GET /notifications/unread-count` + 30s polling in `Header.tsx` were added as a minimal Phase 6 verification shim. Replace both with the SSE approach below.

**Real-time delivery — SSE (not polling):**
The bell must update instantly, not on a 30s timer. Use SSE: add a `GET /notifications/stream` endpoint that holds an open connection per authenticated user. When `NotificationsService` creates any `Notification` record, it pushes a `{ type: 'unread-count', count: N }` event on that user's open connection. The frontend replaces the polling `useEffect` with an `EventSource` pointed at `/notifications/stream`; on each event it updates `unreadCount` in state. The existing SSE infrastructure in `StoriesModule` (`GET /stories/:id/progress`) is the reference implementation. The `GET /notifications/unread-count` REST endpoint added in Phase 6 can remain as a fallback for initial page load (before the SSE connection opens).

**Sub-tasks:**

- [x] `Notification` model — **created in Phase 5** (story_completed / story_failed bell records). This phase builds the module (endpoints), the bell UI, and preferences on top of it; no new model.
- [x] Notifications module: list (`GET /notifications`), mark-as-read (`PATCH /notifications/:id/read`), mark-all-read endpoints, `GET /notifications/stream` (SSE — real-time bell updates)
- [x] Subscription event notifications (emit on Paddle webhook events): payment_failed (bell + email), subscription_canceled (bell + email), subscription_renewed (email only)
- [x] Resend email templates for all remaining event types
- [x] Frontend: private header — wire notification bell (was shell in Phase 3):
    - Dropdown showing last 20 notifications
    - Unread badge count
    - Mark-as-read on open / individual mark-as-read
    - "Mark all as read" action
- [x] Frontend: `/account` → Notifications section wired: per-event toggles (email vs in-app on/off)
- [x] User notification preferences stored on `User` or separate `NotificationPreference` model (decide at implementation) — chose `User.notificationPreferences` JSON column
- [x] Tests: notification creation, email sending (mocked), mark-as-read, preferences respected

**Acceptance Check:**

- Bell shows unread count; dropdown lists recent notifications
- Subscription events trigger correct email + bell combinations
- User can toggle notification preferences per event type
- Tests pass

**Deliverables:** `_docs/phase-10-notifications.md` + ROADMAP progress.

---

### Phase 11 — Ratings & Public Sharing ✅

**Goal:** users can rate completed stories; opt-in public stories appear on the landing page.

**Sub-tasks:**

- [x] Prisma `Rating` model: `id`, `storyId`, `userId`, `score (1-5)`, `comment?`, `createdAt` (+ `updatedAt`, unique `[storyId, userId]`)
- [x] Endpoint: `POST /stories/:id/rating` (upsert — one per user per story); accepts `{ score, comment?, isPublic? }`
- [x] `isPublic` in rating payload mirrors onto `Story.isPublic` (set true **or** false — allows retract); left untouched when omitted
- [x] `GET /stories/public` — list of public stories (already shipped earlier; now includes owner `rating` score)
- [x] `GET /admin/ratings` (admin only)
- [x] Frontend: wire rating panel in story reader right panel (was inactive in Phase 4):
    - 1–5 star input
    - Optional comment textarea
    - "Share this story as an example for other families" opt-in toggle
    - "Save rating" button (pre-fills from existing rating; inline saved/error status)
- [x] Frontend: `/` landing page — wire public stories grid (was empty in Phase 3); hidden when no public stories
- [x] Frontend: custom `not-found.tsx` page (already shipped in an earlier phase)
- [x] Admin: manage `Story.isPublic` visibility (override/retract) — `PATCH /stories/:id/public` (AdminGuard); admin UI in Phase 12
- [x] Tests: rating upsert behavior, isPublic propagation, public story list, admin rating view

**Acceptance Check:**

- User can rate a completed story
- Opting in makes the story appear on the landing page public grid
- Admin can view all ratings and manage public visibility
- Tests pass

**Deliverables:** `_docs/phase-11-ratings.md` ✅ + ROADMAP progress.

---

### Phase 12 — Admin Panel

**Goal:** admin can manage users, review stories, manage templates and art styles, view stats.

**Sub-tasks:**

- [x] Admin-only frontend route group with auth guard
- [x] User management: list, suspend, change role
- [x] Story moderation queue: list flagged/reported stories, mark as reviewed, force-delete, toggle `isPublic`
- [x] StoryBlueprints UI (polish Phase 4 implementation)
- [x] ArtStyle management UI: list, create, edit (name, slug, thumbnail, promptPrefix), activate/deactivate, reorder
- [x] **Art style sample thumbnails:** "Generate thumbnail" action per style in the admin UI — calls the image model with `{promptPrefix} + fixed mascot prompt` ("a friendly fox character, full body, white background"), stores result as a public S3 object (no signing needed — same image for all users), saves URL to `ArtStyle.thumbnailUrl`. Seed all 8 styles on first run. Thumbnails are static per style; re-generate only when `promptPrefix` changes.
- [x] Ratings + feedback view (list all ratings from Phase 10)
- [x] Stats dashboard: counts (users, stories, active subs), revenue from Paddle API
- [x] Tests: admin auth guard, all admin endpoints

**Acceptance Check:**

- Admin can do all the above
- Non-admins blocked from admin routes
- Tests pass

**Deliverables:** `_docs/phase-12-admin.md` ✅ + ROADMAP progress.

---

### Phase 13 — Localization (EN + RU)

**Goal:** UI in EN/RU, generated content in EN/RU.

**Sub-tasks:**

- [x] Frontend: `next-intl` setup, EN + RU translation files
- [x] `/account` → Language section wired: EN / RU switcher (persists to `User.language Language` if logged in, else cookie — reuses `Language` enum already defined in Phase 4)
- [x] Backend: localized error messages via Accept-Language header
- [x] Generation: `language` param drives LLM output language (already passed in `customization` JSON — ensure prompts are language-aware)
- [x] Translate all existing UI strings to RU
- [x] Paddle checkout: pass `locale` to `PADDLE_CHECKOUT_SETTINGS` (`frontend/src/lib/paddle.ts`) from the active UI language — Paddle overlay supports localized checkout UI
- [x] Tests: language switching, localized errors, generated content in correct language

**Acceptance Check:**

- UI switches between EN/RU
- Generated stories respect language param
- Tests pass

**Deliverables:** `_docs/phase-13-localization.md` + ROADMAP progress.

---

### Phase 14 — Final Documentation

**Goal:** bring all documentation to launch-ready quality. Everything is built; nothing is deployed yet. Last chance to capture what was actually built before the codebase is live and changing under load.

**Sub-tasks:**

- [x] Ops runbook: deployment procedure, rollback steps, env variable reference (all vars across all services), health check endpoints
- [x] Monitoring & alerting guide: log structure (Pino), what to watch, how to diagnose common failures
- [x] Backup strategy doc: Postgres backup schedule + restore procedure, S3 versioning policy
- [x] Final sweep of all durable docs (`_docs/architecture/`, `api/`, `guides/`, `decisions/`): verify accuracy, update any commands or configs that changed during later phases
- [x] Final sweep of `AGENTS.md` + all `.agent-docs/rules/*.md`: incorporate all patterns and lessons from Phases 7–13; propose updates for developer approval
- [x] Final review of `DESIGN.md`: confirm it matches what was actually built (no deferred items silently dropped)
- [x] Final review of `ROADMAP.md`: move completed items to ✅, update open questions, archive resolved deferred decisions
- [x] Update the architecture docs to reflect the full system including Phases 7–13 additions
- [x] GDPR launch review: verify privacy policy copy, sub-processors, cookies, account export/delete, S3 retention cleanup, public-story opt-in consent, and child/reference-image handling against production behavior

**Acceptance Check:**

- Ops runbook covers full deployment from zero to live
- All durable docs accurate and complete through Phase 13
- `AGENTS.md` and rules files reflect all conventions established across the full build
- `ROADMAP.md` accurately reflects the shipped product
- GDPR launch checklist is complete or explicitly blocked before production deploy

**Deliverables:** `_docs/phase-14-final-docs.md` + ROADMAP progress.

---

### Phase 15 — Analytics & Monitoring ✅

**Goal:** add observability and product analytics before production deploy — error tracking, APM, uptime monitoring, and Google Analytics with a GDPR-compliant cookie consent banner. No separate staging doc; durable setup guides land in `_docs/guides/external-services.md`, runtime observability in `_docs/guides/monitoring.md`, and env vars in `_docs/guides/environment-variables.md`.

> **Implementation note (diverged from original plan):** New Relic Synthetics is the single
> MVP uptime owner (two locations + email workflow), avoiding a duplicate Sentry uptime alert.
> New Relic loads via `NODE_OPTIONS="--import newrelic/esm-loader.mjs --require newrelic"`: the
> loader supports the ESM backend and `--require` starts the agent. There is no
> `NEW_RELIC_ENABLED` flag; presence of `NODE_OPTIONS` is the gate. GA4 ships via
> `@next/third-parties/google` with a `useSyncExternalStore` consent gate.

---

#### Tools

| Tool                   | Purpose                                                              | Free tier           |
| ---------------------- | -------------------------------------------------------------------- | ------------------- |
| Sentry                 | Error tracking — backend exceptions + frontend JS errors             | 5k errors/month     |
| New Relic              | APM + two-location synthetic uptime check + email workflow           | 100 GB/month ingest |
| Google Analytics (GA4) | Product analytics — page views, consent-aware funnels, and retention | Free                |
| Cookie consent banner  | GDPR-required gate before GA loads                                   | —                   |

#### Env var model

| Variable                         | Dev          | UAT                                                   | Prod                                                  |
| -------------------------------- | ------------ | ----------------------------------------------------- | ----------------------------------------------------- |
| `SENTRY_ENABLED`                 | `false`      | `true`                                                | `true`                                                |
| `SENTRY_DSN`                     | —            | shared DSN                                            | shared DSN                                            |
| `SENTRY_ENVIRONMENT`             | —            | `uat`                                                 | `production`                                          |
| `NEXT_PUBLIC_SENTRY_ENABLED`     | `false`      | `true`                                                | `true`                                                |
| `NEXT_PUBLIC_SENTRY_DSN`         | —            | shared DSN                                            | shared DSN                                            |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | —            | `uat`                                                 | `production`                                          |
| `SENTRY_AUTH_TOKEN`              | —            | BuildKit secret                                       | BuildKit secret                                       |
| `NODE_OPTIONS`                   | —            | `--import newrelic/esm-loader.mjs --require newrelic` | `--import newrelic/esm-loader.mjs --require newrelic` |
| `NEW_RELIC_LICENSE_KEY`          | —            | shared key                                            | shared key                                            |
| `NEW_RELIC_APP_NAME`             | —            | `TailorTales-UAT`                                     | `TailorTales-Prod`                                    |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`  | — (disabled) | — (disabled)                                          | `G-XXXXXXXXXX`                                        |

`SENTRY_AUTH_TOKEN` is build-time only (source map upload) — set it in the Dokploy Compose environment; Compose mounts it only as a frontend BuildKit secret, not an image layer, runtime env var, or GitHub Actions secret (CI doesn't build images).

---

#### Sub-tasks

**Sentry — error tracking**

- [x] Create Sentry account + projects (`tailortales-be` Node/NestJS, `tailortales-fe` Next.js); copy DSNs
- [x] Install `@sentry/nestjs` in backend — init in `src/instrument.ts` (imported first in `main.ts`); add `SentryModule.forRoot()`; capture via `@SentryExceptionCaptured()` on `AllExceptionsFilter`
- [x] Install `@sentry/nextjs` in frontend (wizard) — `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `global-error.tsx`; wrap `next.config.ts` with `withSentryConfig`; DSN moved to env, `sendDefaultPii` removed
- [x] Gate both inits behind `SENTRY_ENABLED` / `NEXT_PUBLIC_SENTRY_ENABLED`; dev stays silent
- [x] Add Sentry vars to env matrix + `backend/.env.example` / `frontend/.env.example`
- [x] Wire `SENTRY_AUTH_TOKEN` into the frontend Dockerfile `build` stage as a BuildKit secret
- [x] Create the Sentry auth token + set it in each Dokploy Compose environment
- [x] Exercise the UAT error path with `SENTRY_ENVIRONMENT=uat`; accept the Sentry integration as the MVP baseline
- [x] Delete the wizard-generated `sentry-example-page` and API route after UAT verification
- [x] Document Sentry registration + setup in `_docs/guides/external-services.md`

**Uptime alert ownership**

- [x] Use the New Relic two-location synthetic check + email workflow as the MVP uptime monitor
- [x] Keep Sentry focused on error tracking; duplicate uptime alerting is deferred until traffic justifies it

**New Relic APM**

- [x] Create New Relic account (free tier); generate license key
- [x] Install `newrelic` in backend; add `newrelic.cjs` config (reads `NEW_RELIC_LICENSE_KEY` + `NEW_RELIC_APP_NAME`); load via `NODE_OPTIONS="--import newrelic/esm-loader.mjs --require newrelic"` (ESM loader plus agent preload — backend is `"type": "module"`)
- [x] Gate agent startup by presence of `NODE_OPTIONS` (unset in dev → agent never loads)
- [x] Add `NEW_RELIC_LICENSE_KEY`, `NEW_RELIC_APP_NAME`, `NODE_OPTIONS` to env matrix + `backend/.env.example`
- [x] Deploy to UAT; verify "TailorTales-UAT" application appears in New Relic with throughput data
- [x] Set up the baseline production observability: 5xx alert excluding expected auth errors, production dashboard, two-location synthetic health-check, and email workflow
- [x] Defer latency and Apdex threshold tuning until production traffic provides a meaningful baseline
- [x] Document New Relic registration + setup in `_docs/guides/external-services.md`

**Google Analytics + cookie consent banner**

- [x] Create GA4 property in Google Analytics; copy Measurement ID
- [x] Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` to `frontend/.env.example`; only set on prod
- [x] Implement minimal cookie consent banner component (`CookieConsent`):
    - Slim bottom bar, non-blocking (content always visible)
    - "Accept" / "Reject" — no dark patterns, no pre-ticked boxes
    - Consent stored in `localStorage` via `useSyncExternalStore`; remembered across sessions, synced across tabs; no SSR flash
    - GA loads only after `accepted`; no tracking before consent
- [x] Wire GA via `@next/third-parties/google` `GoogleAnalytics`, mounted inside the consent component and guarded by consent state
- [x] Banner copy localised (EN / DE / RU)
- [x] Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` to environment-variables.md and env matrix
- [x] Document GA4 property setup in `_docs/guides/external-services.md`
- [x] Add consent-aware product funnel events: Google sign-up, checkout started, subscription activated, and story generation started/completed (no PII or story content)
- [x] Confirm analytics-consent coverage in the GDPR launch checklist before production

**Acceptance Check:**

- Sentry error tracking is enabled on UAT/prod with environment-specific tags and source maps
- New Relic shows "TailorTales-UAT" application with live throughput
- New Relic monitors prod `/api/health` from two locations and owns the email workflow
- GA loads on prod only, and only after user accepts the cookie banner
- Cookie banner passes basic GDPR check: no pre-consent tracking, reject works, preference persists

---

### Phase 16 — Security Hardening & SEO Foundation ✅

**Goal:** harden the backend security posture and build the frontend SEO foundation before production launch.

**Sub-tasks:**

**Rate limiting**

- [x] Install `@nestjs/throttler`; wire `ThrottlerModule.forRoot` with global default (100 req/60 s)
- [x] Register `ClientIpThrottlerGuard` as first `APP_GUARD` (runs before `JwtAuthGuard`); prefer Cloudflare's stable connecting IP, then the first forwarded IP, then the Express/socket fallback
- [x] Per-route overrides: `GET /auth/google` → 10 req/min; `POST /contact` → 5 req/min
- [x] `@SkipThrottle()` on `POST /webhooks/paddle` (Paddle servers must not be throttled)
- [x] Keep `app.set('trust proxy', 1)` in `main.ts` for Express proxy-aware behavior; the throttle tracker resolves the client explicitly across the Cloudflare → Dokploy proxy chain

**Security headers**

- [x] Install `helmet`; add `app.use(helmet())` in `main.ts`
- [x] CSRF analysis: `SameSite: lax` cookie + same-site architecture (`tailortales.app` → `api.tailortales.app`) makes `csurf` unnecessary — documented, no action needed

**JWT hardening**

- [x] Add `@MinLength(32)` to `JWT_SECRET` in `env.validation.ts`; process exits at boot if the secret is weaker

**CI**

- [x] Replace `pnpm type-check` (tsc-only) with `pnpm --filter frontend build` in `ci.yml`; `next build` type-checks against `.next/types/**` (generated route-param types) that `tsc` alone misses

**SEO**

- [x] `frontend/src/app/sitemap.ts` — 6 public pages × 3 locales; each entry carries EN/DE/RU + `x-default` hreflang alternates
- [x] `frontend/src/app/robots.ts` — disallow `admin`, `account`, `library`, `workshop`, `login`, and `api` routes
- [x] `frontend/src/app/manifest.ts` — installable PWA manifest with dedicated 192×192 / 512×512 standard and maskable icons
- [x] `[locale]/layout.tsx` — `Organization` + `WebSite` JSON-LD injected directly in `<head>`
- [x] `frontend/src/utils/seo.utils.ts` — `buildMetadata()` helper: canonical, hreflang + `x-default`, OG, Twitter in one call
- [x] `[locale]/layout.tsx` — `generateMetadata` with `metadataBase`, title template, site-wide OG/Twitter defaults, `JsonLd`
- [x] All 6 public pages (`/`, `/how-it-works`, `/pricing`, `/contact`, `/privacy`, `/terms`) — `generateMetadata` with per-page canonical, hreflang, and locale-aware descriptions (EN/DE/RU)
- [x] `[locale]/login/layout.tsx` — `robots: { index: false }` noindex
- [x] `NEXT_PUBLIC_SITE_URL` env var added; per-page SEO descriptions added to all 3 locale JSON files

**Acceptance Check:**

- `GET /sitemap.xml` returns 6 route entries, each with correct EN/DE/RU + `x-default` hreflang alternates
- `GET /robots.txt` disallows all auth-gated and admin paths
- `GET /manifest.webmanifest` returns valid PWA manifest
- Public page `<head>` includes: locale-correct canonical, hreflang ×3 + `x-default`, OG tags, Twitter card, JSON-LD `@graph`
- `/login` carries `<meta name="robots" content="noindex,follow">`
- Rate limiting active: `POST /contact` rejects after 5 req/min, `GET /auth/google` after 10 req/min
- Helmet headers present on all responses (`X-Frame-Options`, `X-Content-Type-Options`, etc.)
- Process fails to start if `JWT_SECRET` is shorter than 32 characters
- CI `next build` step passes; Next.js route-param type errors caught at build time

**Deliverables:** `_docs/architecture/security.md` (new) + `_docs/guides/seo.md` (new) + env vars doc update + ROADMAP progress.

---

### Phase 17 — Final Manual Check-up

**Goal:** owner-led end-to-end walk-through of the full product on UAT before production deploy. UI polish, copy corrections, and minor UX fixes only — no new features, no architecture changes.

**Areas to cover:**

- Landing page: copy, CTAs, public story grid, pricing cards
- Auth: Google sign-in flow, redirect, session persistence
- Workshop: form UX, validation messages, generation progress, error states
- Library: story cards, thumbnails, watermark visibility (free tier)
- Story detail: PDF viewer, download, page regeneration panel, rating
- Account: subscription status, billing portal link, GDPR export/delete
- Admin panel: stats, user list, story moderation, art style management
- Notifications: bell badge, dropdown, mark-as-read, email delivery
- Localization: switch EN → DE → RU on each key page; check for untranslated strings
- Cross-browser: Chrome + Safari (minimum)

**Acceptance Check:**

- No broken layouts, missing translations, or console errors on the golden path
- All UI copy feels production-ready (not placeholder text)
- Any blockers found are either fixed or explicitly deferred to post-launch

---

### Phase 18 — Mobile View Support ✅

**Goal:** add first-class mobile support across the product instead of treating mobile as a best-effort desktop squeeze.

**Sub-tasks:**

- [x] Define the responsive foundation: supported breakpoints, page gutters, stacking rules, and when sticky / table / sidebar patterns must collapse
- [x] Adapt global shells and navigation: header, locale/account/notifications access, shared sidebar layouts, mobile-safe hero spacing, and replacements for desktop popovers/dropdowns where needed
- [x] Make the public experience mobile-ready: landing, pricing, how-it-works, contact, and privacy
- [x] Make the core private flows mobile-ready: workshop, library, account pages, children/characters flows, and story detail header/actions
- [x] Add dedicated mobile behavior for reading and generation flows: chapter navigation replacement, side panels, preview/progress screens, page grids, and touch-friendly controls
- [x] Define modal and overlay behavior on mobile: sizing, full-height/full-screen cases, sticky headers/footers, and safe interaction with long forms
- [x] Decide and implement the admin mobile policy: responsive support for key screens or an explicit desktop-only fallback for table-heavy screens
- [x] Add mobile QA coverage for critical widths and flows

**Acceptance Check:**

- No horizontal scroll on supported mobile screens in public and core private flows
- Primary actions remain reachable and readable at mobile widths
- Hidden desktop affordances always get an explicit mobile replacement
- Popovers, dropdowns, and modals remain usable on touch devices and small viewports
- Admin surfaces have a clear, intentional mobile policy rather than accidental breakage

**Deliverables:** responsive foundation decisions, mobile/tablet Quiet Dock navigation, mobile-ready public/private core flows, story reader/library/account mobile layouts, touch-safe modals, action element cleanup, and QA notes in ROADMAP / durable docs.

**Phase closeout:** responsive rules live in `_docs/architecture/README.md`. Phase 18 uses Mobile `<768px`, Tablet `768px-1023px`, Desktop `>=1024px`; mobile/tablet navigation uses a fixed Quiet Dock with state-specific guest/auth items, dark `Account` and `More` sheets, inline language access, and mobile-safe cookie consent offset. The temporary phase doc was consolidated into durable docs and removed.

**QA evidence:** `pnpm --filter ./frontend type-check`, `pnpm --filter ./frontend lint`,
`pnpm --filter ./frontend test -- MobileFooterNav Header layout.component`, and
`git diff --check` passed during the implementation pass. Browser checks covered public/login
routes at `360`, `390`, `768`, and `1024` widths with zero page-level horizontal overflow, plus
mobile dock visibility/state checks at `390`, `800`, and `1200` widths.

---

### Phase 19 — Environments & Production Deploy

**Goal:** three environments (dev / UAT / prod) fully configured and documented; app live on production domain via dokploy.

> **Implementation note (August 2026):** UAT and production run as separate Dokploy Compose
> resources on the OVH VPS. Each environment has its own Postgres database, Redis namespace,
> Google OAuth client, secrets, storage, and backend network alias (`backend-uat` /
> `backend-prod`). Public traffic uses same-origin `/api` routing through the frontend; the old
> public `api-uat` / `api` domains are not part of the application contract.

---

#### Environment model

Three environments. Local development uses the existing app-level env files; their `USE_*_STUBS`
flags and sandbox credentials determine whether integrations are stubbed or real. There is no
second env overlay or alternate start command:

```
dev   →  localhost; stubs by default, sandbox integrations when configured in the same env files
UAT   →  uat.tailortales.app, prod-like on sandbox/cheap services
prod  →  tailortales.app, live everything
```

**Initial hosting shape — budget VPS, disposable by design:** UAT, prod, and small auxiliary apps start on one OVH VPS-4 (`shagserv`, Ubuntu 24.04, Gravelines) managed by dokploy. App containers, Postgres, Redis, and disposable UAT MinIO data live on the VPS at first. Production-generated PDFs/images and production Postgres backups must leave the VPS for S3/R2/B2-compatible storage. Scale path: upgrade the VPS first, then move Postgres/Redis to managed services, then split app servers behind a load balancer only when traffic requires it.

**Control-plane domain:** reserve `dokploy.tailortales.app` for the dokploy dashboard even if future apps use unrelated domains. Protect it with Cloudflare Access (allowlist Alex's email) plus dokploy's own admin login; close direct public access to port `3000` after the dashboard works through HTTPS. Public product/API domains must not inherit this Access gate unless they are internal tools.

**Env var sources:**

| Environment | Source                                        | Run command |
| ----------- | --------------------------------------------- | ----------- |
| dev         | `backend/.env` + `frontend/.env` (gitignored) | `pnpm dev`  |
| UAT         | dokploy env panel — no file in repo           | deploy      |
| prod        | dokploy env panel — no file in repo           | deploy      |

**Paddle — one sandbox account serves both dev and UAT:**

- Paddle supports **multiple webhook destinations** per account — register one per environment, each with its own signing secret (`PADDLE_WEBHOOK_SECRET` differs per env).
- Every event is pushed to **all** destinations; the cross-env noise is harmless — our handler matches by `customData.userId`, and a foreign userId (different DB) logs "cannot match a user" and returns 200.
- Prod uses a separate **live** Paddle account (sandbox/live are hard-separated by Paddle anyway).

**Local Paddle webhooks:** UAT is the permanent sandbox webhook integration target. Do not keep a
dedicated dev tunnel running for MVP. If a webhook must be debugged locally, start a temporary
Cloudflare/ngrok tunnel and remove its Paddle destination afterwards.

**Resend — one account, no env constraints:** outbound-only (no webhooks, no domain callback), so a single account with the domain verified once covers all envs; environments differ only by `RESEND_FROM` (`dev@` / `uat@` / `stories@`) and optionally separate API keys for usage tracking.

**DB & schema sync — Prisma migrations are the mechanism, no manual syncing:**

```mermaid
flowchart LR
  A["dev: prisma migrate dev<br/>(generates migration file)"] --> B[git commit / PR / merge]
  B --> C["UAT Compose release:<br/>migrate + idempotent seeds"]
  B --> D["prod Compose release:<br/>migrate + idempotent seeds"]
  C --> E["healthy backend → frontend"]
  D --> F["healthy backend → frontend"]
```

- `migrate dev` (generate + apply) runs **only** locally; `migrate deploy` (apply-only, non-interactive) runs as a deploy step on UAT/prod.
- UAT and prod each use one dokploy Compose resource. Its one-shot `release` service runs migrations and the idempotent `seed:art-styles` / `seed:pricing-tiers` scripts before the new backend can start; the frontend waits for the backend health check. No manual deploy sequencing is required.
- Migrations must use expand-contract compatibility: an already-running backend can overlap briefly with the newly migrated schema, so destructive schema contraction belongs in a later release.
- **Data never syncs between environments** (by design): UAT holds test users + Paddle sandbox subscriptions, prod holds real ones. UAT DB is droppable/recreatable at any time.
- Initial UAT/prod DBs are separate local Postgres databases on the VPS, with external backups. Managed Postgres/Redis is a scale/reliability upgrade, not a launch blocker.

---

#### Environment matrix

| Variable                             | dev (stubs)             | dev (sandbox)                                               | UAT                                                               | prod                                                      |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| `NODE_ENV`                           | `development`           | `development`                                               | `production`                                                      | `production`                                              |
| `BACKEND_URL` / `FRONTEND_URL`       | localhost               | localhost (+ temporary tunnel only when debugging webhooks) | `https://uat.tailortales.app/api` / `https://uat.tailortales.app` | `https://tailortales.app/api` / `https://tailortales.app` |
| `DATABASE_URL`                       | local docker postgres   | same local postgres                                         | dedicated UAT DB on VPS Postgres                                  | dedicated prod DB on VPS Postgres                         |
| `REDIS_URL`                          | local docker redis      | same local redis                                            | VPS Redis with UAT namespace/index                                | VPS Redis with prod namespace/index                       |
| `GOOGLE_CLIENT_ID/SECRET`            | dev OAuth app           | dev OAuth app                                               | UAT OAuth app                                                     | prod OAuth app (isolated)                                 |
| `JWT_SECRET`                         | any local value         | any local value                                             | strong random secret                                              | strong random secret (different from UAT)                 |
| `JWT_EXPIRY_DAYS` / `PORT`           | `7` / `3001`            | `7` / `3001`                                                | Compose-fixed `7` / `3001`                                        | Compose-fixed `7` / `3001`                                |
| `USE_AI_STUBS`                       | `true`                  | `false`                                                     | `false`                                                           | `false`                                                   |
| `OPENROUTER_API_KEY`                 | stub/empty              | real key                                                    | real key                                                          | real key                                                  |
| `OPENROUTER_TEXT_MODEL`              | — (stubs)               | cheap/fast model                                            | cheap/fast model (e.g. `google/gemini-flash-1.5-8b`)              | quality model (e.g. `google/gemini-2.0-flash`)            |
| `OPENROUTER_IMAGE_MODEL`             | — (stubs)               | cheap model                                                 | cheap model                                                       | quality model                                             |
| `USE_EMAIL_STUBS`                    | `true`                  | `false`                                                     | `false`                                                           | `false`                                                   |
| `RESEND_API_KEY`                     | — (stubs)               | real key                                                    | real key                                                          | real key (separate for tracking)                          |
| `RESEND_FROM`                        | —                       | `TailorTales Dev <dev@tailortales.app>`                     | `TailorTales UAT <uat@tailortales.app>`                           | `TailorTales <stories@tailortales.app>`                   |
| `CONTACT_INBOX_EMAIL`                | local/stub address      | owner inbox                                                 | owner inbox                                                       | owner inbox                                               |
| `USE_PADDLE_STUBS`                   | `true`                  | `false`                                                     | `false`                                                           | `false`                                                   |
| `PADDLE_ENVIRONMENT`                 | —                       | `sandbox`                                                   | `sandbox`                                                         | `production`                                              |
| `PADDLE_API_KEY`                     | —                       | `_sdbx_…` (shared sandbox)                                  | `_sdbx_…` (same sandbox)                                          | `_live_…`                                                 |
| `PADDLE_WEBHOOK_SECRET`              | —                       | secret of dev destination                                   | secret of UAT destination                                         | secret of live destination                                |
| `PADDLE_PRODUCT_ID_*` / `PRICE_ID_*` | —                       | sandbox catalog IDs                                         | sandbox catalog IDs (same)                                        | live catalog IDs                                          |
| `STORAGE_REGION`                     | `us-east-1`             | `us-east-1`                                                 | `us-east-1` (MinIO ignores it)                                    | real AWS region                                           |
| `STORAGE_ENDPOINT`                   | `http://localhost:9000` | `http://localhost:9000`                                     | `https://storage-uat.tailortales.app`                             | —                                                         |
| `STORAGE_FORCE_PATH_STYLE`           | `true`                  | `true`                                                      | `true`                                                            | default `false`                                           |
| `STORAGE_BUCKET`                     | `tailortales`           | `tailortales`                                               | MinIO `tailortales-uat`                                           | S3 `tailortales-prod`                                     |
| `STORAGE_ACCESS_KEY/SECRET`          | `minioadmin`            | `minioadmin`                                                | UAT MinIO credentials                                             | AWS IAM credentials                                       |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`    | —                       | sandbox client token                                        | sandbox client token                                              | live client token                                         |
| `NEXT_PUBLIC_PADDLE_ENV`             | `sandbox`               | `sandbox`                                                   | `sandbox`                                                         | `production`                                              |
| `NEXT_PUBLIC_BACKEND_URL`            | `http://localhost:3001` | `http://localhost:3001`                                     | `https://uat.tailortales.app/api`                                 | `https://tailortales.app/api`                             |
| `NEXT_PUBLIC_STORAGE_URL`            | `http://localhost:9000` | `http://localhost:9000`                                     | `https://storage-uat.tailortales.app`                             | CloudFront or S3 URL                                      |
| `NEXT_PUBLIC_SITE_URL`               | `http://localhost:3000` | `http://localhost:3000`                                     | `https://uat.tailortales.app`                                     | `https://tailortales.app`                                 |
| `SENTRY_ENABLED`                     | `false`                 | `false`                                                     | `true`                                                            | `true`                                                    |
| `SENTRY_DSN`                         | —                       | —                                                           | shared DSN                                                        | shared DSN                                                |
| `SENTRY_ENVIRONMENT`                 | —                       | —                                                           | `uat`                                                             | `production`                                              |
| `NEXT_PUBLIC_SENTRY_ENABLED`         | `false`                 | `false`                                                     | `true`                                                            | `true`                                                    |
| `NEXT_PUBLIC_SENTRY_DSN`             | —                       | —                                                           | shared DSN                                                        | shared DSN                                                |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT`     | —                       | —                                                           | `uat`                                                             | `production`                                              |
| `SENTRY_AUTH_TOKEN` (build only)     | —                       | —                                                           | required by Compose                                               | required by Compose                                       |
| `NODE_OPTIONS` (New Relic agent)     | —                       | —                                                           | `--import newrelic/esm-loader.mjs --require newrelic`             | `--import newrelic/esm-loader.mjs --require newrelic`     |
| `NEW_RELIC_LICENSE_KEY`              | —                       | —                                                           | shared key                                                        | shared key                                                |
| `NEW_RELIC_APP_NAME`                 | —                       | —                                                           | `TailorTales-UAT`                                                 | `TailorTales-Prod`                                        |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`      | —                       | —                                                           | —                                                                 | `G-XXXXXXXXXX`                                            |

> Monitoring and analytics env vars are introduced in the analytics & monitoring phase. Registration, project creation, and obtaining the keys is covered by that phase's sub-tasks — configure them here per environment when wiring up UAT and prod in dokploy.
>
> **`SENTRY_AUTH_TOKEN` is build-time only**: the Compose resource reads it from the dokploy environment and mounts it only as a frontend BuildKit secret; it is absent from image layers and the runtime container. `BACKEND_URL`, `FRONTEND_URL`, `PADDLE_ENVIRONMENT`, and `SENTRY_ENVIRONMENT` are intentionally single inputs that Compose maps to their matching `NEXT_PUBLIC_*` names. New Relic has no `*_ENABLED` flag: the Compose-fixed `NODE_OPTIONS` value is the gate.

---

#### Sub-tasks

**Infrastructure**

- [x] Buy domain (`tailortales.app` or similar) and put DNS on Cloudflare (free plan)
- [x] Configure `dokploy.tailortales.app` as the private control-plane domain behind Cloudflare Access; close public `3000/tcp` after verification
- [x] Do not provision a permanent dev webhook tunnel at MVP; UAT owns sandbox webhook verification, and local debugging may use a temporary tunnel
- [x] Provision initial OVH VPS-4 (`shagserv`, Ubuntu 24.04, 8 vCores / 24 GB RAM / 200 GB NVMe) and install dokploy
- [x] Provision UAT dokploy Compose resource alongside the old UAT apps, validate it, move domains, then remove only the old backend/frontend apps
- [x] Provision prod dokploy Compose resource — separate env and trigger from UAT on the same VPS
- [x] Domain + HTTPS for both (handled by dokploy / Cloudflare)
- [x] Provision persistent UAT MinIO resource; route `storage-uat.tailortales.app` to API port `9000`, keep console port `9001` private
- [x] AWS S3 bucket `tailortales-prod` with a dedicated IAM user
- [x] VPS Postgres + Redis configured with separate UAT/prod databases/namespaces
- [x] Backup strategy for prod Postgres + S3 documented; Q3 2026 restore drill completed (owner-confirmed)
- [x] Verify live 14-day retention: `tailortales-backups` expires the production DB prefix through version-aware lifecycle rules; `tailortales-prod` permanently deletes non-current versions after 14 days (owner-confirmed 5 August 2026)

**Local environment**

- [x] Keep `backend/.env` and `frontend/.env` as the only local configuration files; use their existing stub flags and sandbox credentials with `pnpm dev`

**Google OAuth**

- [x] Create UAT Google OAuth client (authorized redirect: UAT domain)
- [x] Create prod Google OAuth client (authorized redirect: prod domain; isolated from dev/UAT)

**Paddle**

- [x] Complete Paddle sandbox setup from `_docs/guides/external-services.md` (Paddle section; sandbox account already started in Phase 9)
- [x] Sandbox: register environment-specific webhook destinations; each env gets its own destination signing secret
- [x] Register Paddle live/production vendor account
- [x] Create live catalog (2 products + monthly prices matching sandbox)
- [x] Request website approval for `tailortales.app` and set the default payment link
- [x] Configure live webhook destination (prod domain); live uses `PADDLE_ENVIRONMENT=production`
- [x] Run `pnpm seed:pricing-tiers` on each env with correct Paddle IDs from env vars

**Resend**

- [x] Verify domain in Resend (once — covers all envs; Resend is outbound-only, no per-env setup)
- [x] Configure per-environment sender addresses and scoped API keys

**OpenRouter**

- [x] Confirm single OpenRouter account is sufficient (no env isolation needed — model names differ per env)
- [x] Set separate UAT/prod API keys and model configuration

**SEO & discoverability**

> SEO foundation is built (sitemap, robots, hreflang/canonical, OG/Twitter, JSON-LD, per-page descriptions EN/DE/RU). What remains is environment config + launch-time setup.

- [x] Set `NEXT_PUBLIC_SITE_URL` per environment (canonical origin: non-www, no trailing slash — `https://tailortales.app` prod, `https://uat.tailortales.app` UAT)
- [x] Enforce `www → non-www` 301 redirect at Cloudflare so the live host matches the canonical tags
- [x] Add the real `og-default.png` (1200×630) social-share image to `frontend/public/`
- [x] Add dedicated 192×192 + 512×512 standard and maskable PWA icons to `frontend/public/icons/`
- [x] **Google Search Console:** prod property is verified and `https://tailortales.app/sitemap.xml` submitted; check Coverage + Performance after a few days
- [x] Noindex the UAT environment (`X-Robots-Tag: noindex, nofollow, noarchive`); UAT must never be submitted to GSC
- [x] After promotion, verify the deployed OG image, four manifest icons, and six-route sitemap with EN/DE/RU + `x-default`; refresh social-preview caches (owner-confirmed 6 August 2026; LinkedIn may continue to show its prior per-URL preview until its external cache refreshes)

**Legal & compliance (GDPR — ongoing after prod launch)**

> Technical GDPR side (export, delete, retention) shipped in Phase 9. Public legal documents and
> the initial breach procedure landed on 5 August 2026. By explicit owner decision at Phase 19
> closeout (6 August 2026), the contractual, legal-review, and real-account validation work below
> is a post-launch compliance follow-up — it is not represented as completed or silently dropped.

- [x] Publish Privacy Notice (`/privacy`): data, purposes, legal bases, sub-processors (Paddle, OpenRouter, Resend, AWS, Google, Sentry, New Relic), retention, rights and VDAI complaint route — effective 5 August 2026, v1.0
- [x] **Children's data section** in the notice: adult account holder supplies the child profile; minimum prompt details may reach AI providers; no photo/biometric data at MVP
- [x] Publish Terms of Service (`/terms`): adults 18+, parent-operated child profiles, acceptable use, AI limitations, sharing opt-in and Lithuanian law
- [ ] Accept/sign DPAs with sub-processors: OpenRouter, Resend, AWS, Paddle (independent controllers for payments)
- [x] Short internal breach-notification procedure (72h to supervisory authority) — `_docs/guides/breach-response.md`
- [x] Privacy Notice includes Google Analytics, Sentry and New Relic; GA remains consent-gated and production-only
- [ ] Have Privacy Notice, Terms and transfer safeguards reviewed by a qualified Lithuanian/EU privacy professional
- [x] US state laws (CCPA/CPRA etc.): thresholds not met at MVP scale — no action beyond the ToS clause; revisit at scale

**Deployment pipeline (dokploy)**

> **Deploy triggers** (fits the GitHub Flow in `git.md` — `main` always deployable):
>
> ```
> merge to main       →  GitHub Actions deploys UAT   (every squash-merged PR lands on uat.tailortales.app)
> Deploy to PROD run  →  tag + API-driven prod deploy (e.g. v1.0.0 — prod ships only by explicit promotion)
> ```
>
> UAT is the continuous integration target; prod is gated behind a deliberate version tag so a merge never reaches real users by itself. The manual workflow creates or verifies the SemVer tag (`vMAJOR.MINOR.PATCH`), pins Dokploy to it through its API, then starts the deploy.
>
> Each environment has one Compose resource using `deploy/docker-compose.yml`. Dokploy triggers that resource once; Compose enforces `release → healthy backend → frontend`. Separate backend/frontend auto-deploy triggers must remain disabled.

- [x] Configure deploy ownership: GitHub Actions deploys UAT on `main`; **Deploy to Production** calculates a SemVer bump, creates the tag, pins Dokploy to it through the API, and deploys it (Dokploy auto-deploy off for both)
- [x] CI Gitleaks gate scans full git history and hard-blocks on detected secrets; the local pre-commit hook remains a faster staged-change guard
- [x] Add shared UAT/prod Compose definition plus strict, complete env template (`deploy/docker-compose.yml`, `deploy/.env.example`)
- [x] Dockerfiles tested end-to-end for both backend and frontend
- [x] Graceful shutdown implemented (`enableShutdownHooks()` + 15-minute Compose grace period)
- [x] Verify an in-flight UAT generation drains on `SIGTERM` before closeout (UAT drill owner-confirmed 6 August 2026)
- [x] Dokploy env var injection configured per environment (no secrets in repo)
- [x] Set `SENTRY_AUTH_TOKEN` in each Compose environment — mounted only as a frontend BuildKit secret for source-map upload
- [x] Wire `prisma migrate deploy` plus art-style/pricing seeds as the automatic Compose `release` service (schema sync = git + deploy, never manual)
- [x] Deployment behaviour accepted for MVP: standard Dokploy Compose may have a brief promotion window; rolling/blue-green deployment is deferred until traffic justifies Swarm/registry complexity
- [x] Open the hardening PR and confirm both the regular CI job and the new Gitleaks job pass before merge

**First-deploy runbook** _(per environment, in order)_

- [x] Confirm the Compose `release` service exited `0` (migrations and both idempotent seeds ran automatically)
- [x] Confirm backend and frontend health checks pass before assigning the public domains
- [x] Verify `BACKEND_URL` is correct — used for self-hosted PDF fonts; wrong URL = broken fonts in all PDFs
- [x] Smoke test: login → generate 1 story → download PDF → check watermark (free tier)
- [x] Verify Paddle webhook round-trip: sandbox/live checkout → `subscription.activated` → tier flip in DB

**Acceptance Check:**

- UAT and prod reachable on their domains
- End-to-end flow works on prod (login → generate → download)
- Paddle live checkout completes and tier flips
- PDF fonts render correctly (not fallback system fonts)
- Backups configured and tested with a restore drill
- All `USE_*_STUBS` flags are `false` on prod
- [x] Rate limiting active — verified on UAT 6 August 2026: `POST /contact` rejects after 5 req/min, `GET /auth/google` after 10 req/min

- [x] Audit package scripts: app-level `start`, migrations and seeds are complete; remote environments use the Compose release service, so duplicate `:uat` / `:prod` scripts are intentionally unnecessary

**Deliverables:** ROADMAP progress. Ops runbook lives in `_docs/guides/runbook.md`; env var reference in `_docs/guides/environment-variables.md`.

---

## 12. Progress Tracking

| Phase                               | Status  | Notes                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Infrastructure                  | ✅ Done |                                                                                                                                                                                                                                                                                                                                                                                           |
| 1 — Auth                            | ✅ Done |                                                                                                                                                                                                                                                                                                                                                                                           |
| 2 — Children                        | ✅ Done |                                                                                                                                                                                                                                                                                                                                                                                           |
| 3 — Design System                   | ✅ Done | SuggestionChip deferred to Phase 4; static page copy deferred to dedicated content phase                                                                                                                                                                                                                                                                                                  |
| 4 — Stories & StoryBlueprints       | ✅ Done |                                                                                                                                                                                                                                                                                                                                                                                           |
| 5 — Generation Pipeline             | ✅ Done | Book end-to-end: BullMQ pipeline, OpenRouter (text + images), Puppeteer PDF, SSE progress, Resend notifications, contact endpoint. Comic deferred.                                                                                                                                                                                                                                        |
| 6 — Human Verification & Bug Fixing | ✅ Done | 21 issues triaged: 20 fixed (5 blockers, 7 major, 4 minor, 4 polish), 1 deferred (FAILED stories in library → Deferred #8)                                                                                                                                                                                                                                                                |
| 7 — Mid-point Documentation         | ✅ Done |                                                                                                                                                                                                                                                                                                                                                                                           |
| 8 — Character + Regeneration        | ✅ Done | Character entity + preview; page regeneration (text/illustration/both) with 30-day quota; iframe reader; FAILED stories in library. Resolved Deferred #8 and #9.                                                                                                                                                                                                                          |
| 9 — Subscriptions                   | ✅ Done | Paddle MoR, PricingTier + Subscription entities, QuotaService, watermark, GDPR export/delete, retention cron, account + pricing UI wired.                                                                                                                                                                                                                                                 |
| 10 — Notifications                  | ✅ Done | Full notification inbox, SSE bell stream, subscription-event emails, per-user preferences, NotificationEmitterService.                                                                                                                                                                                                                                                                    |
| 11 — Ratings & Public Sharing       | ✅ Done | Rating upsert, isPublic opt-in, public stories on landing page, admin visibility override.                                                                                                                                                                                                                                                                                                |
| 12 — Admin Panel                    | ✅ Done | Stats dashboard, user management, story moderation, ArtStyle CRUD + thumbnail generation, ratings view, SidebarLayout shared component. SUPER_ADMIN role added.                                                                                                                                                                                                                           |
| 13 — Localization                   | ✅ Done | next-intl EN/DE/RU, [locale] routing, LocaleSwitcher, backend error i18n via Accept-Language, Paddle checkout locale.                                                                                                                                                                                                                                                                     |
| 14 — Final Documentation            | ✅ Done | All phase-8–13 staging docs consolidated into durable docs and deleted. New files: user-flows.md, monitoring.md, backup-strategy.md, gdpr-launch-checklist.md. backend/AGENTS.md and frontend/AGENTS.md updated with symbol-token swap, error code, S3 scope, and i18n navigation rules.                                                                                                  |
| 15 — Analytics & Monitoring         | ✅ Done | MVP observability baseline accepted: Sentry error tracking with environment tags and source maps; New Relic APM, production dashboard, two-location synthetic health check and email workflow; GA4 behind consent with consent-aware funnel events. Duplicate uptime alerts and latency/Apdex tuning are deferred until traffic justifies them.                                           |
| 16 — Security Hardening & SEO       | ✅ Done | Rate limiting (`@nestjs/throttler`, global + per-route + webhook skip), Helmet headers, trust proxy, JWT 32-char minimum, CI `next build` type-check. SEO: six-route sitemap, robots, installable manifest, OG/PWA assets, JSON-LD, canonical + hreflang on all public pages (EN/DE/RU), login noindex.                                                                                   |
| 17 — Final Manual Check-up          | ✅ Done |                                                                                                                                                                                                                                                                                                                                                                                           |
| 18 — Mobile View Support            | ✅ Done | First-class mobile/tablet web support: breakpoints, app-style footer dock with guest/auth states, Account/More sheets, public pages, login, library, story reader, workshop/account/admin-safe layouts, touch-safe modals, and Button/Link/Icon cleanup. Public/login viewport QA and automated frontend checks passed; private flows were polished through authenticated browser review. |
| 19 — Production Deploy              | ✅ Done | UAT and production are live. Restore, retention, rate-limit, and graceful-shutdown drills passed; legal pages, GSC/SEO/PWA assets, CI secret scanning, and the MVP monitoring baseline are complete. External GDPR paperwork/review and real-account rights-flow validation remain explicitly tracked as post-launch compliance follow-up in the GDPR checklist.                          |

Status legend: ⬜ Not started · 🟡 In progress · ✅ Done · 🔵 Needs rules-revision approval
