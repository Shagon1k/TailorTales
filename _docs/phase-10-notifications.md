# Phase 10 — Notifications

> Status: 🚧 In progress (plan approved, implementing increment by increment)
> Related ROADMAP section: Phase 10
> This file is a staging doc — converts to the TEMPLATE.md format on phase completion.

## Plan

### Current state (investigation, 2026-06-12)

```
ALREADY EXISTS (Phase 5/6/9)
├─ Prisma: Notification model (id, userId, type, payload Json, readAt?, createdAt)
│    NotificationType enum = STORY_COMPLETED | STORY_FAILED
├─ backend/modules/notifications/
│    NotificationsService.storyCompleted/.storyFailed  → bell record + email
│    GET /notifications/unread-count, PATCH /notifications/read-all
├─ backend/modules/email/  → IEmailClient (Resend + stub), 3 templates
├─ backend/modules/billing/billing-webhook.service.ts
│    handleUpdated (renewal = isNewBillingCycle), handleCanceled,
│    handlePaymentTrouble — Phase 10 emails hook in here
├─ SSE reference: @Sse(':id/progress') in stories.controller + generation.service
│    (Observable<MessageEvent>); FE: new EventSource(url, { withCredentials: true })
│    Auth: JWT read from access_token cookie → EventSource works as-is
├─ FE: Header.tsx — 30s polling shim (REMOVE), bell click = mark-all-read (REPLACE)
│    NotificationBell — visual shell with count badge (KEEP, wrap with dropdown)
└─ FE: /account/notifications — "coming soon" placeholder
```

### Decisions

| Decision             | Choice                                                      | Why                                                                                             |
| -------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Preferences storage  | `notificationPreferences Json` column on `User`             | No joins/seeding; defaults merged in code; matches existing `Notification.payload Json` pattern |
| payment_failed email | Always sent — no email toggle (in-app toggle still offered) | Billing-critical: user risks losing the plan without knowing                                    |
| Real-time bell       | SSE `GET /notifications/stream` per ROADMAP                 | Polling shim was explicitly temporary                                                           |

### Preference shape (defaults in code, all `true`)

```json
// User.notificationPreferences — partial overrides merged over defaults
{
    "storyCompleted": { "email": true, "inApp": true },
    "storyFailed": { "email": true, "inApp": true },
    "paymentFailed": { "inApp": true }, // email not toggleable
    "subscriptionCanceled": { "email": true, "inApp": true },
    "subscriptionRenewed": { "email": true } // email-only event, no bell record
}
```

### Increments (implement → human approve → commit → next)

1. **BE: notifications REST API** — `GET /notifications` (last 20, newest first),
   `PATCH /notifications/:id/read` (ownership-checked). Service + controller + tests.
2. **BE: SSE stream** — `GET /notifications/stream`; in-memory `Map<userId, Subject>` in
   `NotificationsService`; push `{ type: 'unread-count', count }` on every create /
   mark-read / mark-all-read. Tests.
3. **BE: subscription event notifications** — migration adds `PAYMENT_FAILED`,
   `SUBSCRIPTION_CANCELED` to `NotificationType`; 3 email templates (payment-failed,
   subscription-canceled, subscription-renewed); emit from `BillingWebhookService`
   (renewed = `handleUpdated` with `isNewBillingCycle`; canceled = `handleCanceled`;
   payment failed = `handlePaymentTrouble`). Tests with stub email client.
4. **BE: preferences** — `notificationPreferences Json` migration; `GET/PATCH
/notifications/preferences`; enforcement inside `NotificationsService` send paths
   (all event types, incl. Phase 5 story events). Tests.
5. **FE: bell dropdown** — dropdown with last 20 notifications, unread badge,
   mark-as-read on open + individual + "mark all as read"; replace polling `useEffect`
   with `EventSource('/notifications/stream')` (REST unread-count stays for initial
   load). Removes the Phase 6 shim behavior. Component tests. _(ask for design
   screenshot before building)_
6. **FE: /account/notifications page** — per-event email/in-app toggles wired to
   preferences endpoints. Component tests. _(ask for design screenshot before building)_
7. **Docs** — finalize this file per TEMPLATE.md, tick ROADMAP Phase 10 boxes,
   propose CLAUDE.md/rules updates if any pattern emerged.

### Out of scope

- Notification pagination beyond last 20 (YAGNI — ROADMAP asks for 20)
- Push/web-push channels; email digest batching
- Admin notification views (Phase 12)
