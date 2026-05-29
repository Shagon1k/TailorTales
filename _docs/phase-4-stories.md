# Phase 4 — Stories, Workshop & Library

> Status: ✅ Completed on 2026-05-29
> Related ROADMAP section: Phase 4

## Summary

Phase 4 delivers the full story-creation loop: a data model for stories and story blueprints, a storage abstraction for S3 assets, a scrollable workshop creation form, a library dashboard, a story reader, and an admin UI for managing blueprints. No AI generation runs yet — stories are created as `DRAFT` and generation is wired in Phase 5. Everything in this phase is the scaffolding that Phase 5 will bring to life.

---

## What Was Added

### Backend

- **Prisma models:** `Story` (status enum DRAFT → QUEUED → GENERATING → COMPLETED → FAILED, S3 keys, language enum EN | RU), `Page` (chapterTitle, text, illustrations JSON, layout), `StoryBlueprint` (systemPrompt with XML markers, S3 preview keys)
- **Migrations:** `Story`, `Page`, `StoryBlueprint` tables; `Page.storyId` cascade delete
- **Storage module:** `StorageService` — S3 abstraction (MinIO for dev, AWS S3 for prod) with `upload`, `getSignedUrl`, `delete`. Keys are always generated server-side; signed URLs are valid for 1 hour. Never passed raw keys to the client.
- **Stories module:** `GET /stories/public`, `GET /stories/config`, `GET /stories`, `GET /stories/:id`, `POST /stories`, `DELETE /stories/:id`. All user-scoped routes enforce ownership via `where: { id, userId }` returning 404 on mismatch.
- **StoryBlueprints module:** `GET /story-blueprints` (public), `GET /story-blueprints/:id` (public), `POST /story-blueprints` (admin only), `PATCH /story-blueprints/:id` (admin only), `DELETE /story-blueprints/:id` (admin only). Admin routes guarded by `AdminGuard` (403 on non-admin).
- **Seed script:** 2 StoryBlueprints (one BOOK, one COMIC) with XML-structured system prompts ready for Phase 5 generation pipeline auto-selection.

### Frontend — API layer

- `src/api/stories.ts` / `stories.server.ts` — client + server-side story API
- `src/api/story-blueprints.ts` / `story-blueprints.server.ts` — client + server-side blueprint API
- `src/api/children.server.ts`, `src/api/art-styles.server.ts` — server-only fetch helpers
- `src/utils/date.utils.ts` — shared `getAge` and `getRelativeTime` (Intl.RelativeTimeFormat) utilities

### Frontend — `/workshop`

- Single scrollable creation form (not a wizard): reader selector, question textarea + suggestion chips, format selector (Book / Comic), length selector (5 / 8 / 12 / 16 / 20 pp), art style grid, language selector
- Sticky right panel: live summary + "Light the lantern →" CTA
- On submit: creates DRAFT story → redirects to `/library` (Phase 5 will redirect to `/workshop/[jobId]`)
- Accepts `?childId=` and `?question=` query params for pre-fill from library links

### Frontend — `/library`

- **`/library`** dashboard: time-of-day greeting (locale-aware utils, switch-based for future i18n), reader row with "+ New tale" quick actions, tale grid with filter chips (All / For [Reader] / Books / Comics), wonder jar suggestion list
- Stats bar: tale count is real; pages/regenerations stubbed pending Phase 5 and 8
- Only `COMPLETED` stories appear in the library — DRAFTs are filtered out at the page level

### Frontend — `/library/[storyId]`

- RSC page redirects non-COMPLETED stories to `/library`
- 3-column layout: chapter list (left), spread viewer (centre), right panels
- **SpreadViewer:** ARIA carousel pattern — `aria-controls`, `aria-live` polite live region announces chapter on navigation, `aria-roledescription="carousel"`, descriptive button labels with target spread number
- **Spread model:** `getSpreads(pages)` pairs 2 pages/spread; isolated in `spread.utils.ts` for Phase 5 revision
- **StoryPage:** text side has decorative `::first-letter` drop cap; illustration side shows dashed hatch placeholder with `painted by the workshop` label
- **Right panels:** AboutPanel (Regenerate/Repaint disabled — Phase 7), RatingPanel (Save disabled — Phase 10), DetailsPanel (dl/dt/dd rows)

### Frontend — `/admin/blueprints`

- Admin-only area protected by `AdminGuard` (checks `user.role === 'ADMIN'`, redirects non-admins to `/library`)
- `/admin/blueprints` — list page with name, type, created date, edit links
- `/admin/blueprints/new` — create form
- `/admin/blueprints/[id]` — edit form with delete (confirmation dialog)
- `BlueprintForm` shared client component: name, description, type (RadioCardGroup), systemPrompt (large textarea, 5000 char max with live counter)

---

## Resulting Structure

```
backend/src/modules/
  stories/
    __tests__/stories.controller.spec.ts
    __tests__/stories.service.spec.ts
    dto/create-story.dto.ts
    stories.constants.ts
    stories.controller.ts
    stories.service.ts
    stories.types.ts
  story-blueprints/
    __tests__/story-blueprints.controller.spec.ts
    __tests__/story-blueprints.service.spec.ts
    dto/create-story-blueprint.dto.ts
    dto/update-story-blueprint.dto.ts
    story-blueprints.constants.ts
    story-blueprints.controller.ts
    story-blueprints.service.ts
    story-blueprints.types.ts
  storage/
    storage.module.ts
    storage.service.ts

frontend/src/
  api/
    children.server.ts
    art-styles.server.ts
    stories.ts / stories.server.ts
    story-blueprints.ts / story-blueprints.server.ts
  utils/
    date.utils.ts           ← getAge, getRelativeTime (shared)
  app/
    admin/
      layout.tsx            ← AdminGuard wrapper
      _components/AdminGuard/AdminGuard.tsx
      blueprints/
        page.tsx / page.module.scss
        new/page.tsx
        [id]/page.tsx
        _components/BlueprintForm/
        _components/BlueprintList/
    (private)/
      workshop/
        page.tsx
        _components/WorkshopForm/
          __tests__/WorkshopForm.component.spec.tsx
          components/ArtStyleGrid/
          components/ReaderChip/
          components/ReaderSelector/
          components/WorkshopSummary/
      library/
        page.tsx
        _components/LibraryGreeting/
          utils/greeting.utils.ts   ← getPeriod, getPeriodLabel, formatDateLine
        _components/ReaderRow/
          components/ReaderCard/
            utils/reader-card.utils.ts
        _components/TaleGrid/
          utils/tale-grid.utils.ts  ← applyFilter, TFilter
          components/TaleCard/
        _components/WonderJar/
        [storyId]/
          page.tsx
          _components/StoryReader/
            utils/spread.utils.ts   ← getSpreads, spreadIndexForPage
            components/ReaderHeader/
            components/ChapterList/
            components/SpreadViewer/
              components/StoryPage/
            components/AboutPanel/
            components/RatingPanel/
            components/DetailsPanel/
```

---

## Commands

```bash
# Run all tests
cd backend && pnpm test
cd frontend && pnpm test

# Run only Phase 4 backend tests
cd backend && pnpm vitest run src/modules/stories/__tests__ src/modules/story-blueprints/__tests__

# Run only WorkshopForm test
cd frontend && pnpm vitest run "src/app/(private)/workshop/_components/WorkshopForm/__tests__"
```

---

## Configuration / Environment Variables

No new environment variables in Phase 4. Storage variables (introduced earlier) remain:

| Variable             | Example                 | Required | Description                |
| -------------------- | ----------------------- | -------- | -------------------------- |
| `STORAGE_ENDPOINT`   | `http://localhost:9000` | yes      | MinIO/S3 endpoint          |
| `STORAGE_ACCESS_KEY` | `minioadmin`            | yes      | S3 access key              |
| `STORAGE_SECRET_KEY` | `minioadmin`            | yes      | S3 secret key              |
| `STORAGE_BUCKET`     | `tailortales`           | yes      | Bucket name                |
| `STORAGE_REGION`     | `us-east-1`             | yes      | Region (MinIO: any string) |

---

## Database Migrations

- `20260527_add_story_and_pages` — creates `Story` and `Page` tables; `Page.storyId` cascades on delete
- `20260527_add_story_blueprint` — creates `StoryBlueprint` table

---

## Gotchas & Known Limitations

- **All stories are DRAFT in Phase 4.** The library filters to `COMPLETED` only, so the library dashboard is empty until Phase 5 wires the generation pipeline. This is intentional.
- **Workshop redirects to `/library` after submit.** Phase 5 will change this to `/workshop/[jobId]` for the live generation progress page.
- **Story reader is unreachable in dev** without a seeded `COMPLETED` story. Phase 5 makes it reachable via the generation flow.
- **WorkshopSummary credit cost is stubbed** (`CREDIT_COST = 5`, `STUB_REMAINING = 12`). Phase 5 wires real balance from the subscription API.
- **S3 keys are never passed to the frontend.** `coverImageKey` and `pdfKey` are stripped from all responses; only pre-signed URLs are sent. Signed URLs expire after 1 hour.
- **`spread.utils.ts` is Phase 5-revisitable.** The 2-pages-per-spread model is a face-value reading of the design. Real generated layouts (cover, colophon, comic panels) may require a revised pairing strategy.
- **AdminGuard is client-side only.** The NestJS `AdminGuard` enforces server-side authorization on mutation endpoints. The frontend `AdminGuard` provides UX redirect only — it is not a security boundary.
- **`getRelativeTime` locale is hardcoded to `en-US`.** A switch-based extension point exists in `date.utils.ts`; wire to i18n context when Phase localization lands.

---

## Tests

| Suite                     | File                                                                                                     | Tests |
| ------------------------- | -------------------------------------------------------------------------------------------------------- | ----- |
| StoriesService            | `backend/src/modules/stories/__tests__/stories.service.spec.ts`                                          | 8     |
| StoriesController         | `backend/src/modules/stories/__tests__/stories.controller.spec.ts`                                       | 8     |
| StoryBlueprintsService    | `backend/src/modules/story-blueprints/__tests__/story-blueprints.service.spec.ts`                        | 10    |
| StoryBlueprintsController | `backend/src/modules/story-blueprints/__tests__/story-blueprints.controller.spec.ts`                     | 9     |
| WorkshopForm              | `frontend/src/app/(private)/workshop/_components/WorkshopForm/__tests__/WorkshopForm.component.spec.tsx` | 9     |

Total new tests: **44** (35 BE + 9 FE). Full suite: 66 BE / 169 FE, all passing.

---

## Follow-ups / Open Items

- **Phase 5:** Generation pipeline (DRAFT → QUEUED → GENERATING → COMPLETED), SSE progress events, `/workshop/[jobId]` progress page, "In the Workshop" strip on library dashboard, Download PDF button on reader
- **Phase 7:** Regenerate words / repaint picture on individual pages (AboutPanel currently disabled)
- **Phase 8:** Subscription stats bar on library dashboard (pages this month, pages left, regenerations used)
- **Phase 10:** Rate this tale submission (RatingPanel currently disabled)
- **Post-MVP:** StoryBlueprint cover image + preview page upload via admin UI (`coverImageKey`, `previewPageKeys`)
- **Post-MVP:** User-facing StoryBlueprint selection in workshop (currently auto-selected by type in generation pipeline)
