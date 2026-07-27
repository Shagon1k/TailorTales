# Security

> How TailorTales defends against common web threats.

## Rate limiting

Every inbound HTTP request passes through `ThrottlerGuard` before any business logic runs.
`ThrottlerGuard` is registered as the first `APP_GUARD` in `app.module.ts`, ahead of
`JwtAuthGuard`, so unauthenticated probing is throttled too.

```
Request
  → ThrottlerGuard   ← runs first; rejects with 429 if limit exceeded
  → JwtAuthGuard     ← auth check (public routes opt-out via @Public())
  → controller
```

**Global default** — `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])`:
100 requests per IP per 60 seconds on all routes unless overridden.

**Per-route overrides:**

| Route                   | Decorator                                           | Why                                       |
| ----------------------- | --------------------------------------------------- | ----------------------------------------- |
| `GET /auth/google`      | `@Throttle({ default: { ttl: 60000, limit: 10 } })` | Brute-force OAuth initiation              |
| `POST /contact`         | `@Throttle({ default: { ttl: 60000, limit: 5 } })`  | Contact-form spam                         |
| `POST /webhooks/paddle` | `@SkipThrottle()`                                   | Paddle servers must never be rate-limited |

**Trust proxy** — `app.set('trust proxy', 1)` in `main.ts` tells Express to read the real
client IP from `X-Forwarded-For` (set by Cloudflare/dokploy). Without this, every request
appears to come from the proxy IP and all users share a single throttle bucket — making
per-IP limiting useless in production.

**Storage** — in-memory (default `ThrottlerStorageService`). Counters reset on process
restart and are not shared across instances. Sufficient for single-instance MVP. See
[ROADMAP Deferred Decision #15](../../ROADMAP.md) for the Redis upgrade path when
horizontal scaling is introduced.

## Security headers (Helmet)

`app.use(helmet())` in `main.ts` sets the following HTTP response headers:

| Header                         | Value (Helmet default) | Defends against               |
| ------------------------------ | ---------------------- | ----------------------------- |
| `X-Frame-Options`              | `SAMEORIGIN`           | Clickjacking                  |
| `X-Content-Type-Options`       | `nosniff`              | MIME-type sniffing            |
| `Strict-Transport-Security`    | `max-age=15552000`     | SSL stripping                 |
| `X-DNS-Prefetch-Control`       | `off`                  | DNS prefetch information leak |
| `Cross-Origin-Resource-Policy` | `same-origin`          | Cross-origin data reads       |
| `Cross-Origin-Opener-Policy`   | `same-origin`          | Cross-origin window access    |
| `Referrer-Policy`              | `no-referrer`          | Referrer leakage              |

Helmet is applied before CORS and cookie-parser middleware so headers are present on every
response, including error responses.

## CSRF

No explicit CSRF token middleware is used. The architecture provides protection via two
complementary mechanisms:

1. **`SameSite: lax` cookie** — the `access_token` httpOnly cookie is only sent on
   same-site requests. A cross-origin attacker cannot trigger cookie-bearing requests.
2. **Same-origin browser API** — browsers call `tailortales.app/api`; Next.js rewrites the
   request to the private backend service. The host-only cookie is not exposed to sibling
   subdomains, and a cross-site attacker (e.g. `evil.com`) cannot forge requests that carry it.

`csurf` is intentionally omitted — it is deprecated, incompatible with stateless JWTs, and
unnecessary given the above.

## Auth security

See [auth.md](auth.md) for the full auth architecture. Security-relevant constraints:

- **`JWT_SECRET` minimum length** — `env.validation.ts` enforces `@MinLength(32)`. The
  backend refuses to start if the secret is shorter, preventing weak-secret deployments.
  Generate with `openssl rand -base64 48`.
- **httpOnly cookie** — the JWT is never accessible to JavaScript; XSS cannot steal it.
- **`secure: true` in production** — the cookie is only transmitted over HTTPS.
- **Short-lived tokens** — default 7 days, configurable via `JWT_EXPIRY_DAYS`. Logout is
  client-side (cookie deletion); the token remains valid until expiry. See
  [Deferred Decision #1](../../ROADMAP.md) for server-side revocation.

## CORS

`app.enableCors({ origin: FRONTEND_URL, credentials: true })` in `main.ts`. Only the
configured frontend origin may make cross-origin requests with credentials. The `FRONTEND_URL`
env var is required at startup.
