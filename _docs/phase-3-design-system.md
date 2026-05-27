# Phase 3 — Design System & Base Layout

> Status: ✅ Completed on 2026-05-27
> Related ROADMAP section: Phase 3

## Summary

Phase 3 established the entire visual foundation for TailorTales: CSS design tokens, a Mantine theme wired to those tokens, a library of 17 UI atom components, route-group layouts (public / private), all five static public pages, the account shell with sidebar navigation, and the `ArtStyle` backend entity. All subsequent phases build on this base — new features compose atoms rather than writing custom styles, and every route group has a consistent chrome from day one.

---

## What Was Added

### Backend

- **ArtStyle entity:** Prisma model with `id`, `name`, `slug`, `thumbnailUrl`, `promptPrefix`, `isActive`, `order`, `createdAt`
- **Migration:** `20260527000000_add_art_style` — creates the `ArtStyle` table
- **Seed script:** `src/scripts/seed-art-styles.ts` — seeds 8 art styles (Storybook, Watercolour, Crayon, Ink line, Felt-pen, Cut-paper, Soft 3D, Comic ink)

### Frontend — CSS Architecture

- `src/styles/_tokens.scss` — all CSS custom properties (color primitives, semantic aliases, spacing, radii, shadows, gradients, motion tokens)
- `src/styles/_typography.scss` — Sass `@mixin` definitions for every Figma text style
- `src/styles/globals.scss` — global reset, `prefers-reduced-motion` collapse, `:focus-visible` ring
- `src/theme/mantine.ts` — `createTheme()` wiring Mantine's visual layer to design tokens

### Frontend — Route Structure

- `src/app/(public)/layout.tsx` — Header + main + Footer chrome for all public pages
- `src/app/(private)/layout.tsx` — AuthGuard + private Header + main + Footer
- `src/app/(private)/account/layout.tsx` — account shell with AccountSidebar
- `src/app/login/page.tsx` — full-bleed split layout outside both groups (no chrome)

### Frontend — Shared Components (`src/components/shared/`)

- `Header` — public variant (How it works, Pricing, Sign in, Begin a tale CTA) and private variant (Library, Workshop, Children, NotificationBell, HeaderUserChip)
- `Footer` — BrandMark + tagline + Privacy/Contact links; identical across both layouts
- `Header/components/NotificationBell` — visual shell only; data wired in Phase 9
- `Header/components/HeaderUserChip` — avatar + first name + plan label

### Frontend — Mantine-based Atoms (`src/components/ui/`)

- `Button` — variants: primary (fox bevel), secondary (outlined), quiet (text-only), on-card (cream on dark)
- `ButtonLink` — polymorphic wrapper around Button with `component={Link}`
- `Card` — variants: default (cream), dark (twilight gradient), gradient (warm canvas), outlined (subtle border)
- `Tag` (Badge base) — variants: filled, warm (ember), gold
- `Rating` — 1–5 star input using `--accent-gold`
- `Divider` — variants: dashed, needle
- `Progress` — fill via `--gradient-progress` (ember → fox → gold)
- `Avatar` — fox bevel gradient border; 44px min
- `Modal` — dark overlay, `--bg-elevated` surface, focus trap
- `Link` (Anchor base) — variants: default, quiet, on-card
- `Input` (TextInput) — label/input/helper/error slots; `aria-describedby` wired
- `Textarea` — same slot pattern
- `Select` — same slot pattern
- `TagsInput` — same slot pattern

### Frontend — Custom CSS Module Atoms (`src/components/ui/`)

- `CapsLabel` — mono font, 11px, all-caps; variants: default, on-card, gold
- `BrandMark` — SVG logo + wordmark; size prop (sm/md); links to `/`
- `StatCard` — stat value + label + optional delta; variants: positive, negative
- `NotificationBell` — icon + unread count badge
- `PageHero` — eyebrow (optional) + h1 heading + sub paragraph (optional)

### Frontend — Static Pages

- `/` (landing) — HeroSection, LanternsSection, TalesSection (mock), CtaSection
- `/how-it-works` — PageHero + DetailedStepsSection (3 step cards) + CtaSection
- `/pricing` — PricingHero, PlansSection (3 plan cards), ComparisonTable, FaqSection, CtaSection
- `/contact` — PageHero + ContactSection (ContactForm with React 19 server action stub)
- `/privacy` — PageHero + PrivacyContent (5 static sections)

### Frontend — Login Page

- `/login` — split layout: fox illustration (left) + dark Card (right); "Continue with Google" OAuth button; BrandMark header; legal note with Link atoms

### Frontend — Account Shell

- `AccountSidebar` — nav to all account sections; active state via `usePathname`; sign-out → `POST /auth/logout` → redirect to `/login`
- `/account/profile` — avatar + name + edit form
- `/account/children` — children dashboard with ChildCard + ChildForm
- `/account/subscription`, `/account/notifications`, `/account/language`, `/account/privacy` — placeholders (wired in Phases 8, 9, 12, 8 respectively)

---

## Resulting Structure

```
backend/
  prisma/
    schema.prisma                         ← ArtStyle model added
    migrations/
      20260527000000_add_art_style/
        migration.sql
  src/
    generated/prisma/                     ← regenerated with ArtStyle
    scripts/
      seed-art-styles.ts

frontend/
  src/
    styles/
      _tokens.scss
      _typography.scss
      globals.scss
    theme/
      mantine.ts
    components/
      ui/
        Avatar/
        BrandMark/
        Button/
          Button.tsx
          ButtonLink.tsx
        Card/
        CapsLabel/
        Divider/
        Input/
        Link/
        Modal/
        PageHero/
        Progress/
        Rating/
        Select/
        StatCard/
        Tag/
        TagsInput/
        Textarea/
      shared/
        Header/
          Header.tsx
          components/
            HeaderUserChip/
            NotificationBell/
        Footer/
    app/
      (public)/
        layout.tsx
        page.tsx
        _components/
          HeroSection/
          LanternsSection/
          TalesSection/
          CtaSection/
        how-it-works/
        pricing/
        contact/
        privacy/
      (private)/
        layout.tsx
        _components/
          AuthGuard/
        account/
          layout.tsx
          page.tsx
          _components/
            AccountSidebar/
          profile/
          children/
          subscription/
          notifications/
          language/
          privacy/
      login/
```

---

## Commands

```bash
# Regenerate Prisma client after schema changes
pnpm db:generate

# Apply ArtStyle migration to a running database
pnpm db:migrate

# Seed 8 art styles into the database
pnpm seed:art-styles

# Run frontend tests
pnpm test                    # from frontend/ or root

# Type-check
pnpm type-check              # from backend/ or frontend/
```

---

## Configuration / Environment Variables

No new environment variables introduced in Phase 3. All variables from Phases 0–2 remain.

---

## External Services

None introduced in Phase 3.

---

## Database Migrations

- `20260527000000_add_art_style` — creates `ArtStyle` table with `id`, `name`, `slug` (unique), `thumbnailUrl`, `promptPrefix`, `isActive` (default true), `order`, `createdAt`

> **Note:** This migration file was authored manually (no live DB connection during Phase 3). Run `pnpm db:migrate` when a DB is available to apply it; Prisma will record it in `_prisma_migrations`.

---

## Gotchas & Known Limitations

- **`pnpm db:migrate` required before `pnpm seed:art-styles`** — the seed script references `prisma.artStyle` which only exists after the migration runs.
- **Card atom is closed** — `Card` accepts no `className`, `classNames`, `style`, or `styles` props (closed via `OmitStyling` type). All inner layout lives in a wrapper `<div>` inside the Card's children.
- **`OmitStyling` blocks Mantine layout shorthands** — Mantine style shorthand props (`ml`, `mt`, `px`, etc.) are stripped by atoms. Use CSS Module wrapper elements or native CSS for spacing around atoms.
- **`ButtonLink` for internal navigation, `Button component="a"` for external** — `ButtonLink` wraps Next.js `Link` internally and is marked `'use client'`. For external URLs (e.g. Google OAuth), use `Button component="a" href={...}` directly — this works in client components.
- **`'use server'` in `actions.ts` is a build-time directive only** — in the Vitest jsdom test environment, `'use server'` is treated as a plain string expression. Server actions render as regular async functions in tests. Mock them when you need to control return values.
- **Static page copy is placeholder** — all four static public pages (`/how-it-works`, `/pricing`, `/contact`, `/privacy`) contain draft copy. See ROADMAP Open Questions: "Static page copy" gate — must be finalized before Phase 3 merges to `main`.
- **ArtStyle thumbnail URLs are placeholder** — `thumbnailUrl` fields point to `/images/art-styles/*.webp` paths that do not exist yet. These will be replaced in Phase 11 (Admin Panel — ArtStyle management UI).
- **`POST /contact` backend not wired** — `submitContact` in `contact/_components/ContactSection/actions.ts` is a stub. See ROADMAP Deferred Decision #4: wire to Phase 5 alongside Resend setup.
- **`TalesSection` uses mock data** — the landing page public stories grid shows `MOCK_TALES`. See ROADMAP TODO cross-reference: wired in Phase 10.

---

## Tests

All new and migrated components ship with tests in `__tests__/` subdirectories alongside the source file.

| Suite          | File                                                                                               | What it covers                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| PageHero atom  | `src/components/ui/PageHero/__tests__/PageHero.component.spec.tsx`                                 | heading renders as h1; eyebrow and sub render when provided                                |
| Public layout  | `src/app/(public)/__tests__/layout.component.spec.tsx`                                             | children in main landmark; header and footer present                                       |
| Private layout | `src/app/(private)/__tests__/layout.component.spec.tsx`                                            | authenticated user sees children; unauthenticated user does not                            |
| Header         | `src/components/shared/Header/__tests__/Header.component.spec.tsx`                                 | public nav links; private nav links; auth state switching                                  |
| Footer         | `src/components/shared/Footer/__tests__/Footer.component.spec.tsx`                                 | brand mark; Privacy and Contact links                                                      |
| AccountSidebar | `src/app/(private)/account/_components/AccountSidebar/__tests__/AccountSidebar.component.spec.tsx` | nav items; active state; sign-out flow                                                     |
| Login page     | `src/app/login/page.component.spec.tsx`                                                            | "Continue with Google" link; OAuth href; welcome heading; no redirect when unauthenticated |
| Home page      | `src/app/(public)/__tests__/page.component.spec.tsx`                                               | h1 heading; hero subtext; primary CTA link                                                 |
| How it works   | `src/app/(public)/how-it-works/__tests__/page.component.spec.tsx`                                  | h1 heading; eyebrow label; all three step cards present                                    |
| Pricing        | `src/app/(public)/pricing/__tests__/page.component.spec.tsx`                                       | h1 heading; all three plan name headings present                                           |
| Contact        | `src/app/(public)/contact/__tests__/page.component.spec.tsx`                                       | h1 heading; send button present                                                            |
| Privacy        | `src/app/(public)/privacy/__tests__/page.component.spec.tsx`                                       | h1 heading; key section headings present                                                   |

Run from `frontend/`:

```bash
pnpm test
```

---

## Follow-ups / Open Items

- **Static page copy** (Deferred Decision #5) — placeholder copy on all four public pages; addressed in a dedicated content pass pre-launch
- **`POST /contact`** (Deferred Decision #4) — wire to real backend in Phase 5 alongside Resend
- **Pricing data from DB** (ROADMAP TODO) — `/pricing` uses hardcoded static data; replace with `GET /pricing` in Phase 8
- **ArtStyle thumbnails** — placeholder paths; create actual thumbnails in Phase 11
- **TalesSection public stories** — mock data replaced with `GET /stories?featured=true` in Phase 10
- **NotificationBell data wiring** — visual shell only; full dropdown wired in Phase 9
- **`SuggestionChip` atom** — not yet built; design deferred until Phase 4 workshop form is designed
- **Mobile breakpoints** — explicitly out of scope for Phase 3; post-MVP
