# Phase 18 — Mobile View Support

## Status

In progress. First implementation slice completed on 2026-07-03. Mobile footer navigation
direction implemented on 2026-07-07.

## Responsive Foundation

```text
Mobile   < 768px
Tablet   768px – 1023px
Desktop  >= 1024px
```

Rules implemented:

- `--layout-gutter` narrows on mobile; `--header-height` is tokenized.
- Public and shared page sections collapse to single-column layouts on mobile.
- Sidebars collapse below desktop and become stacked navigation blocks.
- Table-heavy surfaces use contained horizontal scroll instead of page-level horizontal scroll.
- Mobile modals become full-screen with sticky header/footer and internal scrolling.
- Mobile popovers clamp to viewport width and height.

## Implemented Slice

- Header:
    - Removed the mobile hamburger menu from the header.
    - Desktop header navigation remains unchanged at `>=1024px`.
    - Mobile/tablet header keeps brand presence and private notification access.
- Mobile footer navigation:
    - Added a fixed Quiet Dock for mobile/tablet with `Library`, `Workshop`, `Account`, and
      `More`.
    - Authenticated `Account` opens a dark bottom sheet with account subsections:
      `Profile`, `Children`, `Subscription`, `Notifications`, `Privacy & data`, `Sign out`,
      and a `Delete account` entry that routes to `Privacy & data` for the guarded destructive
      flow.
    - Guest `Account` routes to login.
    - `More` opens a dark bottom sheet with inline language switching plus `Pricing`,
      `How it works`, `Contact us`, and `Privacy`.
    - Current route state highlights primary routes, and secondary public routes highlight
      `More`.
    - Cookie consent is offset above the dock on mobile/tablet so it does not cover the
      navigation.
- Shared layout primitives:
    - `SidebarLayout`, `PageHero`, `Footer`, `Modal`, `Popover`, `Table`, `MascotImage`.
- Public pages:
    - Landing, pricing, how-it-works, contact, privacy, and login.
- Private/core surfaces:
    - Library grid/greeting, workshop form/summary, account children layout, invoice list, story reader header/body/panels/details.
- Admin policy:
    - Responsive shell/sidebar/search controls.
    - Table-heavy admin screens intentionally keep contained horizontal scroll.

## QA Evidence

Commands:

```bash
pnpm --filter ./frontend type-check
pnpm --filter ./frontend lint
pnpm --filter ./frontend test -- MobileFooterNav Header layout.component
git diff --check
```

Results:

- Type-check passed.
- Frontend test run passed: 70 files, 322 tests.
- Lint passed with existing warnings only:
    - `WorkshopForm.tsx` max-lines
    - locale layout `dangerouslySetInnerHTML`
    - `StarField.tsx` array index key
    - `Modal.tsx` React 19 context-provider/useContext preferences
- `git diff --check` passed.

Viewport measurement:

```text
Paths: /en, /en/pricing, /en/how-it-works, /en/contact, /en/privacy, /en/login
Widths: 360, 390, 768, 1024
Result: page-level overflow = 0px for every path/width pair
```

Protected-route local check:

```text
Paths: /en/library, /en/workshop, /en/account, /en/admin
Widths: 360, 390, 768, 1024
Result: redirected to /en/login locally; login page-level overflow = 0px
```

Mobile footer navigation browser check:

```text
Path: /en
Widths: 390, 800, 1200
Results:
- 390px: mobile nav exists, old hamburger absent, More opens with language + secondary links.
- 390px guest state: Account routes to login.
- 800px: mobile nav display = block; desktop header nav display = none.
- 1200px: mobile nav display = none; desktop header nav display = flex.
- Cookie consent banner no longer overlaps the mobile dock.
```

## Remaining Work

- Run authenticated browser QA for private and admin screens with seeded data.
- Verify story reader and workshop generation states with real/private route data.
- Decide whether the reader needs a dedicated mobile chapter selector beyond hiding the desktop chapter rail.
- Add visual regression or browser-driven mobile QA if/when the project introduces that harness.

## Launch / UAT Notes

- Local Docker now avoids common host-port collisions:
    - Postgres: host `5433` -> container `5432`
    - Redis: host `6380` -> container `6379`
- Before UAT/prod deploy, confirm Dokploy/runtime env uses the real service endpoints:
    - `DATABASE_URL` may still point to `:5432` in UAT/prod if that is the managed/self-hosted DB port.
    - `REDIS_URL` may still point to `:6379` in UAT/prod if that is the real Redis port.
- Do not copy local `backend/.env` ports into UAT/prod blindly; verify the actual host/container
  topology during the deploy checklist.
