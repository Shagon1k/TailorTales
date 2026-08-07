# TailorTales

**Important!** Don't be lazy.

## Core

- **Role Contract**: The human provides intent, constraints, and acceptance criteria. The agent chooses the route, executes, and proves the result. Acceptance criteria must exist before substantial work begins; evidence must exist before claiming completion.
- **Definition of Done**: Deliverables must be fully complete or explicitly blocked. Claims of completion require the best available evidence; if proof is missing, state exactly what is absent. Never fake completion.
- **Right to Disagree**: Disagree if quality, truth, or safety is at risk. State the concrete risk briefly, propose the smallest safer alternative, and continue non-blocked work. When unsupervised, if a risk exceeds the delegation boundary, stop and escalate immediately. Logging an override does not transfer liability.
- **Attention Engineering**: Attention is a finite engineering constraint. Keep one coherent objective per active iteration and avoid mixing unrelated tasks in a single reasoning pass. Ensure critical constraints remain visible near the decision point. If a direct check answers the question, do not over-explore or over-delegate.

## Process

- **Check docs first**: before searching the codebase for patterns or implementation details, identify the task type, find the relevant doc via the docs map (`_docs/README.md`), and read it. Search the codebase only after confirming the docs don't already answer the question. Docs encode curated patterns, conventions, and architectural decisions; skipping them duplicates investigation and risks reinventing anti-patterns.
- Analyze impact before writing code.
- **Execution Loop**: for substantial tasks, work in a loop: explore enough to avoid guessing, execute the smallest useful move, then reflect with evidence before continuing.
- Fight for the "obvious" solution. Avoid being clever because something seems smart. We want everything we create to be so obvious it feels kind of stupid. Never hesitate to push back and suggest ways we could make things more obvious. Note that "obvious" and "simple" are not always aligned; sometimes the obvious solution is more complex.
- Ask when unclear; group all questions in one message, don't ask one-by-one. Ask especially when requirements are ambiguous, multiple approaches are equally valid, architectural tradeoffs are material, or policy applicability is unclear.
- For changes touching >5 files or ~100+ LOC: outline the plan -> get approval -> then deliver incrementally.
- **Stronger Second Check**: do not treat weak evidence as final truth. If the first result is inconclusive, fetch missing context or perform one stronger confirming check before escalating or concluding.
- Names carry meaning and guide attention; they are not labels. Never reuse one name for different concepts, and never use different names for the same concept. Qualify ambiguous words, and ensure the same concept is named identically across code, docs, API, and UI (e.g., use `ui_graph` or `knowledge_graph` instead of just `graph`).
- Verify before declaring done: run it, test it, or walk a checklist. Don't ship unverified changes.
- Logs are future context. Log exactly what happened, where it happened, and the expected vs. actual outcomes when relevant. Prefer durable artifacts or compact handoff notes over conversational noise, and include a single, brief next-step hint when useful.
- **Continuity**: keep critical state in durable artifacts when work spans turns or agents. Do not rely on chat history as the only source of truth. For longer tasks, leave a compact handoff with objective, status, key decisions, blockers, evidence, and next step.
- When a conversation produces a reusable pattern or architectural decision, propose adding it to the relevant `AGENTS.md` or `.agent-docs/rules/*.md`. Wait for approval before applying.

## Rule Index

`.agent-docs/rules/*` is the source of truth for reusable project rules. Read the relevant rule before touching matching files:

- Git workflow and commit messages: `.agent-docs/rules/git.md`
- GitHub task and issue routing: `.agent-docs/rules/github-issues.md`
- TypeScript files: `.agent-docs/rules/typescript.md`
- Tests and test utilities: `.agent-docs/rules/testing.md`
- i18n key naming: `.agent-docs/rules/i18n.md`
- Frontend CSS/components/design-system work: `frontend/AGENTS.md`
- Backend Prisma schema/migrations: `backend/AGENTS.md`

Harness-specific loaders may point at these files. For example, Claude adapters live in `.claude/rules/*`, while generic/Codex-visible skills live in `.agents/skills/*`.

## Compact Representation

Prefer structured formats over prose; they compress better for both human skimming and AI attention.

```
flow / state / relationship  ->  Mermaid diagram
algorithm / decision tree    ->  pseudo-code
config / structured data     ->  JSON with inline // comments
narrative that resists above ->  prose (last resort)
```

By file type:

- **AI-facing** (`AGENTS.md`, `.agent-docs/rules/*.md`, harness adapters): diagrams and pseudo-code first; prose only when structure genuinely doesn't fit.
- **Shared docs** (`_docs/`, READMEs): balance compact formats where they compress cleanly with prose where narrative context matters for human readers.

Session context hygiene: apply the same rule within every session. Plans, summaries, and handoff notes default to the most compact lossless form. If something in context can be expressed as a diagram or structured block without losing meaning, convert it.

## Code

- Write minimal but readable code. The codebase should remain easy to follow for any developer picking it up.
- YAGNI: write only what the current task needs. Exceptions require explicit approval.
- Match surrounding code conventions when no explicit styleguide exists.
- NEVER swallow errors or hide failures behind silent fallbacks. Let them surface or log them explicitly.
- Comment the _why_, not the _what_: explain non-obvious decisions and workarounds, document public APIs, and delete commented-out code rather than shipping it.
- Remove unused code and refactor when needed, but ONLY with developer approval. Refactoring means structural changes only, with no behavior changes, and always in a separate commit.
- After any CLI scaffold (NestJS, Next.js, etc.), audit every generated file: verify it is actually needed before keeping it. Default assets, duplicate configs, and boilerplate docs are candidates for removal.
- Stay in scope. Flag unrelated issues to the developer instead of fixing them inline.
- Rules that apply only to the backend go in `backend/AGENTS.md`; rules only for the frontend go in `frontend/AGENTS.md`. Keep this file for rules that apply across both.

## Safety

- NEVER hardcode secrets: API keys, tokens, and credentials go in environment variables.
- NEVER add a new dependency without developer approval.

## i18n

- Locale key naming follows `.agent-docs/rules/i18n.md`.

## Git

- GitHub Flow, `TT-<type>-<descriptor>` branches, Conventional Commits, squash merge. Full spec: `.agent-docs/rules/git.md`.
- One logical change per commit. Refactors require approval and go in a separate commit with no behavior change.
- NEVER commit without explicit developer approval; describe the change and wait for a clear "yes" before running `git commit`.

## Documentation

Three kinds of project knowledge, different lifecycles:

- **Durable docs**: `_docs/architecture/`, `_docs/api/`, `_docs/guides/`, `_docs/decisions/`, and the READMEs. Human-facing, phase-agnostic, the lasting source of truth.
- **Delivery scope**: GitHub Issues in [Project 2](https://github.com/users/Shagon1k/projects/2) are the only source of truth for active and deferred work.
- **Historical artifacts**: `_docs/archive/ROADMAP.md` and `_docs/archive/DESIGN.md` preserve the original phase plan and design-review history. Never use or update them for ongoing scope.

Rules:

- After completing an issue or PR, propose updates to `AGENTS.md` and `.agent-docs/rules/*` when the work produced a reusable pattern. Apply only after developer approval.
- Track a deferred decision or tech-debt item as a GitHub issue in Project 2 with status `Deferred` and an explicit activation trigger.
