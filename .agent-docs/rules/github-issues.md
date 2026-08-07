# GitHub Tasks and Issues

## Canonical Tracker

```yaml
repository: Shagon1k/TailorTales
project:
    owner: Shagon1k
    number: 2
    url: https://github.com/users/Shagon1k/projects/2
templates:
    bug: .github/ISSUE_TEMPLATE/bug.yml
    feature: .github/ISSUE_TEMPLATE/feature.yml
    tech_debt: .github/ISSUE_TEMPLATE/tech-debt.yml
    discovery: .github/ISSUE_TEMPLATE/discovery.yml
```

GitHub Issues in Project 2 are the only source of truth for active and deferred delivery
scope. `_docs/archive/ROADMAP.md` and `_docs/archive/DESIGN.md` are historical artifacts,
not operational inputs.

Issue type is encoded once in the title prefix supplied by the selected template
(`[Bug]`, `[Feature]`, `[Tech debt]`, or `[Discovery]`). Do not add labels that duplicate
that type. `human-control` remains a workflow label and is added only when the owner must
stay involved during development.

## Request Routing

```text
request explicitly says implement / fix / change code
  -> perform the code task

request says create / add a task, ticket, or issue
  -> create a GitHub issue and add it to Project 2
  -> do not edit code or archived planning files

request explicitly asks to correct historical roadmap/design information
  -> edit the relevant archive only; do not create active scope implicitly

request defers work until a stated condition is met
  -> create or update an issue and set Project status to Deferred

ambiguous "add a task to the project"
  -> default to a GitHub issue in Project 2
```

## Project Status Semantics

```text
Deferred
  -> excluded from autonomous selection
  -> must state an observable activation trigger
  -> move to Backlog only after the trigger is evidenced

Backlog
  -> ready to be selected
  -> autonomous AI may select only issues without human-control

In progress
  -> human-led or human-supervised implementation

[AI] In Progress
  -> autonomous AI implementation is active

[AI] Human Review
  -> autonomous implementation produced a PR and awaits owner review

Done
  -> acceptance criteria are satisfied and delivery is complete
```

## Issue Creation

1. Search open and closed issues for a duplicate before creating anything.
2. Classify the work:
    - observed behavior differs from the product promise -> `bug.yml`
    - user-facing capability or product improvement -> `feature.yml`
    - maintainability, reliability, or operational cost -> `tech-debt.yml`
    - evidence-backed product, provider, design, or technical decision before implementation -> `discovery.yml`
3. Read the selected template and preserve its title prefix, required sections, and
   acceptance-criteria format. API-created issues must mirror the form in Markdown because
   creating an issue through an API does not submit the Issue Form itself. Do not add a
   type label; add `human-control` only when its workflow semantics apply.
4. Keep the issue outcome-focused and small enough for one focused pull request when
   practical. Acceptance criteria must be observable.
5. Create the issue in `Shagon1k/TailorTales`.
6. Ensure the issue is in `Shagon1k` Project 2. Prefer the project's auto-add workflow; if it
   is unavailable, add the issue explicitly with a GitHub Project-capable tool.
7. Set the Project status to `Deferred` when its activation trigger is not yet met;
   otherwise leave it in `Backlog`.
8. Report the issue URL, selected template, any workflow labels, status, and confirmed project
   membership.

Do not claim completion if project membership cannot be verified. State exactly which
permission, authentication, or tool capability is missing.
