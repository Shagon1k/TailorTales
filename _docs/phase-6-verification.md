# Phase 6 — Human Verification & Bug Fixing

> QA gate before mid-point documentation. Developer runs the full happy path against the real app with live keys; bugs are logged, triaged, and fixed here before Phase 7 documentation begins.

---

## Automated Baseline (run 2026-06-01)

| Check             | Result                                                 |
| ----------------- | ------------------------------------------------------ |
| `pnpm lint`       | ✅ Clean (both FE + BE)                                |
| `pnpm type-check` | ✅ Clean (both FE + BE)                                |
| `pnpm test`       | ✅ 39 FE + 21 BE test files, 169 + 99 tests — all pass |

---

## Pre-walkthrough Checklist

- [x] `docker-compose up` — Postgres, Redis, MinIO healthy
- [x] `backend/.env` — all required vars present
- [x] `frontend/.env.local` — `NEXT_PUBLIC_BACKEND_URL` present
- [x] `pnpm dev` — both apps boot without errors (`GET /health` → 200)
- [ ] Seed: art styles (8), StoryBlueprints (≥1 BOOK) present

### Env gap (as of baseline)

The following vars are in `backend/.env.example` but **not found** in `backend/.env`:

| Var                      | Required for                                     |
| ------------------------ | ------------------------------------------------ |
| `JWT_SECRET`             | Auth (any authenticated request)                 |
| `JWT_EXPIRY_DAYS`        | Auth                                             |
| `BACKEND_URL`            | OAuth callback URL                               |
| `FRONTEND_URL`           | Post-OAuth redirect                              |
| `REDIS_URL`              | BullMQ / generation queue                        |
| `OPENROUTER_API_KEY`     | Live generation (text + images)                  |
| `OPENROUTER_TEXT_MODEL`  | Generation                                       |
| `OPENROUTER_IMAGE_MODEL` | Generation                                       |
| `USE_AI_STUBS`           | Offline pipeline (set `true` to skip real calls) |
| `RESEND_API_KEY`         | Email notifications                              |
| `RESEND_FROM`            | Email sender address                             |
| `CONTACT_INBOX_EMAIL`    | Contact form routing                             |

`frontend/.env.local` does not exist — needs `NEXT_PUBLIC_BACKEND_URL=http://localhost:3001`.

---

## Triage Log

> Severity: **blocker** (happy path blocked) · **major** (significant UX/data issue) · **minor** (noticeable but workaroundable) · **polish** (visual imperfection)
> Area: **FE** · **BE** · **pipeline** · **content**

| #   | Severity | Area | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Status   |
| --- | -------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | blocker  | BE   | Backend crashed on startup: `ReferenceError: exports is not defined in ES module scope` in `dist/generated/prisma/client.js`. Root cause: Prisma 7 `prisma-client` generator emits `import.meta.url` in generated TypeScript; TypeScript `nodenext` + CJS (no `"type":"module"`) preserved it verbatim in output; Node.js v24 routed the file through the ESM loader, where `exports` is undefined. Fix: added `"type": "module"` to `backend/package.json` (the project was already ESM-ready: `nodenext` tsconfig + `.js` extensions on all imports). Also converted 3 files using CJS `__dirname` to `dirname(fileURLToPath(import.meta.url))`. Added `nest-cli.json` `assets` config to copy `.hbs` templates and rendering assets (placeholder image + fonts) to `dist/` on build — these were absent from `dist/` and caused a second crash. | ✅ Fixed |

---

## Happy-path Walkthrough Script

Steps to execute against the live app (real OpenRouter + Resend keys):

1. **Auth** — open `/`, click "Begin a tale →", sign in with Google, land on `/library`
2. **Child** — add a child profile (name, birthdate, gender, interests)
3. **Workshop** — navigate to `/workshop`, fill the form (child, question, Book format, 5 pages, any art style, EN), submit
4. **Generation progress** — redirected to `/workshop/[jobId]`; observe stage row (Planning → Pictures → Binding → Ready) and per-page thumbnail grid lighting up in real time
5. **Completion** — story appears as COMPLETED; email notification received (check inbox)
6. **Library** — story card appears on `/library`; "In the Workshop" strip gone
7. **Reader** — open story; PDF downloads correctly; pages render in spread viewer; rating + regeneration panels present
8. **Download** — PDF opens with correct A5 layout, fonts, images, watermark, no overflow

---

## Cross-cutting Review Checklist

### Navigation

- [ ] Public header renders: How it works · Pricing · Sign in · "Begin a tale →"
- [ ] Private header renders: Library · Workshop · bell · avatar
- [ ] Account sidebar all sections present; non-wired sections show placeholder
- [ ] Footer: Privacy · Contact links present

### Static pages

- [ ] `/` landing — hero, 3-step cards, public stories grid (empty), CTA
- [ ] `/how-it-works` renders
- [ ] `/pricing` plan cards render (static data)
- [ ] `/privacy` renders
- [ ] `/contact` form renders

### Account pages

- [ ] `/account/profile` — view + edit name
- [ ] `/account/children` — list, add, edit, delete child
- [ ] `/account/subscription` — placeholder
- [ ] `/account/notifications` — placeholder
- [ ] `/account/language` — placeholder
- [ ] `/account/privacy` — placeholder

### Empty / loading / error states

- [ ] Library with no stories — empty state visible
- [ ] Workshop form validation — required fields blocked
- [ ] Attempting second generation while one active — 409 surfaced to user
- [ ] Failed generation — error surfaced in library + reader

### Backend

- [ ] Cross-user access blocked (another user's story → 403/404)
- [ ] SSE stream fires per-page events
- [ ] Signed URL expiry works (re-request after expiry → new URL)

---

## Issues Fixed

_Populated as fixes are applied._

| #   | Commit    | Description                                                                                                                                                                                                                                                                                                               |
| --- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | _pending_ | ESM fix: `"type":"module"` in backend/package.json, `__dirname` → ESM polyfill in 3 files, nest-cli.json asset copying                                                                                                                                                                                                    |
| 2   | _pending_ | Wrong auth routes: Header `Sign in` → `/sign-in` (404), `Begin a tale` → `/sign-up` (404), private nav had wrong `/account/library` + `/account/workshop` paths and a spurious "Children" link. Also fixed 5 more `/sign-up` links across `HeroSection`, `CtaSection`, and `pricing/page.tsx`. All now point to `/login`. |

---

## Deferrals

_Issues triaged as minor/polish, deferred with developer sign-off._

| #   | Description | Severity | Deferred to |
| --- | ----------- | -------- | ----------- |
| —   | —           | —        | —           |
