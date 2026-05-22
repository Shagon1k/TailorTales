# Backend

## Structure

- Feature modules go in `src/modules/`. Infrastructure (`config/`, `prisma/`, `generated/`, `scripts/`) stays at `src/` root.

## Ownership & authorization

- Enforce at service level via `where: { id, userId }`. Return `NotFoundException` on mismatch — not `ForbiddenException` (avoids leaking resource existence).

## DTOs

- `@nestjs/mapped-types` is not installed. Write `UpdateDto` fields manually with `@IsOptional()`.
- Extract business-rule constants to `<module>.constants.ts`. Derived values (e.g. `MAX_AGE_MS`) stay local, computed from the exported constant.
