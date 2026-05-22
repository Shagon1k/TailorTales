# Phase 1 — Users & Authentication

> Status: ✅ Completed on 2026-05-22
> Related ROADMAP section: Phase 1 — Users & Authentication

## Summary

Phase 1 delivers full Google OAuth sign-in with JWT-backed httpOnly cookies. Users can sign in via Google, view and edit their profile name, and sign out. Protected frontend routes redirect unauthenticated visitors to the login page. An admin seed script promotes any user to the `ADMIN` role. Rather than the client-side auth approach originally deferred in the ROADMAP, we implemented an RSC-based session bootstrap: the root `layout.tsx` reads the cookie server-side and passes the resolved user as `initialUser` to the client provider — eliminating any loading flash or client-side fetch on initial render.

## What Was Added

- **Entities:** `User` (`id`, `googleId`, `email`, `name`, `avatarUrl`, `role`, `createdAt`, `updatedAt`)
- **Backend modules:** `AuthModule` (Google OAuth + JWT), `UserModule` (`GET /me`, `PATCH /me`)
- **Endpoints:**
  - `GET /auth/google` — initiates Google OAuth redirect
  - `GET /auth/google/callback` — OAuth callback; issues JWT, sets `access_token` httpOnly cookie, redirects to frontend
  - `POST /auth/logout` — clears the cookie
  - `GET /me` — returns the authenticated user
  - `PATCH /me` — updates the user's name
- **Auth infrastructure:** global `JwtAuthGuard`, `@Public()` decorator to opt out, `@CurrentUser()` param decorator
- **Admin script:** `pnpm seed:admin <email>` — promotes a registered user to `ADMIN`
- **Frontend pages / components:**
  - `/login` — login page with "Sign in with Google" link
  - `/profile` (protected) — displays user info, inline name edit, sign out button
  - `AuthGuard` component — redirects to `/login` when no user is present
  - `(auth-guard)` route group — applies `AuthGuard` to all protected routes
- **Frontend context / API layer:**
  - `UserProvider` — seeded from `initialUser` (RSC), exposes `user`, `isLoading`, `refetch`
  - `api/user.ts` — client-side user API (`getMe`, `updateMe`)
  - `api/auth.ts` — client-side auth API (`logout`)
  - `api/user.server.ts` — server-only helper (`getServerUser`); guarded by `server-only` package
  - `lib/api.ts` — client `apiFetch` utility (credentials: include, JSON content-type)
  - `lib/api.server.ts` — server `apiFetchServer` utility; reads `access_token` cookie and forwards it

## Auth Flow

### 1. Sign-in (OAuth dance)

```
Browser            Frontend             Backend               Google
  │                   │                    │                     │
  │──"Sign in" click──▶ (navigates to /auth/google)             │
  │                   │                    │                     │
  │◀──────────────────────302──────────────│                     │
  │                                        │                     │
  │──────────────── GET /auth/google ─────▶│                     │
  │                                        │──── OAuth redirect ─▶│
  │◀──────────────────────────────────────────── 302 to Google ──│
  │                                                              │
  │──────────────────── user grants consent ────────────────────▶│
  │◀──────────── 302 /auth/google/callback?code=… ───────────────│
  │                                        │
  │── GET /auth/google/callback?code=… ───▶│
  │                   │          GoogleStrategy.validate()
  │                   │          └─ UserService.findOrCreate()   (upserts user in DB)
  │                   │          AuthController.googleCallback()
  │                   │          └─ AuthService.issueToken()     (signs JWT {sub: user.id})
  │                   │          └─ Set-Cookie: access_token=<jwt>; HttpOnly
  │◀── 302 FRONTEND_URL ───────────│
```

**Key details:**
- `GoogleStrategy` requests the `email` and `profile` scopes.
- On first login `findOrCreate` inserts a new `User` row; on subsequent logins it returns the existing record.
- The JWT is stored in an `HttpOnly`, `SameSite: lax` cookie (`access_token`). JavaScript cannot read it.
- The cookie expires in `JWT_EXPIRY_DAYS` days (default 7).

---

### 2. Session bootstrap on first page load

After the OAuth redirect the browser lands on the frontend. Before the page is sent to the client:

```
Next.js SSR (layout.tsx)
  └─ getServerUser()
       └─ apiFetchServer('/me')          ← reads access_token cookie via next/headers
            └─ GET /me  →  JwtAuthGuard
                           └─ JwtStrategy.validate()   ← verifies JWT, loads user from DB
                                                          req.user = User
  └─ returns IUser | null
  └─ <UserProvider initialUser={user}>  ← client-side state seeded from server
```

No client-side fetch, no loading flash. `UserProvider` starts with a fully resolved user or `null`.

---

### 3. Authenticated API requests (client-side)

```
Browser (React)      Backend
  │                    │
  │── apiFetch('/me') ─▶  (credentials: 'include' → cookie is forwarded automatically)
  │                    │
  │                    JwtAuthGuard (global, every endpoint)
  │                    └─ reads req.cookies.access_token
  │                    └─ JwtStrategy.validate({ sub }) → findById(sub) → User
  │                    └─ attaches to req.user
  │                    │
  │                    @CurrentUser() → reads req.user
  │◀─── 200 IUser ─────│
```

To opt a route out of authentication, decorate it with `@Public()`:

```typescript
@Public()
@Get('google')
@UseGuards(AuthGuard('google'))
googleLogin(): void { … }
```

---

### 4. Protected routes (frontend)

Routes inside `(auth-guard)/` wrap their content in `AuthGuard`:

```
User navigates to /profile
  └─ (auth-guard)/layout.tsx renders <AuthGuard>
       └─ useCurrentUser() → { user }
            │
            ├─ user === null  →  router.replace('/login')  +  renders null
            └─ user exists   →  renders children (the page)
```

Because `UserProvider` is seeded from the server, authenticated users never see a redirect flash on a cold page load.

---

### 5. Sign-out

```
User clicks "Sign out"
  └─ POST /auth/logout
       └─ res.clearCookie('access_token')
       └─ 200 OK
  └─ router.replace('/login')
```

On the next page load `getServerUser()` finds no cookie → `initialUser = null` → `UserProvider` starts unauthenticated.

---

## Resulting Structure

```
backend/
  src/
    auth/
      __tests__/
        auth.controller.spec.ts
        auth.service.spec.ts
        jwt-auth.guard.spec.ts
        jwt.strategy.spec.ts
      decorators/
        current-user.decorator.ts
        public.decorator.ts
      guards/
        jwt-auth.guard.ts
      strategies/
        google.strategy.ts
        jwt.strategy.ts
      auth.controller.ts
      auth.module.ts
      auth.service.ts
    user/
      __tests__/
        user.controller.spec.ts
        user.service.spec.ts
      dto/
        update-user.dto.ts
      user.controller.ts
      user.module.ts
      user.service.ts
    scripts/
      seed-admin.ts
  prisma/
    migrations/
      20260522093134_init_user/   ← User model

frontend/
  src/
    api/
      auth.ts
      user.ts
      user.server.ts          ← server-only
    lib/
      api.ts
      api.server.ts           ← server-only
    context/
      UserContext.tsx
    types/
      user.types.ts
    components/
      AuthGuard/
        AuthGuard.tsx
        AuthGuard.spec.tsx
    app/
      layout.tsx              ← async RSC, seeds UserProvider
      providers.tsx
      login/
        page.tsx
        page.spec.tsx
      (auth-guard)/
        layout.tsx
        profile/
          page.tsx
```

## Commands

```bash
# Seed a registered user as admin (run after the user has signed in once via Google)
pnpm seed:admin user@example.com

# Run backend tests
pnpm --filter backend test

# Run frontend tests
pnpm --filter frontend test

# Apply Prisma migrations to the DB
pnpm --filter backend prisma migrate deploy

# Start both apps in development
pnpm dev
```

## Configuration / Environment Variables

### Backend (`backend/.env`)

| Variable              | Example                                         | Required | Description                                        |
| --------------------- | ----------------------------------------------- | -------- | -------------------------------------------------- |
| `DATABASE_URL`        | `postgresql://user:pass@localhost:5432/tailortales` | yes   | Postgres connection string                         |
| `GOOGLE_CLIENT_ID`    | `123456.apps.googleusercontent.com`             | yes          | Google OAuth client ID                             |
| `GOOGLE_CLIENT_SECRET`| `GOCSPX-…`                                      | yes          | Google OAuth client secret                         |
| `BACKEND_URL`         | `http://localhost:3001`                         | yes          | Used to build the OAuth callback URL (`BACKEND_URL/auth/google/callback`). Must match the authorized redirect URI in GCP. |
| `JWT_SECRET`          | `change-me-in-production`                       | yes          | Secret used to sign JWTs                           |
| `JWT_EXPIRY_DAYS`     | `7`                                             | no (def: `7`)| Access token lifetime in days                      |
| `FRONTEND_URL`        | `http://localhost:3000`                         | yes          | Used for CORS origin and post-login redirect       |
| `NODE_ENV`            | `production`                                    | no (def: `development`) | Controls the cookie `secure` flag — set to `production` in prod so the cookie is HTTPS-only |
| `PORT`                | `3001`                                          | no (def: `3001`) | Port the NestJS server listens on             |

### Frontend (`frontend/.env`)

| Variable                    | Example                       | Required | Description                              |
| --------------------------- | ----------------------------- | -------- | ---------------------------------------- |
| `NEXT_PUBLIC_BACKEND_URL`   | `http://localhost:3001`       | yes      | Backend base URL; used client- and server-side |

## External Services

- **Google OAuth** — create a project in [Google Cloud Console](https://console.cloud.google.com/), enable the "Google Identity" API, create OAuth 2.0 credentials (type: Web application), and add `{BACKEND_URL}/auth/google/callback` (e.g. `http://localhost:3001/auth/google/callback` for local dev) as an authorized redirect URI. Free tier is sufficient for development and low-volume production.

## Database Migrations

- `20260522093134_init_user` — creates the `User` table with `id`, `googleId`, `email`, `name`, `avatarUrl`, `role` (`USER` | `ADMIN`), `createdAt`, `updatedAt`. Unique indexes on `id`, `googleId`, `email`.

## Gotchas & Known Limitations

- **Cookie `sameSite: 'lax'`** — works when the frontend and backend share the same top-level domain. If they differ in production (e.g. `app.tailortales.com` → `api.tailortales.com`), switch to `sameSite: 'none'` with `secure: true`.
- **`server-only` boundary** — importing `api/user.server.ts` or `lib/api.server.ts` in a client component will produce a build error (`server-only`). This is intentional. Use `api/user.ts` from client components instead.
- **RSC user seeding vs deferred decision** — ROADMAP Deferred Decision #1 ("Server-side auth in Next.js") has been resolved: the root `layout.tsx` is an async RSC that fetches the user server-side via `getServerUser()` and passes it as `initialUser`. The client `UserProvider` is seeded directly — no useEffect, no loading flash. The deferred decision entry has been removed from ROADMAP.
- **`NEXT_PUBLIC_BACKEND_URL` in server components** — `NEXT_PUBLIC_*` variables are inlined at build time for the client bundle but are also accessible on the server at runtime. A single env var covers both contexts.
- **Prisma v7 adapter** — `PrismaClient` requires a driver adapter (`PrismaPg`) instead of the `datasourceUrl` option that existed in Prisma v5/v6.
- **Admin promotion** — the `seed:admin` script requires the user to have signed in at least once (so their record exists in the DB). There is no invite-only admin creation flow yet.

## Tests

| Suite | File | Tests |
| ----- | ---- | ------ |
| AuthService | `backend/src/auth/__tests__/auth.service.spec.ts` | `issueToken` signs JWT with `sub` |
| JwtStrategy | `backend/src/auth/__tests__/jwt.strategy.spec.ts` | `validate` returns user or throws 401 |
| JwtAuthGuard | `backend/src/auth/__tests__/jwt-auth.guard.spec.ts` | `@Public()` bypass; defers to Passport for protected routes |
| AuthController | `backend/src/auth/__tests__/auth.controller.spec.ts` | `logout` clears cookie; `googleCallback` issues token + redirects |
| UserService | `backend/src/user/__tests__/user.service.spec.ts` | `findById`, `findOrCreate` (new + existing), `updateName` |
| UserController | `backend/src/user/__tests__/user.controller.spec.ts` | `getMe` returns user; `updateMe` delegates to service |
| LoginPage | `frontend/src/app/login/page.spec.tsx` | Google OAuth link renders and points to `/auth/google` |
| AuthGuard | `frontend/src/components/AuthGuard/AuthGuard.spec.tsx` | Redirects to `/login` when no user; renders children when authenticated |

Run all tests: `pnpm test` (from the monorepo root runs both backend and frontend).

## Follow-ups / Open Items

- End-to-end smoke test (real Google OAuth flow) is not automated — manual verification required before each release.
- No token refresh mechanism. When the JWT expires (default 7 days) the user is silently logged out on their next page load.
- `PATCH /me` currently only supports updating the `name` field. Avatar upload is reserved for a future phase.
