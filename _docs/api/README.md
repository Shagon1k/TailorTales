# API Reference

> Every HTTP endpoint, read from the controllers (the source of truth).
> Backend base URL: `http://localhost:3001` (no global path prefix). The frontend reaches it
> via `NEXT_PUBLIC_BACKEND_URL`.

## Conventions

- **Auth is a JWT in an httpOnly cookie** (`access_token`), set by the Google OAuth
  callback and sent automatically by the browser. Every route requires it **except** those
  marked **public** — `JwtAuthGuard` is global (`APP_GUARD`); public routes opt out with
  `@Public()`. See [auth.md](../architecture/auth.md).
- **Admin** routes require `role = ADMIN` or `SUPER_ADMIN` (enforced by `AdminGuard`).
- **Ownership** is enforced in services with `where: { id, userId }`; a mismatch returns
  **404**, never 403 — the API never reveals whether another user's resource exists.
- **Request bodies are JSON**, validated by a global `ValidationPipe({ whitelist: true })`
  (unknown fields are stripped). Invalid input → **400** with a `message` array.
- **Error shape** is uniform (`AllExceptionsFilter`):
    ```json
    { "statusCode": 404, "message": "Story <id> not found" }
    ```
    `message` is a string or a string array for validation errors. 4xx are not logged; 5xx
    return a generic message and log a stack trace server-side. Error messages are translated
    based on the request's `Accept-Language` header (EN / DE / RU supported).

| Status | Meaning in this API                                                   |
| ------ | --------------------------------------------------------------------- |
| 202    | Accepted — async work started (`generate`) or queued (`contact`)      |
| 204    | No content — successful `DELETE`                                      |
| 400    | DTO validation failed                                                 |
| 401    | Missing / invalid / expired auth cookie                               |
| 402    | Quota exceeded (page credits or regeneration limit)                   |
| 403    | Authenticated but not ADMIN                                           |
| 404    | Not found _or_ not owned by the caller                                |
| 409    | Conflict — e.g. a generation is already active, or story not in DRAFT |

## Endpoints

### Health

| Method | Path      | Auth   | Response           |
| ------ | --------- | ------ | ------------------ |
| GET    | `/health` | public | `{ status: "ok" }` |

---

### Auth — `/auth`

| Method | Path                    | Auth   | Notes                                                                                                                          |
| ------ | ----------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/auth/google`          | public | Redirects to Google's consent screen (Passport).                                                                               |
| GET    | `/auth/google/callback` | public | Issues JWT, sets the `access_token` cookie, redirects to `FRONTEND_URL/[locale]/library`.                                      |
| POST   | `/auth/logout`          | user   | Clears the cookie, returns 200. JWT stays valid until expiry — see [auth.md](../architecture/auth.md#logout-and-jwt-lifetime). |

---

### Current user — `/me`

| Method | Path         | Auth | Body       | Response                                                                                                                                                                                                        |
| ------ | ------------ | ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/me`        | user | —          | The current `User`.                                                                                                                                                                                             |
| PATCH  | `/me`        | user | `{ name }` | Updated `User`. `name`: 1–100 chars.                                                                                                                                                                            |
| GET    | `/me/export` | user | —          | GDPR data export: profile, children, characters, stories + pages, ratings, notifications, subscription state, and signed links to any retained files.                                                           |
| DELETE | `/me`        | user | —          | Cancel active Paddle subscription, delete all owned S3 objects, cascade-delete all DB rows. **Irreversible.** Blocked while a paid subscription is active (user must cancel first and wait for the period end). |

---

### Children — `/children`

| Method | Path            | Auth | Body             | Response                                                  |
| ------ | --------------- | ---- | ---------------- | --------------------------------------------------------- |
| GET    | `/children`     | user | —                | `Child[]` (owner's).                                      |
| GET    | `/children/:id` | user | —                | `Child` (404 if not owned).                               |
| POST   | `/children`     | user | `CreateChildDto` | `Child`. 403 if `childrenLimit` reached for current tier. |
| PATCH  | `/children/:id` | user | `UpdateChildDto` | `Child`.                                                  |
| DELETE | `/children/:id` | user | —                | 204. Cascades to the child's Stories, Pages, and Jobs.    |

---

### Characters — `/characters`

| Method | Path                      | Auth | Body                           | Response                                                                                                             |
| ------ | ------------------------- | ---- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| GET    | `/characters`             | user | —                              | `Character[]` (owner's; optional `?childId=` filter).                                                                |
| GET    | `/characters/:id`         | user | —                              | `Character` (404 if not owned).                                                                                      |
| POST   | `/characters`             | user | `CreateCharacterDto`           | `Character`. Belongs to a child (`childId` required); `source = FROM_CHILD`.                                         |
| POST   | `/characters/from-prompt` | user | `CreateCharacterFromPromptDto` | AI drafts a name + appearance from a free-text `prompt`; saved with `source = PROMPT`. Returns the `Character`.      |
| PATCH  | `/characters/:id`         | user | `UpdateCharacterDto`           | `Character`.                                                                                                         |
| DELETE | `/characters/:id`         | user | —                              | 204. Clears `Story.characterId` on related stories (styleAnchor snapshots are unaffected).                           |
| POST   | `/characters/:id/preview` | user | —                              | Generates an AI portrait from `description`, stores it in S3, updates `previewKey`. Returns the updated `Character`. |

---

### Art styles — `/art-styles`

| Method | Path          | Auth | Response                             |
| ------ | ------------- | ---- | ------------------------------------ |
| GET    | `/art-styles` | user | `ArtStyle[]` — active only, ordered. |

---

### Stories — `/stories`

| Method | Path                                   | Auth   | Body                    | Response                                                                                                                       |
| ------ | -------------------------------------- | ------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/stories/public`                      | public | —                       | `IStorySummary[]` — stories where `isPublic = true`, ordered newest-first. Includes `rating` score.                            |
| GET    | `/stories/config`                      | user   | —                       | Allowed page counts, question length bounds, the 6 suggestion chips.                                                           |
| GET    | `/stories`                             | user   | —                       | `IStorySummary[]` — caller's stories, including `FAILED`.                                                                      |
| GET    | `/stories/active-job`                  | user   | —                       | `{ jobId, storyId }` or `null`.                                                                                                |
| GET    | `/stories/:id`                         | user   | —                       | `IStoryDetail` (pages, signed URLs, `myRating`, `rating`).                                                                     |
| GET    | `/stories/:id/progress`                | user   | —                       | **SSE** stream — see below.                                                                                                    |
| GET    | `/stories/:id/pages/:order/html`       | user   | —                       | Handlebars-rendered page HTML (same path as Puppeteer uses). Powers the in-browser reader iframe.                              |
| POST   | `/stories`                             | user   | `CreateStoryDto`        | Created `Story` (status `DRAFT`).                                                                                              |
| POST   | `/stories/:id/generate`                | user   | —                       | **202** `{ jobId, storyId }`. 409 if a generation is active or story isn't `DRAFT`. Checks page-credit quota before enqueuing. |
| POST   | `/stories/:id/pages/:order/regenerate` | user   | `RegeneratePageDto`     | Updated `Page`. Re-stitches PDF. 402 if regeneration quota exhausted.                                                          |
| POST   | `/stories/:id/rating`                  | user   | `CreateRatingDto`       | Upserted `Rating`. Sets `Story.isPublic` when `isPublic` field is present.                                                     |
| PATCH  | `/stories/:id/public`                  | admin  | `{ isPublic: boolean }` | 200. Admin override for story public visibility.                                                                               |
| DELETE | `/stories/:id`                         | user   | —                       | 204.                                                                                                                           |

> Route order matters: `public`, `config`, `active-job` are declared before `:id` so they
> are not captured as an id param.

**SSE — `GET /stories/:id/progress`** streams `MessageEvent`s whose `data` is one of:

```
{ type: "snapshot",      stage, status, completedPages, totalPages, error }
{ type: "page_complete", pageOrder, ...snapshot }
{ type: "completed",     ...snapshot }
{ type: "failed",        ...snapshot }
```

See [generation-pipeline.md → Real-time progress](../architecture/generation-pipeline.md#real-time-progress-sse).

---

### Story blueprints — `/story-blueprints`

| Method | Path                    | Auth  | Body                      | Response                                                 |
| ------ | ----------------------- | ----- | ------------------------- | -------------------------------------------------------- |
| GET    | `/story-blueprints`     | user  | —                         | `IStoryBlueprintSummary[]`.                              |
| GET    | `/story-blueprints/:id` | user  | —                         | `IStoryBlueprintDetail`.                                 |
| POST   | `/story-blueprints`     | admin | `CreateStoryBlueprintDto` | `StoryBlueprint`.                                        |
| PATCH  | `/story-blueprints/:id` | admin | `UpdateStoryBlueprintDto` | `IStoryBlueprintDetail`.                                 |
| DELETE | `/story-blueprints/:id` | admin | —                         | 204. Sets `Story.blueprintId = null` on related stories. |

---

### Pricing tiers — `/pricing`

| Method | Path       | Auth   | Response                                                                                   |
| ------ | ---------- | ------ | ------------------------------------------------------------------------------------------ |
| GET    | `/pricing` | public | `PricingTier[]` — ordered by `order` asc. Includes `paddlePriceId` for Paddle.js checkout. |

---

### Subscriptions — `/subscriptions`

| Method | Path                | Auth | Response                                                                                       |
| ------ | ------------------- | ---- | ---------------------------------------------------------------------------------------------- |
| GET    | `/subscriptions/me` | user | `ISubscriptionDetail` — current tier, usage counters, period end, status, `cancelAtPeriodEnd`. |

---

### Billing — `/billing` and `/webhooks`

| Method | Path                | Auth                        | Notes                                                                                                                                                                                                                                          |
| ------ | ------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/webhooks/paddle`  | public (signature-verified) | Paddle webhook receiver. Verifies `Paddle-Signature` header. Handles `subscription.created/activated/updated/canceled/past_due` and `transaction.payment_failed`. Returns 400 on bad signature, 200 on success or unknown events (idempotent). |
| POST   | `/billing/cancel`   | user                        | Schedules subscription cancellation at period end. Sets `cancelAtPeriodEnd = true`.                                                                                                                                                            |
| POST   | `/billing/portal`   | user                        | Creates a Paddle billing-portal session. Returns `{ url }`.                                                                                                                                                                                    |
| GET    | `/billing/invoices` | user                        | Returns invoice list from Paddle API.                                                                                                                                                                                                          |

---

### Notifications — `/notifications`

| Method | Path                          | Auth | Response                                                                                                                                                                                                                                                                      |
| ------ | ----------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| GET    | `/notifications`              | user | Last 20 notifications, newest first.                                                                                                                                                                                                                                          |
| PATCH  | `/notifications/:id/read`     | user | Sets `readAt = NOW()`. 404 if not owned.                                                                                                                                                                                                                                      |
| PATCH  | `/notifications/read-all`     | user | Sets `readAt = NOW()` for all unread records.                                                                                                                                                                                                                                 |
| GET    | `/notifications/unread-count` | user | `{ count }` — REST fallback for first paint before SSE connects.                                                                                                                                                                                                              |
| GET    | `/notifications/stream`       | user | **SSE** — holds an open connection per user. Pushes `{ type: 'unread-count', count: N }` whenever a new Notification is created for this user. Backed by an in-memory `Map<userId, Subject>`; on reconnect the client receives the current count via the REST endpoint first. |
| GET    | `/notifications/preferences`  | user | `INotificationPreferences` — merged with defaults.                                                                                                                                                                                                                            |
| PATCH  | `/notifications/preferences`  | user | `UpdateNotificationPreferencesDto`                                                                                                                                                                                                                                            | Updated preferences. |

**Notification types and default channels:**

| Type                    | Bell | Email      | Email toggleable?         |
| ----------------------- | ---- | ---------- | ------------------------- |
| `STORY_COMPLETED`       | ✓    | ✓          | yes                       |
| `STORY_FAILED`          | ✓    | ✓          | yes                       |
| `PAYMENT_FAILED`        | ✓    | ✓ (always) | **no** — billing-critical |
| `SUBSCRIPTION_CANCELED` | ✓    | ✓          | yes                       |

`SUBSCRIPTION_RENEWED` is email-only (no bell record) and fires only on a new billing cycle for the same tier.

---

### Contact — `/contact`

| Method | Path       | Auth   | Body         | Response                                                                           |
| ------ | ---------- | ------ | ------------ | ---------------------------------------------------------------------------------- |
| POST   | `/contact` | public | `ContactDto` | **202**. Routes the message to `CONTACT_INBOX_EMAIL` with the sender as `replyTo`. |

---

### Admin — `/admin`

All admin routes require `ADMIN` or `SUPER_ADMIN` role.

| Method | Path                              | Notes                                                                                          |
| ------ | --------------------------------- | ---------------------------------------------------------------------------------------------- |
| GET    | `/admin/stats`                    | Dashboard counts: users, stories, active subscriptions, MRR (euro cents) from Paddle API.      |
| GET    | `/admin/users?search=&page=`      | Paginated user list with role, suspension state, subscription tier.                            |
| PATCH  | `/admin/users/:id/role`           | Change role (`USER` / `ADMIN` / `SUPER_ADMIN`).                                                |
| PATCH  | `/admin/users/:id/suspension`     | Suspend or reinstate a user.                                                                   |
| GET    | `/admin/stories?search=&page=`    | Paginated story list with owner + child context.                                               |
| DELETE | `/admin/stories/:id`              | Force-delete any story (does not delete S3 objects).                                           |
| GET    | `/admin/art-styles`               | Full art style list (includes `isActive`, `order`, `thumbnailUrl`).                            |
| POST   | `/admin/art-styles`               | Create art style.                                                                              |
| PATCH  | `/admin/art-styles/reorder`       | Update `order` for all styles in one call.                                                     |
| PATCH  | `/admin/art-styles/:id`           | Update name / slug / promptPrefix / isActive.                                                  |
| POST   | `/admin/art-styles/:id/thumbnail` | Generate thumbnail via image model; stores in S3; saves signed URL to `ArtStyle.thumbnailUrl`. |
| GET    | `/admin/ratings`                  | All ratings with story + author context, newest first.                                         |

---

### Static assets — `/static`

| Method | Path              | Auth   | Notes                                                                                                                                                                        |
| ------ | ----------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/static/fonts/*` | public | Self-hosted `.woff2` fonts served with `Access-Control-Allow-Origin: *`. Required by the story-reader iframe and Puppeteer PDF rendering (both consume the same font files). |

---

## Request body shapes

DTOs are validated by `class-validator`. Constraints come from each module's `*.constants.ts`.

**`CreateChildDto` / `UpdateChildDto`** (update = all fields optional)

```
name        string, 1–50 chars
birthdate   ISO date string, within last 18 years
gender      "MALE" | "FEMALE"
interests   string[], ≤20 items, ≤50 chars each   (optional)
```

**`CreateCharacterDto` / `UpdateCharacterDto`** (update = all optional)

```
name        string, 1–100 chars
description string, 1–2000 chars
childId     string (optional — link to a Child)
```

**`CreateStoryDto`**

```
childId     string
type        "BOOK" | "COMIC"   (COMIC modelled; generation is post-MVP)
question    string, 3–500 chars
pageCount   5 | 8 | 12 | 16 | 20
artStyleId  string
language    "EN" | "DE" | "RU"
```

**`RegeneratePageDto`**

```
what    "text" | "illustration" | "both"
prompt  string, optional — extra guidance for the AI
```

**`CreateRatingDto`**

```
score     number, 1–5
comment   string, optional
isPublic  boolean, optional — when present, sets Story.isPublic
```

**`CreateStoryBlueprintDto` / `UpdateStoryBlueprintDto`** (update = all optional, admin only)

```
name          string, 1–100 chars
description   string, 1–500 chars
type          "BOOK" | "COMIC"
systemPrompt  string, 1–5000 chars
```

**`ContactDto`**

```
name     string, 1–80 chars
email    valid email
message  string, 10–5000 chars
```

**`UpdateUserDto`** — `{ name }`, 1–100 chars.

---

## Response shapes

**`IStorySummary`** — returned by list endpoints (`GET /stories`, `GET /stories/public`):

```
id, userId, childId, artStyleId, blueprintId (nullable), characterId (nullable)
type, status, question, pageCount, language
title (nullable), isPublic
rating (nullable) — owner's score (1–5)
createdAt, updatedAt
child: { id, name, birthdate }
artStyle: { id, name, slug, thumbnailUrl }
coverImageUrl (nullable, pre-signed)
```

**`IStoryDetail`** — extends `IStorySummary`, returned by `GET /stories/:id`:

```
+ pages: [{
    id, storyId, order, chapterTitle, text (nullable), layout (nullable),
    illustrationPrompt (nullable),
    illustrations: [{ url (pre-signed), position }]
  }]
+ pdfUrl (nullable, pre-signed)
+ myRating (nullable): { score, comment, isPublic }
```

> `coverImageUrl`, illustration `url` values, and `pdfUrl` are computed from S3 keys at
> serve time after an ownership check. S3 keys are never exposed in responses.

**`ISubscriptionDetail`**:

```
id, status, cancelAtPeriodEnd, currentPeriodEnd (nullable)
pagesUsed, regenerationsUsed
pricingTier: { id, name, priceMonthly, pagesPerMonth, regenerationsPerMonth,
               childrenLimit, retentionDays, watermark, paddlePriceId }
```
