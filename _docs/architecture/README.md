# Architecture Overview

> The current-state description of how TailorTales is built — the source of truth for how the
> system works today. Delivery scope lives in
> [GitHub Project 2](https://github.com/users/Shagon1k/projects/2); historical planning lives
> in [`_docs/archive/`](../archive/).

## In this document

- [What TailorTales does](#what-tailortales-does)
- [Repository layout](#repository-layout)
- [Tech stack](#tech-stack)
- [Backend architecture](#backend-architecture)
- [Frontend architecture](#frontend-architecture)
- [Infrastructure & integrations](#infrastructure--integrations)

See also: [data-model.md](data-model.md) · [generation-pipeline.md](generation-pipeline.md) · [auth.md](auth.md) · [user-flows.md](user-flows.md)

## What TailorTales does

TailorTales generates short (5–20 page), personalized PDF storybooks for children. A
parent answers their child's question in the **Workshop**, the backend runs an AI
**generation pipeline** (text + illustrations), stitches the result into an A5 PDF, and
emails the parent a link. Books are read in an in-browser reader and downloaded as PDF.

The end-to-end happy path, and the modules it touches:

```
Sign in (Google)        → AuthModule
  → add a Child         → ChildrenModule
  → fill Workshop form  → StoriesModule        (creates a DRAFT Story)
  → "Light the lantern" → GenerationModule      (enqueues a BullMQ Job)
      Planning → Moderation → Pictures → Binding → Ready   (the pipeline)
  → live progress       → SSE stream            (GET /stories/:id/progress)
  → email + bell        → EmailModule + NotificationsModule
  → read / download PDF  → StoriesModule + StorageModule (signed S3 URLs)
```

## Repository layout

A **pnpm-workspace monorepo** — no Turborepo. Two deployable apps plus shared root config.

```
TailorTales/
  backend/        NestJS REST API + BullMQ generation worker (same process at MVP)
  frontend/       Next.js App Router (React, TypeScript, Mantine)
  _docs/          This documentation (architecture, api, guides, decisions)
  AGENTS.md      Agent-facing project instructions
  .agent-docs/   Source-of-truth agent rule docs
  .agents/       Generic repo skills
  .claude/       Claude compatibility adapters
  docker-compose.yml   Postgres + Redis + MinIO for local dev
```

Root scripts orchestrate both apps: `pnpm dev`, `pnpm build`, `pnpm lint`,
`pnpm type-check`, `pnpm test` all fan out to `backend/` and `frontend/`. See
[guides/getting-started.md](../guides/getting-started.md) to run it.

## Tech stack

| Area              | Choice                                   | Notes                                        |
| ----------------- | ---------------------------------------- | -------------------------------------------- |
| Backend           | NestJS (TypeScript, ESM)                 | REST, module-per-feature                     |
| Frontend          | Next.js App Router + Mantine             | CSS Modules (SCSS), tokens → theme → modules |
| FE state          | React Query (server) + Context (session) | Zustand reserved for richer UI state         |
| Database          | PostgreSQL via Prisma                    | Client generated to `src/generated/prisma`   |
| Queue             | BullMQ (Redis-backed)                    | One in-process worker at MVP                 |
| Object storage    | MinIO (dev) / AWS S3 (prod)              | [ADR](../decisions/storage-minio-vs-s3.md)   |
| AI (text + image) | OpenRouter via `fetch`                   | Env-configurable models                      |
| PDF               | Puppeteer + Handlebars + pdf-lib         | HTML → A5 PDF, self-hosted fonts             |
| Email             | Resend                                   | Transactional (story + contact)              |
| Auth              | Google OAuth + JWT in httpOnly cookie    | [Docs](auth.md)                              |
| Real-time         | SSE (Server-Sent Events)                 | Generation progress                          |

## Backend architecture

### Module map

NestJS discovers everything through the module tree rooted at
[`app.module.ts`](../../backend/src/app.module.ts). Feature modules live in `src/modules/`;
infrastructure (`config/`, `prisma/`, `generated/`, `scripts/`, `common/`) sits at
`src/` root.

| Module                  | Responsibility                                                                                                               | Key endpoints                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `AuthModule`            | Google OAuth, JWT issuance, the global `JwtAuthGuard`                                                                        | `/auth/google`, `/auth/google/callback`, `/auth/logout`                                        |
| `UserModule`            | Current-user profile read/update, GDPR export, account deletion                                                              | `/me`, `/me/export`, `DELETE /me`                                                              |
| `ChildrenModule`        | Child CRUD, scoped to the owner; enforces `PricingTier.childrenLimit`                                                        | `/children`                                                                                    |
| `ArtStylesModule`       | List active art styles (user); full CRUD + thumbnail generation (admin)                                                      | `/art-styles`, `/admin/art-styles`                                                             |
| `StoryBlueprintsModule` | Narrative-DNA blueprints (admin CRUD, user-readable list)                                                                    | `/story-blueprints`                                                                            |
| `StoriesModule`         | Story CRUD + generation/progress URLs + page HTML for iframe reader                                                          | `/stories`, `/stories/:id/generate`, `/stories/:id/progress`, `/stories/:id/pages/:order/html` |
| `CharactersModule`      | Character CRUD scoped to owner; optional preview image generation                                                            | `/characters`, `/characters/:id/preview`                                                       |
| `GenerationModule`      | The generation pipeline (enqueue, worker, 5 stages)                                                                          | _(no controller; generate + progress routes live in `StoriesController`)_                      |
| `RegenerationModule`    | Per-page re-generation with monthly quota; re-stitches PDF after each change                                                 | `/stories/:id/pages/:order/regenerate`                                                         |
| `RenderingModule`       | `PdfRendererService` + `PdfBindingService` + the PageTemplate contract                                                       | _(consumed by generation and regeneration pipelines)_                                          |
| `AiModule`              | `AiClient` / `AiStubClient` behind the `AI_CLIENT` token                                                                     | —                                                                                              |
| `StorageModule`         | S3 upload / signed URL / bulk delete; key patterns in `storage.keys.ts`                                                      | —                                                                                              |
| `EmailModule`           | `ResendClient` / `EmailStubClient` behind `EMAIL_CLIENT` token                                                               | —                                                                                              |
| `PricingTiersModule`    | Public pricing tier list                                                                                                     | `/pricing`                                                                                     |
| `SubscriptionsModule`   | `QuotaService` (assert/deduct credits, watermark, children limit); usage summary; monthly reset cron; retention cleanup cron | `/subscriptions/me`                                                                            |
| `BillingModule`         | Paddle checkout + webhook handler; billing portal + invoice list                                                             | `/webhooks/paddle`, `/billing/cancel`, `/billing/portal`, `/billing/invoices`                  |
| `NotificationsModule`   | `NotificationsService` (inbox, mark-read, SSE stream, preferences) + `NotificationEmitterService` (event → bell + email)     | `/notifications`, `/notifications/stream`, `/notifications/preferences`                        |
| `RatingsModule`         | Story rating upsert; admin rating view                                                                                       | `/stories/:id/rating`, `/stories/:id/public`, `/admin/ratings`                                 |
| `AdminModule`           | Admin stats dashboard + user management (list, role change, suspend)                                                         | `/admin/stats`, `/admin/users`                                                                 |
| `ContactModule`         | Public contact form → inbox email                                                                                            | `/contact`                                                                                     |

Deep dive on the generation flow: **[generation-pipeline.md](generation-pipeline.md)**.

### Request lifecycle

Every HTTP request passes through the same chain:

```
Request
  → CORS (origin = FRONTEND_URL, credentials: true)
  → cookie-parser                       (reads the access_token cookie)
  → JwtAuthGuard (global APP_GUARD)     @Public() routes skip it; others load User from DB
  → ValidationPipe (global, whitelist)  DTO validation strips unknown fields
  → Controller → Service → Prisma / Queue / Storage
  → AllExceptionsFilter                 uniform { statusCode, message }, logs 5xx only
```

Two cross-cutting pieces worth knowing:

- **Auth is deny-by-default.** `JwtAuthGuard` is registered globally via `APP_GUARD`,
  so no route is unprotected unless it opts out with `@Public()`. The full
  request → guard → strategy → `@CurrentUser()` flow is documented in [auth.md](auth.md).
- **Errors are uniform.** [`AllExceptionsFilter`](../../backend/src/common/http-exception.filter.ts)
  turns every thrown exception into `{ statusCode, message }`. 4xx (expected) are not
  logged; 5xx and unexpected errors log a stack trace and return a generic message so
  internals never leak. The BullMQ pipeline runs _outside_ HTTP context, so its failures
  are handled in the pipeline's own catch block, not here.

## Frontend architecture

Next.js **App Router**. The session is fetched server-side in the root layout and seeded
into a client `UserProvider`; everything else is React Query.

### Route groups

```
src/app/
  layout.tsx              root: fetches user (RSC) → <Providers initialUser>
  providers.tsx           QueryClient (per-request useState) + MantineProvider + UserProvider
  (public)/               Header + Footer chrome; landing, how-it-works, pricing, privacy, contact
  (private)/              AuthGuard + private Header/Footer; library, workshop, account
  admin/                  AdminGuard; stats, users, stories, art-styles, ratings, blueprints
  login/                  no chrome (full-bleed split layout)
  not-found.tsx           custom 404
```

Route groups `()` set which layout/chrome wraps a page without affecting the URL.
`login` sits outside any group so it renders with no header/footer.

All routes have a `[locale]` prefix (`/en`, `/de`, `/ru`) managed by `next-intl`. Links and
navigation use locale-aware wrappers from `src/i18n/navigation.ts` instead of `next/navigation`
directly.

**Page inventory:**

| Route                    | Auth   | What it does                                                                 |
| ------------------------ | ------ | ---------------------------------------------------------------------------- |
| `/`                      | public | Landing — hero, how-it-works explainer, public stories grid                  |
| `/how-it-works`          | public | Product walkthrough                                                          |
| `/pricing`               | public | Plan comparison cards, fetched from `GET /pricing`                           |
| `/privacy`               | public | Privacy policy                                                               |
| `/contact`               | public | Contact form (routes to `CONTACT_INBOX_EMAIL`)                               |
| `/login`                 | public | Google OAuth entry; full-bleed layout, no chrome                             |
| `/library`               | user   | Story grid with filters; usage stats bar; "In the Workshop" active-job strip |
| `/library/[storyId]`     | user   | Story reader: spread viewer, regeneration panel, rating panel, PDF download  |
| `/workshop`              | user   | Generation form; redirects to `/workshop/[jobId]` if a job is active         |
| `/workshop/[jobId]`      | user   | Live generation progress: stage indicators, per-page thumbnail grid, SSE log |
| `/account/profile`       | user   | Name + avatar                                                                |
| `/account/children`      | user   | Child CRUD with character description per child                              |
| `/account/subscription`  | user   | Plan card, usage bars, billing portal link, invoice list                     |
| `/account/notifications` | user   | Per-event email / in-app toggles                                             |
| `/account/language`      | user   | Locale switcher (EN / DE / RU)                                               |
| `/account/privacy`       | user   | GDPR: data export + account deletion                                         |
| `/admin`                 | admin  | Stats dashboard (users, stories, active subscriptions, MRR)                  |
| `/admin/users`           | admin  | Paginated user table: search, role change, suspend                           |
| `/admin/stories`         | admin  | Paginated story table: search, force-delete, toggle public                   |
| `/admin/art-styles`      | admin  | ArtStyle CRUD, thumbnail generation, reorder                                 |
| `/admin/ratings`         | admin  | Read-only ratings view                                                       |
| `/admin/blueprints`      | admin  | StoryBlueprint CRUD                                                          |

### Responsive shell

The web app supports three breakpoints:

```text
Mobile   < 768px
Tablet   768px-1023px
Desktop  >= 1024px
```

Desktop keeps the classic header-led navigation. Mobile and tablet use an
application-style fixed footer dock, while the header keeps brand presence and the
notification bell.

| User state | Footer dock items                       | Sheet behavior                                                                  |
| ---------- | --------------------------------------- | ------------------------------------------------------------------------------- |
| Guest      | How it works · Pricing · Sign in · More | `More` contains secondary public links, including contact/privacy.              |
| Signed in  | Library · Workshop · Account · More     | `Account` opens account sections; `More` contains language + public/help links. |

Mobile/tablet route content should be intentionally adapted, not only squeezed:

- Hero/header layouts center their primary content where the page reads like an app screen.
- Sidebars collapse below desktop; account/admin section navigation moves into explicit
  mobile affordances rather than staying as narrow desktop sidebars.
- Table-heavy surfaces use contained horizontal scroll when a dense table is the clearest
  representation.
- Modals keep the app visible behind the overlay, preserve sticky headers, and use footer
  action bars for long or destructive flows on mobile.
- The story reader is single-column on mobile: the page preview, navigation, regeneration,
  rating, and download actions are ordered as touch-friendly sections instead of a desktop
  main/aside split.

### Session & client auth

**Session seeding** — the root `layout.tsx` is an RSC. It calls `getServerUser()` and passes
the result as `initialUser` to `<Providers>`. `UserProvider` feeds it into React Query as
`initialData`, so the session is available on first render with no loading flash. React Query
re-validates it in the background. To read session state anywhere in client components:

```ts
const { user, isLoading, refetch } = useCurrentUser(); // from @/context/UserContext
```

**Client guards vs. backend guard** — the backend `JwtAuthGuard` rejects every unauthenticated
API call; that is the security boundary. The client guards are UX only — they prevent rendering
an invalid state and redirect the browser:

- **`AuthGuard`** (wraps `(private)/` layout) — redirects to `/login` if `user` is null.
- **`AdminGuard`** (wraps `admin/` layout) — redirects non-admins (`USER` role) to `/library`,
  unauthenticated users to `/login`. Allows both `ADMIN` and `SUPER_ADMIN`.

Both are client components: they read `useCurrentUser()` and fire `router.replace()` via
`useEffect`. They do not replace the backend guard — they complement it.

**Session + subscription seeding** — the root `layout.tsx` fetches both the user and the
subscription in parallel and seeds the React Query cache via `useState` initializers. This
prevents a "…" flash on the `HeaderUserChip` during locale navigation, where Next.js
remounts the layout but the cache is cold.

### Component location & the promotion rule

Components start **co-located** with the route that uses them and are lifted only when a
second route or feature area needs them. This is the single most important FE convention:

| Kind               | Location                              |
| ------------------ | ------------------------------------- |
| Design-system atom | `src/components/ui/<Name>/`           |
| Shared structural  | `src/components/shared/<Name>/`       |
| Route component    | `src/app/<route>/_components/<Name>/` |

`_components/` prevents Next.js from treating the folder as a route segment. Private
sub-components nest under a `components/` subfolder.

### Data layer

Call chain (client): component → hook (`hooks/<resource>.ts`) → `api/<resource>.ts` → `apiFetch` (`lib/api.ts`).
Call chain (RSC): server component → `api/<resource>.server.ts` → `apiFetch` (`lib/api.server.ts`).

- **`src/lib/api.ts`** (`apiFetch`) — client-side fetch wrapper; **`src/lib/api.server.ts`**
  — the RSC equivalent.
- **`src/api/<resource>.ts`** — typed client API objects (e.g. `storiesApi`).
  **`src/api/<resource>.server.ts`** — RSC variants, each starts with `import 'server-only'`.
- **`src/hooks/<resource>.ts`** — React Query hooks; query keys are exported `as const`.
- **`src/types/<resource>.types.ts`** — shared response/payload interfaces.

### Error handling

`apiFetch` (client-side) and its RSC counterpart both throw `ApiError(status, message)` on any
non-2xx response. There is **no automatic redirect on 401** at the fetch layer — the session is
managed by React Query's `useCurrentUser()`, and the `AuthGuard` component redirects to `/login`
when the user is null. Catching specific status codes (e.g. 404, 409) is the responsibility of
each hook or component.

### Styling

Four strictly-ordered layers: design tokens (`styles/_tokens.scss`) → typography mixins →
Mantine theme (`theme/mantine.ts`) → per-component `.module.scss`. Components consume
**semantic tokens only**, never primitives or hardcoded values. The atom library wraps
Mantine and overrides it with compound modifier classes (`.button.m-primary`).

The atom library (`src/components/ui/`) includes: `Button`, `Card`, `Badge`, `Rating`,
`Avatar`, `Modal`, `Toast`, `Input`, `Textarea`, `Select`, `TagsInput`, `Divider`,
`Progress`, `Link`, `CapsLabel`, `BrandMark`, `StatCard`, `NotificationBell`,
`SuggestionChip`, `Popover`, `Switch`, `Table` (compound), `Loader`, `Pagination`, `Icon`.
Shared structural components (`src/components/shared/`) include `Header` (with
`LocaleSwitcher`, `NotificationCenter`, `HeaderUserChip`), `Footer`, and `SidebarLayout`
(used by both `/account` and `/admin`).

#### Action elements

`Button` is the single entry point for button styling. Supported variants are:

| Variant     | Use for                                                   |
| ----------- | --------------------------------------------------------- |
| `primary`   | The main affirmative action on a surface                  |
| `secondary` | Important non-primary actions, including external portals |
| `quiet`     | Low-emphasis cancel/back/neutral actions                  |
| `danger`    | Destructive confirmation actions                          |

All variants use the same weight, hover glow, focus ring, and pressed active motion so the
button system feels related rather than mixed from unrelated styles.

`Link` defaults to the gold inline link treatment. Use quieter/on-card variants only when the
surrounding surface already supplies enough emphasis.

`Icon` centralizes local SVG icon configs used by navigation and shared actions. Add new
inline SVGs there when an icon is shared across components; keep route-local one-off artwork
co-located with the route.

## Infrastructure & integrations

- **PostgreSQL** holds all entities. `Page` rows are the materialized, validated Story
  Plan — the source the PDF is rendered from; the PDF is a derived artifact. See
  [data-model.md](data-model.md).
- **S3 keys, never URLs**, are stored in the DB (`pdfKey`, `coverImageKey`,
  `Page.illustrations[].key`). The signed URL is computed at serve time after an
  ownership check. Key patterns live in one place:
  [`storage.keys.ts`](../../backend/src/modules/storage/storage.keys.ts).
- **Redis + BullMQ** decouple the HTTP enqueue from the long-running pipeline. At MVP the
  worker runs in the same process as the API; scaling out is "add worker processes against
  the shared queue" with no code change.
- **OpenRouter** (text + images) and **Resend** (email) are external. Both have stub
  clients — AI stubs gated by `USE_AI_STUBS`, email stubs by `USE_EMAIL_STUBS` — so the
  full pipeline and CI run offline with zero spend.
