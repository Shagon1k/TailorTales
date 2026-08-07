# TailorTales Documentation

These are the **durable docs** — the current source of truth for how the system works. Keep
them accurate as the code changes.

Active and deferred delivery scope is tracked only in
[GitHub Project 2](https://github.com/users/Shagon1k/projects/2). The original phase plan
and design-review record are preserved in [`archive/`](archive/) for history, not planning.

## I want to…

| Goal                                                                      | Read                                                                       |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Run the stack locally / make a first change                               | [guides/getting-started.md](guides/getting-started.md)                     |
| Get credentials for external services (OAuth, OpenRouter, Resend, Paddle) | [guides/external-services.md](guides/external-services.md)                 |
| Look up every env variable                                                | [guides/environment-variables.md](guides/environment-variables.md)         |
| Deploy to production                                                      | [guides/deployment.md](guides/deployment.md)                               |
| Run, write, and structure tests                                           | [guides/testing.md](guides/testing.md)                                     |
| Recover from a stuck story, webhook failure, or outage                    | [guides/runbook.md](guides/runbook.md)                                     |
| Monitor logs and diagnose failures                                        | [guides/monitoring.md](guides/monitoring.md)                               |
| Understand the backup and restore strategy                                | [guides/backup-strategy.md](guides/backup-strategy.md)                     |
| Review GDPR compliance before launch                                      | [guides/gdpr-launch-checklist.md](guides/gdpr-launch-checklist.md)         |
| Respond to a suspected personal-data breach                               | [guides/breach-response.md](guides/breach-response.md)                     |
| Understand the system at a high level                                     | [architecture/README.md](architecture/README.md)                           |
| See key user flows as sequence diagrams                                   | [architecture/user-flows.md](architecture/user-flows.md)                   |
| Understand how auth works                                                 | [architecture/auth.md](architecture/auth.md)                               |
| Understand how a story gets generated (and regenerated)                   | [architecture/generation-pipeline.md](architecture/generation-pipeline.md) |
| Know the DB entities and relationships                                    | [architecture/data-model.md](architecture/data-model.md)                   |
| Call or extend the HTTP API                                               | [api/README.md](api/README.md)                                             |
| Know _why_ a design choice was made                                       | [decisions/](decisions/)                                                   |
| Read historical planning and design artifacts                             | [archive/](archive/)                                                       |

## Conventions

- Docs link to code with **repo-relative paths** so they survive moves better than line
  numbers.
- When code and a doc disagree, **code wins** — fix the doc.
