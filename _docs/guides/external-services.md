# External Services

> The third-party accounts TailorTales talks to, and how to get credentials for each.
> For local dev you can skip all of these — `USE_AI_STUBS=true` + `USE_EMAIL_STUBS=true` runs
> the full app offline. You need real credentials only for the capabilities noted below.

## Google OAuth — sign-in

The only authentication method. Without it, the stack still boots, but no one can sign in.

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Identity** API.
3. Create **OAuth 2.0 credentials** → application type **Web application**.
4. Add the callback as an **authorized redirect URI**:
   `{BACKEND_URL}/auth/google/callback` — e.g. `http://localhost:3001/auth/google/callback`
   for local dev. It must match `BACKEND_URL` exactly.
5. Put the client ID/secret in `backend/.env`:

```bash
GOOGLE_CLIENT_ID="123456.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-…"
JWT_SECRET="any-non-empty-secret"      # signs the session JWT
```

The free tier covers development and low-volume production.

## OpenRouter — text + image generation

A single provider for both the story text and the illustrations (two configurable models).
Needed to generate a **real** book; with `USE_AI_STUBS=true` the stub client returns canned
text + a placeholder image and no key is used.

1. Sign up and create a key at [openrouter.ai/keys](https://openrouter.ai/keys).
2. Configure `backend/.env`:

```bash
OPENROUTER_API_KEY="sk-or-…"
OPENROUTER_TEXT_MODEL="google/gemini-2.0-flash"   # must support response_format: json_schema
OPENROUTER_IMAGE_MODEL="google/gemini-flash-1.5-8b"
USE_AI_STUBS=false
```

Pay-as-you-go; expect a few cents per generated book at MVP scale. Models are env-configurable
so you can swap them without code changes. The text model **must** support JSON-schema
structured output (Gemini 2.0 Flash and GPT-4o-class models do).

## Resend — transactional email

Sends the story-completed / story-failed notifications and routes the contact form. With
`USE_EMAIL_STUBS=true` emails are logged instead of sent, and no key is used.

1. Sign up at [resend.com](https://resend.com) (free tier ≈ 3K emails/month).
2. **Verify your sending domain** (DKIM + SPF records) before production.
3. Configure `backend/.env`:

```bash
RESEND_API_KEY="re_…"
RESEND_FROM="TailorTales <stories@yourdomain.com>"   # must be on a verified domain
CONTACT_INBOX_EMAIL="hello@yourdomain.com"            # where contact-form messages land
USE_EMAIL_STUBS=false
```
