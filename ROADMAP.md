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

- **Required:** child question, child age, output format (book/comic), length (5/8/12/16/20 pages), art style, language.
- **Optional:** child interests/hobbies.
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
| Email                 | **Resend** (decided in Phase 5 — story completion notification)                            |
| Real-time progress    | **SSE** (Server-Sent Events)                                                               |
| Notifications         | Email + in-app (bell + toast)                                                              |
| Testing               | Vitest + React Testing Library                                                             |
| Containerization      | Docker + docker-compose for dev; Dockerfiles deployed via **dokploy**                      |
| CI/CD                 | GitHub Actions (lint + type-check + test) — minimal at start                               |
| Observability         | Pino logs only at MVP (no Sentry/OTel for now)                                             |
| Compliance            | GDPR (EU-only target audience at MVP)                                                      |

---

## 3. Domain Model (high level)

| Entity             | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**           | Google OAuth identity, role (USER / ADMIN).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Child**          | Belongs to User. Fields: name, birthdate, gender, interests, optional avatarUrl (reserved for v2 photo input).                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **ArtStyle**       | Admin-managed. Fields: id, name, slug, thumbnailUrl, promptPrefix, isActive, order. Seeded with 8 styles.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Story**          | Unified entity for books AND comics, distinguished by `type` field. Belongs to User, references Child. Key fields: `question`, `pageCount`, `artStyleId`, `language (Language enum — EN\|RU)`, `title?` (LLM-generated, Phase 5), `coverImageKey?`, `pdfKey?` (S3 keys — never URLs; signed at serve time via StorageService). `isPublic boolean (default false)` — set via opt-in in rating flow.                                                                                                                                                                                       |
| **Page**           | Belongs to Story, ordered. `text` is optional — both book and comic pages may be illustration-only. Contains illustration URL(s) + chapter title. Composite unique on `(storyId, order)`.                                                                                                                                                                                                                                                                                                                                                                                                |
| **StoryBlueprint** | Pre-defined story blueprint created by Admin (previously named `Template`). `systemPrompt` carries structured LLM guidance using XML markers (e.g. `<intro_prompt>`, `<climax_prompt>`). Specifies font overrides applied on top of `PageTemplate` defaults. `coverImageKey` + `previewPageKeys` are S3 keys reserved for user-facing preview (Post-MVP). Auto-selected by the generation pipeline based on `StoryType`; user-facing selection deferred to Post-MVP.                                                                                                                     |
| **PageTemplate**   | Typed page layout specification — single source of truth for LLM prompt builder, response validator, and PDF renderer. Defines A5 dimensions (1748×2480 px at 300 DPI), image zones (exact width/height, aspect ratio), text zones (maxChars, type: `body \| caption \| speech-bubble \| narration-box`), font defaults, and the Handlebars template file name. Lives in `page-templates.config.ts` — no DB model. Layouts: `book-cover`, `book-illustration`, `book-full-illustration`, `book-final`, `comic-cover`, `comic-2-panel`, `comic-3-panel`, `comic-4-panel`, `comic-splash`. |
| **Plan**           | Subscription tier definition. Fields: id, name, paddleProductId, priceMonthly, pagesPerMonth, regenerationsPerMonth, childrenLimit, retentionDays, watermark.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Subscription**   | Paddle-backed. Fields: id, userId, planId, paddleSubscriptionId, status, currentPeriodEnd, pagesUsed, regenerationsUsed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Rating**         | Belongs to Story + User. Fields: score (1–5), comment (optional). One per user per story (upsert).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Job**            | Tracks generation pipeline state and progress for SSE.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Notification**   | In-app notification per User. Fields: id, userId, type, payload (JSON), readAt?, createdAt.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

**Unified naming:** `Story` covers both book and comic.

---

## 4. Business Rules & Policies

- **Pricing model:** page credits. 1 book page = 1 credit. 1 comic page = 2 credits.
- **Generation:** fully automated end-to-end. User submits customization → receives final PDF.
- **Concurrent generation:** 1 active generation job per user at MVP.
- **Regeneration:** user can regenerate specific pages (text / illustration / both) with an optional prompt. Limited per subscription tier.
- **Free tier:** PDFs are watermarked. Retention policies differ per tier (free PDFs may expire).
- **Content safety:** strict — text and image moderation pre-delivery. Child-friendly only.
- **Age-adaptive content:** LLM adapts vocabulary and complexity based on child's age.
- **Localization:** UI + generated content in EN and RU.
- **Subscriptions only for registered users.**
- **Public stories:** opt-in only. Parent explicitly agrees when rating a story. Appears on landing page.
- **Admin:** seeded via DB or admin-only invite flow. Has a dedicated admin panel.

---

## 5. MVP Scope

### IN

- ✅ Google OAuth, USER + ADMIN roles
- ✅ Multiple children per user (capped by plan's `childrenLimit`)
- ✅ Stories: book + comic, single entity with `type`
- ✅ StoryBlueprints (admin-created; auto-selected during generation by StoryType; user-facing selection Post-MVP)
- ✅ Generation pipeline (text via OpenRouter, images via DALL-E)
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
- ✅ Watermark on free tier
- ✅ EN + RU localization
- ✅ `/account` settings page (Profile, Children, Subscription, Notifications, Language, Privacy & data)
- ✅ Delete account (GDPR)
- ✅ Schema reserved for photo input (avatarUrl on Child) — extendable later

### OUT (Post-MVP / v2)

- ❌ Magic email link auth
- ❌ Photo input (requires switching image provider to Flux/SD with reference-image support)
- ❌ Referral program
- ❌ Public story sharing gallery (beyond opt-in landing page display)
- ❌ Advanced analytics & observability (Sentry, OTel)
- ❌ Email/password auth, Apple OAuth, etc.
- ❌ Export library (ZIP of all user PDFs)
- ❌ "From the Wonder Jar" AI-personalized question suggestions (requires story history analysis)
- ❌ Mobile apps
- ❌ More languages (French, Estonian, etc.)

---

## 6. Navigation Decisions

### Public header (unauthenticated)

`[Logo] TailorTales` · How it works · Pricing · `Sign in` · **Begin a tale →** (CTA button)

### Private header (authenticated)

`[Logo] TailorTales` · **Library** · **Workshop** · `[🔔]` · `[Avatar] Name / Plan`

### Footer (both states)

Privacy · Contact _(both static pages)_

---

## 7. Process & Documentation Rules

- **ROADMAP.md is the single source of truth.** Update it on every scope change or decision.
- **DESIGN.md** documents all UI/UX decisions from design screen reviews. Update after each design review session.
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

## 8. Deferred Decisions & Tech Debt

> Items explicitly deferred during development. Each entry records **what**, **why it was deferred**, and **when to revisit**.
> New items require developer approval before being added.

| #   | Item                                   | Deferred reason                                                                                                                                                                                                                                                                        | Revisit at               |
| --- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 1   | Refresh tokens + server-side logout    | httpOnly + SameSite:lax sufficient for MVP; Google re-login is frictionless; current logout is client-side only (JWT stays valid up to 7d after cookie deletion). Refresh tokens require DB/Redis storage, rotation endpoint, and frontend handling — complexity not justified at MVP. | Post-MVP                 |
| 2   | Magic email link auth                  | Requires email provider (already decided: Resend in Phase 5). Added as Post-MVP auth option alongside Apple OAuth.                                                                                                                                                                     | Post-MVP                 |
| 3   | Exact comic credit rate                | Design confirms 2 credits/page. Final business confirmation during Phase 8 (Subscriptions) Paddle setup.                                                                                                                                                                               | Phase 8                  |
| 4   | Contact form backend (`POST /contact`) | Resend (the logical transport) isn't wired until Phase 5. Frontend Server Action stub is in place; implement the actual endpoint in Phase 5 alongside Resend setup, or Phase 9 if email templates are added there.                                                                     | Phase 5                  |
| 5   | Static page copy finalization          | All four public pages (`/how-it-works`, `/pricing`, `/contact`, `/privacy`) use placeholder copy. Copy is a content/copywriting concern, not a code concern. Will be addressed in a dedicated content pass before launch.                                                              | Pre-launch content phase |

### In-code TODO cross-reference

> Quick lookup: every `// TODO` comment in the frontend codebase, mapped to its ROADMAP resolution.

| File                                                    | TODO summary                                                        | Resolves in                    |
| ------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------ |
| `contact/_components/ContactSection/actions.ts`         | Wire `submitContact` to real `POST /contact` endpoint               | Deferred Decision #4 → Phase 5 |
| `pricing/page.tsx`                                      | Replace hardcoded plan data with `GET /pricing` (real Plan records) | Phase 8                        |
| `(public)/_components/TalesSection/TalesSection.tsx`    | Replace `MOCK_TALES` with `GET /stories?featured=true`              | Phase 10                       |
| `(public)/_components/TalesSection/TalesSection.tsx`    | Add link to `/tales` (public story library page)                    | Post-MVP                       |
| `privacy/_components/PrivacyContent/PrivacyContent.tsx` | Extract privacy copy to CMS if non-dev editing is needed            | Post-MVP                       |

---

## 9. Phase Plan

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
- [x] **Husky + commitlint** — pre-commit hook enforces Conventional Commits per [`.claude/rules/git.md`](.claude/rules/git.md). `prepare` script installs hooks on `pnpm install`.
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

**Deliverables:** `_docs/phase-0-infrastructure.md`

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

**Deliverables:** `_docs/phase-1-auth.md`

---

### Phase 2 — Children Management ✅

**Goal:** parents can manage multiple child profiles.

**Sub-tasks:**

- [x] Prisma `Child` model: `id`, `userId`, `name`, `birthdate`, `gender`, `interests (string[])`, `avatarUrl?` (reserved for v2), `createdAt`, `updatedAt`
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

**Deliverables:** `_docs/phase-2-children.md`

---

### Phase 3 — Design System & Base Layout

**Goal:** establish the visual foundation — design tokens, Mantine theme, atom library, route-group layouts, static pages, account shell, and the `ArtStyle` entity — so all subsequent phases build on a consistent base.

> All TypeScript follows `.claude/rules/typescript.md` (e.g. `IComponentNameProps`, explicit return types, no `React.FC`).
> All CSS follows `frontend/.claude/rules/css.md` (tokens → Mantine theme → CSS Modules; semantic tokens only; `m-` modifiers).
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
- [x] `NotificationBell` — icon + unread count badge; visual shell at Phase 3 (no data wiring); full dropdown UI wires in Phase 9
- [x] `SuggestionChip` — pill-shaped tappable chip for workshop question suggestions (delivered in Phase 4)

**Static pages** (placed inside route groups — chrome comes from group's `layout.tsx`)

- [x] `src/app/(public)/page.tsx` — landing: hero, Three lanterns explainer (3-step cards), public stories grid (empty — wired in Phase 10), bottom CTA strip
- [x] `src/app/login/page.tsx` (existing — restyle): split layout (illustration left, auth card right); "Continue with Google" primary button; legal note
- [x] `src/app/(public)/how-it-works/page.tsx` — placeholder content
- [x] `src/app/(public)/pricing/page.tsx` — plan cards (Free Chapter, Story Hour, Family Workshop) + feature comparison table + FAQ section; monthly/yearly toggle; static/hardcoded data (wired to Paddle in Phase 8)
- [x] `src/app/(public)/privacy/page.tsx` — static
- [x] `src/app/(public)/contact/page.tsx` — static

**Account shell** (sub-pages placeholder until their respective phases)

- [x] `src/app/(private)/account/_components/AccountSidebar/` — sidebar nav with all sections (Profile [Phase 1 — existing], Children [Phase 2 — existing], Subscription [Phase 8], Notifications [Phase 9], Language [Phase 12], Privacy & data [Phase 8], Sign out [existing], Delete account [Phase 8])
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

**Deliverables:** `_docs/phase-3-design-system.md`

**Out of scope (explicit):** Mobile responsiveness — design system targets desktop at MVP; mobile breakpoints are post-MVP.

---

### Phase 4 — Story Entity & StoryBlueprints

**Goal:** data model for stories + StoryBlueprints, draft creation, workshop form, story reader (read-only), library grid. No generation yet.

**Sub-tasks:**

- [x] Prisma `Story` model: `id`, `userId`, `childId`, `type (BOOK | COMIC)`, `status (DRAFT | QUEUED | GENERATING | COMPLETED | FAILED)`, `blueprintId?`, `question`, `pageCount`, `artStyleId`, `language (Language enum)`, `title?` (LLM-generated), `isPublic (default false)`, `coverImageKey?`, `pdfKey?`, `createdAt`, `updatedAt`
- [x] Prisma `Page` model: `id`, `storyId`, `order`, `chapterTitle?`, `text?` (optional — book and comic pages may be illustration-only), `illustrations (JSON — array of { url, position })`, `layout?`
- [x] Prisma `StoryBlueprint` model: `id`, `name`, `description`, `type`, `systemPrompt` (structured with XML markers e.g. `<intro_prompt>`, `<climax_prompt>` for multi-stage LLM guidance), `coverImageKey?`, `previewPageKeys (String[] default [])`, `createdById`, `createdAt`, `updatedAt`
- [x] Prisma migrations
- [x] Storage module: S3 abstraction (MinIO for dev, AWS S3 for prod) — upload, get signed URL, delete
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
- [ ] Frontend: `/library` dashboard page (partial):
    - Greeting + tonight's tale (one static suggestion)
    - "Your readers" child cards with "+ New tale" quick action
    - "Your library" tale grid with filter chips (All / For [Child] / Books / Comics)
    - Stats bar stubbed (zeros until Phase 8 wires subscription data)
    - "In the Workshop" strip placeholder (wired in Phase 5)
- [ ] Frontend: `/library/[storyId]` story reader (read-only at this stage):
    - Breadcrumb + page header (title, subtitle, Download PDF stub)
    - Chapter list (left panel)
    - Spread viewer with navigation (center)
    - Details panel (right — created, reader, format, style, language, file size)
    - Regeneration and rating panels rendered but inactive (wired in Phases 7 and 10)
- [ ] Admin frontend: StoryBlueprint CRUD UI
- [ ] Tests: Story CRUD, scoping, draft lifecycle, StoryBlueprint admin-only create, workshop form renders and submits

**Acceptance Check:**

- User can save a DRAFT story via the workshop form
- Art styles load from DB in the form
- Admin can CRUD StoryBlueprints
- Stories scoped per user; StoryBlueprints publicly listable
- Story reader renders chapter list and spread viewer
- Tests pass

**Deliverables:** `_docs/phase-4-stories.md`

---

### Phase 5 — Generation Pipeline

**Goal:** end-to-end generation from DRAFT to downloadable PDF with real-time progress.

**Sub-tasks:**

- [ ] BullMQ setup (Nest BullMQ module), Redis connection
- [ ] Prisma `Job` model: `id`, `storyId`, `type`, `status`, `progress`, `error?`, `attempts`, `createdAt`, `updatedAt`
- [ ] Queue definitions: `outline`, `text`, `illustration`, `assembly`, `upload`
- [ ] OpenRouter client (configurable model via `OPENROUTER_MODEL` env)
- [ ] DALL-E client (with exponential backoff retry, max 3 attempts)
- [ ] 1-concurrent-story enforcement: check for active job before enqueuing; return 409 if one exists
- [ ] **PageTemplate system** (`src/modules/rendering/`): `page-templates.config.ts` typed config (A5 1748×2480px, image zones with exact px dimensions, text zones with maxChars + type, font defaults, Handlebars template file per layout); `PdfRendererService` (resolves layout by name, renders via Handlebars, Puppeteer A5 → single page PDF, pdf-lib stitches pages); Handlebars templates for all 9 layouts (`book-cover`, `book-illustration`, `book-full-illustration`, `book-final`, `comic-cover`, `comic-2-panel`, `comic-3-panel`, `comic-4-panel`, `comic-splash`)
- [ ] **Layout resolution** (before Outline): assign a `PageTemplate` name to each page slot based on `StoryType`, `pageCount`, and composition rules (first page = cover, last = final, book pages alternate illustration sides, comic splash no more than once)
- [ ] **Stage 1 — Outline:** LLM generates page-by-page outline + chapter titles; each page receives its resolved `PageTemplate` spec (exact image dimensions, maxChars) as hard constraints in the prompt
- [ ] **Stage 2 — Words:** LLM writes content per page (parallelizable; age-adaptive prompt)
- [ ] **Stage 3 — Pictures:** DALL-E generates image(s) per page (parallelizable; consistent style prefix + character description)
- [ ] **Stage 4 — Moderation:** LLM-based text moderation; image moderation via DALL-E safety flags (runs silently — not a named user-visible stage)
- [ ] **Stage 5 — Binding:** `PdfRendererService` resolves Handlebars template by `Page.layout` name, injects page data, Puppeteer renders each page to A5 PDF; pdf-lib stitches single-page PDFs into final document; watermark layer applied for free-tier users via Puppeteer overlay
- [ ] **Stage 6 — Ready:** PDF uploaded to S3, signed URL stored on Story; Story status → COMPLETED
- [ ] SSE endpoint: `GET /stories/:id/progress` — streams per-page completion events (not just %) + stage transitions
- [ ] Retry policy: exponential backoff, 3 retries, transient errors only (4xx fails immediately)
- [ ] Failure handling: mark Story FAILED, surface error to user
- [ ] `/workshop` routing: if active job exists → redirect to `/workshop/[jobId]`; otherwise show form
- [ ] Frontend: `/workshop/[jobId]` generation progress page:
    - Fox mascot + progress bar ("page X of Y · [stage] · ~N min remaining")
    - Pipeline stage row: Outline ✓ → Words ✓ → Pictures (active) → Binding → Ready
    - "Pages so far" grid: thumbnails appear per SSE page-completion event; active page glows
    - Workshop log (LIVE badge): timestamped, short human-friendly label per event
    - "Close safely" banner (email + address displayed)
- [ ] Frontend: "In the Workshop" strip on `/library` dashboard wired (shows active job)
- [ ] Frontend: Download PDF button wired on story reader on COMPLETED stories
- [ ] Frontend: workshop summary panel — wire credit cost and remaining balance from subscription API (stubbed as `CREDIT_COST = 5` / `STUB_REMAINING = 12` in `WorkshopSummary.tsx` in Phase 4)
- [ ] Email notification on story_completed (Resend) — also creates bell `Notification` record
- [ ] Bell notification on story_failed — also creates bell `Notification` record
- [ ] Resend client module (used here and expanded in Phase 9)
- [ ] Tests: each pipeline stage independently (mocked LLM/DALL-E), SSE events, 1-concurrent enforcement, failure handling

**Acceptance Check:**

- User submits workshop form → redirected to generation page → sees per-page real-time progress → story completes → PDF downloadable
- Second generation attempt while one is active returns 409
- Failed stories surface error to user
- Free tier PDFs are watermarked
- User receives email on completion
- Tests pass

**Deliverables:** `_docs/phase-5-generation.md`

---

### Phase 6 — Mid-point Documentation

**Goal:** consolidate what was built in Phases 1–5 into coherent, durable documentation for both developers and AI. The core happy path is complete at this point — good moment to document the system as a whole before adding complexity.

**Sub-tasks:**

- [ ] Architecture overview doc: system design, data flow diagram, key decisions and their rationale (covers Phases 0–5)
- [ ] API reference: all endpoints, request/response shapes, auth rules, error codes
- [ ] Developer onboarding guide: prerequisites, env setup, local run (frontend + backend + workers), first contribution checklist
- [ ] Review and improve all `_docs/phase-N-*.md` files (0–5): fill gaps, fix stale info, ensure commands still work
- [ ] Sweep `CLAUDE.md` + all `.claude/rules/*.md`: incorporate patterns and lessons learned from Phases 1–5; propose updates for developer approval
- [ ] Verify `DESIGN.md` and `ROADMAP.md` reflect actual built state (no drift)

**Acceptance Check:**

- A new developer can clone the repo, follow the onboarding guide, and run the full stack locally without assistance
- All `_docs/phase-0` through `_docs/phase-5` docs are accurate and complete
- `CLAUDE.md` and rules files updated with any new conventions discovered
- Architecture overview covers all major system components

**Deliverables:** `_docs/phase-6-midpoint-docs.md`

---

### Phase 7 — Page Regeneration

**Goal:** users can regenerate specific pages within tier limits, with an optional prompt.

**Sub-tasks:**

- [ ] Endpoint: `POST /stories/:id/pages/:order/regenerate` with body `{ what: 'text' | 'illustration' | 'both', prompt?: string }`
- [ ] Track regenerations per User per month; enforce per-tier limits (read from Subscription; use free-tier placeholder limit until Phase 8)
- [ ] Re-render PDF after page regeneration, replace S3 file
- [ ] Frontend: wire regeneration in story reader right panel:
    - "Regenerate words on this page" → opens modal (current page text as context + optional prompt field + submit)
    - "Repaint the picture" → opens modal (illustration description as context + optional prompt field + submit)
    - "N regenerations left this month" (stubbed count until Phase 8 wires subscription quota)
- [ ] Tests: regeneration flow, optional prompt forwarded to LLM/DALL-E, quota enforcement (placeholder limit)

**Acceptance Check:**

- User can regenerate text / illustration / both for a page
- Optional prompt is respected in regenerated output
- Quota tracked and enforced (at least with free-tier placeholder)
- PDF updates correctly
- Tests pass

**Deliverables:** `_docs/phase-7-regeneration.md`

---

### Phase 8 — Subscriptions (Paddle)

**Goal:** users can subscribe, quotas are enforced per plan, billing details visible in account settings, account deletion supported.

**Sub-tasks:**

- [ ] Prisma `Plan` model: `id`, `name`, `paddleProductId`, `priceMonthly`, `pagesPerMonth`, `regenerationsPerMonth`, `childrenLimit`, `retentionDays`, `watermark (bool)`
- [ ] Prisma `Subscription` model: `id`, `userId`, `planId`, `paddleSubscriptionId`, `status`, `currentPeriodEnd`, `pagesUsed`, `regenerationsUsed`
- [ ] Prisma migrations
- [ ] Paddle integration: checkout link generation, webhook handler (created, updated, canceled, payment_failed)
- [ ] Quota service: validate pages + regenerations against subscription before allowing operations
- [ ] Quota service: deduct page credits on generation completion (1 per book page, 2 per comic page)
- [ ] Children limit enforcement: `childrenLimit` from Plan enforced in children endpoint (backfills Phase 2's uncapped endpoint)
- [ ] `DELETE /me`: cancel active Paddle subscription (if any) then delete user + all owned data
- [ ] Retention cleanup job (cron): delete PDFs past tier `retentionDays`
- [ ] Frontend: `/account` → Subscription section wired:
    - Current plan card (name, billing, description, next renewal, VAT breakdown)
    - Usage bars: pages painted X/Y · regenerations X/Y · children profiles X/Y
    - Payment details section (card "Change" → Paddle billing portal; billing email / address / Tax ID displayed from Paddle API)
    - Past parcels list (invoice history from Paddle API)
    - Upgrade / Cancel subscription actions
- [ ] Frontend: `/account` → Privacy & data section: GDPR info + "Delete account" flow
- [ ] Frontend: stats bar on `/library` dashboard wired (pages this month / left / regenerations / tales count)
- [ ] Frontend: regeneration quota count wired in story reader (was stubbed in Phase 7)
- [ ] Frontend: workshop length section helper text wired ("N pages will use N of your N remaining credits this month." — depends on subscription quota API; currently absent from UI)
- [ ] Frontend: `/pricing` page wired to real Plan data (replaces Phase 3 static hardcoded data — ships in Phase 8)
- [ ] Tests: webhook handling, quota enforcement, children limit, retention cleanup, account deletion flow

**Acceptance Check:**

- User can subscribe via Paddle
- Quotas enforced before generation and regeneration
- Children limit enforced per plan
- Account deletion cancels subscription and removes all user data
- Free-tier PDFs expire per retention policy
- Tests pass

**Deliverables:** `_docs/phase-8-subscriptions.md`

---

### Phase 9 — Notifications

**Goal:** full notification preferences UI, in-app bell wiring, subscription event emails.

> Note: story_completed and story_failed notifications (email + bell record) already ship in Phase 5.
> This phase adds: all remaining event types, user preferences, and the bell UI.

**Sub-tasks:**

- [ ] Prisma `Notification` model: `id`, `userId`, `type`, `payload (JSON)`, `readAt?`, `createdAt` (may already be created in Phase 5 — verify)
- [ ] Notifications module: list (`GET /notifications`), mark-as-read (`PATCH /notifications/:id/read`), mark-all-read endpoints
- [ ] Subscription event notifications (emit on Paddle webhook events): payment_failed (bell + email), subscription_canceled (bell + email), subscription_renewed (email only)
- [ ] Resend email templates for all remaining event types
- [ ] Frontend: private header — wire notification bell (was shell in Phase 3):
    - Dropdown showing last 20 notifications
    - Unread badge count
    - Mark-as-read on open / individual mark-as-read
    - "Mark all as read" action
- [ ] Frontend: `/account` → Notifications section wired: per-event toggles (email vs in-app on/off)
- [ ] User notification preferences stored on `User` or separate `NotificationPreference` model (decide at implementation)
- [ ] Tests: notification creation, email sending (mocked), mark-as-read, preferences respected

**Acceptance Check:**

- Bell shows unread count; dropdown lists recent notifications
- Subscription events trigger correct email + bell combinations
- User can toggle notification preferences per event type
- Tests pass

**Deliverables:** `_docs/phase-9-notifications.md`

---

### Phase 10 — Ratings & Public Sharing

**Goal:** users can rate completed stories; opt-in public stories appear on the landing page.

**Sub-tasks:**

- [ ] Prisma `Rating` model: `id`, `storyId`, `userId`, `score (1-5)`, `comment?`, `createdAt`
- [ ] Endpoint: `POST /stories/:id/rating` (upsert — one per user per story); accepts `{ score, comment?, isPublic? }`
- [ ] When `isPublic = true` in rating payload: set `Story.isPublic = true`
- [ ] `GET /stories/public` — paginated list of public stories (for landing page "Tales lit this week")
- [ ] `GET /admin/ratings` (admin only)
- [ ] Frontend: wire rating panel in story reader right panel (was inactive in Phase 4):
    - 1–5 star input
    - Optional comment textarea
    - "Share this story as an example for other families" opt-in toggle
    - "Save rating" button
- [ ] Frontend: `/` landing page — wire public stories grid (was empty in Phase 3)
- [ ] Admin: manage `Story.isPublic` visibility (override/retract public status)
- [ ] Tests: rating CRUD, upsert behavior, isPublic propagation, public story list, admin rating view

**Acceptance Check:**

- User can rate a completed story
- Opting in makes the story appear on the landing page public grid
- Admin can view all ratings and manage public visibility
- Tests pass

**Deliverables:** `_docs/phase-10-ratings.md`

---

### Phase 11 — Admin Panel

**Goal:** admin can manage users, review stories, manage templates and art styles, view stats.

**Sub-tasks:**

- [ ] Admin-only frontend route group with auth guard
- [ ] User management: list, suspend, change role
- [ ] Story moderation queue: list flagged/reported stories, mark as reviewed, force-delete, toggle `isPublic`
- [ ] StoryBlueprints UI (polish Phase 4 implementation)
- [ ] ArtStyle management UI: list, create, edit (name, slug, thumbnail, promptPrefix), activate/deactivate, reorder
- [ ] Ratings + feedback view (list all ratings from Phase 9)
- [ ] Stats dashboard: counts (users, stories, active subs), revenue from Paddle API
- [ ] Tests: admin auth guard, all admin endpoints

**Acceptance Check:**

- Admin can do all the above
- Non-admins blocked from admin routes
- Tests pass

**Deliverables:** `_docs/phase-11-admin.md`

---

### Phase 12 — Localization (EN + RU)

**Goal:** UI in EN/RU, generated content in EN/RU.

**Sub-tasks:**

- [ ] Frontend: `next-intl` setup, EN + RU translation files
- [ ] `/account` → Language section wired: EN / RU switcher (persists to `User.language Language` if logged in, else cookie — reuses `Language` enum already defined in Phase 4)
- [ ] Backend: localized error messages via Accept-Language header
- [ ] Generation: `language` param drives LLM output language (already passed in `customization` JSON — ensure prompts are language-aware)
- [ ] Translate all existing UI strings to RU
- [ ] Tests: language switching, localized errors, generated content in correct language

**Acceptance Check:**

- UI switches between EN/RU
- Generated stories respect language param
- Tests pass

**Deliverables:** `_docs/phase-12-localization.md`

---

### Phase 13 — Final Documentation

**Goal:** bring all documentation to launch-ready quality. Everything is built; nothing is deployed yet. Last chance to capture what was actually built before the codebase is live and changing under load.

**Sub-tasks:**

- [ ] Ops runbook: deployment procedure, rollback steps, env variable reference (all vars across all services), health check endpoints
- [ ] Monitoring & alerting guide: log structure (Pino), what to watch, how to diagnose common failures
- [ ] Backup strategy doc: Postgres backup schedule + restore procedure, S3 versioning policy
- [ ] Final sweep of all `_docs/phase-N-*.md` (0–12): verify accuracy, update any commands or configs that changed during later phases
- [ ] Final sweep of `CLAUDE.md` + all `.claude/rules/*.md`: incorporate all patterns and lessons from Phases 6–12; propose updates for developer approval
- [ ] Final review of `DESIGN.md`: confirm it matches what was actually built (no deferred items silently dropped)
- [ ] Final review of `ROADMAP.md`: move completed items to ✅, update open questions, archive resolved deferred decisions
- [ ] Update architecture overview doc (from Phase 6) to reflect full system including Phases 6–12 additions

**Acceptance Check:**

- Ops runbook covers full deployment from zero to live
- All per-phase docs accurate and complete through Phase 12
- `CLAUDE.md` and rules files reflect all conventions established across the full build
- `ROADMAP.md` accurately reflects the shipped product

**Deliverables:** `_docs/phase-13-final-docs.md`

---

### Phase 14 — Production Deploy

**Goal:** app runs in production via dokploy.

**Sub-tasks:**

- [ ] Production env variables documented
- [ ] Production Dockerfiles tested end-to-end
- [ ] AWS S3 bucket provisioned
- [ ] Production Postgres + Redis provisioned
- [ ] Paddle production credentials wired
- [ ] OpenAI/OpenRouter production keys wired
- [ ] Resend production credentials wired
- [ ] Domain + HTTPS (handled by dokploy)
- [ ] dokploy deployment pipeline configured
- [ ] Smoke tests in production env (login → generate one story → download)
- [ ] Backup strategy for Postgres + S3 documented

**Acceptance Check:**

- App reachable on production domain
- End-to-end flow works (login → generate → download)
- Backups configured

**Deliverables:** `_docs/phase-14-deploy.md`

---

## 10. Post-MVP Backlog (v2+)

- User-facing StoryBlueprint selection in workshop (browse blueprints, preview pages via signed URLs, filter by StoryType); StoryBlueprint cover/preview image upload endpoints (`POST /story-blueprints/:id/cover`, `POST /story-blueprints/:id/previews`)
- Photo personalization (switch image provider to Flux or SD with IP-Adapter)
- Referral program (link-based, free book/pages reward)
- Full public sharing gallery (browse all public stories)
- Sentry + OpenTelemetry observability
- Magic email link auth
- Email/password auth, Apple OAuth
- Export library (ZIP of all user PDFs)
- "From the Wonder Jar" AI-personalized question suggestions (requires story history analysis)
- "From page X" text excerpt preview during generation
- "About this page" per-page generation context panel in story reader
- Mobile apps
- Audio narration (TTS)
- Print-on-demand integration
- More languages (French, Estonian, Spanish, German)
- Public API for third-party integrations

---

## 11. Ideas & Future Directions

> Not scheduled. No implementation commitment. Worth revisiting when MVP is stable.

- **Workshop step-by-step wizard pagination** — currently a single scrollable form; a step-by-step flow (Reader → Question → Look → Review) could improve UX for new users at scale
- **Family plan upsell card** — contextual upsell in the dashboard "Your readers" section, personalized based on usage patterns
- **AI-flavored workshop log descriptions** — during generation, produce whimsical human-like prose for each log event instead of short labels (e.g. "The mountain breathed slowly into the story...")
- **Workshop estimated paint time** — display "Estimated paint time: ~N minutes" in the summary panel before submission; estimate based on page count, story type, and live queue depth; surface via a dedicated API field once generation infrastructure is stable (Phase 5+ prerequisite)
- **"Share with family"** — share a specific story link with other family members (grandparents, etc.)

---

## 12. Progress Tracking

| Phase                         | Status         | Notes                                                                                    |
| ----------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| 0 — Infrastructure            | ✅ Done        |                                                                                          |
| 1 — Auth                      | ✅ Done        |                                                                                          |
| 2 — Children                  | ✅ Done        |                                                                                          |
| 3 — Design System             | ✅ Done        | SuggestionChip deferred to Phase 4; static page copy deferred to dedicated content phase |
| 4 — Stories & StoryBlueprints | 🟡 In progress | Backend + API layer + types + SuggestionChip done; seed + frontend pages + tests remain  |
| 5 — Generation Pipeline       | ⬜ Not started |                                                                                          |
| 6 — Mid-point Documentation   | ⬜ Not started |                                                                                          |
| 7 — Regeneration              | ⬜ Not started |                                                                                          |
| 8 — Subscriptions             | ⬜ Not started |                                                                                          |
| 9 — Notifications             | ⬜ Not started |                                                                                          |
| 10 — Ratings & Public Sharing | ⬜ Not started |                                                                                          |
| 11 — Admin Panel              | ⬜ Not started |                                                                                          |
| 12 — Localization             | ⬜ Not started |                                                                                          |
| 13 — Final Documentation      | ⬜ Not started |                                                                                          |
| 14 — Production Deploy        | ⬜ Not started |                                                                                          |

Status legend: ⬜ Not started · 🟡 In progress · ✅ Done · 🔵 Needs rules-revision approval

---

## 13. Open Questions

- Image moderation provider — DALL-E's own safety flags are the default; explicit image moderation provider TBD if coverage proves insufficient.
- Backup strategy specifics for Postgres + S3 — confirm in Phase 14.
- Notification preferences storage — `User` JSON field vs separate `NotificationPreference` model — decide in Phase 9.
- Static page copy — all four static pages (`/how-it-works`, `/pricing`, `/contact`, `/privacy`) contain placeholder copy. Deferred to a dedicated content phase before launch. See Deferred Decision #5.
