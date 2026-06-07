# API Reference

> Every HTTP endpoint, read from the controllers (the source of truth).
> Backend base URL: `http://localhost:3001` (no global path prefix). The frontend reaches it
> via `NEXT_PUBLIC_BACKEND_URL`.

## Conventions

- **Auth is a JWT in an httpOnly cookie** (`access_token`), set by the Google OAuth
  callback and sent automatically by the browser. Every route requires it **except** those
  marked **public** below — `JwtAuthGuard` is global (`APP_GUARD`); public routes opt out
  with `@Public()`. See [auth.md](../architecture/auth.md).
- **Admin** routes additionally require `role = ADMIN` (`AdminGuard`).
- **Ownership** is enforced in services with `where: { id, userId }`; a mismatch returns
  **404**, never 403 — the API never reveals whether another user's resource exists.
- **Request bodies are JSON**, validated by a global `ValidationPipe({ whitelist: true })`
  (unknown fields are stripped). Invalid input → **400** with a `message` array.
- **Error shape** is uniform (`AllExceptionsFilter`):
    ```json
    { "statusCode": 404, "message": "Story <id> not found" }
    ```
    `message` is a string, or a string array for validation errors. 4xx are not logged; 5xx
    return a generic message and log a stack trace server-side.

| Status | Meaning in this API                                                   |
| ------ | --------------------------------------------------------------------- |
| 202    | Accepted — async work started (`generate`) or queued (`contact`)      |
| 204    | No content — successful `DELETE`                                      |
| 400    | DTO validation failed                                                 |
| 401    | Missing/invalid/expired auth cookie                                   |
| 403    | Authenticated but not ADMIN                                           |
| 404    | Not found _or_ not owned by the caller                                |
| 409    | Conflict — e.g. a generation is already active, or story not in DRAFT |

## Auth flow

A browser-based client authenticates once via Google OAuth and the cookie is sent automatically
from that point on. The sequence:

```
1. Browser → GET /auth/google
              ↳ backend redirects to Google's OAuth consent screen

2. Google  → GET /auth/google/callback?code=...
              ↳ backend exchanges code, creates/updates the User row,
                signs a JWT, sets it in the `access_token` httpOnly cookie,
                redirects browser → FRONTEND_URL/library

3. All subsequent requests automatically include the cookie.
   The `JwtAuthGuard` (global) validates it and attaches the User.

4. POST /auth/logout → cookie is cleared (JWT stays valid until expiry — see auth.md)
```

**Testing from the command line:** use a browser's DevTools to copy the `access_token` cookie
value and pass it manually:

```bash
curl http://localhost:3001/me \
  -H "Cookie: access_token=<copied-jwt>"
```

## Endpoints

### Health

| Method | Path      | Auth   | Response           |
| ------ | --------- | ------ | ------------------ |
| GET    | `/health` | public | `{ status: "ok" }` |

### Auth — `/auth`

| Method | Path                    | Auth   | Notes                                                                                                       |
| ------ | ----------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| GET    | `/auth/google`          | public | Redirects to Google's consent screen (Passport).                                                            |
| GET    | `/auth/google/callback` | public | Issues JWT, sets the `access_token` cookie, redirects to `FRONTEND_URL/library`.                            |
| POST   | `/auth/logout`          | user   | Clears the cookie, returns 200. (Client-side only — JWT stays valid until expiry; see ROADMAP Deferred #1.) |

### Current user — `/me`

| Method | Path  | Auth | Body       | Response                             |
| ------ | ----- | ---- | ---------- | ------------------------------------ |
| GET    | `/me` | user | —          | The current `User`.                  |
| PATCH  | `/me` | user | `{ name }` | Updated `User`. `name`: 1–100 chars. |

### Children — `/children`

| Method | Path            | Auth | Body             | Response                    |
| ------ | --------------- | ---- | ---------------- | --------------------------- |
| GET    | `/children`     | user | —                | `Child[]` (owner's).        |
| GET    | `/children/:id` | user | —                | `Child` (404 if not owned). |
| POST   | `/children`     | user | `CreateChildDto` | `Child`.                    |
| PATCH  | `/children/:id` | user | `UpdateChildDto` | `Child`.                    |
| DELETE | `/children/:id` | user | —                | 204.                        |

### Art styles — `/art-styles`

| Method | Path          | Auth | Response                             |
| ------ | ------------- | ---- | ------------------------------------ |
| GET    | `/art-styles` | user | `ArtStyle[]` — active only, ordered. |

### Stories — `/stories`

| Method | Path                    | Auth   | Body             | Response                                                                                                                                                                           |
| ------ | ----------------------- | ------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/stories/public`       | public | —                | `IStorySummary[]` — stories where `isPublic = true`. **No endpoint sets `isPublic` at MVP** — this will always return an empty list until the rating opt-in flow ships (Post-MVP). |
| GET    | `/stories/config`       | user   | —                | Allowed page counts, question length bounds, the 6 suggestion chips.                                                                                                               |
| GET    | `/stories`              | user   | —                | `IStorySummary[]` — caller's stories.                                                                                                                                              |
| GET    | `/stories/active-job`   | user   | —                | `{ jobId, storyId }` or `null`.                                                                                                                                                    |
| GET    | `/stories/:id`          | user   | —                | `IStoryDetail` (pages, signed URLs).                                                                                                                                               |
| GET    | `/stories/:id/progress` | user   | —                | **SSE** stream (see below).                                                                                                                                                        |
| POST   | `/stories`              | user   | `CreateStoryDto` | Created `Story` (status `DRAFT`).                                                                                                                                                  |
| POST   | `/stories/:id/generate` | user   | —                | **202** `{ jobId, storyId }`. 409 if a generation is active or the story isn't `DRAFT`.                                                                                            |
| DELETE | `/stories/:id`          | user   | —                | 204.                                                                                                                                                                               |

> Route order matters: `public`, `config`, and `active-job` are declared before `:id` so
> they aren't captured as an id param.

**SSE — `GET /stories/:id/progress`** streams `MessageEvent`s whose `data` is one of:

```
{ type: "snapshot",      stage, status, completedPages, totalPages, error }
{ type: "page_complete", pageOrder, ...snapshot }
{ type: "completed",     ...snapshot }
{ type: "failed",        ...snapshot }
```

See [generation-pipeline.md → Real-time progress](../architecture/generation-pipeline.md#real-time-progress-sse).

### Story blueprints — `/story-blueprints`

| Method | Path                    | Auth  | Body                      | Response                    |
| ------ | ----------------------- | ----- | ------------------------- | --------------------------- |
| GET    | `/story-blueprints`     | user  | —                         | `IStoryBlueprintSummary[]`. |
| GET    | `/story-blueprints/:id` | user  | —                         | `IStoryBlueprintDetail`.    |
| POST   | `/story-blueprints`     | admin | `CreateStoryBlueprintDto` | `StoryBlueprint`.           |
| PATCH  | `/story-blueprints/:id` | admin | `UpdateStoryBlueprintDto` | `IStoryBlueprintDetail`.    |
| DELETE | `/story-blueprints/:id` | admin | —                         | 204.                        |

### Notifications — `/notifications`

| Method | Path                          | Auth | Response     |
| ------ | ----------------------------- | ---- | ------------ |
| GET    | `/notifications/unread-count` | user | `{ count }`. |
| PATCH  | `/notifications/read-all`     | user | 200.         |

> These two are a verification shim (the header polls `unread-count`). The full notifications
> module — list, mark-one-read, preferences, and real-time (SSE) delivery — is planned (see
> ROADMAP).

### Contact — `/contact`

| Method | Path       | Auth   | Body         | Response                                                                           |
| ------ | ---------- | ------ | ------------ | ---------------------------------------------------------------------------------- |
| POST   | `/contact` | public | `ContactDto` | **202**. Routes the message to `CONTACT_INBOX_EMAIL` with the sender as `replyTo`. |

## Request body shapes

DTOs are validated by `class-validator`. Constraints come from each module's `*.constants.ts`.

**`CreateChildDto`** / **`UpdateChildDto`** (update = all fields optional)

```
name        string, 1–50 chars                 (required)
birthdate   ISO date string, within last 18yr   (required)
gender      "MALE" | "FEMALE"                    (required)
interests   string[], ≤20 items, ≤50 chars each (optional)
avatarUrl   URL                                  (optional, reserved for v2 photo)
```

**`CreateStoryDto`**

```
childId     string                               (required)
type        "BOOK" | "COMIC"                     (required — COMIC modelled, generation deferred)
question    string, 3–500 chars                  (required)
pageCount   one of 5 | 8 | 12 | 16 | 20          (required)
artStyleId  string                               (required)
language    "EN" | "RU"                          (required)
```

**`CreateStoryBlueprintDto`** / **`UpdateStoryBlueprintDto`** (update = all optional, admin only)

```
name          string, 1–100 chars                 (required)
description   string, 1–500 chars                 (required)
type          "BOOK" | "COMIC"                    (required)
systemPrompt  string, 1–5000 chars                (required)
```

**`ContactDto`**

```
name     string, 1–80 chars      (required)
email    valid email             (required)
message  string, 10–5000 chars   (required)
```

**`UpdateUserDto`** — `{ name }`, 1–100 chars.

## Response shapes

**`IStorySummary`** — returned by list endpoints (`GET /stories`, `GET /stories/public`):

```
id, userId, childId, artStyleId, blueprintId (nullable)
type, status, question, pageCount, language
title (nullable), styleAnchor (nullable), isPublic
createdAt, updatedAt
child: { id, name, birthdate }
artStyle: { id, name, slug, thumbnailUrl }
coverImageUrl (nullable, pre-signed)
```

**`IStoryDetail`** — extends `IStorySummary`, returned by `GET /stories/:id`:

```
+ pages: [{ id, storyId, order, chapterTitle, text, layout, illustrations: [{ url, position }] }]
+ pdfUrl (nullable, pre-signed)
```

> `coverImageUrl` and `pdfUrl` are computed from the stored S3 key at serve time after an
> ownership check. They are never stored in the database.
