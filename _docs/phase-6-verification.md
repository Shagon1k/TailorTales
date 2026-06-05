# Phase 6 — Human Verification & Bug Fixing

> Status: ✅ Completed on 2026-06-05
> Related ROADMAP section: Phase 6

---

## Summary

Developer-driven QA gate covering the full happy path (auth → children → workshop → generation → PDF) against the live app with real OpenRouter and Resend keys. Bugs discovered during walkthrough were logged, triaged, and fixed before Phase 7 documentation begins. All blocker and major issues are resolved; minor/polish items are either fixed or explicitly deferred.

---

## Automated Baseline (run 2026-06-01)

| Check             | Result                                                 |
| ----------------- | ------------------------------------------------------ |
| `pnpm lint`       | ✅ Clean (both FE + BE)                                |
| `pnpm type-check` | ✅ Clean (both FE + BE)                                |
| `pnpm test`       | ✅ 39 FE + 21 BE test files, 169 + 99 tests — all pass |

---

## Triage Log

> Severity: **blocker** (happy path blocked) · **major** (significant UX/data issue) · **minor** (noticeable but workaroundable) · **polish** (visual imperfection)
> Area: **FE** · **BE** · **pipeline** · **content**

| #   | Severity | Area     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Status      |
| --- | -------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | blocker  | BE       | Backend crashed on startup: `ReferenceError: exports is not defined in ES module scope`. Root cause: Prisma 7 generator emits `import.meta.url` in TypeScript output; Node v24 routed it through the ESM loader where `exports` is undefined. Fix: added `"type":"module"` to `backend/package.json`; converted 3 files using `__dirname` to `dirname(fileURLToPath(import.meta.url))`; added `nest-cli.json` assets config to copy `.hbs` templates + fonts + placeholder image to `dist/` (these were absent from dist, causing a second crash). | ✅ Fixed    |
| 2   | blocker  | FE       | Wrong navigation routes throughout the app: Header "Sign in" → `/sign-in` (404), "Begin a tale →" → `/sign-up` (404). Private header had `/account/library` and `/account/workshop` (404s) and a spurious "Children" link. Five more `/sign-up` links across `HeroSection`, `CtaSection`, and `pricing/page.tsx`. All corrected to `/login`, `/library`, `/workshop`.                                                                                                                                                                              | ✅ Fixed    |
| 3   | blocker  | BE       | Auth callback redirected to `FRONTEND_URL` (the landing page `/`) after Google OAuth. Users landed on the public home page instead of `/library`. Fixed `AuthController` to redirect to `${frontendUrl}/library`.                                                                                                                                                                                                                                                                                                                                  | ✅ Fixed    |
| 4   | blocker  | FE       | Story reader showed broken images: page illustrations were stored in DB as S3 keys (`{key, position}[]`) but `StoriesService.toDetail()` only resolved the top-level `coverImageUrl` and `pdfUrl` — it never resolved per-page illustration keys to signed URLs. Reader received raw keys instead of URLs.                                                                                                                                                                                                                                         | ✅ Fixed    |
| 5   | blocker  | FE       | MinIO/S3 image URLs blocked by Next.js: `next.config.ts` only whitelisted the backend hostname; images served directly from MinIO (`NEXT_PUBLIC_STORAGE_URL`, default `http://localhost:9000`) were blocked by `next/image` remote-patterns validation. All story illustrations and cover images were silently refused.                                                                                                                                                                                                                            | ✅ Fixed    |
| 6   | major    | BE       | Boolean env vars (`USE_AI_STUBS`, `USE_EMAIL_STUBS`, `STORAGE_FORCE_PATH_STYLE`) were received as strings from `.env` files but compared against `boolean` in validation — `"true" !== true` so flags were always `false`. Added explicit string-to-boolean coercion before `plainToInstance` in `validateEnv`.                                                                                                                                                                                                                                    | ✅ Fixed    |
| 7   | major    | BE       | `EmailModule` used `USE_AI_STUBS` to select the stub email client instead of its own flag. Running with `USE_AI_STUBS=true` did not stub emails — Resend was still called. Added dedicated `USE_EMAIL_STUBS` env var and updated the factory in `EmailModule`.                                                                                                                                                                                                                                                                                     | ✅ Fixed    |
| 8   | major    | BE       | Unhandled exceptions returned raw NestJS error objects with stack traces to the client. Added `AllExceptionsFilter` (global) that formats all responses as `{ statusCode, message }`, logs 5xx with full stack, suppresses 4xx noise, and never leaks internal details.                                                                                                                                                                                                                                                                            | ✅ Fixed    |
| 9   | major    | BE       | OpenRouter API errors exposed raw HTTP details to users via the pipeline error message (e.g. `"OpenRouter 429: …"`). Added `AppError` class for user-safe messages; `AiClient` now throws `AppError` with readable messages (`"AI service rate limit reached…"`, `"AI service temporarily unavailable…"`); pipeline uses `AppError` vs generic `Error` to decide whether to surface the message or show a generic fallback.                                                                                                                        | ✅ Fixed    |
| 10  | major    | pipeline | SSE missed already-completed page events on reconnect: the `isFirstPoll` guard suppressed `page_complete` events when `completedPages > 0` at connection time. A user refreshing mid-generation saw a blank thumbnail grid. Fix: on first poll the baseline is set to `0` so all completed pages replay as events.                                                                                                                                                                                                                                 | ✅ Fixed    |
| 11  | major    | pipeline | PDF page rendering race condition: `PdfRendererService.render()` used `Promise.all()` across all pages, causing Puppeteer to open N browser tabs simultaneously. Under load this produced garbled PDFs (pages rendering into wrong tabs) and occasional crashes. Changed to sequential `for…of` loop.                                                                                                                                                                                                                                              | ✅ Fixed    |
| 12  | major    | FE       | Notification badge persisted forever: `storyCompleted`/`storyFailed` create `Notification` DB records (`readAt: null`), but there was no endpoint to mark them read. Added `GET /notifications/unread-count` + `PATCH /notifications/read-all` endpoints; Header polls every 30 s; clicking the bell immediately clears the count and fires `PATCH /notifications/read-all` (optimistic update).                                                                                                                                                   | ✅ Fixed    |
| 13  | major    | content  | Both text-only templates (`book-text`, `book-text-image`) were missing the chapter title eyebrow label in the rendered PDF — the field was in the DB but not wired into the template. Added chapter title rendering, drop-cap first letter, and italic body text to both templates. `book-text-image` also had image on top / text below — layout swapped to text-top / image-bottom to match storybook reading flow.                                                                                                                              | ✅ Fixed    |
| 14  | minor    | pipeline | Puppeteer font detection used `document.fonts.ready` (a Promise, always truthy in a boolean context) instead of `document.fonts.status === "loaded"` (a string check). Fonts were not reliably loaded before PDF capture, occasionally producing PDFs with fallback fonts.                                                                                                                                                                                                                                                                         | ✅ Fixed    |
| 15  | minor    | pipeline | Puppeteer launched without `--disable-dev-shm-usage`, causing crashes in memory-constrained environments (Docker with default `/dev/shm` limits). Flag added.                                                                                                                                                                                                                                                                                                                                                                                      | ✅ Fixed    |
| 16  | minor    | FE       | BrandMark in Header used `size="sm"` (non-existent variant, silently fell back to default 36 px). Changed to `size="lg"` (56 px) to match design intent.                                                                                                                                                                                                                                                                                                                                                                                           | ✅ Fixed    |
| 17  | minor    | FE       | Mascot images were scattered across `public/images/` with inconsistent naming. Consolidated all fox mascot webps into `public/images/mascot/` directory; introduced the `MascotImage` shared component (`src/components/shared/MascotImage/`) as the single import point. Login page migrated from raw `<Image>` to `<MascotImage>`.                                                                                                                                                                                                               | ✅ Fixed    |
| 18  | polish   | FE       | Next.js default 404 page shown for unknown routes. Replaced with a branded `not-found.tsx`: fox-question mascot with aura glow, "Lost in the woods?" heading, and a "Take me home" CTA button.                                                                                                                                                                                                                                                                                                                                                     | ✅ Fixed    |
| 19  | polish   | FE       | Account placeholder pages (`/account/subscription`, `/account/notifications`, `/account/language`, `/account/privacy`) were missing `export const metadata` — browser tab showed the app's default title. Added `Metadata` export to each. Login page also lacked a layout with metadata; added `login/layout.tsx`.                                                                                                                                                                                                                                | ✅ Fixed    |
| 20  | polish   | FE       | App favicon was a generic tree-fox icon at 32 × 32 px, unrelated to the fox-logo mascot. Replaced `src/app/icon.png` with a new 32 × 32 favicon generated from `fox-logo.webp` with a bark (`#583b35`) rounded-square background. Added `apple-icon.png` at 180 × 180 for Apple touch icon.                                                                                                                                                                                                                                                        | ✅ Fixed    |
| 21  | deferred | FE       | FAILED stories are not reachable from the library after navigating off the progress page — library filters to `COMPLETED` only. The progress page now surfaces failure actions, but a persistent "failed" entry with "Try again" in the library is missing. See Deferred Decision #8 in ROADMAP.                                                                                                                                                                                                                                                   | ⏭ Deferred |

---

## Issues Fixed

| #   | Commits              | Description                                                                          |
| --- | -------------------- | ------------------------------------------------------------------------------------ |
| 1   | `0fc9b87`            | ESM startup: `"type":"module"`, `__dirname` polyfills, nest-cli assets copy          |
| 2   | `754ff66`            | Nav route corrections throughout FE (Header + public pages)                          |
| 3   | `0fc9b87`            | Auth callback: redirect to `${frontendUrl}/library` instead of `frontendUrl`         |
| 4   | `0fc9b87`            | Page illustration keys resolved to signed URLs in `StoriesService.toDetail`          |
| 5   | `0fc9b87`            | `next.config.ts`: added `NEXT_PUBLIC_STORAGE_URL` to `images.remotePatterns`         |
| 6   | `0fc9b87`            | Boolean env coercion: `USE_AI_STUBS`, `USE_EMAIL_STUBS`, `STORAGE_FORCE_PATH_STYLE`  |
| 7   | `0fc9b87`            | `EmailModule`: `USE_AI_STUBS` → `USE_EMAIL_STUBS` for stub selection                 |
| 8   | `0fc9b87`            | Global `AllExceptionsFilter` + `AppError` class                                      |
| 9   | `0fc9b87`            | `AiClient` wraps OpenRouter errors in user-safe `AppError` messages                  |
| 10  | `0fc9b87`            | SSE baseline fix: already-completed pages replay on first poll                       |
| 11  | `0fc9b87`            | PDF rendering sequential `for…of` (was `Promise.all`)                                |
| 12  | `0fc9b87`            | Notification badge: `unread-count` + `read-all` endpoints + Header wiring            |
| 13  | `0fc9b87`            | `book-text.hbs` + `book-text-image.hbs`: chapter title, drop cap, italic; layout fix |
| 14  | `0fc9b87`            | Puppeteer: `document.fonts.status === "loaded"` font gate                            |
| 15  | `0fc9b87`            | Puppeteer: `--disable-dev-shm-usage` flag                                            |
| 16  | `754ff66`            | BrandMark in Header: `size="sm"` → `size="lg"`                                       |
| 17  | `11550a1`            | Mascot images to `public/images/mascot/`; `MascotImage` shared component             |
| 18  | `754ff66`            | Custom `not-found.tsx`: branded 404 with fox-question mascot                         |
| 19  | `754ff66`            | Account + login `Metadata` exports; `login/layout.tsx` added                         |
| 20  | `c74593e`, `0fc9b87` | Favicon: new `icon.png` + `apple-icon.png` from fox-logo mascot, bark bg             |

---

## Deferrals

| #   | Description                                                                                                                                                                                                                                                                                             | Severity | Deferred to                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------- |
| 1   | **FAILED stories not surfaced in library.** Library only shows `COMPLETED` stories; FAILED stories are unreachable after leaving the generation page. Requires: stop filtering to COMPLETED-only, add failed-state visual to `TaleCard`, wire "Try again" link. Logged as ROADMAP Deferred Decision #8. | major    | Phase 8 (pre-Phase 9 subscriptions) |

---

## Resulting Structure

New or significantly changed files:

```
backend/
  src/
    common/
      errors.ts                          ← AppError: user-safe pipeline error class
      http-exception.filter.ts           ← AllExceptionsFilter: global error handler
    modules/
      ai/
        ai.client.ts                     ← AppError wrapping for OpenRouter errors
      generation/
        generation.pipeline.ts           ← AppError distinction for user-facing messages
        generation.service.ts            ← SSE baseline fix (first-poll replay)
      notifications/
        notifications.controller.ts      ← GET /notifications/unread-count + PATCH /read-all
        notifications.service.ts         ← markAllRead()
      rendering/
        pdf-renderer.service.ts          ← Sequential rendering, font gate fix, Puppeteer flags
        templates/
          book-text-image.hbs            ← Text-top/image-bottom layout, drop cap, italic
      stories/
        stories.service.ts               ← Per-page illustration keys → signed URLs

frontend/
  src/
    app/
      icon.png                           ← New favicon (32×32, bark bg)
      apple-icon.png                     ← Apple touch icon (180×180, bark bg)
      not-found.tsx                      ← Branded 404: fox-question mascot, "Lost in the woods?"
      not-found.module.scss
      login/
        layout.tsx                       ← New: Metadata "Sign In"
      (private)/account/
        language/page.tsx                ← Metadata added
        notifications/page.tsx           ← Metadata added
        privacy/page.tsx                 ← Metadata added
        subscription/page.tsx            ← Metadata added
    api/
      notifications.ts                   ← fetchUnreadCount + markAllNotificationsRead
    components/
      shared/
        Header/
          Header.tsx                     ← unreadCount polling + bell onClick mark-all-read
        MascotImage/
          MascotImage.tsx                ← New shared component for mascot webp images
          MascotImage.module.scss
  next.config.ts                         ← NEXT_PUBLIC_STORAGE_URL in remotePatterns
  public/
    images/
      mascot/                            ← All fox mascot webps consolidated here
        fox-logo.webp
        fox-hero.webp
        fox-books.webp   (+ 9 more)
```

---

## Configuration / Environment Variables

| Variable                  | Example                 | Required | Description                                                      |
| ------------------------- | ----------------------- | -------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_STORAGE_URL` | `http://localhost:9000` | yes      | MinIO / S3 base URL; whitelisted in `next/image` remote patterns |
| `USE_EMAIL_STUBS`         | `false`                 | no       | Set `true` to skip Resend and log emails to console instead      |

`NEXT_PUBLIC_STORAGE_URL` was missing from `frontend/.env.example` — added in this phase.
`USE_EMAIL_STUBS` was split out from `USE_AI_STUBS` which incorrectly controlled both AI and email stubs.

---

## Gotchas & Known Limitations

- **ESM + Node v24:** `backend/package.json` now has `"type":"module"`. Any future file using `__dirname` or `require()` must be converted to ESM equivalents (`dirname(fileURLToPath(import.meta.url))` and dynamic `import()`).
- **Boolean env vars must be coerced:** `.env` files deliver all values as strings. `USE_AI_STUBS`, `USE_EMAIL_STUBS`, and `STORAGE_FORCE_PATH_STYLE` are coerced via `validateEnv` before validation. Any new boolean var added to `EnvironmentVariables` must also be added to the `BOOLEAN_KEYS` array in `env.validation.ts`.
- **`USE_AI_STUBS` and `USE_EMAIL_STUBS` are now independent:** setting one does not stub the other. Both must be `true` for a fully offline local run (no OpenRouter, no Resend calls).
- **Puppeteer sequential rendering:** pages are rendered one at a time to avoid tab-level race conditions. On a machine with many CPU cores this is a safe conservative choice; parallel rendering can be revisited when the iframe reader (Deferred Decision #9) normalises the render path.
- **Notification polling:** the 30 s `setInterval` in Header is an explicit Phase 6 shim. Phase 10 replaces it with SSE (`GET /notifications/stream`) as noted in the ROADMAP.
- **`NEXT_PUBLIC_STORAGE_URL` must match the MinIO/S3 host exactly** — including port for local dev. A mismatch silently blocks all story images in the reader.
- **FAILED stories:** accessible via direct URL (`/library/[storyId]`) and via the generation progress page; not listed in the library grid. See Deferred Decision #8.

---

## Follow-ups / Open Items

- Deferred Decision #8 (ROADMAP): surface FAILED stories in the library with a "Try again" action — scheduled for Phase 8.
- Deferred Decision #9 (ROADMAP): iframe-based story reader for 1:1 PDF alignment — scheduled for Phase 8.
- Phase 10 will remove the 30 s polling shim in Header and replace it with `GET /notifications/stream` (SSE).
