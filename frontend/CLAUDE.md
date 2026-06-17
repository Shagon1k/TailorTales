# Frontend

Next.js App Router + Mantine. Components co-locate with their route (`_components/`) and lift
only on a second consumer. Session comes from an RSC fetch in the root layout → `UserProvider`;
everything else is React Query. CSS/design-system conventions auto-load from the rules.

## React Query

- `QueryClient` must be created with `useState(() => new QueryClient())` — module-scope creation causes SSR data leaks between users.
- Query keys: exported `as const` arrays in `hooks/*.ts`. Extract hooks to `hooks/` when used by multiple components; inline `useQuery`/`useMutation` is fine for single-component use.

## API layer

- Server-side (RSC) API files: `src/api/*.server.ts`, must start with `import 'server-only'`.

## Utility functions

- **Shared (used by 2+ components or areas)** → `src/utils/<name>.utils.ts`. Import via `@/utils/<name>.utils`.
- **Local (used only within one component or area)** → `<component>/utils/<name>.utils.ts`, co-located next to the component.
- Never place a utility in a component's `utils/` folder if a second consumer already exists — promote it to `src/utils/` instead.

## i18n navigation

- Always import `Link`, `useRouter`, and `usePathname` from `src/i18n/navigation.ts` — never from `next/navigation` directly. The wrappers inject the active locale; bypassing them breaks locale-prefixed routing.
