---
paths:
    - '**/*.{spec,test}.{ts,tsx}'
    - '**/__tests__/**/*.{ts,tsx}'
    - '**/vitest.config.{ts,js}'
    - '**/*.mock.{ts,tsx}'
---

# Testing Rules

## General

### Principles

- Follow F.I.R.S.T.: tests must be Fast, Isolated, Repeatable, Self-validating, and Thorough.
- Don't write tests just to improve coverage numbers — cover meaningful scenarios (happy path, edge cases, error states).
- Each test file must cover only one source file. Do not test multiple modules in a single test file.

### File Structure

- Place tests in a `__tests__` subfolder next to the file under test.
- Test files: `[name].spec.ts`
- Mock files: `[name].mock.ts` — stored inside `__tests__` as well.
- Test data: use factories or builder functions instead of inline hardcoded objects.

### Naming — Gherkin Style (Given-When-Then)

- Top-level `describe` block = the entity under test (function, component, class, etc.).
- Multiple exports in one file → one `describe` block per exported entity.
- Nested `describe` blocks start with `"given..."` or `"when..."`.
- `it`/`test` blocks start with `"should..."` or `"then..."`.

### Test Body — AAA Structure

- Structure each test body with three sections: **Arrange** (setup), **Act** (execute), **Assert** (verify).
- GWT naming applies to block names; AAA applies to what's inside each `it`/`test`.

### Hooks & Mocking (Vitest)

- Use `beforeEach`/`beforeAll` for setup, `afterEach`/`afterAll` for cleanup — not interchangeably.
- Use `vi.fn()`, `vi.mock()`, `vi.spyOn()` — never Jest equivalents.
- Vitest globals are enabled (`globals: true`) — do NOT import `describe`, `it`, `expect`, `vi`,
  `beforeEach`, `afterEach`, etc. They are available without imports.
- Don't mock what you don't own — wrap third-party libraries first, then mock the wrapper.

---

## Component Testing (FE / Next.js only)

### File Naming

- General tests: `[name].component.spec.tsx`
- Accessibility tests: `[name].component.a11y.spec.tsx`

### React Testing Library

- Test user **behavior**, not implementation details — do not access internal state or methods.
- **Never assert `className`, `classList`, or third-party internal class names** (e.g. `mantine-Avatar-placeholder`) — all are styling internals, not observable behavior. Test what the user sees (rendered text, semantic roles, ARIA attributes, DOM structure) and what the component does (disabled state, navigation href, aria-busy). Visual variant correctness belongs in visual regression tests, not unit tests.
- **If there is no meaningful behavioral assertion, write no test** — a test that only verifies a component renders without crashing adds noise without coverage value. Only test observable outcomes.
- Avoid snapshot testing — it produces false positives/negatives and slows down the suite.
- Use `screen` to query elements — avoid `container` (exception: querying non-semantic elements like `svg` that have no accessible role).
- Element querying priority:
    - `get*` — default
    - `query*` — only to assert element is NOT present
    - `find*` — only for async/deferred elements
- Use `jest-dom` matchers over raw DOM assertions:
    - ❌ `expect(button.disabled).toBe(true)`
    - ✅ `expect(button).toBeDisabled()`
- Use `user-event` over `fireEvent` for simulating user interactions.

### Custom Hooks

- Use `renderHook` from `@testing-library/react` — do not create helper wrapper components.
- Cover custom hooks separately only if they are reusable or likely to be reused. Hook logic used in a single component can be tested through that component.

---

## BE / Nest.js

- Build the unit under test with `Test.createTestingModule({ providers: [...] })` and get it
  via `module.get(Service)`. Re-create the module in `beforeEach` so each test starts with
  fresh mocks.
- **Mock dependencies with `useValue`**, exposing only the methods the test exercises — e.g.
  `{ provide: PrismaService, useValue: { story: { findFirst: vi.fn(), create: vi.fn() } } }`.
  Mock our services/wrappers, never the real Prisma client or a third-party SDK directly.
- Hold the `vi.fn()` handles in `let` bindings in the `describe` block so tests can set return
  values and assert calls.
- Test data comes from typed `MOCK_*` factory constants (typed against the Prisma model), not
  inline literals repeated per test.
- Assert thrown Nest exceptions by type — `await expect(call).rejects.toThrow(NotFoundException)`
  — matching the service's contract (ownership mismatch → `NotFoundException`, not `Forbidden`).
- The `GenerationPipeline` is intentionally BullMQ-free, so test it by calling `run(jobId)`
  directly with the stub AI client (`AI_CLIENT` → `AiStubClient`) — no Redis needed.
- supertest/e2e HTTP tests are not used yet — add the convention here when they are.
