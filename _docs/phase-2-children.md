# Phase 2 — Children Management

> Status: ✅ Completed on 2026-05-22
> Related ROADMAP section: Phase 2

## Summary

Phase 2 adds full CRUD management for child profiles. Parents can create, edit, and delete children associated with their account. The backend enforces per-user ownership at the service layer, with full DTO validation (name length, birthdate range, gender enum, interests limits). The frontend provides a children dashboard built with Mantine modals, React Query for server state, and two new components — `ChildCard` and `ChildForm`. React Query was also introduced to the project in this phase, replacing manual `useState/useEffect` fetch patterns across the existing profile page.

---

## What Was Added

- **Entities:** `Child` (userId, name, birthdate, gender, interests, avatarUrl)
- **Enums:** `Gender` (MALE, FEMALE)
- **Backend modules:** `src/modules/children/` — service, controller, module, DTOs, constants, tests
- **Endpoints:** `GET /children`, `GET /children/:id`, `POST /children`, `PATCH /children/:id`, `DELETE /children/:id`
- **Frontend pages:** `/children` — dashboard with add/edit/delete via Mantine modals
- **Frontend components:** `ChildCard`, `ChildForm`
- **Frontend hooks:** `hooks/children.ts` (`useChildren`, `useCreateChild`, `useUpdateChild`, `useDeleteChild`), `hooks/user.ts` (`useUpdateUser`, `USER_QUERY_KEY`)
- **Frontend API:** `api/children.ts`
- **Frontend types:** `types/child.types.ts`
- **React Query** added to the project (+ `@mantine/form`, `@mantine/modals`)
- **Structural refactor:** feature modules moved to `src/modules/` (auth, children, user)
- **Docs:** `frontend/CLAUDE.md`, `backend/CLAUDE.md` with project conventions
- **ESLint rule:** `no-duplicate-imports: error` added to TS/TSX block

---

## Resulting Structure

```
backend/
  prisma/
    schema.prisma                          ← Child model + Gender enum added
    migrations/
      20260522140123_add_child/
        migration.sql                      ← new
  src/
    modules/                               ← new top-level feature directory
      auth/                                ← moved from src/auth/
      user/                                ← moved from src/user/
      children/                            ← new
        __tests__/
          children.service.spec.ts
          children.controller.spec.ts
        dto/
          create-child.dto.ts
          update-child.dto.ts
        children.constants.ts
        children.controller.ts
        children.module.ts
        children.service.ts

frontend/
  CLAUDE.md                                ← new
  src/
    api/
      children.ts                          ← new
    hooks/
      children.ts                          ← new
      user.ts                              ← new (extracted from UserContext + profile page)
    types/
      child.types.ts                       ← new
    context/
      UserContext.tsx                      ← migrated to useQuery
    app/
      providers.tsx                        ← added QueryClientProvider + ModalsProvider
      (auth-guard)/
        children/
          page.tsx                         ← new
        profile/
          page.tsx                         ← migrated to useUpdateUser hook
    components/
      ChildCard/
        ChildCard.tsx                      ← new
        __tests__/
          ChildCard.component.spec.tsx     ← new
      ChildForm/
        ChildForm.tsx                      ← new
        __tests__/
          ChildForm.component.spec.tsx     ← new

backend/CLAUDE.md                          ← new
```

---

## Commands

```bash
# Run backend tests
pnpm --filter backend test

# Run frontend tests
pnpm --filter frontend test

# Apply the new migration (dev)
pnpm --filter backend prisma:migrate

# Regenerate Prisma client after schema changes
pnpm --filter backend prisma:generate
```

---

## Configuration / Environment Variables

No new environment variables introduced in this phase.

---

## External Services

None introduced in this phase.

---

## Database Migrations

- `20260522140123_add_child` — creates `Gender` enum (MALE, FEMALE) and `Child` table with FK to `User` (CASCADE delete on user removal).

---

## Gotchas & Known Limitations

- **`avatarUrl` is reserved, not used.** The field exists on `Child` for v2 photo personalization. No upload endpoint or UI exists yet.
- **`@nestjs/mapped-types` is not installed.** `UpdateChildDto` fields are written manually with `@IsOptional()` — do not use `PartialType()`.
- **Ownership via `NotFoundException`.** Service returns 404 (not 403) when a child exists but belongs to another user. This intentionally avoids leaking resource existence to unauthorized callers.
- **`QueryClient` must use `useState` initializer.** `useState(() => new QueryClient())` prevents SSR data leaks between users. Do not move it to module scope.
- **Mantine `Select` and `TagsInput` in tests.** Both components render a `role="combobox"` input **and** a `role="listbox"` that share the same label via `aria-labelledby`. `getByLabelText` finds multiple elements. Use `getByRole('combobox', { name: /label/i })` instead.
- **Mantine `form.onSubmit` calls handler as `(values, event)`.** When asserting in tests, include `expect.anything()` as the second argument: `toHaveBeenCalledWith(expect.objectContaining({...}), expect.anything())`.
- **`staleTime` defaults to `0`.** Queries re-fetch on window focus, remount, and network reconnect — but not on a polling interval. All mutations call `invalidateQueries` to trigger explicit refetch.

---

## Tests

**Backend** (`backend/src/modules/children/__tests__/`):
- `children.service.spec.ts` — unit tests for all service methods: `findAllByUser`, `findOne` (found / not-found / wrong-owner), `create` (with/without interests), `update` (success / wrong-owner), `remove` (success / wrong-owner)
- `children.controller.spec.ts` — wiring tests verifying each endpoint calls the correct service method with correct arguments

**Frontend** (`frontend/src/components/*/`):
- `ChildCard.component.spec.tsx` — 8 tests: name render, age computation, gender label (Boy/Girl), interests badges, empty interests, edit/delete callbacks
- `ChildForm.component.spec.tsx` — 5 tests: all fields render, `initialValues` population, name validation error, valid submit calls `onSubmit`, cancel calls `onCancel`

```bash
pnpm --filter backend test
pnpm --filter frontend test
```

---

## Follow-ups / Open Items

- Avatar upload for child profiles (deferred to post-MVP / v2 photo feature)
- Refresh tokens + server-side logout (deferred — see ROADMAP § Deferred Decisions)
