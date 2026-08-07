# Contributing to TailorTales

## Workflow

1. **Branch off `main`** with a name like `TT-<type>-<short-descriptor>`:
    - `TT-feat-google-oauth`
    - `TT-fix-session-cookie-expiry`
    - `TT-chore-bump-prisma`
2. **Make focused commits** following [Conventional Commits](#commit-message-format) (below).
3. **Open a PR** with title in Conventional Commits format.
4. **Link the GitHub issue** from [Project 2](https://github.com/users/Shagon1k/projects/2).
5. **PR description** must include: acceptance evidence and any new env vars / migrations.
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

## Enforcement

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

## Issue Workflow

- [Project 2](https://github.com/users/Shagon1k/projects/2) is the only source of truth for
  active and deferred delivery scope.
- `Deferred` issues are excluded from autonomous work until their documented activation
  trigger is met and they are moved to `Backlog`.
- Autonomous work may select only `Backlog` issues without the `human-control` label.
- A PR moves to `[AI] Human Review` when autonomous implementation is ready for owner review.
- Keep durable docs accurate when behavior changes. Archived planning files under
  `_docs/archive/` are historical and are not updated as part of delivery work.
