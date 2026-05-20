# CurioCraft

## Process
- Analyze impact before writing code.
- Ask when unclear — group all questions in one message, don't ask one-by-one.
- For changes touching >5 files or ~100+ LOC: outline the plan -> get approval -> then deliver incrementally.
- Verify before declaring done — run it, test it, or walk a checklist. Don't ship unverified changes.

## Code
- Write minimal but readable code. The codebase should remain easy to follow for any developer picking it up.
- YAGNI — write only what the current task needs. Exceptions require explicit approval.
- Match surrounding code conventions when no explicit styleguide exists.
- NEVER swallow errors or hide failures behind silent fallbacks. Let them surface or log them explicitly.
- Remove unused code and refactor when needed — but ONLY with developer approval. Refactoring means structural changes only, with no behavior changes, and always in a separate commit.
- Stay in scope. Flag unrelated issues to the developer instead of fixing them inline.

## Safety
- NEVER hardcode secrets — API keys, tokens, and credentials go in environment variables.
- NEVER add a new dependency without developer approval.

## Git
- One logical change per commit with a clear, descriptive message.
- Refactors require approval, go in a separate commit, and must not change behavior.
