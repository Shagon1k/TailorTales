---
paths:
    - '**/*.prisma'
    - '**/migrations/**/*.sql'
---

# Prisma Rules

## Schema conventions

- **Enum values are SCREAMING_SNAKE_CASE** — `PENDING`, `STORY_COMPLETED`, `IN_PROGRESS`. Never lowercase or mixed-case. All existing enums follow this: `DRAFT`, `QUEUED`, `BOOK`, `USER`, etc.
- **Model names are PascalCase** (Prisma default): `Story`, `StoryBlueprint`, `Job`.
- **Field names are camelCase** (Prisma default): `createdAt`, `artStyleId`, `coverImageKey`.
- **Relation fields** — use the model name camelCase for singular (`story Story`), pluralised for arrays (`pages Page[]`).

## Migrations

- Name migrations descriptively: `phase_N_<what_changed>` during active development, `add_<entity>` or `drop_<column>` for standalone changes.
- Never edit an already-applied migration file — create a new one.
- `prisma migrate dev` requires an interactive TTY. When running non-interactively (scripts, CI), use `migrate deploy` for applying existing migrations.
- Hand-write migration SQL when `migrate dev` blocks on destructive-change warnings in a non-TTY context (e.g. enum value renames on empty tables). Apply via `pg` client or `psql`, then register with `prisma migrate resolve --applied <migration_name>`.
