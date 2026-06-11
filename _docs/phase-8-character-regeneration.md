# Phase 8 — Character Consistency & Page Regeneration

> Status: ✅ Completed on 2026-06-11
> Related ROADMAP section: Phase 8

## Summary

Phase 8 delivered two capabilities: repeatable character identity across generated stories, and per-page regeneration for completed stories. A `Character` entity stores a text description of a child's recurring visual identity; the generation pipeline snapshots it into `Story.styleAnchor` before painting begins, so every image prompt carries the same visual reference. Regeneration lets users rewrite text, repaint an illustration, or redo both on any page — with an optional free-text prompt to guide the AI — within a monthly quota. The phase also resolved two deferred items: FAILED stories now surface in the library with a badge and "Try again" link (Deferred #8), and the story reader now renders pages through the same Handlebars/Puppeteer path as the PDF via an iframe endpoint, eliminating font/layout drift between web and PDF (Deferred #9).

## What Was Added

**Entities / schema:**

- `Character` — `userId`, `childId?`, `name`, `description`, `source (MANUAL_DESCRIPTION)`, `generatedPreviewImageKey?`
- `Story.characterId?` — provenance reference to the Character used at creation time
- `User.regenerationsInWindow`, `User.regenerationWindowStartedAt` — 30-day rolling quota window (migrated to `Subscription` in Phase 9)

**Backend modules:**

- `CharactersModule` — full CRUD scoped to user; `POST /characters/:id/preview` generates and stores a preview image
- `RegenerationModule` — `RegenerationService` handles text / illustration / both re-generation; enforces 30-day rolling quota; re-stitches PDF after each page change; `POST /stories/:id/pages/:order/regenerate`
- `PdfBindingService` extracted from generation pipeline (reused by regeneration)

**Endpoints:**

| Method | Path                                   | Description                               |
| ------ | -------------------------------------- | ----------------------------------------- |
| GET    | `/characters`                          | List user's characters                    |
| GET    | `/characters/:id`                      | Get one character                         |
| POST   | `/characters`                          | Create character                          |
| PATCH  | `/characters/:id`                      | Update character                          |
| DELETE | `/characters/:id`                      | Delete character                          |
| POST   | `/characters/:id/preview`              | Generate/regenerate preview image         |
| POST   | `/stories/:id/pages/:order/regenerate` | Regenerate page (text/illustration/both)  |
| GET    | `/stories/:id/pages/:order/html`       | Return page HTML for iframe preview       |
| GET    | `/static/fonts/*`                      | Self-hosted fonts (Express static assets) |

**Frontend pages / components:**

- `RegenerationPanel` + `RegenerationModal` — replaces the stub `AboutPanel` in the story reader right column; three actions (Regenerate text, Repaint illustration, Remake everything), optional author note, loading/error states
- `StoryPageIframe` — replaces `StoryPage`; fetches rendered HTML from the new endpoint, scales a fixed A5 stage via `ResizeObserver`, caches visited pages in a `useRef` map
- `TaleCard` — FAILED state: dark overlay badge, "Try again →" CTA, links to `/workshop?storyId=…`
- `/library` page — filters include FAILED stories alongside COMPLETED
- `/workshop` page + `WorkshopForm` — reads `?storyId=` param, fetches story server-side, pre-fills all six form fields on retry
- `/account/children` — character description field per child
- Workshop summary — shows the selected child's Character, inline edit action

## Resulting Structure

```
backend/
  src/
    main.ts                          (useStaticAssets for /static/fonts + CORS header)
    modules/
      characters/
        characters.controller.ts
        characters.service.ts
        characters.module.ts
        characters.constants.ts
        characters.prompts.ts
        dto/
        __tests__/characters.service.spec.ts
      regeneration/
        regeneration.service.ts
        regeneration.module.ts
        regeneration.constants.ts
        regeneration.prompts.ts
        dto/
        __tests__/regeneration.service.spec.ts
      rendering/
        pdf-renderer.service.ts      (buildPageHtml now public; HTTP font URL)
        pdf-binding.service.ts       (extracted from generation pipeline)
      stories/
        stories.service.ts           (getPageHtml method)
        stories.controller.ts        (GET .../html + POST .../regenerate endpoints)
  prisma/
    migrations/
      20260610104120_add_character_model/
      20260610200000_add_user_regeneration_quota/
frontend/
  src/
    api/
      stories.ts                     (regeneratePage, getPageHtml)
    types/
      character.types.ts
      story.types.ts                 (IRegenerateWhat, IRegeneratePagePayload)
    app/(private)/
      library/
        page.tsx                     (FAILED filter)
        _components/TaleGrid/components/TaleCard/  (FAILED state)
        [storyId]/_components/StoryReader/
          components/
            RegenerationPanel/       (new — replaces AboutPanel)
            SpreadViewer/components/
              StoryPageIframe/       (new — replaces StoryPage)
      workshop/
        page.tsx                     (storyId retry pre-fill)
        _components/WorkshopForm/    (initialStoryType/PageCount/ArtStyleId/Language props)
      account/children/              (character form integration)
```

## Configuration / Environment Variables

No new variables. Phase 8 reuses `BACKEND_URL` (added in Phase 5) for the font HTTP path.

## Database Migrations

- `20260610104120_add_character_model` — adds `Character` table; adds `Story.characterId?`
- `20260610200000_add_user_regeneration_quota` — adds `User.regenerationsInWindow (int default 0)` and `User.regenerationWindowStartedAt (DateTime?)`; quota migrated to `Subscription.regenerationsUsed` in Phase 9

## Gotchas & Known Limitations

- **Regeneration quota** is a 30-day rolling window on `User`; Phase 9 migrates this to `Subscription.regenerationsUsed` with Paddle billing cycles. The free-tier limit constant (`FREE_TIER_REGENERATION_LIMIT`) in `regeneration.constants.ts` is the interim gate.
- **`what: 'both'`** re-generates text and illustration in one atomic call (1 quota unit). Sequential calls (text then illustration) cost 2 units — the UI's "Remake everything" button uses the atomic path.
- **Watermark** is hard-coded `true` in `getPageHtml` (story reader iframe) until Phase 9 wires the real tier check.
- **Font CORS**: `Access-Control-Allow-Origin: *` is set directly on `useStaticAssets` because static files are served before the global CORS middleware runs. Covers both browser iframes (frontend origin) and Puppeteer (null opaque origin).
- **`styleAnchor` is immutable per story** — editing a Character after creation does not affect existing stories; `Story.styleAnchor` is a snapshot taken once at generation time.

## Tests

- `backend/src/modules/characters/__tests__/characters.service.spec.ts` — Character CRUD, ownership scoping, child default character lookup
- `backend/src/modules/regeneration/__tests__/regeneration.service.spec.ts` — regeneration flow (text/illustration/both), optional prompt forwarded to AI client, quota enforcement, 30-day window reset

## Follow-ups / Open Items

- Regeneration quota wiring to real subscription tier → Phase 9
- `Story.watermark` flag tied to `PricingTier.watermark` in iframe endpoint → Phase 9
- Character preview image as visual reference input to image model → Deferred #11 (Post-MVP)
- Photo/reference-image character creation → Deferred #10 (Post-MVP, legal review required)
