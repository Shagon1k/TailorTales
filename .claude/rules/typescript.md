---
paths:
  - "**/*.{ts,tsx}"
---

# TypeScript Rules

## General
- Project runs with `strict: true` — rely on compiler enforcement, don't add redundant type guards.
- NEVER use `any`. Use `unknown` when the type is truly unknown and narrow it explicitly.
- NEVER use `as` type assertions — use type guards instead.
- Prefer string literal unions over enums. Use `const enum` only when required for interoperability.
- Use `interface` for object shapes that may be extended or implemented. Use `type` for unions, intersections, tuples, mapped types, and utility type compositions.
- Prefix interfaces with `I` (e.g. `IEntity`). Re-exported external interfaces follow the same rule (e.g. `import { Store as IStore } from 'redux'`).
- Prefix generic type parameters with `T` and use a descriptive name (e.g. `<TResponse>`).
- Prefix imported/re-exported types with the `type` keyword.
- Declare global variables in a dedicated `declarations.d.ts`.
- Extract types to a `.types.ts` file only when reused across multiple files. Never for component props.
- Don't create a separate type/interface for functions with ≤2 parameters — inline them.
- Use TypeScript utility types (`Partial`, `Pick`, `Omit`, `Required`, etc.) over manually redefining shapes.
- Always declare explicit return types on exported functions.
- NEVER use `@ts-ignore`. Use `@ts-expect-error` with a mandatory reason comment.
- Always use `async/await` with `try/catch`. Type caught errors as `unknown`, narrow them with a helper before use, log before re-throwing — never swallow.

## React (FE / Next.js only)
- Component props interface must follow the pattern: `I[ComponentName]Props`.
- Use `React.Component<Props, State>` for class components.
- Use `React.ComponentType<Props>` for union component types (e.g. HOCs).
- Use `React.ReactEventHandler<HTML{input}Element>` for generic event handlers.
- Use `React.{EventType}Event<HTML{input}Element>` for specific event handlers.
- Do not use `React.FC` — type props explicitly and declare the return type instead.
