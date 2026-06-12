# Phase 9 — Subscriptions (Paddle)

> Status: 🟡 Code complete — pending developer verification, Paddle sandbox live test, and commit
> Related ROADMAP section: Phase 9

## Summary

Subscriptions on Paddle: `PricingTier` + `Subscription` entities (every user owns a Subscription
row — free tier by default — so quota logic has a single code path), a `QuotaService` authority
for page credits / regenerations / children limit / watermark, Paddle checkout + webhooks behind
a stub-swappable `PADDLE_CLIENT`, GDPR export & account deletion, retention cleanup, and the
frontend wiring that replaced every Phase 5/8 quota stub.

## What Was Added

- **Entities:** `PricingTier` (incl. `paddlePriceId`, `paddleProductId`, `order` beyond the
  original ROADMAP list), `Subscription` (incl. `paddleCustomerId`, `cancelAtPeriodEnd`),
  `SubscriptionStatus` enum (`ACTIVE | PAST_DUE | CANCELED`). Dropped
  `User.regenerationsInWindow` + `User.regenerationWindowStartedAt` (Phase 8 MVP quota).
- **Modules (backend):**
    - `pricing-tiers/` — public `GET /pricing`, tier lookups (`findFreeTier` = `priceMonthly: 0`).
    - `subscriptions/` — `SubscriptionsService` (`getOrCreateForUser` lazy safety net,
      `getUsageSummary`), `QuotaService` (assert/deduct page credits — BOOK 1 / COMIC 2 per page,
      assert/record regenerations, watermark), `GET /subscriptions/me`, two crons (below).
    - `billing/` — `PADDLE_CLIENT` token: `PaddleApiClient` (@paddle/paddle-node-sdk) or
      `PaddleStubClient` (`USE_PADDLE_STUBS`); `POST /webhooks/paddle` (signature-verified via
      `rawBody`), `POST /billing/cancel`, `POST /billing/portal`, `GET /billing/invoices`.
    - `user/` — `GET /me/export` (GDPR JSON with signed asset links), `DELETE /me`
      (Paddle cancel → S3 prefix delete with expected-vs-actual audit → cascading user delete).
    - `storage/` — `listKeys(prefix)`, `deleteMany(keys)` bulk ops; story deletion now removes
      S3 assets with an audit log line.
- **Quota wiring:** generation enqueue checks credits, Ready stage deducts (FAILED never
  charges); regeneration uses Subscription counters (window logic deleted); watermark comes
  from `PricingTier.watermark` (PDF binding + iframe reader HTML); children creation enforces
  `childrenLimit` (null = unlimited).
- **Webhook → Subscription mapping** (all idempotent):

| Paddle event                                           | Action                                                                                                                                                                 |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `subscription.created` / `activated`                   | match user via `customData.userId`; attach Paddle ids, set tier from price id, reset counters                                                                          |
| `subscription.updated`                                 | re-map tier; sync status/`currentPeriodEnd`; `cancelAtPeriodEnd` from scheduled change; **reset counters only when the period end advanced** (paid-tier monthly reset) |
| `subscription.canceled`                                | revert to free tier, keep `paddleCustomerId`, reset counters                                                                                                           |
| `subscription.past_due` / `transaction.payment_failed` | `status = PAST_DUE` (access kept while Paddle dunning retries)                                                                                                         |

- **Background jobs (@nestjs/schedule):** `free-tier-reset.cron.ts` (`0 3 1 * *` — zero
  counters where `paddleSubscriptionId IS NULL`); `retention-cleanup.cron.ts` (`0 4 * * *` —
  delete assets of COMPLETED stories past tier `retentionDays`; non-null `pdfKey` is the
  "not yet purged" marker; metadata rows kept; logs `expected=N deleted=M`).
- **Frontend:** `/pricing` server-fetches `GET /pricing` (yearly toggle and rollover copy
  removed; free regenerations now "3 / mo"); Paddle.js overlay checkout from `PriceCard`
  (`customData.userId` round-trips through the webhook); `/account/subscription` (PlanCard,
  UsageBars, PaymentDetails → Paddle portal, InvoiceList, cancel modal, `?checkout=success`
  polling); `/account/privacy` (GDPR info, export download, typed-DELETE confirmation — blocked
  while a paid subscription is active); usage wiring via shared `useSubscription()` hook in
  LibraryGreeting stats, WorkshopSummary credits + helper text + over-budget submit block,
  RegenerationPanel "N left this month" + disable at 0, HeaderUserChip real tier name.

## Resulting Structure

```
backend/src/modules/
  pricing-tiers/   {controller,service,module}
  subscriptions/   {controller,service,module} quota.service.ts subscriptions.{constants,types}.ts
                   free-tier-reset.cron.ts retention-cleanup.cron.ts __tests__/
  billing/         billing.{controller,module}.ts billing-webhook.service.ts billing.types.ts
                   paddle-api.client.ts paddle-stub.client.ts webhook.controller.ts
                   __fixtures__/ __tests__/
  user/            data-export.service.ts account-deletion.service.ts (+ controller routes)
backend/src/scripts/seed-pricing-tiers.ts
frontend/src/
  api/             pricing.ts pricing.server.ts subscription.ts billing.ts account.ts
  hooks/           subscription.ts
  lib/             paddle.ts
  types/           pricing.types.ts subscription.types.ts
  utils/           money.utils.ts (+ formatLongDate in date.utils.ts)
  app/(private)/account/subscription/  page + PlanCard/UsageBars/PaymentDetails/InvoiceList
  app/(private)/account/privacy/       page + PrivacyInfo/ExportSection/DeleteAccountSection
```

## Commands

```bash
pnpm seed:pricing-tiers   # upsert 3 tiers + backfill free Subscriptions (idempotent)
# Offline webhook simulation (stub client parses fixtures without signature):
curl -X POST localhost:3001/webhooks/paddle -H 'Content-Type: application/json' \
     -H 'paddle-signature: stub' -d @src/modules/billing/__fixtures__/subscription-activated.json
```

## Configuration / Environment Variables

| Variable                                    | App            | Required               | Description                                          |
| ------------------------------------------- | -------------- | ---------------------- | ---------------------------------------------------- |
| `USE_PADDLE_STUBS`                          | backend        | no (default `false`)   | `true` = offline stub Paddle client (dev/CI)         |
| `PADDLE_API_KEY`                            | backend        | when stubs off         | Paddle Billing API key                               |
| `PADDLE_WEBHOOK_SECRET`                     | backend        | when stubs off         | Webhook signature secret                             |
| `PADDLE_ENVIRONMENT`                        | backend        | no (default `sandbox`) | `sandbox` \| `production`                            |
| `PADDLE_PRODUCT_ID_*` / `PADDLE_PRICE_ID_*` | backend (seed) | no                     | Catalog ids for Story Hour / Family Workshop         |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`           | frontend       | for live checkout      | Paddle.js token (CTA degrades gracefully when empty) |
| `NEXT_PUBLIC_PADDLE_ENV`                    | frontend       | no (default `sandbox`) | `sandbox` \| `production`                            |

## External Services — Paddle Sandbox Setup (manual, ~30 min)

> **Why this matters:** this is the money path. Every step below ends with a ✅ check —
> do not move on until the check passes. Everything in CI/dev runs offline with
> `USE_PADDLE_STUBS=true`; this setup is only needed to verify the real
> checkout → webhook → DB flow before launch. The same steps, run in the **live**
> dashboard, are the Phase 15 production task — see "Production delta" at the end.

### Prerequisites

- [ ] Local stack running: `docker compose up` (Postgres/Redis/MinIO) + `pnpm dev`
- [ ] A tunnel tool for webhooks: `brew install ngrok` (or `cloudflared`, `hookdeck`)
- [ ] ~30 minutes — the Paddle dashboard steps are quick, but verify each one

### Step 1 — Create the sandbox account

1. Go to <https://sandbox-vendors.paddle.com/signup> (sandbox is fully separate from live —
   you do NOT need a production account first, and no business verification is required).
2. Fill the form, click the verification link in your email, complete the short onboarding.

✅ **Check:** the dashboard shows a persistent "Test Mode"/sandbox indicator. If you don't
see it, you accidentally signed up at `vendors.paddle.com` (live) — start over at the
sandbox URL.

### Step 2 — Create the product catalog

Our seed maps Paddle **price ids** (not product ids) to tiers, so both ids matter.
The Free Chapter tier has no Paddle product — create only the two paid tiers.

1. **Catalog → Products → New product:**
    - Name: `Story Hour` · Tax category: **Standard digital goods**
2. On the product page, **add a price:**
    - Type: **Recurring**, billed **Monthly** · Amount: **5.00 EUR**
    - Leave trial empty (we don't offer trials at MVP)
3. Repeat for `Family Workshop` — monthly recurring, **10.00 EUR**.
4. Copy all four ids (product pages show `pro_…`; the price row shows `pri_…`).

✅ **Check:** you have 4 ids — `pro_…`/`pri_…` for Story Hour, `pro_…`/`pri_…` for
Family Workshop — and both prices say "Monthly · €X.00 · recurring".

### Step 3 — Backend API key

1. **Paddle → Developer tools → Authentication → API keys → New API key.**
2. Name it (e.g. `tailortales-dev`), copy the key **immediately** (shown once).
3. Put it in `backend/.env`:

```bash
PADDLE_API_KEY="<the key>"          # sandbox keys contain "_sdbx"
PADDLE_ENVIRONMENT="sandbox"
```

✅ **Check:** the key contains `_sdbx`. A key without it is a **live** key — wrong account.

### Step 4 — Frontend client-side token

1. Same page: **Developer tools → Authentication → Client-side tokens → New token.**
2. Put it in `frontend/.env`:

```bash
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_…"
NEXT_PUBLIC_PADDLE_ENV="sandbox"
```

✅ **Check:** the token starts with `test_`. (Live tokens start with `live_`.)
Client-side tokens are public by design — but still never commit `.env`.

### Step 5 — Webhook destination (the critical one)

Paddle pushes subscription state to us; without this step checkout will "succeed" in the
overlay but the user's tier will never change.

1. Start a tunnel to the backend: `ngrok http 3001` → note the `https://<id>.ngrok.app` URL.
2. **Paddle → Developer tools → Notifications → New destination:**
    - Type: **Webhook** · URL: `https://<id>.ngrok.app/webhooks/paddle`
    - Subscribe to exactly these events (more is harmless noise, fewer breaks flows):
        - `subscription.created`
        - `subscription.activated`
        - `subscription.updated`
        - `subscription.canceled`
        - `subscription.past_due`
        - `transaction.payment_failed`
3. Open the destination (⋮ → Edit destination), copy the **secret key** (`pdl_ntfset_…`)
   → `backend/.env`:

```bash
PADDLE_WEBHOOK_SECRET="pdl_ntfset_…"
```

> Signatures arrive in the `Paddle-Signature` header; `PaddleApiClient` verifies them via
> the SDK's `webhooks.unmarshal`. A wrong/stale secret → every webhook is rejected with 400.
> Each destination has its **own** secret — if you recreate the destination, update the env.

✅ **Check:** with the backend running (`USE_PADDLE_STUBS=false` — see Step 7), Paddle →
Notifications → your destination → "Send test event" (or use the Simulator, below) returns
**200**. A 400 means wrong secret; a timeout means the tunnel URL is wrong or ngrok died.

### Step 6 — Wire the catalog ids into the seed

1. Add to `backend/.env`:

```bash
PADDLE_PRODUCT_ID_STORY_HOUR="pro_…"
PADDLE_PRICE_ID_STORY_HOUR="pri_…"
PADDLE_PRODUCT_ID_FAMILY_WORKSHOP="pro_…"
PADDLE_PRICE_ID_FAMILY_WORKSHOP="pri_…"
```

2. Re-run the (idempotent) seed: `pnpm --filter ./backend seed:pricing-tiers`

> Note: local webhook testing with the stub may have left `pri_stub_story_hour` on the
> Story Hour row — this seed run overwrites it with the real id.

✅ **Check:** `curl -s localhost:3001/pricing | grep pri_` shows your two real `pri_…` ids.
The webhook handler maps `items[0].price.id` → tier via these values; a mismatch logs
`No PricingTier matches Paddle price …` and the user's tier silently stays free.

### Step 7 — Switch off stubs and smoke-test checkout

1. In `backend/.env`: `USE_PADDLE_STUBS=false` → restart the backend. (It will refuse to
   boot if `PADDLE_API_KEY` / `PADDLE_WEBHOOK_SECRET` are missing — that is intentional.)
2. Restart the frontend so the `NEXT_PUBLIC_*` vars are picked up.
3. Sign in, open `/pricing`, click **Join Story Hour →** — the Paddle overlay opens with a
   "Test Mode" watermark (sandbox needs no domain approval, localhost works).
4. Pay with a test card — any cardholder name, any future expiry, any CVC:

| Card number           | Behaviour                                                          |
| --------------------- | ------------------------------------------------------------------ |
| `4242 4242 4242 4242` | Success, no 3DS                                                    |
| `4000 0038 0000 0446` | Success, with a 3DS challenge step                                 |
| `4000 0000 0000 0002` | Declined                                                           |
| `4000 0027 6000 3184` | First charge succeeds, renewals decline (dunning/PAST_DUE testing) |

✅ **Smoke-test checklist (all must pass):**

- [ ] Overlay opens with Test Mode watermark and the €5.00/mo price
- [ ] After payment you land on `/account/subscription?checkout=success`
- [ ] Within a few seconds the page flips to **Story Hour** (webhook → DB → refetch)
- [ ] Backend log shows `Subscription sub_… activated for user … (Story Hour)`
- [ ] Header chip now reads "Story Hour"; usage counters are reset to 0
- [ ] `Open billing portal →` on `/account/subscription` opens the Paddle-hosted portal
- [ ] After the **next renewal simulation** (Step 8) an invoice appears under "Past parcels"
- [ ] **Cancel subscription** → confirm → "Cancels on <date>" badge appears
      (tier stays paid — the downgrade only happens at period end)

### Step 8 — Simulate renewals & lifecycle (no month-long waits)

Paddle ships a webhook **Simulator**: **Developer tools → Simulations → New simulation.**

- Run the **"Subscription renewal"** scenario against your destination to verify the
  paid-tier monthly reset (counters zero when `currentPeriodEnd` advances).
- Run **"Subscription cancellation"** to verify the revert-to-free path without waiting for
  the period end.
- Single events with editable payloads are also available — set `custom_data.userId` to a
  real user id from your DB when simulating `subscription.activated` directly.

✅ **Check:** after the renewal simulation, `pagesUsed`/`regenerationsUsed` are 0 and
`currentPeriodEnd` moved forward; after cancellation, the user is back on Free Chapter and
`paddleCustomerId` is still set (invoice history stays reachable).

### Troubleshooting

| Symptom                                                  | Likely cause → fix                                                                                                                       |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Overlay doesn't open / console error about token         | `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` missing or live token in sandbox env → check `test_` prefix, restart `pnpm dev`                        |
| Checkout succeeds but tier never changes                 | Webhook not arriving: tunnel dead, wrong destination URL, or events not subscribed → check ngrok console + Paddle → Notifications → Logs |
| Backend logs `Invalid webhook signature` (400)           | `PADDLE_WEBHOOK_SECRET` stale (destination recreated?) → re-copy from Edit destination                                                   |
| Backend logs `No PricingTier matches Paddle price pri_…` | Seed ran without the env ids, or the price was recreated in Paddle → fix env, re-run `seed:pricing-tiers`                                |
| Backend logs `… has no customData.userId`                | Checkout opened without being signed in, or simulated event lacks `custom_data.userId` → sign in first / edit the simulation payload     |
| Backend refuses to boot after `USE_PADDLE_STUBS=false`   | `PADDLE_API_KEY`/`PADDLE_WEBHOOK_SECRET` missing — fill them or flip stubs back on                                                       |
| Webhooks 200 in Paddle logs but DB unchanged             | Event for an unknown `paddleSubscriptionId` (idempotent ignore) → check the warning logs; usually a stale simulation payload             |

### Security notes

- `PADDLE_API_KEY` and `PADDLE_WEBHOOK_SECRET` are **secrets** — env vars only, never
  committed, never logged. The client-side token is public by design.
- Never disable signature verification "temporarily" — the stub client exists for that
  (`USE_PADDLE_STUBS=true`), and it never runs against real Paddle.
- If a secret leaks, revoke + recreate it in the dashboard (API keys and destination
  secrets are independently rotatable).

### Production delta (Phase 15 — do NOT do this now)

Same steps against <https://vendors.paddle.com> with three differences: ① live accounts
require **business verification** (takes days — start early); ② website/domain approval is
required for live checkout (sandbox needed none); ③ env flips: `PADDLE_ENVIRONMENT=production`,
`NEXT_PUBLIC_PADDLE_ENV=production`, live key (no `_sdbx`), `live_` client token, and the
webhook destination points at the real backend domain — no tunnel.

## Database Migrations

- `20260611132226_add_pricing_tier_and_subscription` — both tables + `SubscriptionStatus` enum.
- `20260611163902_drop_user_regeneration_quota_columns` — hand-written: carries
  `regenerationsInWindow` → `Subscription.regenerationsUsed` (no-op on fresh DBs), then drops
  both User columns. Applied via psql + `prisma migrate resolve` (non-TTY destructive change).

## Gotchas & Known Limitations

- **Free "1 tale/month" is approximated by `pagesPerMonth=12`** — two 5-page tales fit. Add
  `talesPerMonth` later if strictness is wanted.
- **Quota model:** check at enqueue, deduct at completion, no reservations — the
  1-active-job-per-user rule bounds overshoot. Counters use atomic `increment`.
- **Cancel semantics:** `POST /billing/cancel` schedules at period end; user keeps the paid tier
  until Paddle emits `subscription.canceled`. No "Resume subscription" at MVP (flagged
  post-MVP); the pricing CTA shows "Manage in account →" while a Paddle sub exists.
- **Mid-cycle upgrade:** `subscription.updated` with an unchanged period does NOT reset
  counters — usage carries into the bigger allowance (intentional). Plan changes happen in the
  Paddle billing portal, not custom UI.
- **Stub webhook fixtures use the internal camelCase `IPaddleEvent` shape** — the real SDK owns
  the snake_case wire mapping; the stub does not replicate it.
- **Webhook handler errors return 5xx on purpose** so Paddle retries (handlers are idempotent);
  bad signatures return 400; unknown events 200.
- **Deletion audit:** account deletion deletes by S3 **prefix listing** (robust to orphans) and
  logs `expected(DB)=… listed(S3)=… deleted=…`; retention cleanup and story deletion enumerate
  keys **from DB rows** (per-story scope).
- **Ratings are not in the export** — the `Rating` entity ships in Phase 11; add it to
  `DataExportService` then.
- **VAT breakdown** on the plan card is a static "VAT calculated by Paddle at checkout" note —
  no pricing-preview API call at MVP.
- Root-layout session fetch logs a 401 for logged-out visitors (pre-existing, unrelated).

## Tests

- Backend (`pnpm test`, 181 passing): `subscriptions/__tests__/` (quota boundaries, comic 2×,
  lazy creation, watermark, usage summary, both crons), `billing/__tests__/` (every webhook
  mapping, renewal-reset-only-on-period-advance, idempotent replay, unknown price id, signature
  400), `user/__tests__/` (export shape + signed-links-only-for-existing-keys, deletion order +
  Paddle-failure abort), plus updated generation/regeneration/children/stories specs.
- Frontend (`pnpm test`, 185 passing): pricing page renders from tier data + login CTAs,
  WorkshopSummary credit math + over-budget disable, RegenerationPanel quota line + zero state.
- Verified live: `GET /pricing`, webhook fixture flips tier and cancel reverts it (curl + psql),
  `GET /me/export` with a real session, and all five frontend surfaces in the browser preview.

## Follow-ups / Open Items

- **Developer:** Paddle sandbox setup (guide above) + live checkout/portal/invoice smoke test.
- Phase 10 builds subscription-event notifications on `status = PAST_DUE` + webhook events.
- Phase 11 adds `Rating` to the GDPR export.
- Phase 15 repeats the Paddle setup against the live dashboard.
