# External Services

> Third-party accounts TailorTales integrates with, and how to get credentials for each.
> For local dev you can skip all of these — `USE_AI_STUBS=true`, `USE_EMAIL_STUBS=true`, and
> `USE_PADDLE_STUBS=true` run the full app offline with zero spend and no accounts needed.

## Google OAuth — sign-in

The only authentication method. Without it, the stack still boots, but no one can sign in.

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Identity** API.
3. Create **OAuth 2.0 credentials** → application type **Web application**.
4. Add the callback as an **authorized redirect URI**:
   `{BACKEND_URL}/auth/google/callback` — e.g. `http://localhost:3001/auth/google/callback`
   for local dev, `https://uat.tailortales.app/api/auth/google/callback` for UAT, and
   `https://tailortales.app/api/auth/google/callback` for production. It must match
   `BACKEND_URL` exactly.
5. Put the client ID/secret in `backend/.env`:

```bash
GOOGLE_CLIENT_ID="123456.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-…"
JWT_SECRET="any-non-empty-secret"
```

The free tier covers development and low-volume production. Create a separate OAuth app per
environment (dev / UAT / prod) — authorized redirect URIs are domain-bound.

---

## OpenRouter — text + image generation

A single provider for both story text and illustrations (two configurable models). Needed to
generate a real book; with `USE_AI_STUBS=true` the stub client returns canned text + a
placeholder image and no key is used.

1. Sign up and create a key at [openrouter.ai/keys](https://openrouter.ai/keys).
2. Configure `backend/.env`:

```bash
OPENROUTER_API_KEY="sk-or-…"
OPENROUTER_TEXT_MODEL="google/gemini-2.0-flash"    # must support response_format: json_schema
OPENROUTER_IMAGE_MODEL="google/gemini-flash-1.5-8b"
USE_AI_STUBS=false
```

Pay-as-you-go; expect a few cents per generated book at MVP scale. Models are env-configurable
so you can swap them without code changes. The text model **must** support JSON-schema structured
output (Gemini 2.0 Flash and GPT-4o-class models do).

Use a cheaper model for UAT (`OPENROUTER_TEXT_MODEL=google/gemini-flash-1.5-8b`) and a quality
model for prod to keep UAT generation cost low.

---

## Resend — transactional email

Sends story-completed, story-failed, payment-failed, subscription-canceled, and subscription-renewed
notifications, plus the contact-form relay. With `USE_EMAIL_STUBS=true` emails are logged instead
of sent, and no key is used.

1. Sign up at [resend.com](https://resend.com) (free tier ≈ 3 K emails/month).
2. **Verify your sending domain** (DKIM + SPF records). Required for production — unverified
   domains can only send to the account's own email.
3. Configure `backend/.env`:

```bash
RESEND_API_KEY="re_…"
RESEND_FROM="TailorTales <stories@yourdomain.com>"   # must be on a verified domain
CONTACT_INBOX_EMAIL="hello@yourdomain.com"
USE_EMAIL_STUBS=false
```

Resend is outbound-only with no per-environment constraints — one account with one verified
domain covers all environments. Differentiate senders per env via `RESEND_FROM` (e.g.
`dev@tailortales.app`, `uat@tailortales.app`, `stories@tailortales.app`).

---

## Paddle — subscriptions and billing

Paddle is the **merchant of record**: the customer pays Paddle, Paddle remits a monthly payout
(minus their fee) to the founder's bank account. Card data never touches TailorTales code.
Paddle handles VAT collection and filing in every jurisdiction.

**Fee:** 5% + $0.50 per transaction. For a €5 subscription (tax-inclusive, customer in Germany
at 19% VAT): ~€3.49 net payout (~70%).

With `USE_PADDLE_STUBS=true` the stub client parses fixture files in
`backend/src/modules/billing/__fixtures__/` without calling Paddle — all webhook flows
(subscribe, renew, cancel, payment_failed) are testable offline.

### Sandbox setup (first-time, ~30 min)

> Complete this before testing the checkout flow end-to-end. Sandbox is fully separate from
> live; no business verification required.

**Step 1 — Create sandbox account**

Go to <https://sandbox-vendors.paddle.com/signup>. Complete onboarding.

✅ Dashboard shows a persistent "Test Mode" / sandbox indicator. If not, you signed up on the
live dashboard — start over at the sandbox URL.

**Step 2 — Create the product catalog**

The free tier has no Paddle product. Create only the two paid tiers.

1. **Catalog → Products → New product:**
    - Name: `Story Hour` · Tax category: **Standard digital goods**
2. On the product page, **add a price:** Recurring · Monthly · **5.00 EUR** · tax-inclusive.
3. Repeat for `Family Workshop` — Monthly · **10.00 EUR** · tax-inclusive.
4. Copy all four IDs: `pro_…` (product) and `pri_…` (price) for each tier.

✅ You have 4 IDs and both prices say "Monthly · €X.00 · recurring".

**Step 3 — API key (backend)**

**Developer tools → Authentication → API keys → New API key.** Copy immediately (shown once).

```bash
PADDLE_API_KEY="<key>"        # sandbox keys contain "_sdbx"
PADDLE_ENVIRONMENT="sandbox"
```

✅ Key contains `_sdbx`. A key without it is a live key — wrong account.

**Step 4 — Client-side token (frontend)**

**Developer tools → Authentication → Client-side tokens → New token.**

```bash
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_…"
NEXT_PUBLIC_PADDLE_ENV="sandbox"
```

✅ Token starts with `test_`.

**Step 5 — Webhook destination**

Paddle pushes subscription state to the backend. Without this, checkout "succeeds" in the
overlay but the user's tier never changes.

1. Start a tunnel: `ngrok http 3001` → note the `https://<id>.ngrok.app` URL.  
   For a permanent dev URL, use a Cloudflare named tunnel: `dev-api.<domain> → localhost:3001`.
2. **Developer tools → Notifications → New destination:**
    - Type: **Webhook** · URL: `https://<id>.ngrok.app/webhooks/paddle`
        - UAT: `https://uat.tailortales.app/api/webhooks/paddle`
        - Production: `https://tailortales.app/api/webhooks/paddle`
    - Subscribe to: `subscription.created`, `subscription.activated`, `subscription.updated`,
      `subscription.canceled`, `subscription.past_due`, `transaction.payment_failed`
3. Copy the **secret key** (`pdl_ntfset_…`) → `backend/.env`:

```bash
PADDLE_WEBHOOK_SECRET="pdl_ntfset_…"
```

✅ With the backend running (`USE_PADDLE_STUBS=false`), Paddle → Notifications → your
destination → "Send test event" returns **200**. A 400 means wrong secret; a timeout means
the tunnel URL is wrong or ngrok restarted.

**Step 6 — Seed catalog IDs**

```bash
# backend/.env
PADDLE_PRODUCT_ID_STORY_HOUR="pro_…"
PADDLE_PRICE_ID_STORY_HOUR="pri_…"
PADDLE_PRODUCT_ID_FAMILY_WORKSHOP="pro_…"
PADDLE_PRICE_ID_FAMILY_WORKSHOP="pri_…"

pnpm --filter ./backend seed:pricing-tiers
```

✅ `curl -s localhost:3001/pricing | grep pri_` shows your two real `pri_…` IDs.

**Step 7 — Smoke test**

With `USE_PADDLE_STUBS=false` and `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` set:

1. Sign in, open `/pricing`, click **Join Story Hour**.
2. Pay with a test card (any cardholder name, any future expiry, any CVC):

| Card number           | Behaviour                               |
| --------------------- | --------------------------------------- |
| `4242 4242 4242 4242` | Success, no 3DS                         |
| `4000 0038 0000 0446` | Success, with 3DS challenge             |
| `4000 0000 0000 0002` | Declined                                |
| `4000 0027 6000 3184` | First charge succeeds, renewals decline |

✅ Smoke-test checklist:

- Overlay opens with "Test Mode" watermark and €5.00/mo price
- After payment you land on `/account/subscription?checkout=success`
- Within a few seconds the page flips to **Story Hour** (webhook → DB → refetch)
- Backend log shows `Subscription sub_… activated for user … (Story Hour)`
- Header chip now reads "Story Hour"; usage counters reset to 0
- Cancel subscription → "Cancels on \<date>" badge appears (tier stays paid until period end)

**Step 8 — Simulate lifecycle events**

**Developer tools → Simulations** lets you fire any event payload without waiting for real
billing cycles. Set `custom_data.userId` to a real user ID from your DB. Useful for testing:

- Subscription renewal (counter reset)
- Subscription cancellation (revert to free tier)
- Payment failure (PAST_DUE state)

### Troubleshooting

| Symptom                                                | Likely cause → fix                                                                                                           |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Overlay doesn't open                                   | `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` missing or live token in sandbox env → check `test_` prefix, restart `pnpm dev`            |
| Checkout succeeds but tier never changes               | Webhook not arriving: tunnel dead, wrong URL, or events not subscribed → check ngrok console + Paddle → Notifications → Logs |
| `Invalid webhook signature` (400)                      | `PADDLE_WEBHOOK_SECRET` stale — destination recreated? → re-copy from Edit destination                                       |
| `No PricingTier matches Paddle price pri_…`            | Seed ran without env IDs → fix env, re-run `seed:pricing-tiers`                                                              |
| `has no customData.userId`                             | Checkout opened without signing in, or simulation payload lacks `custom_data.userId`                                         |
| Backend refuses to boot after `USE_PADDLE_STUBS=false` | `PADDLE_API_KEY` / `PADDLE_WEBHOOK_SECRET` missing                                                                           |

### Security

- `PADDLE_API_KEY` and `PADDLE_WEBHOOK_SECRET` are **secrets** — env vars only, never committed,
  never logged. The client-side token is public by design.
- Never disable signature verification. The stub client (`USE_PADDLE_STUBS=true`) exists for
  that purpose — it never calls real Paddle.
- If a secret leaks, revoke + recreate it in the dashboard (keys and destination secrets are
  independently rotatable).

### Production differences from sandbox

Same steps against <https://vendors.paddle.com> with three differences:

1. **Business verification required** — takes days; start early.
2. **Domain / website approval** required for live checkout (sandbox needed none); submit as
   soon as the domain is live under **Checkout → Default payment link**.
3. **Env flip:** `PADDLE_ENVIRONMENT=production`, `NEXT_PUBLIC_PADDLE_ENV=production`, live
   API key (no `_sdbx`), `live_` client token, and the same-origin production webhook
   destination `https://tailortales.app/api/webhooks/paddle`.

**Multiple webhook destinations:** register one per environment (dev tunnel, UAT, prod) against
the same sandbox account. Each destination has its own `PADDLE_WEBHOOK_SECRET`. Every Paddle
event is pushed to all destinations; cross-environment events are harmless — the handler
matches by `customData.userId` and logs a warning if the user isn't found.

---

## Sentry — error tracking + uptime

Captures backend exceptions and frontend JS errors, and runs the uptime monitor. Disabled in
dev (the inits are gated); only UAT/prod report. See
[monitoring.md](monitoring.md#sentry--error-tracking) for how it's wired in code.

1. Sign up at [sentry.io](https://sentry.io) (free tier ≈ 5k errors/month).
2. Create **two projects** — copy each DSN (Settings → Projects → Client Keys):
    - `tailortales-be` — platform **Node.js / NestJS**
    - `tailortales-fe` — platform **Next.js**
3. Configure env (UAT/prod only — leave unset in dev):

```bash
# backend/.env
SENTRY_ENABLED=true
SENTRY_DSN="https://…@…ingest.de.sentry.io/…"   # the tailortales-be DSN
SENTRY_ENVIRONMENT="uat"                          # or "production"

# frontend/.env
NEXT_PUBLIC_SENTRY_ENABLED=true
NEXT_PUBLIC_SENTRY_DSN="https://…@…ingest.de.sentry.io/…"   # the tailortales-fe DSN
NEXT_PUBLIC_SENTRY_ENVIRONMENT="uat"                        # or "production"
```

4. **Source maps (frontend):** create an auth token (Settings → Auth Tokens, scope
   `project:releases`) and set `SENTRY_AUTH_TOKEN` in the Dokploy Compose environment.
   Compose mounts it only as a frontend BuildKit secret; it is consumed by `next build`, absent
   from image layers and runtime, and is not a GitHub Actions secret (CI doesn't build images):

```bash
SENTRY_AUTH_TOKEN="sntrys_…"   # Compose input → frontend BuildKit secret
```

5. **Uptime monitor:** Sentry → **Crons/Uptime → Uptime Monitors → Add** →
   `GET https://tailortales.app/api/health`, interval 5 min, alert by email. Replaces a
   standalone uptime service.

The DSN is safe to expose (it's write-only ingest); the **auth token is a secret**. One Sentry
account covers all environments — the `environment` tag separates them.

---

## New Relic — APM (backend only)

Request latency, throughput, and BullMQ job durations. Loads via the ESM loader and only when
`NODE_OPTIONS` is set, so dev never starts the agent. See
[monitoring.md](monitoring.md#new-relic--apm-backend-only) for the loader rationale.

1. Sign up at [newrelic.com](https://newrelic.com) (free tier ≈ 100 GB/month ingest).
2. Generate a **license key** (Administration → API keys → "Ingest - License").
3. Configure env (UAT/prod only):

```bash
# backend/.env
NODE_OPTIONS="--import newrelic/esm-loader.mjs"   # the gate — unset in dev
NEW_RELIC_LICENSE_KEY="…NRAL"
NEW_RELIC_APP_NAME="TailorTales-UAT"              # or "TailorTales-Prod"
```

4. Deploy; the app appears in New Relic → **APM & Services** within a minute or two of the first
   request. Set alerts (error rate, p95 latency, Apdex) once data flows.

The license key is a **secret** — env var only. Config (`backend/newrelic.cjs`) excludes `cookie`
and `authorization` headers from captured attributes.

---

## Google Analytics (GA4) — product analytics

Page views and funnels, loaded **prod only** and **only after cookie consent** (GDPR). The
`CookieConsent` component mounts the GA script via `@next/third-parties/google` once the user
accepts; nothing is tracked before that.

1. Create a **GA4 property** at [analytics.google.com](https://analytics.google.com) →
   Admin → Create property → add a **Web** data stream for `https://tailortales.app`.
2. Copy the **Measurement ID** (`G-XXXXXXXXXX`).
3. Set it on prod only — leave unset in dev and UAT so analytics never runs outside production:

```bash
# frontend/.env (prod only)
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

The Measurement ID is public by design. With it unset, the consent banner still renders but no
analytics script ever loads. Domain ownership isn't verified at stream creation — verification
only matters if you later enable Google Ads/Search Console linking.

> **Custom events** (e.g. `story_created`, `signup_completed`) are intentionally deferred until
> there's real traffic to justify which funnels to instrument. When added, use `sendGAEvent`
> from `@next/third-parties/google` at the call sites — no new dependency needed.
