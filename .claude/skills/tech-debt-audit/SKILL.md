---
name: tech-debt-audit
description: Audit a codebase for technical debt and maintain a prioritized roadmap in _docs/tech-debt-audit.md. Use this whenever the user wants to find, audit, assess, or track technical debt, code smells, maintainability problems, or "what should we clean up / refactor / fix" across a project — in any programming language. Each finding is actionable (file+line, description, severity, suggested fix), grouped by severity (High/Medium/Low) with a category tag. After analysis it updates _docs/tech-debt-audit.md without duplicating existing entries, and can optionally open Jira tickets (only with explicit user approval) and record the ticket links back into the doc. Trigger on phrases like "analyze tech debt", "audit this codebase", "find code smells", "what's our technical debt", "build a refactoring roadmap", even when the user doesn't name the file.
---

# Tech Debt Audit

Find real, actionable technical debt in a codebase, then persist it as a living roadmap in `_docs/tech-debt-audit.md` that developers tick off over time. Optionally file Jira tickets for the items the user chooses.

The value of this skill is **actionability and continuity**. A finding nobody can act on is noise; a roadmap that gets rewritten from scratch every run is useless. So two things matter above all: every finding points to a specific place and a specific change, and re-running the analysis *updates* the existing roadmap rather than duplicating it.

## Workflow

Follow these phases in order. Phases 4 (Jira) is optional and gated on explicit user approval.

1. **Scope the codebase** — understand what you're analyzing
2. **Detect debt against the criteria** — find issues, classify them
3. **Reconcile with the existing roadmap** — merge into `_docs/tech-debt-audit.md` without duplication
4. **Offer Jira tickets** (optional) — only if the user approves

---

## Phase 1 — Scope the codebase

Before hunting for issues, get oriented so findings are grounded in how *this* project actually works, not generic advice.

- Identify the stack and entry points: read manifest/build files (e.g. `package.json`, `pom.xml`, `build.gradle`, `requirements.txt`, `go.mod`, `Cargo.toml`, `*.csproj`), and the README.
- Map the source tree. Note the layers (controllers/handlers, services, data access, UI, config) and where the bulk of logic lives.
- Note the languages in play. This skill is language-agnostic — the criteria apply whether the code is Java, JavaScript, Python, Go, etc.

Keep this fast. Use directory listings and targeted searches (Glob, Grep) rather than reading files wholesale — the goal is enough context to judge findings, not a full architecture review.

## Phase 2 — Detect debt against the criteria

Read `references/criteria.md` — it defines the catalog of debt criteria, each mapped to a **category** and a typical **severity**. Walk the codebase looking for instances of these criteria. You are not limited to the catalog; if you spot genuine debt that doesn't fit a listed criterion, include it and assign a sensible category and severity.

**Categories**: `performance`, `consistency`, `error-handling`, `maintainability`, `configuration`, `security`, `testing`.

**Severity** is about impact × likelihood, judged in context — not a fixed label per criterion. The same criterion can be High in one place and Low in another. Calibrate:

- **High** — can cause incorrect behavior, data loss, security exposure, or outages; or blocks development broadly. Fix soon.
- **Medium** — degrades maintainability, performance, or correctness under load/edge cases; worth scheduling.
- **Low** — cleanliness, consistency, and minor risks. Fix opportunistically.

Each finding MUST be actionable. A reader should know exactly where to look and what to change. Capture for every finding:

- **Location** — `path/to/file.ext:line` (or a line range). If the issue is project-wide (e.g. a missing CI gate), say so and point at the most representative file or the repo root.
- **Description** — what the issue is and *why it's debt* (the concrete risk or cost), in one or two sentences.
- **Category** — one of the categories above.
- **Severity** — High / Medium / Low, justified by the impact in this codebase.
- **Suggested fix** — the specific change to make, concrete enough to act on. Name the construct, pattern, or config to introduce. Avoid vague advice like "improve error handling".

Be honest and specific. Prefer a shorter list of real, well-located findings over a long list of generic observations. Don't invent line numbers — open the file and cite the actual location. If you're unsure a thing is debt, either verify it or leave it out.

## Phase 3 — Reconcile with the existing roadmap

The output lives at `_docs/tech-debt-audit.md` (create `_docs/` and the file if they don't exist). This file is a **roadmap that persists across runs** — developers fix items and mark them done or delete them. Your job is to merge new findings in **without creating duplicates**.

Read `references/report-format.md` for the exact document template and the dedup procedure. The essentials:

- The document groups findings by severity (High → Medium → Low). Each severity section is a table; **category is a column**, so related items stay visible together within a priority band.
- Before adding a finding, check whether it already exists (same location + same underlying issue). If it does, **do not add a second row** — instead reconcile: refresh the description/fix if your analysis is better, and leave its Status and Jira columns intact. Never resurrect or overwrite an item a developer has marked `Done`/`Won't fix` unless the issue genuinely recurs.
- Preserve human edits. The Status column and any Jira links are owned by developers — treat existing values as source of truth and don't clobber them.
- When you finish, give the user a short summary: how many findings are new, how many already existed, the severity breakdown.

## Phase 4 — Offer Jira tickets (optional)

This phase is **opt-in** and requires Jira tooling to be available. Before offering this to the user, check whether any Jira MCP tool is present in your environment (look for tools with names like `jira`, `create_issue`, `mcp__jira*`). If none is found, skip the offer entirely — just note that Jira integration is unavailable if the user asks.

If Jira tooling is available: after updating the doc, ask the user — clearly and once — whether they want to create Jira tickets for any of the findings. If they decline or don't respond affirmatively, **skip this entirely**; the doc stands on its own and the skill is complete.

If they say yes, follow `references/jira-integration.md`. The essentials:

- Let the user choose *which* findings get tickets (e.g. "all High", "these three", a specific list). Don't bulk-create without that choice.
- Create a ticket per selected finding, mapping its location/description/severity/fix onto the issue. If Jira can't be reached, tell the user and stop — don't fabricate ticket URLs.
- After each ticket is created, write its URL into that finding's **Jira** column in `_docs/tech-debt-audit.md`, so the doc links the roadmap to the tracker.

---

## Quick reference

| Phase | Output | Gated? |
|-------|--------|--------|
| 1 Scope | mental model of the stack | no |
| 2 Detect | list of actionable findings | no |
| 3 Reconcile | updated `_docs/tech-debt-audit.md` | no |
| 4 Jira | tickets + URLs in the doc | **yes — explicit approval** |

Reference files (read when you reach the relevant phase):
- `references/criteria.md` — the debt criteria catalog (category + severity guidance)
- `references/report-format.md` — `_docs/tech-debt-audit.md` template and dedup procedure
- `references/jira-integration.md` — optional Jira ticket workflow
