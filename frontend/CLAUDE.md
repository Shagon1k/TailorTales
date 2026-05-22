# Frontend

## React Query

- `QueryClient` must be created with `useState(() => new QueryClient())` — module-scope creation causes SSR data leaks between users.
- Query keys: exported `as const` arrays in `hooks/*.ts`. Extract hooks to `hooks/` when used by multiple components; inline `useQuery`/`useMutation` is fine for single-component use.

## API layer

- Server-side (RSC) API files: `src/api/*.server.ts`, must start with `import 'server-only'`.
