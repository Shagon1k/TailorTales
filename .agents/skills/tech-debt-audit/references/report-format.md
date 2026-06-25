# `_docs/tech-debt-audit.md` — Format & Reconciliation

This file is the durable artifact of the skill. It is a **roadmap**, not a report: it lives across many audit runs, developers act on it, and they mark items done or delete them. Treat it with the care you'd give a tracked source file.

## Document template

Create `_docs/tech-debt-audit.md` with this exact structure when it doesn't exist. When it does, conform new content to it.

```markdown
# Technical Debt Roadmap

> Maintained by the `tech-debt-audit` skill. Findings are grouped by severity and
> tagged by category. Developers: update the **Status** column as you work
> (`Open` → `In progress` → `Done`), or delete a row once it's resolved.
> The **Jira** column links to a tracker ticket when one has been created.

_Last audit: YYYY-MM-DD_

## Summary

| Severity | Open | In progress | Done |
| -------- | ---- | ----------- | ---- |
| High     | 0    | 0           | 0    |
| Medium   | 0    | 0           | 0    |
| Low      | 0    | 0           | 0    |

## High

| ID  | Category       | Location          | Description                   | Suggested Fix                | Status | Jira |
| --- | -------------- | ----------------- | ----------------------------- | ---------------------------- | ------ | ---- |
| H1  | error-handling | `src/foo.java:42` | What it is and why it's debt. | The specific change to make. | Open   | —    |

## Medium

| ID  | Category    | Location        | Description | Suggested Fix | Status | Jira |
| --- | ----------- | --------------- | ----------- | ------------- | ------ | ---- |
| M1  | performance | `src/bar.js:88` | …           | …             | Open   | —    |

## Low

| ID  | Category        | Location        | Description | Suggested Fix | Status | Jira |
| --- | --------------- | --------------- | ----------- | ------------- | ------ | ---- |
| L1  | maintainability | `src/baz.py:10` | …           | …             | Open   | —    |
```

### Conventions

- **ID** — stable handle (`H1`, `M3`, `L2`). Assign sequentially within each severity. Once assigned, an ID stays with its finding across runs; don't renumber existing rows. New findings take the next free number in their section.
- **Location** — `path:line` or `path:start–end`, in backticks. For project-wide issues, use the repo-root-relative path of the most representative file (or the manifest) and note the scope in the description.
- **Description / Suggested Fix** — keep to one or two sentences each; enough to act without re-deriving the audit. Escape pipe characters (`\|`) inside cells.
- **Status** — `Open`, `In progress`, `Done`, or `Won't fix`. Developer-owned.
- **Jira** — `—` until a ticket exists; then a markdown link `[KEY-123](url)`.
- **Last audit** — set to today's date on each run.
- Keep the **Summary** table counts in sync with the rows after every update.

## Reconciliation procedure (run every time)

The whole point is to **avoid duplication**. Re-running analysis must enrich the roadmap, not balloon it.

1. **Read the existing file first** (if present). Parse the current rows: their IDs, locations, descriptions, Status, and Jira links.
2. **For each new finding, look for a match** among existing rows. A match means _same underlying issue at the same place_ — judge by location plus the nature of the problem, not exact wording. A finding whose location shifted by a few lines (because the file changed) but is clearly the same issue is still a match.
3. **If it matches an existing row:**
    - Do **not** add a new row.
    - You may refine the Description/Suggested Fix if your new analysis is clearer or the code moved — but **preserve the Status and Jira columns verbatim**. Those are developer-owned.
    - If the existing row is `Done` or `Won't fix`, leave it alone unless the issue has genuinely reappeared in the code; if it has, note the recurrence rather than silently flipping it back to Open.
4. **If it's new**, add a row to the appropriate severity section with the next free ID and `Status: Open`, `Jira: —`.
5. **Don't delete rows that you no longer detect** unless you've confirmed the underlying code is gone/fixed. A developer may have context you don't. If a previously-listed issue appears resolved in the code, you may mark it `Done` and say so in your summary, but prefer to surface it to the user rather than deleting silently.
6. **Recompute the Summary table** and update `_Last audit_`.
7. **Report to the user**: counts of new vs. already-tracked findings, and the severity breakdown. Example: "Added 4 new findings (1 High, 2 Medium, 1 Low); 3 already tracked; 1 previously-listed item now appears fixed (marked Done)."

## Editing mechanics

- This is a Markdown file you edit with normal file tools. When the file already exists, prefer targeted edits (add rows, update specific cells) over rewriting the whole file, so you don't disturb developer edits or git history more than necessary.
- If the existing file has drifted from this template (hand-edited headings, extra columns), adapt to it gracefully: keep the developer's structure, add your columns/rows where they fit, and don't strip information.
