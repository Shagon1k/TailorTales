---
audience: ai
---

# Sub-agent prompt efficiency

Loaded when spawning sub-agents. Each sub-agent starts with an empty
context window — its prompt _is_ its entire context. A fat prompt wastes tokens
multiplied by the number of agents spawned.

## The rule

**Include** what the agent cannot derive itself. **Exclude** what it can read or infer.

| Include                           | Exclude                                 |
| --------------------------------- | --------------------------------------- |
| Exact task in one sentence        | Prior conversation history              |
| Relevant file paths (let it read) | Full file contents it could read itself |
| Key decisions already made        | Raw tool output from your session       |
| Expected output format            | Background the task doesn't require     |
| Constraints / non-obvious context | Explanations of things it will discover |

## Structured output over freeform prose

When a sub-agent's result will be consumed by code or fed into another agent, request
structured output explicitly. It forces concise responses and eliminates parsing.

```
Return JSON only: {"findings": [{"file": "...", "line": N, "issue": "..."}]}
No preamble, no explanation.
```

Without this, agents produce verbose prose that pads token count and requires extraction.
Use freeform only when the result is for human reading.

## Before / after

### Before — 420 tokens, bloated

```
We've been investigating this Spring Boot codebase. It's Java 11, Maven, PostgreSQL.
The backend is in backend/src/main/java/com/brownevents/app/. We looked at the
controller and service layers earlier. The service layer calls repositories directly
in some places which might be a problem. Also the DataInitializer sets up sample data.
We tried to add pagination earlier but it had an issue with the sort parameter.
The conference endpoint is the one we care about most right now.

Please review the conference service for N+1 query problems and let me know what
you find. Include suggestions for how to fix them.
```

### After — 55 tokens, complete

```
Review `backend/src/main/java/com/brownevents/app/service/ConferenceService.java`
for N+1 query problems (Spring Data JPA project).
Return JSON: {"findings": [{"method": "...", "line": N, "issue": "...", "fix": "..."}]}
```

**Saved: ~365 tokens per agent. At 10 agents that is ~3,650 tokens.**

## Never invent

If the agent would need to guess a file path, API endpoint, symbol name, or any value it
cannot derive from what it was given — return `null` or `"UNKNOWN"` explicitly. Inventing
plausible-looking values produces tool calls that fail, which cost tokens to diagnose and
retry.

## Length target

One short context paragraph (if truly needed) + one task sentence + output format.
If you need more than three sentences of context, ask: is this actually necessary,
or is the agent discovering it anyway?

## Schema output for workflow agents

When using a workflow harness with a `schema` option, pass it — the agent is forced
to call a structured tool and retries on schema mismatch. No parsing, no extraction,
no "sorry I couldn't find the format" prose in results.

---

See also: [`search-and-read.md`](search-and-read.md) — efficient reading patterns for
what the sub-agent will read once spawned.
