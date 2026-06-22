# Git Rules

## Branching Strategy

- **GitHub Flow:** `main` is always deployable. Work happens on short-lived feature branches, merged back via PR.
- Branch from `main`, merge to `main` via PR.
- One logical concern per branch — keep PRs reviewable.

## Branch Naming

Format: `TT-<type>-<short-kebab-descriptor>`

- `<type>` matches commit types (see below): `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, `style`.
- `<descriptor>` — short, kebab-case, describes the change.
- Meta branches (rare): `TT-<name>` acceptable when no clear type applies (e.g. `TT-init` for initial repo setup).
- Phase tracking → use **GitHub Milestones** (e.g. `Phase 1 — Auth`), NOT phase-named branches.

### Examples

- `TT-feat-google-oauth`
- `TT-feat-user-entity`
- `TT-fix-session-cookie-expiry`
- `TT-chore-bump-prisma`
- `TT-docs-roadmap-phase-4-detail`

## Commit Messages — Conventional Commits

Format: `<type>(<optional-scope>): <subject>`

### Types

| Type       | When to use                                                      |
| ---------- | ---------------------------------------------------------------- |
| `feat`     | New feature                                                      |
| `fix`      | Bug fix                                                          |
| `chore`    | Maintenance (deps, configs) — no production code behavior change |
| `docs`     | Documentation only                                               |
| `refactor` | Code restructuring, no behavior change                           |
| `test`     | Tests only                                                       |
| `perf`     | Performance improvement                                          |
| `build`    | Build system or external dependencies                            |
| `ci`       | CI/CD configuration                                              |
| `style`    | Formatting/whitespace, no code change                            |

### Scope (optional)

Use to clarify the area: `feat(auth):`, `fix(backend):`, `docs(roadmap):`, `chore(deps):`. Prefer scope when it sharpens context.

### Subject rules

- **Imperative mood** — "add", not "added" or "adds".
- **No trailing period.**
- **Lowercase** (except proper nouns).

### Body (optional)

- Blank line between subject and body.
- Explain _why_, not _what_ (the diff shows what).

### Limits

Cite the config when a limit comes up — never restate the number elsewhere, so it can't drift.

| Constraint                     | Source (`commitlint.config.js` rule)         |
| ------------------------------ | -------------------------------------------- |
| Header `type(scope): subject`  | `header-max-length` (72)                     |
| Body / footer line length      | `body-max-line-length`, `footer-max-line-length` (100) |
| Allowed types                  | `type-enum` (see type table above)           |
| Scope optional                 | `scope-empty`                                |

### Examples

```
feat(auth): add Google OAuth callback handler
fix(frontend): correct session cookie expiry
chore: bump prisma to 5.10
docs(roadmap): clarify Phase 4 acceptance criteria
refactor(backend): extract DTO validation into pipe
```

## Pull Requests

- **Squash merge** to `main` — one commit per logical PR, clean linear history.
- PR title MUST follow Conventional Commits — it becomes the squash-commit message.
- PR description MUST include (the `.github/PULL_REQUEST_TEMPLATE.md` template prompts for these):
    - **ROADMAP phase reference** (e.g. "Phase 1 — Auth").
    - **Acceptance check confirmation** — which checks pass.
    - **New env vars / migrations** — call out anything operational.
- Link the GitHub Milestone for the phase the PR belongs to.

## Enforcement

- **`commitlint` + `husky`** enforce Conventional Commits at commit time (set up in Phase 0).
- Commits failing the check must be rewritten — do NOT bypass with `--no-verify`.
- Branch name validation is lightweight (visual review at PR time); may be automated later.

## Anti-patterns

- Never `git push --force` to a shared branch — it rewrites history others depend on. Use `--force-with-lease` and only on your own branch.
- Never bypass hooks with `--no-verify` — fix the lint/commitlint failure instead.
- Never put two scopes in one commit — split them so each is independently revertable.
