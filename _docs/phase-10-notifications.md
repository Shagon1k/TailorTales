# Phase 10 — Notifications

> Status: ✅ Completed on 2026-06-14
> Related ROADMAP section: Phase 10

## Summary

Phase 10 turns the notification stub (Phase 5 created the `Notification` model and
story-event records; Phase 6 added an unread-count polling shim) into the full feature:
a real-time in-app bell, subscription-event notifications driven by Paddle webhooks,
and a user-facing preferences screen. The bell now updates instantly over SSE instead
of polling, and every event honours per-user, per-channel toggles.

## What Was Added

- **Entities:** no new model. Added `User.notificationPreferences` (`Json?`) and two
  `NotificationType` enum values — `PAYMENT_FAILED`, `SUBSCRIPTION_CANCELED`.
- **Modules / services:**
    - `NotificationsService` — the inbox: list, unread count, mark-(all-)read,
      `createBellRecord`, SSE stream, get/update preferences.
    - `NotificationEmitterService` — turns app events into notifications (load user →
      check prefs → bell record → email). Consumed by the generation pipeline and the
      billing webhook handler.
- **Endpoints (all under `JwtAuthGuard`):**
    - `GET /notifications` — last 20, newest first
    - `PATCH /notifications/:id/read` — ownership-checked
    - `PATCH /notifications/read-all`
    - `GET /notifications/unread-count` — REST fallback for first paint
    - `GET /notifications/stream` — SSE, pushes `{ type: 'unread-count', count }`
    - `GET` / `PATCH /notifications/preferences`
- **Emails:** Resend templates for `payment-failed`, `subscription-canceled`,
  `subscription-renewed`; all templates refactored to single `xxxEmail(): IEmailContent`
  builders sharing one `escapeHtml` helper.
- **Frontend pages / components:**
    - `NotificationCenter` (bell + dropdown, live via `EventSource`) with presentational
      `NotificationList`; replaced the Phase 6 polling shim in `Header.tsx`.
    - `HeaderUserChip` became a `Popover` account menu (My account / Subscription /
      Children + set-apart Sign out).
    - `/account/notifications` preferences page — per-event email/in-app toggles with
      optimistic updates.
    - New UI atoms: `Popover` (styled dropdown surface) and `Switch`.

## Resulting Structure

```
backend/src/modules/
  notifications/
    notifications.service.ts            # inbox + SSE + preferences
    notification-emitter.service.ts     # event → notification
    notification-preferences.ts         # mergePreferences (defaults)
    notifications.constants.ts
    dto/update-notification-preferences.dto.ts
  email/templates/
    escape-html.ts
    payment-failed.template.ts
    subscription-canceled.template.ts
    subscription-renewed.template.ts
frontend/src/
  components/ui/Popover/                 # new atom
  components/ui/Switch/                  # new atom
  components/shared/Header/components/
    NotificationCenter/                  # bell + dropdown + NotificationList
  app/(private)/account/notifications/   # preferences page + NotificationPreferences
  api/notifications.ts · hooks/notifications.ts · types/notification.types.ts
```

## Database Migrations

- `20260612090000_add_subscription_notification_types` — adds `PAYMENT_FAILED`,
  `SUBSCRIPTION_CANCELED` to the `NotificationType` enum.
- `20260612091000_add_user_notification_preferences` — adds `User.notificationPreferences`
  (`JSONB`, nullable; null = all defaults on).

## Configuration / Environment Variables

None new. Emails use the existing `EMAIL_CLIENT` (Resend / stub); SSE auth reuses the
`access_token` cookie consumed by `JwtAuthGuard`.

## Key Decisions

- **Preferences storage:** `User.notificationPreferences` JSON column over a separate
  model — no joins/seeding, defaults merged in code, survives adding event types.
- **`payment_failed` email is always sent** — billing-critical, no email toggle (the
  in-app bell is still toggleable).
- **`subscription_renewed`** is email-only (no bell record), and only fires on a _new
  billing cycle on the same tier_ (a tier change is a plan change, not a renewal).
- **Real-time via SSE**, mirroring `StoriesModule`'s progress stream: an in-memory
  `Map<userId, Subject>` fans out the unread count to a user's open tabs.

## Gotchas & Known Limitations

- SSE state is in-memory per process: a missed push only delays the bell until the next
  page load (the REST unread-count covers first paint, and `EventSource` auto-reconnects).
  Multi-instance deployments would need a shared pub/sub (e.g. Redis) — out of scope.
- Subscription-event delivery is covered by unit tests with the stub email/Paddle clients;
  a live end-to-end Paddle webhook → email was not exercised.
- The `/account` layout (sidebar) and the header are not yet mobile-responsive — flagged
  separately, not part of this phase.

## Tests

- Backend (`pnpm --filter backend test`): `notifications.service`, `notification-emitter.service`,
  `notification-preferences`, and extended `billing-webhook.service` specs (event emission,
  dunning idempotency, renewal-vs-plan-change).
- Frontend (`pnpm --filter frontend test`): `NotificationCenter`, `NotificationList`,
  `HeaderUserChip`, `NotificationPreferences`, plus `Popover` and `Switch` atoms.

## Follow-ups / Open Items

- Mobile-responsive header + account layout (separate task).
- Shared pub/sub for SSE if/when the backend runs multi-instance.
- Live Paddle webhook verification before production.
