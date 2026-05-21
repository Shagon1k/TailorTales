# TailorTales — Roadmap

> Single source of truth for project scope, decisions, and progress.
> Update this file whenever scope changes, a decision is made, or a phase completes.

---

## 1. Project Overview

**TailorTales** is a SaaS service that generates short (5–20 page), customized PDF books and comics for children. Target audience: parents who want to create personalized educational content that answers their child's "Why?" / "How?" questions in an age-appropriate, engaging way.

### Output formats

- **Book** — text + 1 illustration per page (or per spread).
- **Comic** — panels with speech bubbles, multiple illustrations per page.

### Customization inputs (per generation)

- **Required:** child question, child age, output format (book/comic), length (short 1–5 pages / medium 5–10 / long 10–20).
- **Optional:** child interests/hobbies, art style preference, language (EN/RU).
- **Future (v2):** child photo, parent photo for character likeness.

---

## 2. Stack & Architecture Decisions

| Area                  | Decision                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------ |
| Repo layout           | Monorepo: `frontend/` + `backend/`, **pnpm workspaces** (no Turborepo for now)             |
| Backend               | Nest.js (TypeScript), REST API with OpenAPI auto-generation                                |
| Frontend              | Next.js (React, TypeScript), CSS Modules, **Mantine** UI library                           |
| State management (FE) | React Query (server state) + Zustand (UI state)                                            |
| Database              | PostgreSQL via **Prisma** ORM                                                              |
| Queue                 | **BullMQ** (Redis-backed)                                                                  |
| Object storage        | **MinIO** for dev/local, **AWS S3** for production                                         |
| LLM (text)            | **OpenRouter** — `claude-haiku-4-5` for prod, `gpt-4o-mini` for dev (configurable via env) |
| Image generation      | **DALL-E 3** via OpenAI API                                                                |
| PDF generation        | **Puppeteer** (HTML → PDF)                                                                 |
| Auth                  | **Google OAuth only** at MVP                                                               |
| Payments              | **Paddle**                                                                                 |
| Real-time progress    | **SSE** (Server-Sent Events)                                                               |
| Email                 | TBD (Resend / Postmark / SES) — decide in Phase 7                                          |
| Notifications         | Email + in-app                                                                             |
| Testing               | Vitest + React Testing Library                                                             |
| Containerization      | Docker + docker-compose for dev; Dockerfiles deployed via **dokploy**                      |
| CI/CD                 | GitHub Actions (lint + type-check + test) — minimal at start                               |
| Observability         | Pino logs only at MVP (no Sentry/OTel for now)                                             |
| Compliance            | GDPR (EU-only target audience at MVP)                                                      |

---

## 3. Domain Model (high level)

| Entity           | Notes                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| **User**         | Google OAuth identity, role (USER / ADMIN).                                                                    |
| **Child**        | Belongs to User. Fields: name, birthdate, gender, interests, optional avatarUrl (reserved for v2 photo input). |
| **Story**        | Unified entity for books AND comics, distinguished by `type` field. Belongs to User, references Child.         |
| **Page**         | Belongs to Story, ordered, contains text + illustration URL(s).                                                |
| **Template**     | Pre-defined Story blueprint created by Admin. Users instantiate Stories from Templates with customization.     |
| **Subscription** | Paddle-backed, plan + quotas (pages/month, regenerations/month).                                               |
| **Rating**       | Belongs to Story, score + comment.                                                                             |
| **Job**          | Tracks generation pipeline state and progress for SSE.                                                         |
| **Notification** | In-app notifications per User.                                                                                 |

**Unified naming:** `Story` (covers both book and comic).

---

## 4. Business Rules & Policies

- **Pricing model:** "page credits." 1 book page = 1 credit, 1 comic page = 2–3 credits (comic costs more due to multi-illustration pages).
- **Generation:** fully automated end-to-end. User submits customization, receives final PDF.
- **Regeneration:** user can regenerate specific pages (text and/or illustration) with limits per subscription tier.
- **Free tier:** PDFs are watermarked. Retention policies differ per tier (free PDFs may expire).
- **Content safety:** strict — text and image moderation pre-delivery. Child-friendly only.
- **Age-adaptive content:** LLM adapts vocabulary and complexity based on child's age.
- **Localization:** UI + content in EN and RU.
- **Subscriptions only for registered users.**
- **Admin:** seeded via DB or admin-only invite flow. Has a dedicated admin panel.

---

## 5. MVP Scope

### IN

- ✅ Google OAuth, USER + ADMIN roles
- ✅ Multiple children per user
- ✅ Stories: book + comic, single entity with `type`
- ✅ Templates (admin-created, user-customized)
- ✅ Generation pipeline (text via OpenRouter, images via DALL-E)
- ✅ Customization: question, age, format, length, interests, art style, language
- ✅ Limited page regeneration per tier
- ✅ Paddle subscriptions (page credits model)
- ✅ Ratings + feedback (score + comment)
- ✅ Email + in-app notifications
- ✅ Admin panel (users, stories review, templates, basic stats)
- ✅ Content moderation (text + image)
- ✅ Watermark on free tier
- ✅ EN + RU localization
- ✅ Schema reserved for photo input (avatarUrl on Child, etc.) — extendable later

### OUT (Post-MVP / v2)

- ❌ Photo input (requires switching image provider to Flux/SD with reference-image support)
- ❌ Referral program (link-based, free book/pages reward)
- ❌ Public story sharing / gallery
- ❌ Advanced analytics & observability (Sentry, OTel)
- ❌ More auth providers (email/password, Apple, etc.)
- ❌ Mobile apps

---

## 6. Process & Documentation Rules

- **ROADMAP.md is the single source of truth.** Update it on every scope change or decision.
- **Per-phase docs (mandatory):** every completed phase MUST produce `_docs/phase-N-<name>.md` following `_docs/TEMPLATE.md`. Each doc must include:
    - **Summary** — one-paragraph overview of what was added
    - **What was added** — entities, modules, endpoints, pages, jobs, etc.
    - **Resulting structure** — directory tree of new/changed files
    - **Commands** — how to run, build, test, seed, migrate (anything new in this phase)
    - **Configuration / env vars** — new env vars introduced, with example values
    - **External services** — any new third-party integrations and how to obtain credentials
    - **Database migrations** — list of migrations and what they change
    - **Gotchas / known limitations** — anything a future developer needs to know
- **Rules revision:** after each phase, review and propose updates to `CLAUDE.md` and `.claude/rules/*.md` based on what was learned. **Each revision requires developer approval before commit.**
- **Phase completion gate:** a phase is NOT complete until acceptance checks pass AND its `_docs/phase-N-*.md` is written. No half-finished phases in `main`.

---

## 7. Phase Plan

> Each phase below lists: **Goals → Sub-tasks → Acceptance Check → Deliverables**.
> Use the checkboxes for progress tracking.

---

### Phase 0 — Infrastructure & Foundation

**Goal:** working dev environment, empty FE + BE skeletons, Docker-ready.

**Sub-tasks:**

- [ ] Initialize monorepo: root `package.json`, `pnpm-workspace.yaml`
- [ ] Create `backend/` (Nest.js scaffold), `frontend/` (Next.js scaffold)
- [ ] Root scripts for `dev`, `build`, `lint`, `test` orchestrating both apps
- [ ] `docker-compose.yml`: PostgreSQL, Redis, MinIO services with persistent volumes
- [ ] `.env.example` files at root and per-app
- [ ] `backend/Dockerfile` (multi-stage Node build, production-ready for dokploy)
- [ ] `frontend/Dockerfile` (multi-stage Next build, production-ready for dokploy)
- [ ] Prisma init in `backend/`, connect to PostgreSQL
- [ ] Shared ESLint + Prettier config at root
- [ ] Vitest setup in both `backend/` and `frontend/`
- [ ] **Husky + commitlint** — pre-commit hook enforces Conventional Commits per [`.claude/rules/git.md`](.claude/rules/git.md). `prepare` script installs hooks on `pnpm install`.
- [ ] Basic health-check endpoint in Nest (`GET /health`)
- [ ] Basic landing page in Next
- [ ] GitHub Actions workflow: install + lint + type-check + test on PR

**Acceptance Check:**

- `docker-compose up` brings up PG, Redis, MinIO without errors
- `pnpm dev` starts both Nest (default :3001) and Next (:3000) without errors
- `GET /health` returns 200
- `pnpm test` runs (even with empty suites) and exits clean
- Commit with invalid message is rejected by commitlint; valid Conventional Commit is accepted
- CI green on a no-op PR

**Deliverables:** `_docs/phase-0-infrastructure.md`

---

### Phase 1 — Users & Authentication

**Goal:** users can sign in with Google, sessions work, admin role exists.

**Sub-tasks:**

- [ ] Prisma `User` model: `id`, `email`, `googleId`, `name`, `avatarUrl`, `role (USER | ADMIN)`, `createdAt`, `updatedAt`
- [ ] Prisma migration
- [ ] Nest Auth module: Google OAuth strategy (Passport), callback handler, JWT issuance
- [ ] Session via httpOnly cookies
- [ ] Auth guard + `@CurrentUser()` decorator
- [ ] Endpoints: `GET /auth/google`, `GET /auth/google/callback`, `POST /auth/logout`, `GET /me`, `PATCH /me`
- [ ] Admin seed script (`pnpm seed:admin <email>`)
- [ ] Frontend: login page with "Sign in with Google" button
- [ ] Frontend: OAuth callback handling, session context via React Query
- [ ] Frontend: protected route wrapper, redirect to login if unauthenticated
- [ ] Frontend: profile page (view + edit name)
- [ ] Backend tests: auth flow, guards, user CRUD
- [ ] Frontend tests: login button renders, protected route redirects

**Acceptance Check:**

- User can sign in via Google, lands on profile page
- Protected routes redirect unauthenticated visitors
- Logout clears session
- Admin role can be assigned via seed script
- Tests pass

**Deliverables:** `_docs/phase-1-auth.md`

---

### Phase 2 — Children Management

**Goal:** parents can manage multiple child profiles.

**Sub-tasks:**

- [ ] Prisma `Child` model: `id`, `userId`, `name`, `birthdate`, `gender`, `interests (string[])`, `avatarUrl?` (reserved for v2), `createdAt`, `updatedAt`
- [ ] Prisma migration
- [ ] Children module: CRUD endpoints scoped to current user (`/children`)
- [ ] Authorization: user can only access own children
- [ ] DTO validation (name length, birthdate range, etc.)
- [ ] Frontend: children dashboard (list)
- [ ] Frontend: add/edit/delete child forms (Mantine)
- [ ] Tests: ownership scoping, validation, full CRUD

**Acceptance Check:**

- User can add, edit, delete children
- Other users cannot access another user's children
- Validation blocks invalid input
- Tests pass

**Deliverables:** `_docs/phase-2-children.md`

---

### Phase 3 — Story Entity & Templates

**Goal:** data model for stories + templates, draft creation, no generation yet.

**Sub-tasks:**

- [ ] Prisma `Story` model: `id`, `userId`, `childId`, `type (BOOK | COMIC)`, `status (DRAFT | QUEUED | GENERATING | COMPLETED | FAILED)`, `templateId?`, `customization (JSON)`, `language`, `pdfUrl?`, `createdAt`, `updatedAt`
- [ ] Prisma `Page` model: `id`, `storyId`, `order`, `text`, `illustrations (JSON — array of { url, position })`, `layout?`
- [ ] Prisma `Template` model: `id`, `name`, `description`, `type`, `blueprint (JSON)`, `customizableFields (JSON)`, `coverImageUrl`, `createdById`, `createdAt`, `updatedAt`
- [ ] Prisma migrations
- [ ] Storage module: S3 abstraction (MinIO for dev, AWS S3 for prod) — upload, get signed URL, delete
- [ ] Stories module: CRUD (draft create, list user's stories, get by id, delete)
- [ ] Templates module: list (public to all users), CRUD (admin only)
- [ ] Frontend: stories list page
- [ ] Frontend: story detail page (read-only at this stage)
- [ ] Frontend: template gallery
- [ ] Frontend: "create story" wizard (collects customization, saves as DRAFT — no generation yet)
- [ ] Admin frontend: template CRUD UI
- [ ] Tests: CRUD, scoping, admin-only template create

**Acceptance Check:**

- User can save a DRAFT story with customization
- Admin can CRUD templates
- Templates are publicly listable, only admin can modify
- Stories scoped per user
- Tests pass

**Deliverables:** `_docs/phase-3-stories.md`

---

### Phase 4 — Generation Pipeline (core feature)

**Goal:** end-to-end generation from DRAFT to downloadable PDF.

**Sub-tasks:**

- [ ] BullMQ setup (Nest BullMQ module), Redis connection
- [ ] Prisma `Job` model: `id`, `storyId`, `type`, `status`, `progress`, `error?`, `attempts`, `createdAt`, `updatedAt`
- [ ] Queue definitions: `outline`, `text`, `illustration`, `assembly`, `upload`
- [ ] OpenRouter client (configurable model via `OPENROUTER_MODEL` env)
- [ ] DALL-E client (with exponential backoff retry, max 3 attempts)
- [ ] **Stage 1 — outline:** LLM generates page-by-page outline (page count from `length`, characters, theme)
- [ ] **Stage 2 — text:** LLM writes content per page (parallelizable; age-adaptive prompt)
- [ ] **Stage 3 — illustration:** DALL-E generates image(s) per page (parallelizable; consistent style prefix + character description)
- [ ] **Stage 4 — moderation:** LLM-based text moderation; image moderation (TBD provider — at minimum OpenAI moderation API for text, image moderation flag from DALL-E)
- [ ] **Stage 5 — assembly:** Puppeteer renders HTML pages → PDF
- [ ] **Stage 6 — upload:** PDF uploaded to S3, signed URL stored on Story
- [ ] Watermark applied for free-tier users at assembly stage
- [ ] SSE endpoint: `GET /stories/:id/progress` streams job progress events
- [ ] Retry policy: exponential backoff, 3 retries, transient errors only (4xx fails immediately)
- [ ] Failure handling: mark Story FAILED, surface error to user
- [ ] Frontend: "Generate" button triggers pipeline, real-time progress UI via SSE
- [ ] Frontend: completed story page with PDF download
- [ ] Tests: each stage independently (mocked LLM/DALL-E), full pipeline integration test

**Acceptance Check:**

- User submits customization → sees real-time progress → downloads PDF
- Generation works for both book and comic types
- Failed stages retry transient errors and surface non-transient failures clearly
- Free tier PDFs are watermarked
- Tests pass

**Deliverables:** `_docs/phase-4-generation.md`

---

### Phase 5 — Page Regeneration

**Goal:** users can regenerate specific pages within tier limits.

**Sub-tasks:**

- [ ] Endpoint: `POST /stories/:id/pages/:order/regenerate` with body `{ what: 'text' | 'illustration' | 'both' }`
- [ ] Track regenerations per Story and per User per month
- [ ] Enforce per-tier limits (read from Subscription, deferred to Phase 6 — until then use a placeholder/free tier limit)
- [ ] Re-render PDF after page regeneration, replace S3 file
- [ ] Frontend: regenerate buttons per page on story detail
- [ ] Frontend: show remaining regenerations
- [ ] Tests: regeneration flow, quota enforcement

**Acceptance Check:**

- User can regenerate a page (text only / illustration only / both)
- Quota tracked and enforced
- PDF updates correctly
- Tests pass

**Deliverables:** `_docs/phase-5-regeneration.md`

---

### Phase 6 — Subscriptions (Paddle)

**Goal:** users can subscribe and quotas are enforced.

**Sub-tasks:**

- [ ] Prisma `Plan` model: `id`, `name`, `paddleProductId`, `priceMonthly`, `pagesPerMonth`, `regenerationsPerMonth`, `retentionDays`, `watermark (bool)`
- [ ] Prisma `Subscription` model: `id`, `userId`, `planId`, `paddleSubscriptionId`, `status`, `currentPeriodEnd`, `pagesUsed`, `regenerationsUsed`
- [ ] Paddle integration: checkout link generation, webhook handler (created, updated, canceled, payment_failed)
- [ ] Quota service: before generation, validate pages + credits against subscription
- [ ] Quota service: deduct page credits on generation completion (1 per book page, 2–3 per comic page — TBD exact rate)
- [ ] Retention cleanup job (cron): delete PDFs past tier retention
- [ ] Frontend: pricing page (plans listed)
- [ ] Frontend: subscription management UI (current plan, change, cancel, billing portal link)
- [ ] Frontend: usage display (pages used / remaining, regenerations remaining)
- [ ] Tests: webhook handling, quota enforcement, retention cleanup

**Acceptance Check:**

- User can subscribe via Paddle
- Quotas enforced before generation
- Free-tier PDFs expire per retention policy
- Tests pass

**Deliverables:** `_docs/phase-6-subscriptions.md`

---

### Phase 7 — Notifications (Email + In-App)

**Goal:** users get notified on key events.

**Sub-tasks:**

- [ ] Decide email provider (Resend recommended — simple, generous free tier)
- [ ] Email service module (templates for: story*completed, story_failed, subscription*\* events)
- [ ] Prisma `Notification` model: `id`, `userId`, `type`, `payload (JSON)`, `readAt?`, `createdAt`
- [ ] Notifications module: list, mark-as-read endpoints
- [ ] Event-driven: emit notification + email on story completion, story failure, subscription events
- [ ] Frontend: notification bell + dropdown, mark-as-read
- [ ] Frontend: SSE or polling for new notifications (SSE preferred — already in stack)
- [ ] Tests: notification creation, email sending (mocked), mark-as-read

**Acceptance Check:**

- User receives email + in-app notification on key events
- Notifications can be marked as read
- Tests pass

**Deliverables:** `_docs/phase-7-notifications.md`

---

### Phase 8 — Ratings & Feedback

**Goal:** users can rate completed stories with a comment.

**Sub-tasks:**

- [ ] Prisma `Rating` model: `id`, `storyId`, `userId`, `score (1-5)`, `comment?`, `createdAt`
- [ ] Endpoints: `POST /stories/:id/rating`, `GET /admin/ratings` (admin only)
- [ ] One rating per user per story (upsert)
- [ ] Frontend: rating UI on completed story page (stars + comment input)
- [ ] Tests: rating CRUD, upsert behavior, admin-only listing

**Acceptance Check:**

- User can rate a completed story
- Admin can view all ratings
- Tests pass

**Deliverables:** `_docs/phase-8-ratings.md`

---

### Phase 9 — Admin Panel

**Goal:** admin can manage users, review stories, manage templates, view stats.

**Sub-tasks:**

- [ ] Admin-only frontend route group with auth guard
- [ ] User management: list, suspend, change role
- [ ] Story moderation queue: list flagged stories, mark as reviewed, force-delete
- [ ] Templates UI (already exists from Phase 3, polish here)
- [ ] Ratings + feedback view
- [ ] Stats dashboard: counts (users, stories, active subs), revenue from Paddle API
- [ ] Tests: admin auth guard, admin endpoints

**Acceptance Check:**

- Admin can do all the above
- Non-admins blocked from admin routes
- Tests pass

**Deliverables:** `_docs/phase-9-admin.md`

---

### Phase 10 — Localization (EN + RU)

**Goal:** UI in EN/RU, generated content in EN/RU.

**Sub-tasks:**

- [ ] Frontend: `next-intl` setup, EN + RU translation files
- [ ] Language switcher (persists to user profile if logged in, else cookie)
- [ ] Backend: localized error messages via Accept-Language header
- [ ] Generation: `language` param drives LLM output language
- [ ] Translate all existing UI strings to RU
- [ ] Tests: language switching, localized errors

**Acceptance Check:**

- UI switches between EN/RU
- Generated stories respect language param
- Tests pass

**Deliverables:** `_docs/phase-10-localization.md`

---

### Phase 11 — Production Deploy

**Goal:** app runs in production via dokploy.

**Sub-tasks:**

- [ ] Production env variables documented
- [ ] Production Dockerfiles tested end-to-end
- [ ] AWS S3 bucket provisioned
- [ ] Production Postgres + Redis provisioned
- [ ] Paddle production credentials wired
- [ ] OpenAI/OpenRouter production keys wired
- [ ] Domain + HTTPS (handled by dokploy)
- [ ] dokploy deployment pipeline configured
- [ ] Smoke tests in production env (login, generate one story end-to-end)
- [ ] Backup strategy for Postgres + S3 documented

**Acceptance Check:**

- App reachable on production domain
- End-to-end flow works (login → generate → download)
- Backups configured

**Deliverables:** `_docs/phase-11-deploy.md`

---

## 8. Post-MVP Backlog (v2+)

- Photo personalization (switch image provider to Flux or SD with IP-Adapter)
- Referral program (link-based, free book/pages reward)
- Public sharing / story gallery
- Sentry + OpenTelemetry observability
- Email/password auth, Apple OAuth, etc.
- Mobile apps
- Public API for third-party integrations
- More languages
- Audio narration (TTS)
- Print-on-demand integration

---

## 9. Progress Tracking

| Phase                   | Status         | Notes |
| ----------------------- | -------------- | ----- |
| 0 — Infrastructure      | ⬜ Not started |       |
| 1 — Auth                | ⬜ Not started |       |
| 2 — Children            | ⬜ Not started |       |
| 3 — Stories & Templates | ⬜ Not started |       |
| 4 — Generation Pipeline | ⬜ Not started |       |
| 5 — Regeneration        | ⬜ Not started |       |
| 6 — Subscriptions       | ⬜ Not started |       |
| 7 — Notifications       | ⬜ Not started |       |
| 8 — Ratings             | ⬜ Not started |       |
| 9 — Admin Panel         | ⬜ Not started |       |
| 10 — Localization       | ⬜ Not started |       |
| 11 — Production Deploy  | ⬜ Not started |       |

Status legend: ⬜ Not started · 🟡 In progress · ✅ Done · 🔵 Needs rules-revision approval

---

## 10. Open Questions / Deferred Decisions

- Image moderation provider — only OpenAI moderation for text covers text. Image moderation via DALL-E's own safety flags is the default; explicit image moderation provider TBD.
- Email provider — confirm Resend in Phase 7.
- Exact page-credit rate for comics (2 or 3 per page) — confirm in Phase 6.
- Backup strategy specifics for Postgres + S3 — confirm in Phase 11.
