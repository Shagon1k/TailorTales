# Auth

> How authentication and authorization work in TailorTales.

## Request flow

Every request passes through `JwtAuthGuard` before reaching a controller. It is registered
globally via `APP_GUARD` in `app.module.ts` — no route is unprotected by default. Routes
that should be publicly accessible opt out with `@Public()`.

```
Request
  → JwtAuthGuard.canActivate()
      → @Public() on this route? → yes → let through
                                 → no  → extract JWT from cookie
                                           → invalid / expired → 401 Unauthorized
                                           → valid → decode payload (sub = userId)
                                                        → load User from DB
                                                            → not found → 401
                                                            → found → attach to request → continue
```

## Components

**`JwtAuthGuard`** — extends Passport's `AuthGuard('jwt')`. Reads `@Public()` metadata via
`Reflector`; if public, returns `true` immediately. Otherwise delegates to `JwtStrategy`.

**`@Public()`** — a `SetMetadata` decorator that attaches `isPublic: true` to the route
handler's metadata. `JwtAuthGuard` reads it back via `Reflector`.

**`JwtStrategy`** — extracts the JWT from the `access_token` httpOnly cookie and verifies
it with `JWT_SECRET`. On success, calls `validate(payload)`: loads the full `User` from DB
by `payload.sub` (the only field stored in the JWT) and attaches it to the request. Returns
401 if the user no longer exists.

> **Cookie settings (set at login):** `httpOnly: true`, `sameSite: lax`, `secure: true` in
> production only. Expiry is `JWT_EXPIRY_DAYS` days (default 7, configurable via env).

**`AdminGuard`** — applied via `@UseGuards(AdminGuard)` on a controller or handler after
`JwtAuthGuard`. Checks `request.user.role === ADMIN`; throws **403 Forbidden** if not.
Unlike ownership checks (which return 404 to avoid leaking resource existence), admin routes
returning 403 is intentional — the existence of admin-only routes is not a secret.

**`AuthService.issueToken(user)`** — called by `AuthController.googleCallback()` after
Google OAuth succeeds. Signs `{ sub: user.id }` with `JWT_SECRET` and the configured expiry.
The controller writes the token into the `access_token` httpOnly cookie.

**`@CurrentUser()`** — a param decorator that extracts `request.user`. By the time a
controller runs, the user is verified and fully loaded.

## Why httpOnly cookie instead of Authorization header?

httpOnly cookies are inaccessible from JavaScript, eliminating XSS token-theft. The browser
sends the cookie automatically — no frontend token management needed.

The tradeoff: CSRF must be considered. Mitigated with `SameSite: Lax`, which blocks
cross-site POST requests while allowing normal navigation. A stricter CSRF token is a
post-MVP decision.

## Logout and JWT lifetime

`POST /auth/logout` clears the `access_token` cookie on the **client** only. The JWT itself
remains cryptographically valid until it expires (default 7 days, `JWT_EXPIRY_DAYS`). There is
no server-side token blocklist.

**Operational implication:** after logout, a client that retained the raw token value can still
call the API until expiry. This is an accepted trade-off at MVP — revocation infrastructure is a
post-MVP decision.

For forced invalidation (e.g. suspected token leakage), the only safe option today is to rotate
`JWT_SECRET` — this invalidates all issued tokens at once.

## Why load the User from DB on every request?

The JWT payload stores only `sub` (user id). Loading the full `User` on every request ensures:

- A deleted user's token is immediately rejected.
- Role changes (`USER → ADMIN`) take effect on the next request.
- Controllers always receive a fresh, accurate `User` object.

Embedding sensitive fields in the JWT would create a window where stale data is trusted.

## Google profile sync

Google OAuth uses the `email` and `profile` scopes. On every successful Google sign-in, the
backend refreshes the stored Google profile basics (`email`, `name`, `avatarUrl`) from the
provider payload before issuing the session cookie.

Custom uploaded avatars are stored separately in S3 and take precedence in the UI, so refreshing
the Google avatar does not overwrite a user's manually chosen avatar.
