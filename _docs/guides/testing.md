# Testing

> How tests are written and run in TailorTales. Full conventions live in
> [`.agent-docs/rules/testing.md`](../../.agent-docs/rules/testing.md) — that file is the
> authoritative spec for naming, structure, and framework usage. This guide covers the
> practical "how to run" and "how it fits together" view.

## Stack

| Area     | Tool                                                                                 | Notes                                                       |
| -------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| Backend  | [Vitest](https://vitest.dev/) (`node` environment)                                   | Unit tests for services and the pipeline.                   |
| Frontend | Vitest + [React Testing Library](https://testing-library.com/) (`jsdom` environment) | Component and hook tests.                                   |
| Browser  | [Playwright](https://playwright.dev/) (Chromium)                                     | Small UAT smoke suite for critical user-visible paths only. |

## Running tests

```bash
pnpm test            # all tests (backend + frontend, in parallel)
pnpm --filter backend test
pnpm --filter frontend test
```

Tests must pass with no live external services:

```bash
USE_AI_STUBS=true USE_EMAIL_STUBS=true pnpm test
```

This is the CI configuration — no OpenRouter calls, no Resend calls, no Redis or Postgres
required.

## Browser smoke tests

Playwright lives in the root [`e2e/`](../../e2e) directory and tests a running application,
not mocked component internals. It is intentionally a small release confidence suite, not a
replacement for the fast unit/component suite.

```bash
# Start the local frontend and backend first, then run public smoke tests.
pnpm test:e2e e2e/public-navigation.spec.ts

# Run the full UAT suite. The secret is the UAT Dokploy E2E_TEST_SECRET value.
PLAYWRIGHT_BASE_URL=https://uat.tailortales.app \
E2E_TEST_SECRET=... \
pnpm test:e2e
```

The suite has two boundaries:

| Scenario                      | Authentication             | Purpose                                                    |
| ----------------------------- | -------------------------- | ---------------------------------------------------------- |
| `public-navigation.spec.ts`   | None                       | Landing page and public routing remain usable.             |
| `authenticated-smoke.spec.ts` | Test-only session endpoint | Library and subscription render for an authenticated user. |

`POST /api/auth/e2e/session` exists only when `E2E_TEST_SECRET` is configured. It requires the
same secret in the `x-e2e-test-secret` header, creates or reuses the dedicated
`e2e-smoke@tailortales.invalid` user, and sets the normal HTTP-only session cookie. The endpoint
returns `404` when the variable is absent, so production does not expose it. Authenticated specs
must use `page.request`, not Playwright's standalone `request` fixture, because the page request
context shares the browser cookie jar.

If UAT has `AUTH_ALLOWED_EMAILS`, its `app-uat` service-level value must include
`e2e-smoke@tailortales.invalid` together with the owner emails. The JWT strategy enforces that
allowlist on every authenticated request, including the test session.

Install Chromium once after dependency installation:

```bash
pnpm exec playwright install chromium
```

Playwright saves a trace on the first retry and a screenshot on failure. Treat those artifacts as
the first debugging input; do not broaden the smoke suite with arbitrary long flows.

## File structure

- **Backend:** `src/modules/<module>/__tests__/<name>.spec.ts`
- **Frontend components:** `src/app/<route>/_components/<Name>/__tests__/<name>.component.spec.tsx`
- **Frontend hooks:** `src/hooks/__tests__/<name>.spec.ts`
- **Browser smoke:** `e2e/<flow>.spec.ts`
- Mock files (`<name>.mock.ts`) co-locate with the spec file in the same `__tests__/` folder.

## Key conventions (summary)

- **Naming:** Given-When-Then. `describe` = entity; nested `describe` starts with `"given..."` or
  `"when..."`; `it`/`test` starts with `"should..."`.
- **Backend:** use `Test.createTestingModule`; mock dependencies with `useValue`; re-create per
  `beforeEach`. Hold `vi.fn()` handles in `let` bindings.
- **Frontend:** test observable behavior (text, roles, ARIA), not className or implementation
  details. Use `user-event` over `fireEvent`.
- **Vitest globals are enabled** — do not import `describe`, `it`, `expect`, `vi`, etc.

## Testing the generation pipeline offline

`GenerationPipeline` has no BullMQ dependency, so it can be tested directly:

```ts
// No Redis needed — call run() directly with the stub AI client
pipeline.run(jobId); // AI_CLIENT resolves to AiStubClient when USE_AI_STUBS=true
```

See [`generation.pipeline.spec.ts`](../../backend/src/modules/generation/__tests__/generation.pipeline.spec.ts)
for the reference implementation.

## What is not yet tested

- Full purchase, OAuth-provider, image-generation, and PDF-generation workflows — smoke tests
  deliberately avoid paid or third-party side effects.
- Visual regression tests — planned, not yet in scope.
