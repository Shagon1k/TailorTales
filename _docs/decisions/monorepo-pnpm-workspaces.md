# Decision: pnpm workspaces monorepo (no Turborepo)

## Decision

Keep `backend/` and `frontend/` in a **pnpm-workspace monorepo** without Turborepo or other
build orchestration.

## Context

TailorTales is two deployable apps — a NestJS backend and a Next.js frontend — that share no
compiled packages between them (they share only conventions and this repo). They need to be
developed, tested, and deployed together.

## Why a monorepo?

- Shared root tooling (`pnpm`, `eslint`, `prettier`, `commitlint/husky`, `tsconfig.base.json`)
  with a single `pnpm install`.
- Root-level scripts (`pnpm dev`, `pnpm test`, `pnpm build`, `pnpm type-check`) fan out to
  both packages — contributors run one command, not two.
- A single git history, a single PR, a single CI run for cross-cutting changes.

## Why pnpm?

- Efficient disk usage via content-addressable store (symlinked `node_modules`).
- `--filter` flag makes it easy to target individual packages: `pnpm --filter backend test`.
- `pnpm-lock.yaml` enforces reproducible installs across environments.

## Why not Turborepo?

- At two packages with no shared compiled libraries, Turborepo's pipeline caching adds
  complexity without a clear payoff. There is no package `A` that `B` depends on; the apps
  are independent.
- `pnpm dev` (parallel with `concurrently`) and `pnpm test` are simple scripts — no task graph
  is needed.

## Revisit if

- A third shared package emerges (e.g. shared types, a design system package) where build
  ordering matters.
- CI build times become a bottleneck and incremental caching is worth the added configuration.
