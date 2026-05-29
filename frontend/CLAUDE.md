# Frontend

## React Query

- `QueryClient` must be created with `useState(() => new QueryClient())` — module-scope creation causes SSR data leaks between users.
- Query keys: exported `as const` arrays in `hooks/*.ts`. Extract hooks to `hooks/` when used by multiple components; inline `useQuery`/`useMutation` is fine for single-component use.

## API layer

- Server-side (RSC) API files: `src/api/*.server.ts`, must start with `import 'server-only'`.

## Utility functions

- **Shared (used by 2+ components or areas)** → `src/utils/<name>.utils.ts`. Import via `@/utils/<name>.utils`.
- **Local (used only within one component or area)** → `<component>/utils/<name>.utils.ts`, co-located next to the component.
- Never place a utility in a component's `utils/` folder if a second consumer already exists — promote it to `src/utils/` instead.
