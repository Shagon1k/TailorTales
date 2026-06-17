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

## Real-time (SSE)

- Push with `@Sse()` returning `Observable<MessageEvent>` (see `StoriesModule` progress and `NotificationsService` unread-count). For per-user fan-out, hold an in-memory `Map<userId, Subject>`: create on first subscribe, `subject.next(...)` on writes, drop when the last connection closes (`!subject.observed`).
- In-memory by design — pair with a REST fallback for first paint (`EventSource` auto-reconnects). A missed push only delays until the next load. Needs shared pub/sub (e.g. Redis) only if the backend runs multi-instance.

## Storage

- The DB stores S3 **keys, never URLs** (`pdfKey`, `coverImageKey`, `Page.illustrations[].key`). Sign at serve time with `StorageService.getSignedUrl()` after an ownership check. Key patterns live in `storage.keys.ts` — add new ones there, don't build key strings inline.

## Tests / offline

- Tests and CI run with `USE_AI_STUBS=true` (+ `USE_EMAIL_STUBS=true`): `AI_CLIENT`/`EMAIL_CLIENT` resolve to stub clients, so the full pipeline runs offline with no API spend.

## Symbol-token swap pattern

- `AI_CLIENT`, `EMAIL_CLIENT`, and `PADDLE_CLIENT` are NestJS Symbol injection tokens. Each module provides either the real or stub implementation based on the corresponding `USE_*_STUBS` env flag. New external integrations must follow this same pattern — never instantiate third-party clients inline.

## Error codes

- Services throw string keys (e.g. `'errors.ratings.storyNotCompleted'`) or `{ code: string, params?: object }` objects — never prose error messages. `AllExceptionsFilter` resolves these via `error-translations.ts` and returns the localised message to the client.

## S3 deletion scope

- Entity-level `remove()` services (stories, children) do **not** delete S3 objects. Only `DELETE /me` (account deletion) does full S3 cleanup by prefix-listing all keys for the user. The retention cron handles scheduled expiry. Do not add ad-hoc S3 deletes in other flows without explicit approval.
