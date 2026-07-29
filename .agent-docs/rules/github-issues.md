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
```

GitHub Issues in Project 2 are the canonical task tracker. `ROADMAP.md` remains the
implementation guide for phase scope, decisions, and progress; it is not the default task
inbox.

## Request Routing

```text
request explicitly says implement / fix / change code
  -> perform the code task

request says create / add a task, ticket, or issue
  -> create a GitHub issue and add it to Project 2
  -> do not edit code or ROADMAP.md

request explicitly says update roadmap / phase scope / deferred decision
  -> follow the ROADMAP.md documentation rules

ambiguous "add a task to the project"
  -> default to a GitHub issue in Project 2
```

## Issue Creation

1. Search open and closed issues for a duplicate before creating anything.
2. Classify the work:
    - observed behavior differs from the product promise -> `bug.yml`
    - user-facing capability or product improvement -> `feature.yml`
    - maintainability, reliability, or operational cost -> `tech-debt.yml`
3. Read the selected template and preserve its title prefix, labels, required sections, and
   acceptance-criteria format. API-created issues must mirror the form in Markdown because
   creating an issue through an API does not submit the Issue Form itself.
4. Keep the issue outcome-focused and small enough for one focused pull request when
   practical. Acceptance criteria must be observable.
5. Create the issue in `Shagon1k/TailorTales`.
6. Ensure the issue is in `Shagon1k` Project 2. Prefer the project's auto-add workflow; if it
   is unavailable, add the issue explicitly with a GitHub Project-capable tool.
7. Report the issue URL, selected template, labels, and confirmed project membership.

Do not claim completion if project membership cannot be verified. State exactly which
permission, authentication, or tool capability is missing.
