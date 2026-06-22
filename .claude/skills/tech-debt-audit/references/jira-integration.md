# Optional Jira Ticket Creation

This workflow is **strictly opt-in**. It runs only after the user explicitly approves creating tickets. If the user didn't ask for tickets, declined, or gave no clear yes — do nothing here and consider the skill complete with the doc updated.

Creating tickets is an outward-facing, hard-to-reverse action (a ticket notifies people and clutters a board). So the bar is explicit approval, and the user picks exactly which findings become tickets.

This file covers only what's specific to turning tech-debt findings into tickets — the selection, the finding-to-ticket mapping, and writing links back into the roadmap. How tickets actually reach Jira (credentials, API, templates) is outside this skill's concern. If Jira can't be reached, report that and stop — never fabricate ticket keys or links.

## Step 1 — Ask, once, clearly

After `_docs/tech-debt-audit.md` is updated, ask whether they want Jira tickets. Make the default path "no" — e.g.:

> "The roadmap is updated. Want me to create Jira tickets for any of these? If so, which — all High-severity, a specific list of IDs, or none?"

If the answer is no / silence / "maybe later" → stop. Don't ask repeatedly.

## Step 2 — Let the user choose the findings

Take the user's selection (e.g. "all High", "H1, H2, M3"). If they said "yes" without specifying, propose a sensible default — typically the High-severity findings — and confirm the list before creating anything. Show the list you're about to file so there are no surprises.

## Step 3 — Map each finding onto a ticket

For each selected finding, create one issue with this tech-debt-specific mapping:

- **Summary**: a concise title — `[<severity>][<category>] <short description>`.
- **Description**: the location, the full description (why it's debt), and the suggested fix. Include the `_docs/tech-debt-audit.md` ID (e.g. `H1`) so the ticket and roadmap cross-reference.
- **Issue type**: `Task` (or the project's debt/tech-debt type if one exists). If unsure, use `Task`.
- Apply a `tech-debt` label if supported.

Create them one at a time. If a creation fails, report it and continue with the rest rather than aborting everything.

## Step 4 — Write the links back into the doc

For each created ticket, update that finding's **Jira** column in `_docs/tech-debt-audit.md` to a markdown link pointing at the new issue. This is what ties the roadmap to the tracker — don't skip it.

Then summarize for the user: which findings got tickets, with their keys/links, and any that failed.

## Guardrails

- Approval is per-run, not standing. Don't assume a previous "yes" carries to a later audit.
- Don't create duplicate tickets for a finding that already has a link in its Jira column — if a finding is already linked, skip it (or ask) rather than filing a second ticket.
- Only the findings the user selected get tickets. Don't quietly file the rest.
