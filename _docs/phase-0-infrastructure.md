# Phase 0 — Infrastructure & Foundation

> Status: ✅ Completed on 2026-05-21
> Related ROADMAP section: Phase 0

## Summary

Established the full monorepo foundation for TailorTales: pnpm workspaces with a NestJS backend and Next.js frontend, shared TypeScript/ESLint/Prettier config at the root, Vitest in both apps, Husky + commitlint enforcing Conventional Commits, Prisma initialized for PostgreSQL, Docker Compose for local services (PostgreSQL, Redis, MinIO), production-ready multi-stage Dockerfiles, and a GitHub Actions CI pipeline.

## What Was Added

- **Monorepo:** root `package.json`, `pnpm-workspace.yaml`, `.nvmrc` (Node 24)
- **Backend:** NestJS 11 scaffold, `GET /health` endpoint, Vitest with node environment
- **Frontend:** Next.js 16 scaffold, Mantine 9 UI library, Vitest with jsdom environment, landing page, `Tag` component (CSS Modules demo), logo and favicon
- **Tooling:** shared `tsconfig.base.json`, `eslint.config.js` (ESLint 10 flat config), `prettier.config.js`, `eslint-config-prettier`, commitlint with custom rules
- **Prisma:** initialized in `backend/` with PostgreSQL provider, `prisma.config.ts` for CLI config, `db:*` scripts
- **Docker:** `docker-compose.yml` (PostgreSQL 17, Redis 7, MinIO), `backend/Dockerfile`, `frontend/Dockerfile` (multi-stage, Node 24 Alpine)
- **CI:** `.github/workflows/ci.yml` — install, lint + format check, type-check, test on push/PR to `main`

## Resulting Structure

```
.
├── .claude/rules/          # git.md, testing.md, typescript.md
├── .github/workflows/
│   └── ci.yml
├── .husky/
│   └── commit-msg
├── .vscode/
│   └── settings.json
├── _docs/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── app.controller.ts
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   └── __tests__/
│   │       └── app.controller.spec.ts
│   ├── .env.example
│   ├── Dockerfile
│   ├── nest-cli.json
│   ├── prisma.config.ts
│   ├── test-setup.ts
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   └── vitest.config.ts
├── frontend/
│   ├── public/images/
│   │   └── logo.webp
│   ├── src/
│   │   ├── app/
│   │   │   ├── __tests__/
│   │   │   │   └── page.component.spec.tsx
│   │   │   ├── globals.css
│   │   │   ├── icon.png
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── providers.tsx
│   │   └── components/
│   │       └── Tag/
│   │           ├── Tag.module.css
│   │           └── Tag.tsx
│   ├── .env.example
│   ├── Dockerfile
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── test-setup.ts
│   ├── tsconfig.json
│   └── vitest.config.ts
├── .nvmrc
├── .prettierignore
├── commitlint.config.js
├── docker-compose.yml
├── eslint.config.js
├── package.json
├── pnpm-workspace.yaml
├── prettier.config.js
└── tsconfig.base.json
```

## Commands

```bash
# Install dependencies
pnpm install

# Start both apps in dev mode (backend :3001, frontend :3000)
pnpm dev

# Build both apps
pnpm build

# Lint + format check
pnpm check

# Type-check
pnpm type-check

# Run all tests
pnpm test

# Format all files
pnpm format

# Start local services (PostgreSQL, Redis, MinIO)
docker compose up -d

# Stop local services
docker compose down

# Prisma (run from backend/ or via filter)
pnpm --filter backend db:generate      # generate Prisma client
pnpm --filter backend db:migrate       # run migrations (dev)
pnpm --filter backend db:migrate:deploy  # run migrations (prod)
pnpm --filter backend db:studio        # open Prisma Studio
```

## Configuration / Environment Variables

| Variable       | Example                                                                   | Required | Description                            |
| -------------- | ------------------------------------------------------------------------- | -------- | -------------------------------------- |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/tailortales?schema=public` | yes      | PostgreSQL connection string (backend) |

Copy `backend/.env.example` → `backend/.env` and fill in values before running locally.

## External Services

None in this phase. Local services only (PostgreSQL, Redis, MinIO) via Docker Compose.

## Database Migrations

None — Prisma schema has no models yet. Models and initial migration will be added in Phase 1.

## Gotchas & Known Limitations

- **Prisma v7:** datasource `url` is no longer set in `schema.prisma`. It lives in `prisma.config.ts` (for CLI/migrations) and must be passed to `PrismaClient` constructor at runtime (Phase 1).
- **Prisma build scripts:** `@prisma/engines` and `prisma` require `onlyBuiltDependencies` approval in root `package.json` — already configured.
- **`test-setup.ts` location:** both apps keep `test-setup.ts` at the package root (not inside `src/`). The backend file imports `reflect-metadata`; the frontend file mocks `window.matchMedia` for Mantine.
- **Favicon:** `src/app/icon.png` (32×32) is picked up automatically by Next.js App Router — no explicit `<link>` needed.
- **Turbopack:** used only for `next dev`. Production build still uses webpack (Turbopack prod builds are not yet stable).
- **ESLint 10:** uses flat config (`eslint.config.js`). `eslint-plugin-react` only supports up to ESLint 9 — `@eslint-react/eslint-plugin` is used instead.
- **VS Code JSON formatter:** must be set to Prettier explicitly in `.vscode/settings.json` — the global `defaultFormatter` is overridden by VS Code's built-in JSON formatter otherwise.

## Tests

- **Backend:** `backend/src/__tests__/app.controller.spec.ts` — tests `GET /health` returns `{ status: 'ok' }`.
- **Frontend:** `frontend/src/app/__tests__/page.component.spec.tsx` — tests heading, tagline, and CTA button render.
- Run with `pnpm test` from the root.

## Follow-ups / Open Items

- `prisma.config.ts` is outside `backend/tsconfig.json`'s `include: ["src/**/*"]` — the IDE flags `process.env` in that file. Low priority; Prisma v7 uses its own `env()` helper from `prisma/config` now.
- MinIO bucket creation is manual at this stage — no init script yet. Needed in the generation pipeline phase.
