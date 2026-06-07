# Decision: Resend for transactional email

## Decision

Use **Resend** for transactional email (story completion notifications and contact form
submissions).

## Context

Two email use cases at MVP:

1. **Story completed** — notifies the parent that their book is ready (with a link).
2. **Contact form** — routes a user's message to `CONTACT_INBOX_EMAIL`.

## Why Resend?

- **Developer-first API.** Clean REST API with React Email support; minimal boilerplate for
  transactional templates.
- **Simple pricing.** Generous free tier for MVP send volumes; no complex per-feature billing.
- **Stub-friendly.** `EmailStubClient` (gated by `USE_EMAIL_STUBS=true`) replaces Resend in
  CI and offline dev with zero configuration — the same Symbol-token pattern as `AiStubClient`.
- **Email delivery features.** Built-in domain verification, SPF/DKIM setup, and send logs —
  the essentials without operating your own mail infrastructure.

## Trade-offs

- Resend is not self-hosted — it is an external dependency with its own uptime SLA.
- Failed email sends are **not** treated as generation failures: the Ready stage (stage 5)
  sends the notification inside a try/catch that logs but does not re-throw. A failed email
  never blocks or rolls back the generation result.

## Revisit if

- Send volume grows to where Resend pricing becomes a concern vs. AWS SES.
- Self-hosted email infrastructure becomes a compliance requirement.
