# Backend

NestJS (TypeScript, ESM). Feature modules in `src/modules/`; a global `JwtAuthGuard` protects
every route unless it has `@Public()`. The generation pipeline (BullMQ) has its own
`src/modules/generation/CLAUDE.md` with the invariants to preserve there.

## Structure

- Feature modules go in `src/modules/`. Infrastructure (`config/`, `prisma/`, `generated/`, `scripts/`) stays at `src/` root.

## Request handling (global — don't reinvent per route)

- `ValidationPipe({ whitelist: true })` validates DTOs and strips unknown fields globally — don't re-validate in controllers.
- `AllExceptionsFilter` returns a uniform `{ statusCode, message }` (logs 5xx only). Throw Nest exceptions (`NotFoundException`, `ConflictException`, …); never hand-format error responses.

## Ownership & authorization

- Enforce at service level via `where: { id, userId }`. Return `NotFoundException` on mismatch — not `ForbiddenException` (avoids leaking resource existence).

## DTOs

- `@nestjs/mapped-types` is not installed. Write `UpdateDto` fields manually with `@IsOptional()`.
- Extract business-rule constants to `<module>.constants.ts`. Derived values (e.g. `MAX_AGE_MS`) stay local, computed from the exported constant.

## Storage

- The DB stores S3 **keys, never URLs** (`pdfKey`, `coverImageKey`, `Page.illustrations[].key`). Sign at serve time with `StorageService.getSignedUrl()` after an ownership check. Key patterns live in `storage.keys.ts` — add new ones there, don't build key strings inline.

## Tests / offline

- Tests and CI run with `USE_AI_STUBS=true` (+ `USE_EMAIL_STUBS=true`): `AI_CLIENT`/`EMAIL_CLIENT` resolve to stub clients, so the full pipeline runs offline with no API spend.
