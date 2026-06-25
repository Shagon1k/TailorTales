# Contributing to TailorTales

## Workflow

1. **Branch off `main`** with a name like `TT-<type>-<short-descriptor>`:
    - `TT-feat-google-oauth`
    - `TT-fix-session-cookie-expiry`
    - `TT-chore-bump-prisma`
2. **Make focused commits** following [Conventional Commits](#commit-message-format) (below).
3. **Open a PR** with title in Conventional Commits format.
4. **Link the GitHub Milestone** for the ROADMAP phase (e.g. `Phase 1 — Auth`).
5. **PR description** must include: ROADMAP phase, which acceptance checks pass, any new env vars / migrations.
6. **Squash merge** to `main` once approved.

## Commit Message Format

```
<type>(<optional-scope>): <subject>
```

- **Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, `style`
- **Subject:** imperative mood, lowercase, no period, <72 chars
- **Scope (optional):** narrows context — `feat(auth):`, `fix(backend):`

Examples:

```
feat(auth): add Google OAuth callback handler
fix(frontend): correct session cookie expiry
chore: bump prisma to 5.10
```

## Enforcement (set up in Phase 0)

- **`commitlint` + `husky`** validate commit messages on every commit.
- Failed commit? Fix the message and recommit. **Do not bypass with `--no-verify`.**

## Setup

Full setup instructions (prerequisites, Docker services, env vars, database migrations, seeds):
**[\_docs/guides/getting-started.md](_docs/guides/getting-started.md)**

The minimal steps to have the repo ready for commits:

```bash
pnpm install   # installs all workspaces + Husky commit hooks (via the prepare script)
```

After install, every `git commit` runs commitlint on the message. If it fails, the commit is rejected.

## Phase Workflow

TailorTales is built in numbered phases (see [ROADMAP.md](ROADMAP.md)). Per phase:

- Track work via a GitHub Milestone named `Phase N — <name>`.
- All PRs related to a phase carry that milestone.
- Phase is complete when: all milestone PRs merged, acceptance checks pass, and the phase's working `_docs/phase-N-<name>.md` is written (per `_docs/TEMPLATE.md`). At documentation phases these get consolidated into the durable docs (`_docs/architecture/`, `api/`, `guides/`) and removed.
- After each phase, propose updates to `AGENTS.md` and `.agent-docs/rules/*` — apply only after developer approval.
