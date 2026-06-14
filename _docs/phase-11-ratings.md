# Phase 11 — Ratings & Public Sharing

> Status: ✅ Completed on 2026-06-14
> Related ROADMAP section: Phase 11

## Summary

Families can now rate a completed story (1–5 stars + an optional note) from the story reader, and
opt that story in as a public example. Opted-in stories surface on the landing page's "Tales lit
recently" grid (previously hardcoded mock data). A rating is an upsert — one per user per story —
and because only a story's owner can rate it, each story carries at most a single rating, which is
also the score shown publicly. Admin-only endpoints expose every rating and allow overriding or
retracting a story's public visibility; the admin UI for these lands in Phase 12.

## What Was Added

- **Entities:** `Rating` (`id`, `storyId`, `userId`, `score`, `comment?`, `createdAt`, `updatedAt`,
  unique `[storyId, userId]`). Relations added to `User.ratings` and `Story.ratings`.
- **Modules:** `RatingsModule` (`RatingsService`, `RatingsController`), imported by `StoriesModule`
  (to reuse `RatingsService` for the rating endpoint) and registered in `AppModule`.
- **Endpoints:**
    - `POST /stories/:id/rating` — owner-only upsert `{ score, comment?, isPublic? }`; mirrors the
      `isPublic` toggle onto `Story.isPublic`. Returns the `Rating`.
    - `GET /admin/ratings` — admin-only; every rating with story + author context, newest first.
    - `PATCH /stories/:id/public` — admin-only; override/retract `Story.isPublic`.
    - `GET /stories/:id` now embeds `myRating` (owner's full rating) and `rating` (score);
      `GET /stories` and `GET /stories/public` summaries now include `rating`.
- **Frontend pages / components:**
    - `RatingPanel` (story reader) — wired from the Phase 4 disabled shell: pre-fills from
      `myRating`, star input, note, "Share as an example" `Switch`, Save with inline saved/error
      status.
    - `TalesSection` (landing) — now takes real public stories (`storiesServerApi.getPublic()`),
      maps them to `StoryCard`, and renders nothing when there are none.

## Resulting Structure

```
backend/
  src/
    modules/
      ratings/
        ratings.module.ts
        ratings.controller.ts         # GET /admin/ratings (AdminGuard)
        ratings.service.ts            # upsert + findAllForAdmin
        ratings.constants.ts
        ratings.types.ts
        dto/create-rating.dto.ts
        __tests__/ratings.service.spec.ts
      stories/
        dto/update-visibility.dto.ts  # PATCH /stories/:id/public body
        stories.controller.ts         # + rate(), setVisibility()
        stories.service.ts            # + setPublicVisibility(); ratings in include/mappers
        stories.types.ts              # + rating, myRating
  prisma/
    schema.prisma                     # + Rating model
    migrations/20260614104713_add_rating_model/
frontend/
  src/
    api/stories.ts                    # + submitRating()
    types/story.types.ts              # + rating, IMyRating, ISubmitRatingPayload
    app/(public)/page.tsx             # fetch + pass public stories
    app/(public)/_components/TalesSection/TalesSection.tsx
    app/(private)/library/[storyId]/_components/StoryReader/
      StoryReader.tsx                 # pass storyId/myRating/isPublic to RatingPanel
      components/RatingPanel/RatingPanel.tsx (+ .module.scss, __tests__)
```

## Commands

No new commands. Standard workflow:

```bash
pnpm --filter ./backend db:migrate   # apply the Rating migration in dev
pnpm test                            # backend + frontend suites
```

## Configuration / Environment Variables

None added.

## External Services

None added.

## Database Migrations

- `20260614104713_add_rating_model` — adds the `Rating` table with a unique `[storyId, userId]`
  index and cascading FKs to `Story` and `User`.

## Gotchas & Known Limitations

- **One rating per story, by design.** Ratings are owner-only (`POST /stories/:id/rating` is scoped
  to `{ id, userId }`), so the unique `[storyId, userId]` constraint effectively means one rating
  per story. The mappers therefore read `ratings[0]`. If non-owner ratings are ever introduced,
  the "owner's score" selection logic must change.
- **`isPublic` mirrors the toggle.** Submitting a rating sets `Story.isPublic` to the toggle value
  (true _or_ false) when the field is present, so a user can retract a story by un-toggling and
  re-saving. The field is only left untouched when omitted entirely from the payload.
- **Admin UI deferred to Phase 12.** `GET /admin/ratings` and `PATCH /stories/:id/public` ship as
  backend-only endpoints; the admin route group that consumes them is Phase 12.
- **Public card accent colors are decorative** — cycled by grid position, not derived from data.

## Tests

- `backend/.../ratings/__tests__/ratings.service.spec.ts` — upsert ownership/status guards, compound
  upsert key, isPublic mirror (true/false/omitted), admin list query.
- `backend/.../stories/__tests__/stories.controller.spec.ts` — `rate` delegates to `RatingsService`;
  `setVisibility` delegates to `StoriesService`.
- `frontend/.../RatingPanel/__tests__/RatingPanel.component.spec.tsx` — disabled until a score is
  picked, pre-fill from existing rating, submit payload + saved confirmation.
- Run: `pnpm test` (backend 220 tests, frontend 219 tests, all green).

## Follow-ups / Open Items

- Admin panel UI for ratings + visibility management (Phase 12).
- Public library page — the "Browse the library →" link in `TalesSection` is still `href="#"`
  pending a dedicated public stories page (post-MVP).
