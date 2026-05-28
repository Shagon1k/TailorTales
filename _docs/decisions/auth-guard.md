# How the Auth Guard Works

> Captured during Phase 4. Reference this in Phase 6 mid-point documentation.

## Overview

Every request to the server passes through `JwtAuthGuard` before reaching a controller.
It is registered globally in `app.module.ts` via `APP_GUARD`, so no route is unprotected by default.
Routes that should be publicly accessible are explicitly opted out using the `@Public()` decorator.

---

## Step-by-step flow

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

---

## The components

### `JwtAuthGuard`

Extends Passport's `AuthGuard('jwt')`. Runs on every request.

First checks whether the route has the `@Public()` decorator by reading its metadata via `Reflector`.
If public — returns `true` immediately (no token check).
If not — delegates to `super.canActivate()`, which triggers `JwtStrategy`.

### `@Public()` decorator

A thin metadata marker:

```ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): MethodDecorator => SetMetadata(IS_PUBLIC_KEY, true);
```

`SetMetadata` attaches `isPublic: true` to the route handler's metadata.
`Reflector` reads it back inside the guard. That's the entire mechanism — no magic.

### `JwtStrategy`

Passport strategy registered as `'jwt'`. Responsible for two things:

1. **Extracting the token** — reads from the `access_token` httpOnly cookie (set at login).
   The browser sends it automatically with every request.

2. **Validating the token** — verifies the JWT signature using `JWT_SECRET`.
   If the signature is invalid or the token has expired, Passport rejects the request with 401.

    If valid, it calls `validate(payload)`:

    ```ts
    async validate(payload: IJwtPayload): Promise<User> {
        const user = await this.userService.findById(payload.sub);
        if (!user) throw new UnauthorizedException();
        return user;
    }
    ```

    `payload.sub` is the user's id — the only thing stored inside the JWT.
    The full `User` object is loaded from the DB on every request.
    This catches the case where a token was issued to a user who was later deleted.

    The returned `User` is attached to the request object by NestJS (`request.user`).

### `@CurrentUser()` decorator

A convenience param decorator that extracts `request.user`:

```ts
@Get()
findAll(@CurrentUser() user: User): Promise<IStorySummary[]> {
    return this.storiesService.findAllByUser(user.id);
}
```

By the time the controller runs, the user is already verified and fully loaded — the controller
just uses it.

---

## Why a cookie instead of an Authorization header?

httpOnly cookies are not accessible from JavaScript, which eliminates a whole class of XSS attacks
where a malicious script steals the token from `localStorage` or memory.
The browser handles sending the cookie automatically — no frontend token management needed.

The tradeoff: CSRF protection must be considered. Mitigated with `SameSite: Lax` on the cookie,
which blocks cross-site POST requests while still allowing normal navigation.
This is documented as a known deferred decision in `ROADMAP.md § Deferred Decisions`.

---

## Why load the User from DB on every request?

The JWT payload only contains `sub` (user id) — not the full user object.
This is intentional: JWT payloads are not encrypted, and embedding sensitive fields
(role, email) creates a window where stale data could be trusted.

Loading from DB on every request ensures:

- A deleted user's token is immediately rejected
- Role changes (e.g. USER → ADMIN) take effect on the next request
- The controller always receives a fresh, accurate User object
