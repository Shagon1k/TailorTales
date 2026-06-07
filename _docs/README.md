# TailorTales Documentation

These are the **durable docs** — the current source of truth for how the system works. Keep
them accurate as the code changes.

## I want to…

| Goal                                        | Read                                                                       |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| Run the stack locally / make a first change | [guides/getting-started.md](guides/getting-started.md)                     |
| Get credentials for external services       | [guides/external-services.md](guides/external-services.md)                 |
| Look up every env variable                  | [guides/environment-variables.md](guides/environment-variables.md)         |
| Deploy to production                        | [guides/deployment.md](guides/deployment.md)                               |
| Run, write, and structure tests             | [guides/testing.md](guides/testing.md)                                     |
| Recover from a stuck story or outage        | [guides/runbook.md](guides/runbook.md)                                     |
| Understand the system at a high level       | [architecture/README.md](architecture/README.md)                           |
| Understand how auth works                   | [architecture/auth.md](architecture/auth.md)                               |
| Understand how a story gets generated       | [architecture/generation-pipeline.md](architecture/generation-pipeline.md) |
| Know the DB entities and relationships      | [architecture/data-model.md](architecture/data-model.md)                   |
| Call or extend the HTTP API                 | [api/README.md](api/README.md)                                             |
| Know _why_ a design choice was made         | [decisions/](decisions/)                                                   |

## Conventions

- Docs link to code with **repo-relative paths** so they survive moves better than line
  numbers.
- When code and a doc disagree, **code wins** — fix the doc.
