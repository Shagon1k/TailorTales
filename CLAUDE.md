# TailorTales

**Important!** Don't be lazy, or I will switch you with Codex.

> Rules are scoped to where they apply:
> - **Project-wide**: [`.claude/rules/`](.claude/rules/) — `typescript.md`, `testing.md`, `git.md`
> - **Backend-specific**: [`backend/.claude/rules/`](backend/.claude/rules/) — NestJS, Prisma, API patterns
> - **Frontend-specific**: [`frontend/.claude/rules/`](frontend/.claude/rules/) — CSS, component patterns, Mantine
> - Each package may also have its own `CLAUDE.md` for package-level instructions.
> When adding a new convention, put it in the most specific location that applies.

## Core

- **Definition of Done**: Deliverables must be fully complete or explicitly blocked. Claims of completion require the best available evidence; if proof is missing, state exactly what is absent. Never fake completion.
- **Right to Disagree**: Disagree if quality, truth, or safety is at risk. State the concrete risk briefly, propose the smallest safer alternative, and continue non-blocked work. When unsupervised, if a risk exceeds the delegation boundary, stop and escalate immediately. Logging an override does not transfer liability.
- **Attention Engineering**: Attention is a finite engineering constraint. Keep one coherent objective per active iteration and avoid mixing unrelated tasks in a single reasoning pass. Ensure critical constraints remain visible near the decision point. If a direct check answers the question, do not over-explore or over-delegate.

## Process

- Analyze impact before writing code.
- Ask when unclear — group all questions in one message, don't ask one-by-one.
- For changes touching >5 files or ~100+ LOC: outline the plan -> get approval -> then deliver incrementally.
- Names carry meaning and guide attention; they are not labels. Never reuse one name for different concepts, and never use different names for the same concept. Qualify ambiguous words, and ensure the same concept is named identically across code, docs, API, and UI (e.g., use ui_graph or knowledge_graph instead of just graph).
- Verify before declaring done — run it, test it, or walk a checklist. Don't ship unverified changes.
- Logs are future context. Log exactly what happened, where it happened, and the expected vs. actual outcomes when relevant. Prefer durable artifacts or compact handoff notes over conversational noise, and include a single, brief next-step hint when useful.
- When a conversation produces a reusable pattern or architectural decision, propose adding it to the relevant CLAUDE.md or .claude/rules/\*.md. Wait for approval before applying.

## Code

- Write minimal but readable code. The codebase should remain easy to follow for any developer picking it up.
- YAGNI — write only what the current task needs. Exceptions require explicit approval.
- Match surrounding code conventions when no explicit styleguide exists.
- NEVER swallow errors or hide failures behind silent fallbacks. Let them surface or log them explicitly.
- Remove unused code and refactor when needed — but ONLY with developer approval. Refactoring means structural changes only, with no behavior changes, and always in a separate commit.
- After any CLI scaffold (NestJS, Next.js, etc.), audit every generated file: verify it is actually needed before keeping it. Default assets, duplicate configs, and boilerplate docs are candidates for removal.
- Stay in scope. Flag unrelated issues to the developer instead of fixing them inline.

## Safety

- NEVER hardcode secrets — API keys, tokens, and credentials go in environment variables.
- NEVER add a new dependency without developer approval.

## Git

- Follow [`.claude/rules/git.md`](.claude/rules/git.md): GitHub Flow, `TT-<type>-<descriptor>` branches, Conventional Commits, squash merge.
- One logical change per commit. Refactors require approval and go in a separate commit with no behavior change.
- NEVER commit without explicit developer approval — describe the change and wait for a clear "yes" before running git commit.

## Documentation

- `ROADMAP.md` is the single source of truth — update it on every scope change or decision.
- Every completed phase MUST ship with a doc at `_docs/phase-N-<name>.md` covering: what was added, resulting structure, working commands, configuration/env vars, gotchas. Follow `_docs/TEMPLATE.md`.
- After each phase: propose updates to `CLAUDE.md` and `.claude/rules/*` based on what was learned. Apply only after developer approval.
- A phase is NOT complete until its doc is written and acceptance checks pass.
- When deferring a decision or tech debt item, propose adding it to `ROADMAP.md` section "Deferred Decisions & Tech Debt" — ALWAYS ask the developer before adding.
