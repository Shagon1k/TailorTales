# Security

> How TailorTales defends against common web threats.

## Rate limiting

Every inbound HTTP request passes through `ClientIpThrottlerGuard` before any business logic
runs. The guard extends Nest's `ThrottlerGuard` and is registered as the first `APP_GUARD` in
`app.module.ts`, ahead of
`JwtAuthGuard`, so unauthenticated probing is throttled too.

```
Request
  → ClientIpThrottlerGuard  ← runs first; rejects with 429 if limit exceeded
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

**Client IP** — `ClientIpThrottlerGuard` uses Cloudflare's `CF-Connecting-IP` first, then the
first `X-Forwarded-For` address, and finally Express's request/socket IP. This keeps one stable
bucket per visitor through the Cloudflare → Dokploy proxy chain. `app.set('trust proxy', 1)` in
`main.ts` remains enabled for Express features that rely on the request IP. The backend must
remain reachable only through the managed proxy path so clients cannot inject trusted headers.

**Storage** — in-memory (default `ThrottlerStorageService`). Counters reset on process
restart and are not shared across instances.

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
  [GitHub issue #57](https://github.com/Shagon1k/TailorTales/issues/57) for server-side revocation.

## CORS

`app.enableCors({ origin: FRONTEND_URL, credentials: true })` in `main.ts`. Only the
configured frontend origin may make cross-origin requests with credentials. The `FRONTEND_URL`
env var is required at startup.
