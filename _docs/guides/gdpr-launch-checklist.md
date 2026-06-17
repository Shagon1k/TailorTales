# GDPR Launch Checklist

> Pre-production checklist for GDPR compliance. All technical items (export, delete, retention)
> are implemented. What remains is legal paperwork and copy review.
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

> **Children's data:** the child's name and interests are sent in generation prompts to
> OpenRouter (an AI provider). This is a cross-border transfer covered under sub-processor
> SCCs/DPF. Parents enter and consent to this data; children are not users and do not
> create accounts (keeps US COPPA out of scope under the "service for adults" clause in the
> Terms of Service).

## Technical checklist (implemented)

- [x] **Data export** (`GET /me/export`) — returns all user data as structured JSON, with
      signed download links to retained files. Covers: profile, children, characters, stories + pages, ratings, notifications, subscription state.
- [x] **Account deletion** (`DELETE /me`) — cancels active Paddle subscription, deletes all
      S3 objects by prefix listing (with audit log), cascade-deletes all DB rows. Blocked while
      a paid subscription is active (user must cancel and wait for period end first).
- [x] **Retention enforcement** — `RetentionCleanupCron` runs daily and deletes PDFs/images
      past `PricingTier.retentionDays`; free-tier assets have a shorter retention window.
- [x] **Session cookie** — httpOnly, SameSite: Lax, Secure in production. No analytics cookies.
- [x] **Public-story opt-in** — `Story.isPublic` defaults to `false`. A story only appears
      publicly if the owner explicitly checks "Share as an example" in the rating panel.
- [x] **No cookie consent banner needed** — the session cookie is strictly necessary; no
      analytics or tracking scripts are loaded. Adding any analytics requires a consent banner
      first.

## Legal paperwork (required before production launch)

### Privacy Policy

Replace the placeholder `PrivacyContent` component with a real policy covering:

- [ ] What personal data is collected (see table above)
- [ ] Legal basis for each processing activity
- [ ] **Sub-processors** (see list below) — names, purposes, and data transfer mechanism
- [ ] **Children's data section** — parent enters and consents; child name/interests sent to AI
      providers; no biometric or photo data at MVP
- [ ] Retention periods per tier (with a table matching `PricingTier.retentionDays` values)
- [ ] User rights: access, rectification, erasure, portability, restriction, objection
- [ ] How to exercise rights (link to export/delete in `/account/privacy`, or email)
- [ ] Supervisory authority (DPA) complaint right and the relevant authority for the EU country
      of establishment
- [ ] Policy effective date and version

### Terms of Service

- [ ] **"Service for adults 18+ / accounts operated by parents"** clause — ensures COPPA
      does not apply (children are not users; parents operate the account on their behalf)
- [ ] Acceptable use policy
- [ ] Limitation of liability for AI-generated content
- [ ] Governing law and jurisdiction

### Sub-processor list

| Sub-processor  | Purpose                                                   | Transfer mechanism                                                  |
| -------------- | --------------------------------------------------------- | ------------------------------------------------------------------- |
| **Paddle**     | Payment processing, invoicing, VAT compliance             | Independent controller (MoR model — Paddle is the seller of record) |
| **OpenRouter** | AI text + image generation (story planning, illustration) | Standard Contractual Clauses (SCC) or EU-US DPF if applicable       |
| **Resend**     | Transactional email delivery                              | SCC or EU-US DPF if applicable                                      |
| **AWS S3**     | Object storage for generated PDFs and images              | SCC or EU-US DPF; data stored in selected AWS region                |
| **Google**     | OAuth identity provider (sign-in only; no tracking)       | SCC or EU-US DPF                                                    |

- [ ] Sign DPAs with OpenRouter, Resend, and AWS (or confirm they are covered under existing
      framework agreements). Paddle is an independent controller for payments.
- [ ] Document transfer mechanism for each sub-processor in the Privacy Policy.

### Breach notification procedure

- [ ] Define an internal procedure: who is notified, within what timeframe?
- [ ] GDPR requires notifying the supervisory authority within **72 hours** of becoming aware
      of a breach likely to cause risk to individuals.
- [ ] Affected users must be notified without undue delay if the breach is high-risk to them.
- [ ] Keep a breach register even for incidents not requiring notification.

## Cookie audit

Current cookies set by TailorTales:

| Cookie         | Purpose     | Type               | Expiry                             |
| -------------- | ----------- | ------------------ | ---------------------------------- |
| `access_token` | Session JWT | Strictly necessary | `JWT_EXPIRY_DAYS` (default 7 days) |

No third-party cookies. No analytics. No marketing pixels.

**Before adding any analytics or tracking:** add a consent banner first. Cookie consent must be
freely given, specific, informed, and unambiguous. Pre-ticked boxes are not valid consent.

## Pre-launch sign-off

- [ ] Privacy Policy copy reviewed by a lawyer or qualified DPO
- [ ] Terms of Service copy reviewed
- [ ] Sub-processor DPAs signed
- [ ] Breach notification procedure documented
- [ ] `GET /me/export` tested with a real account (verify all data present + links work)
- [ ] `DELETE /me` tested (verify DB rows gone, S3 objects deleted, audit log shows expected vs actual counts)
- [ ] Public-story opt-in flow tested end-to-end (rate → toggle Share → verify on landing page)
- [ ] Cookie audit confirmed (no new cookies introduced since this doc was written)
