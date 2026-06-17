# Phase 13 — Localization

> Status: ✅ Completed on 2026-06-17
> Related ROADMAP section: Phase 13

## Summary

Full i18n support across the TailorTales stack: three locales (EN / DE / RU), next-intl routing infrastructure with locale-aware URL prefixes, a redesigned locale switcher in the header, localized backend error messages via `Accept-Language`, and Paddle checkout in the user's current locale.

## What Was Added

- **Locales:** English (`en`, default), German (`de`), Russian (`ru`)
- **Routing:** `[locale]` segment wraps the entire Next.js app; `routing.ts` and `navigation.ts` wrappers replace all `next/navigation` imports
- **Translations:** `frontend/src/i18n/locales/{en,de,ru}.json` — full coverage of every public page, auth, header, footer, library, workshop, account, pricing, admin, and notification copy
- **LocaleSwitcher:** redesigned circular trigger button with popover dropdown (locale code badge + native language name + active dot); WAI-ARIA `menuitemradio` pattern with `trapFocus` and `returnFocus`; View Transitions API cross-fade on switch; server-side subscription pre-seeding to prevent HeaderUserChip flicker
- **Backend error i18n:** `common/error-translations.ts` — EN/DE/RU translation map; `AllExceptionsFilter` reads `Accept-Language`, translates known error codes; services throw string codes or `{ code, params }` objects for parameterized messages
- **Frontend error propagation:** `apiFetch` reads the JSON body `message` field (was using `statusText`) and sends `Accept-Language` from `document.documentElement.lang`
- **Paddle checkout:** `PriceCard` passes `locale` from `useLocale()` into `Checkout.open` settings

## What Was Changed

- **Header layout:** nav links | `|` divider | `[LocaleSwitcher][NotificationBell][UserChip]`; bell border removed; icon cluster gap tightened
- **Popover defaults:** `returnFocus` added as default; `trapFocus` added per-usage where appropriate (`LocaleSwitcher`, `NotificationCenter`)
- **StatCard:** removed `white-space: nowrap` from label to fix overflow on long strings (e.g. "ACTIVE SUBSCRIPTIONS")
- **globals.scss:** View Transitions cross-fade CSS (`::view-transition-old/new(root)` with 300ms duration)

## Resulting Structure

```
backend/
  src/
    common/
      error-translations.ts       ← translation map + resolveLocale + translate
      http-exception.filter.ts    ← updated to resolve locale from Accept-Language

frontend/
  src/
    i18n/
      config.ts                   ← routing config + ILocale type
      navigation.ts               ← locale-aware Link/useRouter/usePathname wrappers
      request.ts                  ← getMessages() for RSC layouts
      locales/
        en.json                   ← source of truth (~700 keys)
        de.json
        ru.json
    components/shared/Header/
      components/LocaleSwitcher/  ← new component (was language-selector)
    lib/
      api.ts                      ← updated error extraction + Accept-Language
```

## Commands

```bash
# No new commands — next-intl middleware is wired at build time
pnpm dev       # app serves at /en, /de, /ru
pnpm test      # 547 tests (280 backend + 267 frontend)
```

## Configuration / Environment Variables

No new environment variables. The supported locales are compile-time constants in `frontend/src/i18n/config.ts`.

## External Services

None added.

## Database Migrations

None.

## Key Design Decisions

- **next-intl v4** over `react-intl` / `i18next`: deep Next.js App Router integration, RSC-compatible `getTranslations`, async messages, no client bundle for translation files.
- **Error code pattern**: services throw string codes (`'errors.ratings.storyNotCompleted'`) or `{ code, params }` objects for parameterized messages; the global filter resolves translations — no per-service locale context needed.
- **View Transitions**: `document.startViewTransition` wraps the locale `router.replace` call for a cross-fade; `startTransition` must NOT be nested (defers React commit past the transition window). Deferred Decision #13 tracks per-route tuning.
- **Server-side subscription pre-seeding**: `layout.tsx` fetches subscription data and seeds the `QueryClient` via `useState` initializer so `HeaderUserChip` never shows "…" on locale navigation.

## Tests

| File                                                                                                          | What it covers                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/src/common/__tests__/error-translations.spec.ts`                                                     | `resolveLocale` — header parsing, q-values, case, fallback; `translate` — all three locales, param interpolation, unknown codes                         |
| `backend/src/common/__tests__/http-exception.filter.spec.ts`                                                  | Filter end-to-end: locale resolution from Accept-Language, string codes, `{ code, params }` body, unknown messages pass-through, non-HTTP context no-op |
| `backend/src/modules/subscriptions/__tests__/quota.service.spec.ts`                                           | Updated: verifies `{ code, params }` body shape on both quota exceptions                                                                                |
| `backend/src/modules/ratings/__tests__/ratings.service.spec.ts`                                               | Updated: verifies error code on not-completed guard                                                                                                     |
| `frontend/src/lib/__tests__/api.spec.ts`                                                                      | `apiFetch` — JSON body message extraction, array message (validation pipe), fallback to statusText, Accept-Language header sending                      |
| `frontend/src/components/shared/Header/components/LocaleSwitcher/__tests__/LocaleSwitcher.component.spec.tsx` | Updated: menuitemradio role, aria-checked, router.replace with correct locale                                                                           |

Run: `pnpm test`

## Gotchas & Known Limitations

- **`startTransition` nesting**: wrapping `document.startViewTransition` in React's `startTransition` causes the snapshot to be taken after React commits the new DOM, breaking the animation. Solution: call `startViewTransition` directly; React's update happens inside the callback.
- **Mantine Popover + `trapFocus` default**: adding `trapFocus` as a shared Popover default causes immediate close — Mantine's `closeOnFocusLoss` fires before recognizing the focus moved inside the portal. `trapFocus` must be opt-in per usage.
- **Portal synthetic clicks**: `preview_click` and programmatic `btn.click()` trigger Mantine's mousedown-based outside-click handler, closing the popover immediately. Real browser clicks do not have this issue.
- **Backend string codes through NestJS**: `new BadRequestException('code')` wraps the string into `{ statusCode, message, error }`. The filter handles this via the `'message' in body` branch, not the `typeof body === 'string'` branch. The `string` branch only applies to raw `new HttpException(string, status)`.

## Follow-ups / Open Items

- **Deferred Decision #13**: Global page transitions via View Transitions API — 300ms too slow for in-app nav, per-route tuning needed, `experimental.viewTransition` flag still experimental in Next.js. See ROADMAP.md.
- **Generated story content locale**: AI generation prompts are English-only; stories are always generated in English regardless of the user's locale. A future phase could pass the locale to the generation pipeline and prompt the AI accordingly.
- **Admin panel error messages**: Admin-only guards (`AdminGuard`, `SuperAdminGuard`) and `admin-users.service.ts` still throw English prose — not worth localizing for admin-only surfaces.
