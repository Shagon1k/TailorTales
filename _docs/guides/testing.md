# Testing

> How tests are written and run in TailorTales. Full conventions live in
> [`.claude/rules/testing.md`](../../.claude/rules/testing.md) — that file is the
> authoritative spec for naming, structure, and framework usage. This guide covers the
> practical "how to run" and "how it fits together" view.

## Stack

| Area     | Tool                                                                                 | Notes                                     |
| -------- | ------------------------------------------------------------------------------------ | ----------------------------------------- |
| Backend  | [Vitest](https://vitest.dev/) (`node` environment)                                   | Unit tests for services and the pipeline. |
| Frontend | Vitest + [React Testing Library](https://testing-library.com/) (`jsdom` environment) | Component and hook tests.                 |

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

## File structure

- **Backend:** `src/modules/<module>/__tests__/<name>.spec.ts`
- **Frontend components:** `src/app/<route>/_components/<Name>/__tests__/<name>.component.spec.tsx`
- **Frontend hooks:** `src/hooks/__tests__/<name>.spec.ts`
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

- E2E / supertest HTTP tests — not set up yet. Add the convention to `.claude/rules/testing.md`
  when they are introduced.
- Visual regression tests — planned, not yet in scope.
