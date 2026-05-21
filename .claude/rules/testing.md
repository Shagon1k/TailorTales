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
- Avoid snapshot testing — it produces false positives/negatives and slows down the suite.
- Use `screen` to query elements — never `container`.
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

> TODO: Define Nest.js-specific testing conventions (e.g. `@nestjs/testing`, supertest for e2e, module mocking patterns).
