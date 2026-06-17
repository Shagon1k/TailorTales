# User Flows

> Sequence diagrams for the key end-to-end flows. Backend base: `http://localhost:3001`.

## 1. Google OAuth sign-in

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Backend
    participant Google
    participant DB as Postgres

    User->>Browser: clicks "Continue with Google"
    Browser->>Backend: GET /auth/google
    Backend-->>Browser: 302 → Google consent screen
    Browser->>Google: redirect with client_id + scopes
    User->>Google: grants permission
    Google-->>Browser: 302 → /auth/google/callback?code=…
    Browser->>Backend: GET /auth/google/callback?code=…
    Backend->>Google: exchange code → access token
    Google-->>Backend: profile (email, googleId, name, avatarUrl)
    Backend->>DB: upsert User (create or update name/avatar)
    Backend->>Backend: sign JWT { sub: userId }
    Backend-->>Browser: set access_token httpOnly cookie<br/>302 → /[locale]/library
    Browser->>Backend: GET /me (cookie sent automatically)
    Backend-->>Browser: User object (hydrates session)
```

## 2. Story generation (happy path)

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Backend
    participant DB as Postgres
    participant Queue as Redis/BullMQ
    participant Worker
    participant OpenRouter
    participant Storage as S3/MinIO
    participant Resend

    User->>Browser: fills Workshop form, clicks "Light the lantern"
    Browser->>Backend: POST /stories (create DRAFT)
    Backend->>DB: INSERT Story (status=DRAFT)
    Backend-->>Browser: { id: storyId }

    Browser->>Backend: POST /stories/:id/generate
    Backend->>DB: check no PENDING/ACTIVE job for user (409 if one exists)
    Backend->>DB: INSERT Job (status=PENDING), Story → QUEUED
    Backend->>Queue: queue.add('generate', { jobId })
    Backend-->>Browser: 202 { jobId, storyId }

    Browser->>Backend: GET /stories/:id/progress (SSE, stays open)

    Queue->>Worker: dequeue job
    Worker->>DB: Job → ACTIVE, Story → GENERATING

    Note over Worker: Stage: Planning
    Worker->>DB: stage = "planning"
    Worker->>DB: load StoryBlueprint by story type
    Worker->>OpenRouter: generateStoryPlan (JSON schema constrained)
    OpenRouter-->>Worker: { title, styleAnchor, pages[] }
    Worker->>DB: save Story.title + styleAnchor, INSERT Pages with illustrationPrompts
    Backend-->>Browser: SSE snapshot (stage=planning)

    Note over Worker: Stage: Moderation
    Worker->>DB: stage = "moderation"
    Worker->>OpenRouter: moderateText(all page text)
    OpenRouter-->>Worker: safe ✓

    Note over Worker: Stage: Pictures (batches of 3)
    Worker->>DB: stage = "pictures"
    loop per page (concurrency=3)
        Worker->>OpenRouter: generateImage(styleAnchor + illustrationPrompt)
        OpenRouter-->>Worker: image bytes (base64)
        Worker->>Storage: upload illustration
        Worker->>DB: Page.illustrations = [{ key, position }]
        Backend-->>Browser: SSE page_complete (thumbnail lights up)
    end
    Worker->>DB: Story.coverImageKey = page[0].illustrations[0].key

    Note over Worker: Stage: Binding
    Worker->>DB: stage = "binding"
    Worker->>Storage: fetch illustrations as base64
    Worker->>Worker: Handlebars render + Puppeteer print → pdf-lib stitch
    Note over Worker: watermark applied if PricingTier.watermark = true

    Note over Worker: Stage: Ready
    Worker->>DB: stage = "ready"
    Worker->>Storage: upload PDF
    Worker->>DB: Story.pdfKey, Story.status = COMPLETED, Job → COMPLETED
    Worker->>DB: INSERT Notification (STORY_COMPLETED)
    Worker->>Resend: send story-completed email

    Backend-->>Browser: SSE completed event
    Browser->>Backend: GET /stories/:id (load story detail)
    Backend-->>Browser: IStoryDetail with signed pdfUrl
    User->>Browser: clicks "Download PDF"
```

## 3. Page regeneration

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Backend
    participant DB as Postgres
    participant OpenRouter
    participant Storage as S3/MinIO

    User->>Browser: opens RegenerationPanel, picks action + optional note
    Browser->>Backend: POST /stories/:id/pages/:order/regenerate<br/>{ what: "illustration" | "text" | "both", prompt? }

    Backend->>DB: load Subscription, check regenerationsUsed < PricingTier.regenerationsPerMonth
    Note over Backend: 402 if quota exhausted

    Backend->>DB: load Story (styleAnchor, artStyle) + Page
    Backend->>DB: Subscription.regenerationsUsed++

    alt what = "text" or "both"
        Backend->>OpenRouter: generateStoryPlan (single-page variant with optional prompt)
        OpenRouter-->>Backend: updated page text
        Backend->>DB: Page.text updated
    end

    alt what = "illustration" or "both"
        Backend->>OpenRouter: generateImage(styleAnchor + page.illustrationPrompt + prompt?)
        OpenRouter-->>Backend: image bytes
        Backend->>Storage: upload new illustration
        Backend->>DB: Page.illustrations updated
    end

    Backend->>Storage: fetch all page illustrations (base64)
    Backend->>Backend: Puppeteer re-render full story PDF
    Backend->>Storage: upload new PDF (overwrites existing pdfKey)
    Backend->>DB: Story.pdfKey updated (same key, new object)

    Backend-->>Browser: updated Page data
    Browser->>Browser: StoryPageIframe reloads via GET /stories/:id/pages/:order/html
```

## 4. Subscription checkout (Paddle)

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant PaddleJS as Paddle.js overlay
    participant Paddle as Paddle platform
    participant Backend
    participant DB as Postgres

    User->>Browser: clicks "Join Story Hour" on /pricing or /account/subscription
    Browser->>PaddleJS: Checkout.open({ priceId, customData: { userId }, locale })
    PaddleJS-->>User: payment overlay (Test Mode in sandbox)
    User->>PaddleJS: enters card details + confirms
    PaddleJS->>Paddle: process payment
    Paddle-->>PaddleJS: payment success
    PaddleJS-->>Browser: overlay closes, redirects to /account/subscription?checkout=success

    Note over Paddle,Backend: async — arrives within seconds
    Paddle->>Backend: POST /webhooks/paddle (subscription.activated)
    Backend->>Backend: verify Paddle-Signature header
    Backend->>DB: find User by customData.userId
    Backend->>DB: find PricingTier by price id
    Backend->>DB: UPDATE Subscription (tier, paddleIds, status=ACTIVE, reset counters)

    loop polling (frontend, ~2s interval)
        Browser->>Backend: GET /subscriptions/me
        Backend-->>Browser: Subscription + PricingTier
    end
    Note over Browser: page flips to Story Hour when tier changes

    User->>Browser: clicks "Open billing portal"
    Browser->>Backend: POST /billing/portal
    Backend->>Paddle: create portal session
    Paddle-->>Backend: portal URL
    Backend-->>Browser: { url }
    Browser->>Browser: window.open(url) → Paddle-hosted portal
```

## 5. Notification delivery (bell + email)

```mermaid
sequenceDiagram
    participant Pipeline as Generation Worker
    participant Emitter as NotificationEmitterService
    participant DB as Postgres
    participant SSEMap as In-memory SSE Map
    participant Resend
    participant Browser

    Note over Browser: user has GET /notifications/stream open (EventSource)
    Browser->>SSEMap: register Subject for userId

    Pipeline->>Emitter: emit({ type: STORY_COMPLETED, userId, payload })
    Emitter->>DB: load User + notificationPreferences (merge with defaults)

    alt in-app bell enabled (default: true)
        Emitter->>DB: INSERT Notification { type, payload, readAt: null }
        Emitter->>DB: SELECT COUNT unread for userId
        Emitter->>SSEMap: push { type: "unread-count", count: N } to userId
        SSEMap-->>Browser: SSE event
        Browser->>Browser: bell badge updates to N
    end

    alt email enabled (default: true)
        Emitter->>Resend: send story-completed email
    end

    User->>Browser: clicks bell icon
    Browser->>Backend: GET /notifications
    Backend->>DB: SELECT last 20 notifications for userId
    Backend-->>Browser: Notification[]
    Browser->>Browser: dropdown renders

    User->>Browser: opens a notification
    Browser->>Backend: PATCH /notifications/:id/read
    Backend->>DB: Notification.readAt = NOW()
    Backend-->>Browser: 200
```
