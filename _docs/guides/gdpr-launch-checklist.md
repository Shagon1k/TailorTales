# GDPR Launch Checklist

> Compliance checklist for GDPR. Technical controls and public-facing Privacy Notice and Terms of
> Service are implemented. Contractual review and provider paperwork remain open.

> **Phase 19 close decision (6 August 2026):** the remaining contractual, legal-review, and
> real-account validation items are intentional post-launch compliance follow-up. They are not
> complete and must be revisited before scaling paid acquisition, adding child-photo processing,
> or materially expanding providers/data flows.
>
> Target: EU-only audience at MVP. US state privacy laws (CCPA/CPRA etc.) are below threshold
> at MVP scale — revisit at scale.

## Data we collect and why

| Data                                                           | Legal basis                                | Purpose                              |
| -------------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| Google account (email, name, avatar)                           | Contract performance                       | Identity, session                    |
| Child name, birthdate, gender, interests                       | Contract performance + legitimate interest | Personalization of generated stories |
| Story content (question, generated text + illustrations, PDFs) | Contract performance                       | The service output                   |
| Character description                                          | Contract performance                       | Cross-story visual consistency       |
| Subscription + billing data                                    | Contract performance                       | Billing management (via Paddle)      |
| IP address / server logs                                       | Legitimate interest                        | Security, abuse prevention           |
| Session cookie (`access_token`)                                | Strictly necessary                         | Authentication                       |
| Analytics (page views, device/region) via Google Analytics     | Consent (cookie banner)                    | Product analytics — prod only        |

> **Children's data:** the child's name and interests may be sent in generation prompts to
> OpenRouter (an AI provider). Parents enter the data; children do not create accounts. The
> transfer safeguards and provider terms must be confirmed as part of the open processor review.

## Technical checklist (implemented)

- [x] **Data export** (`GET /me/export`) — returns all user data as structured JSON, with
      signed download links to retained files. Covers: profile, children, characters, stories + pages, ratings, notifications, subscription state.
- [x] **Account deletion** (`DELETE /me`) — blocked while a paid subscription is active; the
      user must cancel and wait for the paid period to end. It then deletes all S3 objects by
      prefix listing (with audit log) and cascade-deletes all DB rows.
- [x] **Retention enforcement** — `RetentionCleanupCron` runs daily and deletes PDFs/images
      past `PricingTier.retentionDays`; free-tier assets have a shorter retention window.
- [x] **Session cookie** — httpOnly, SameSite: Lax, Secure in production.
- [x] **Public-story opt-in** — `Story.isPublic` defaults to `false`. A story only appears
      publicly if the owner explicitly checks "Share as an example" in the rating panel.
- [x] **Cookie consent banner** (`CookieConsent`) — gates Google Analytics. No tracking script
      loads before the user clicks **Accept**; **Reject** is equally prominent (no dark patterns,
      no pre-ticked boxes). The choice is stored in `localStorage` (`tt_cookie_consent`), not a
      cookie, so no consent record is itself a tracking cookie. GA only loads on prod
      (`NEXT_PUBLIC_GA_MEASUREMENT_ID` set) **and** after consent.

## Public legal documents

- [x] Privacy Notice published in production at `/privacy` in EN/DE/RU — effective 5 August 2026, version 1.0.
- [x] Terms of Service published in production at `/terms` in EN/DE/RU — effective 5 August 2026, version 1.0.
- [x] Login, desktop footer and mobile footer link to both documents.

The documents are product copy, not legal advice. Review them with a qualified Lithuanian/EU
privacy professional as the service and legal structure develop.

### Privacy Policy

The live Privacy Notice covers:

- [x] What personal data is collected (see table above)
- [x] Legal basis for each processing activity
- [x] **Sub-processors** (see list below) — names, purposes, and transfer safeguards
- [x] **Children's data section** — parent enters and consents; child name/interests sent to AI
      providers; no biometric or photo data at MVP
- [x] Retention periods per tier, including 14-day backup retention
- [x] User rights: access, rectification, erasure, portability, restriction, objection
- [x] How to exercise rights (link to export/delete in `/account/privacy`, or email)
- [x] Supervisory authority (VDAI) complaint right
- [x] Policy effective date and version

### Terms of Service

- [x] **"Service for adults 18+ / accounts operated by parents"** clause — keeps children out
      of account creation and makes the adult responsible for the profile information
- [x] Acceptable use policy
- [x] AI-assisted output limitations and liability wording
- [x] Lithuanian governing law and legal-notice contact details

The Terms are not a substitute for legal advice and do not themselves determine COPPA or other
non-EU law applicability. Reassess this when the audience, features or legal structure changes.

### Sub-processor list

| Sub-processor          | Purpose                                                   | Transfer mechanism                                                  |
| ---------------------- | --------------------------------------------------------- | ------------------------------------------------------------------- |
| **Paddle**             | Payment processing, invoicing, VAT compliance             | Independent controller (MoR model — Paddle is the seller of record) |
| **OpenRouter**         | AI text + image generation (story planning, illustration) | Standard Contractual Clauses (SCC) or EU-US DPF if applicable       |
| **Resend**             | Transactional email delivery                              | SCC or EU-US DPF if applicable                                      |
| **AWS S3**             | Object storage for generated PDFs and images              | SCC or EU-US DPF; data stored in selected AWS region                |
| **Google (OAuth)**     | OAuth identity provider (sign-in only; no tracking)       | SCC or EU-US DPF                                                    |
| **Google (Analytics)** | Product analytics — page views (consent-gated, prod)      | SCC or EU-US DPF                                                    |
| **Sentry**             | Error tracking — exception data, may include IP           | SCC or EU-US DPF (Sentry EU region ingest in use)                   |
| **New Relic**          | APM — request metadata (cookie/auth headers excluded)     | SCC or EU-US DPF                                                    |

- [ ] Confirm and retain DPAs / contractual terms with OpenRouter, Resend, and AWS (or confirm
      they are covered under existing framework agreements).
- [ ] Confirm and retain DPAs / framework coverage for Google Analytics, Sentry, and New Relic.
- [ ] Verify the documented transfer safeguard for each provider with a legal professional.

### Internal breach-notification procedure

- [x] Internal 72-hour procedure documented in [breach-response.md](breach-response.md).
- [ ] Nominate a backup incident owner and complete a tabletop exercise.

## Cookie audit

Current cookies / client storage set by TailorTales:

| Name                | Purpose                     | Type               | Set when            | Expiry                             |
| ------------------- | --------------------------- | ------------------ | ------------------- | ---------------------------------- |
| `access_token`      | Session JWT                 | Strictly necessary | Signed in           | `JWT_EXPIRY_DAYS` (default 7 days) |
| `tt_cookie_consent` | Stores accept/reject choice | Strictly necessary | Banner answered     | `localStorage` (no expiry)         |
| `_ga`, `_ga_*`      | Google Analytics client ID  | Analytics          | Prod + after Accept | up to 2 years (Google-managed)     |

The GA cookies (`_ga*`) are **only** set on production after the user accepts the banner; on dev
and UAT, and before/after a Reject, no analytics cookies exist. The consent choice itself lives in
`localStorage`, not a cookie, and is strictly necessary (it records the user's GDPR preference).

Consent is freely given, specific, informed, and unambiguous: Accept and Reject are equally
prominent, nothing is pre-ticked, and no analytics runs before a positive choice.

## Post-launch compliance follow-up

- [x] Privacy Notice published at `/privacy` with effective date and version
- [x] Terms of Service published at `/terms` with effective date and version
- [ ] Privacy Notice copy reviewed by a lawyer or qualified DPO
- [ ] Terms of Service copy reviewed by a lawyer or qualified DPO
- [ ] Sub-processor DPAs signed
- [x] Breach notification procedure documented
- [ ] `GET /me/export` tested with a real account (verify all data present + links work)
- [ ] `DELETE /me` tested (verify DB rows gone, S3 objects deleted, audit log shows expected vs actual counts)
- [ ] Public-story opt-in flow tested end-to-end (rate → toggle Share → verify on landing page)
- [x] Cookie audit confirmed for the MVP monitoring baseline on 5 August 2026; revisit when a new client-side integration is added
