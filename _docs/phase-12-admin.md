# Phase 12 — Admin Panel

> Status: ✅ Completed on 2026-06-15
> Related ROADMAP section: Phase 12

## Summary

A full admin control room accessible to users with role `ADMIN` or `SUPER_ADMIN`. Covers user
management, story moderation, art style CRUD with thumbnail generation, a read-only ratings view,
and story blueprint management. The admin shell uses a shared `SidebarLayout` component (also
adopted by `/account`). Two UX bugs surfaced and fixed during this phase: a page-navigation freeze
on first visit (resolved with `app/admin/loading.tsx` Suspense boundary) and a toggle blink on
art-style active switches (resolved with optimistic updates + per-row disabled state).

## What Was Added

- **Entities:** no new Prisma models; `UserRole` enum gained `SUPER_ADMIN`.
- **Modules (backend):**
    - `AdminModule` — `AdminUsersController`, `AdminUsersService`, `AdminStatsController`,
      `AdminStatsService`. Handles user list/search, role change, suspend/unsuspend, and
      dashboard stats (users, stories, active subs, MRR from Paddle).
    - `AdminStoriesController` (in `StoriesModule`) — admin story list/search + force-delete.
    - `AdminArtStylesController` (in `ArtStylesModule`) — full CRUD, reorder, thumbnail generation.
    - `RatingsController` (in `RatingsModule`) — already existed from Phase 11; admin UI lands here.
- **Endpoints:**
    - `GET /admin/stats` — dashboard counts (users, stories, active subs, MRR cents)
    - `GET /admin/users?search=&page=` — paginated user list with role, suspension, subscription tier
    - `PATCH /admin/users/:id/role` — change role (`USER` / `ADMIN` / `SUPER_ADMIN`)
    - `PATCH /admin/users/:id/suspension` — suspend or reinstate a user
    - `GET /admin/stories?search=&page=` — paginated story list with owner + child context
    - `DELETE /admin/stories/:id` — force-delete any story
    - `GET /admin/art-styles` — full art style list (order, isActive, thumbnailUrl)
    - `POST /admin/art-styles` — create
    - `PATCH /admin/art-styles/reorder` — update `order` for all styles in one call
    - `PATCH /admin/art-styles/:id` — update name / slug / promptPrefix / isActive
    - `POST /admin/art-styles/:id/thumbnail` — generate thumbnail via image model, store in S3,
      save signed URL to `ArtStyle.thumbnailUrl`
    - `GET /admin/ratings` — all ratings with story + author context, newest first
- **Frontend pages / components:**
    - `AdminGuard` — blocks non-admin users at the client boundary, redirects to `/library`.
    - `AdminSidebar` — nav for Dashboard / Users / Stories / Art styles / Ratings / Blueprints.
    - `SidebarLayout` (shared, also used by `/account`) — eyebrow + heading + sidebar + content slot.
    - `admin/page.tsx` — stats dashboard (4 stat cards).
    - `admin/users/page.tsx` — paginated user table, debounced search, suspend modal, role selector.
    - `admin/stories/page.tsx` — paginated stories table, debounced search, force-delete confirm modal.
    - `admin/art-styles/page.tsx` — art styles table with toggle, reorder arrows, create/edit modal,
      thumbnail generate button. Optimistic updates on `isActive` toggle.
    - `admin/ratings/page.tsx` — read-only ratings table (user, story, score ★, comment, date).
    - `admin/blueprints/` — Phase 4 CRUD brought into the admin shell (layout + style alignment).
    - `Table` compound atom (`Table.Head`, `Table.Body`, `Table.Row`, `Table.HeaderCell`,
      `Table.Cell`) — shared by all admin tables and `BlueprintList`.
    - `Loader` UI atom — spinner + label, used as page-level loading state.
    - `Pagination` — page controls used by Users and Stories tables.
- **Hooks:** `hooks/admin.ts` — `useAdminUsers`, `useChangeUserRole`, `useSetUserSuspension`,
  `useAdminStories`, `useDeleteStory`, `useAdminArtStyles`, `useCreateArtStyle`,
  `useUpdateArtStyle` (with optimistic updates), `useReorderArtStyles`,
  `useGenerateArtStyleThumbnail`, `useAdminRatings`.

## Resulting Structure

```
backend/
  src/
    modules/
      admin/
        admin.module.ts
        admin.types.ts                  # IAdminUserSummary, IAdminUserListPage, IAdminUsersFilter
        admin.constants.ts              # PAGE_SIZE
        admin-stats.controller.ts
        admin-stats.service.ts
        admin-users.controller.ts
        admin-users.service.ts
        dto/update-role.dto.ts
        dto/update-suspension.dto.ts
      stories/
        admin-stories.controller.ts     # GET /admin/stories, DELETE /admin/stories/:id
        stories.types.ts                # + IAdminStorySummary, IAdminStoryListPage
      art-styles/
        admin-art-styles.controller.ts  # full art style admin CRUD + thumbnail
frontend/
  src/
    api/admin.ts
    hooks/admin.ts
    types/admin.types.ts
    components/
      shared/
        SidebarLayout/
      ui/
        Table/                          # compound Table atom
        Loader/
    app/
      admin/
        layout.tsx
        loading.tsx                     # Suspense boundary — prevents nav freeze
        page.tsx                        # stats dashboard
        _components/
          AdminGuard/
          AdminSidebar/
          Pagination/
          StatsCard/
        users/
          page.tsx
          _components/UsersTable/
        stories/
          page.tsx
          _components/StoriesTable/
        art-styles/
          page.tsx
          page.module.scss
          _components/
            ArtStylesTable/
            ArtStyleForm/
        ratings/
          page.tsx
          _components/RatingsTable/
        blueprints/                     # Phase 4 pages, polished into admin shell
          page.tsx
          new/page.tsx
          [id]/page.tsx
          _components/
            BlueprintList/
            BlueprintForm/
```

## Commands

```bash
# Promote a user to SUPER_ADMIN (run from backend/)
pnpm seed:admin <email> SUPER_ADMIN
```

## Gotchas & Known Limitations

- **`Button component={Link}` in RSC** — Mantine's polymorphic `component` prop passes a function
  reference, which cannot cross the RSC → client boundary. Blueprint pages are RSC; use a styled
  `<Link>` with `page__action` class instead.
- **`t-body-xs` mixin does not exist** — the smallest typography mixin is `t-body-sm`. Using
  `t-body-xs` causes a build-time "Undefined mixin" error from Sass.
- **Thumbnail URL** — `ArtStyle.thumbnailUrl` is a signed S3 URL returned from the backend;
  the client-side value will expire. Re-fetching the art styles list refreshes the URL.
- **Optimistic updates on `isActive` toggle** — `useUpdateArtStyle` updates the React Query cache
  immediately on `onMutate` and rolls back on error. The switch for the specific row in flight is
  disabled via `updatingId`; all other switches remain interactive.

## Tests

- `admin.types.ts` — type-only, no tests.
- `AdminGuard` — renders children when user is admin; redirects when not.
- `UsersTable`, `StoriesTable`, `ArtStylesTable`, `RatingsTable` — component tests covering
  interactions (edit, toggle, delete, reorder) and edge cases (first/last row disable, no comment).
- `ArtStyleForm` — form validation, submit with correct values, cancel.
- `Table` atom — `HeaderCell` renders `columnheader` role; `Cell` renders `cell` role.
- All tests in `frontend/` via `pnpm test`.

## Follow-ups / Open Items

- Admin pagination for stories/users is client-side only; if the dataset grows large, server-side
  cursor pagination may be needed.
- No audit log — admin actions (suspend, force-delete, role change) are not recorded anywhere.
  Consider adding an `AdminAuditLog` table in a future phase.
- Ratings page is read-only; a future enhancement could allow admins to delete abusive ratings.
