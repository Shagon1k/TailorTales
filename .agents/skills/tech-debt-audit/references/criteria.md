# Technical Debt Criteria Catalog

A language-agnostic catalog of what to look for. Each criterion lists its **category** and a **typical severity** — a starting point, not a verdict. Always calibrate severity to the actual impact in the codebase you're analyzing (see SKILL.md, Phase 2).

The catalog is a checklist to make detection thorough, not a cage. If you find real debt that isn't listed, include it with a sensible category and severity.

## How to use this file

For each criterion, ask: _does this codebase exhibit it, and where?_ When it does, record an actionable finding (location + description + category + severity + suggested fix). Group related instances rather than filing one row per line when they share a single fix.

---

## Error handling

| Criterion                                 | Typical severity | What it looks like                                                                                                                                                                                                    |
| ----------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unchecked nullable / optional results     | High             | A lookup that can return "absent" is used directly (e.g. `.get()` on an empty optional, dereferencing a possibly-null value), so a missing record throws an unhandled runtime error instead of a controlled response. |
| No centralized error handling             | Medium           | Exceptions propagate with no global handler/middleware; failures surface as generic 500s, stack traces, or crashes instead of structured, safe responses.                                                             |
| Internal error details exposed to clients | High             | Raw stack traces or internal exception messages returned in API responses, leaking implementation detail and aiding attackers.                                                                                        |
| Swallowed errors                          | Medium           | Caught exceptions ignored or logged-and-continued, hiding failures and producing corrupt state downstream.                                                                                                            |
| No timeout/retry on external calls        | Medium           | Outbound HTTP/service calls lack timeouts and retry/backoff, so a slow dependency cascades into the whole system.                                                                                                     |

## Security

| Criterion                                  | Typical severity | What it looks like                                                                                              |
| ------------------------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------- |
| Secrets committed to source control        | High             | Passwords, API keys, tokens in plaintext config tracked by VCS.                                                 |
| Injection vulnerabilities                  | High             | User-controlled input concatenated into queries/commands without parameterization or escaping.                  |
| Wildcard / permissive CORS                 | Medium           | All origins allowed unconditionally across endpoints, removing cross-origin protections.                        |
| Missing authn/authz on sensitive endpoints | High             | Protected operations reachable without identity or permission checks.                                           |
| Sensitive data written to logs             | Medium           | PII, tokens, or credentials emitted to logs.                                                                    |
| Missing input validation at API boundaries | High             | External input accepted without constraints, letting malformed/oversized data reach business logic and storage. |

## Performance

| Criterion                          | Typical severity | What it looks like                                                                               |
| ---------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| Unbounded list queries             | Medium           | Endpoints return entire collections with no pagination/limit; memory and latency grow with data. |
| N+1 query pattern                  | Medium           | A query per item in a loop instead of a single batched/joined query.                             |
| Missing indexes on queried columns | Medium           | Columns used in filters/joins lack indexes, causing full scans at scale.                         |
| Repeated expensive work            | Low              | Recomputation or refetching of stable data that could be cached or hoisted.                      |

## Maintainability

| Criterion                                            | Typical severity | What it looks like                                                                                                                      |
| ---------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Persistence model used as API contract               | Medium           | Storage entities serialized straight to clients (no DTO/response layer), so schema changes break the API and internals leak.            |
| Business logic in the wrong layer                    | Medium           | Domain rules/validation in controllers, routes, or views instead of a service/domain layer.                                             |
| Magic values                                         | Low              | Domain states/flags as inline strings/numbers instead of enums or named constants — typos undetectable, refactors unsafe.               |
| Structural duplication                               | Low              | Logic or markup repeated across locations rather than extracted into a shared abstraction.                                              |
| Dead code                                            | Low              | Unused variables, imports, methods, or files.                                                                                           |
| Verbose boilerplate replaceable by language features | Low              | Hand-written constructors/getters/repetition where the language offers a native construct (records, data classes, destructuring, etc.). |
| Oversized units                                      | Low              | Functions/classes/files large enough that responsibilities blur and changes are risky.                                                  |

## Consistency

| Criterion                         | Typical severity | What it looks like                                                                                                     |
| --------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Inconsistent API response shape   | Medium           | Some endpoints wrap responses in an envelope, others return raw payloads; consumers must special-case each.            |
| Inconsistent naming conventions   | Low              | Identifiers mix casing/abbreviation/naming patterns with no consistent convention.                                     |
| Inconsistent async/error patterns | Low              | Mixed callbacks/promises/async styles, or mixed error-return vs throw conventions, making control flow hard to follow. |
| No API versioning strategy        | Medium           | Breaking changes shipped on existing endpoints with no version path for consumers.                                     |

## Configuration

| Criterion                             | Typical severity | What it looks like                                                                                           |
| ------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------ |
| Hardcoded environment-specific values | Medium           | URLs, hosts, thresholds, timeouts embedded in code instead of externalized config.                           |
| Outdated dependencies                 | Medium           | Runtime/framework/library versions behind current stable/LTS, accumulating unpatched CVEs and missing fixes. |
| Unused declared dependencies          | Low              | Packages in the manifest no longer referenced, inflating build size and attack surface.                      |
| Debug logging in production paths     | Low              | Verbose/diagnostic logging (including query/SQL echo) left enabled in production config or code.             |
| Missing schema/DB constraints         | Medium           | No uniqueness/nullability/referential constraints, allowing inconsistent data to persist silently.           |
| Risky auto-managed schema             | Medium           | Schema auto-update/auto-migrate enabled in environments where it can cause data loss or drift.               |

## Testing

| Criterion                         | Typical severity | What it looks like                                                                         |
| --------------------------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| Thin test coverage                | Medium           | Most services/handlers/integration paths have no automated tests; critical logic untested. |
| No linter / static analysis in CI | Low              | No automated quality/style gate enforced in the pipeline.                                  |
| Missing CI for tests              | Medium           | Tests exist but aren't run automatically on changes, so regressions slip through.          |
