# TailorTales

**Important!** Don't be lazy, or I will switch you with Codex.

> Domain-specific rules live in [`.claude/rules/`](.claude/rules/) and auto-load (path-scoped where appropriate): `typescript.md`, `testing.md`, `git.md`.

## Process

- Analyze impact before writing code.
- Ask when unclear — group all questions in one message, don't ask one-by-one.
- For changes touching >5 files or ~100+ LOC: outline the plan -> get approval -> then deliver incrementally.
- Verify before declaring done — run it, test it, or walk a checklist. Don't ship unverified changes.

## Code

- Write minimal but readable code. The codebase should remain easy to follow for any developer picking it up.
- YAGNI — write only what the current task needs. Exceptions require explicit approval.
- Match surrounding code conventions when no explicit styleguide exists.
- NEVER swallow errors or hide failures behind silent fallbacks. Let them surface or log them explicitly.
- Remove unused code and refactor when needed — but ONLY with developer approval. Refactoring means structural changes only, with no behavior changes, and always in a separate commit.
- Stay in scope. Flag unrelated issues to the developer instead of fixing them inline.

## Safety

- NEVER hardcode secrets — API keys, tokens, and credentials go in environment variables.
- NEVER add a new dependency without developer approval.

## Git

- Follow [`.claude/rules/git.md`](.claude/rules/git.md): GitHub Flow, `TT-<type>-<descriptor>` branches, Conventional Commits, squash merge.
- One logical change per commit. Refactors require approval and go in a separate commit with no behavior change.

## Documentation

- `ROADMAP.md` is the single source of truth — update it on every scope change or decision.
- Every completed phase MUST ship with a doc at `_docs/phase-N-<name>.md` covering: what was added, resulting structure, working commands, configuration/env vars, gotchas. Follow `_docs/TEMPLATE.md`.
- After each phase: propose updates to `CLAUDE.md` and `.claude/rules/*` based on what was learned. Apply only after developer approval.
- A phase is NOT complete until its doc is written and acceptance checks pass.
