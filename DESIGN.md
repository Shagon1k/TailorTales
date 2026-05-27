# TailorTales — Design Reference

> Captures all UI/UX decisions from design screen reviews (session: 2026-05-26).
> Single source of truth for page structure, navigation, and design scope decisions.
> Update whenever new screens are reviewed or decisions change.

---

## Screens Reviewed

| #   | Screen                                | Auth state    |
| --- | ------------------------------------- | ------------- |
| 1   | Workshop — story creation form        | Authenticated |
| 2   | Library / Dashboard                   | Authenticated |
| 3   | Login                                 | Public        |
| 4   | Pricing                               | Public        |
| 5   | Landing                               | Public        |
| 6   | Account / Settings — Subscription tab | Authenticated |
| 7   | Story Reader                          | Authenticated |
| 8   | Generation progress                   | Authenticated |

---

## Navigation

### Public header (unauthenticated)

```
[Logo] TailorTales     How it works · Pricing     Sign in   [Begin a tale →]
```

### Private header (authenticated)

```
[Logo] TailorTales     Library · Workshop     [🔔]   [H] Hannah / Story Hour
```

### Footer (both states)

```
[Logo] TailorTales                          Privacy · Contact
A small workshop for one child's questions.
```

**Excluded from scope:** Tales, For parents, Children (nav item), Sample tales,
For schools, Gift a tale, Safety, Sign in (footer), Pricing (footer).

---

## Pages

### Public

#### `/` — Landing page

- Hero: large headline + subheadline + two CTAs ("Light the first lantern →", "Hear the workshop")
- Fox + tree illustration (SVG/image asset)
- "Three lanterns, then a book" — 3-step explainer cards (i. Light a name · ii. Whisper a why · iii. Carry it home)
- "Tales lit this week" — grid of publicly shared stories (`Story.isPublic = true`); cards show title, for/age/pages/format
- Bottom CTA strip: "Begin a tale for free →"

#### `/login` — Login / Auth

- Split layout: illustration left (fox + tree), auth card right
- Card: "Welcome back · Step back into the workshop."
- "Continue with Google" (primary button, Google-branded)
- Post-MVP: "Use a magic email link instead"
- Legal note: terms + privacy links, "We will never sell your child's data."

#### `/pricing` — Pricing

- Monthly / Yearly toggle (yearly = –20%)
- 3 plan cards: Free Chapter · Story Hour · Family Workshop
- Feature comparison table (MVP rows: pages/month, books + comics, children supported, regenerations, watermark, print-ready PDF, art styles available, stories retained, EN + RU content)
- FAQ section — 6 questions; content is copywriting (TBD separately, not code scope)

#### `/how-it-works` — Static page (content TBD)

#### `/privacy` — Static page

#### `/contact` — Static page

---

### Authenticated

#### `/library` — Dashboard / Library

Sections, top → bottom:

| #        | Section                 | Notes                                                                                                                                    |
| -------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | Greeting                | "Good [evening], [Name]." + personalized subtitle (tale count recap)                                                                     |
| 2        | Stats bar               | Pages this month / pages left / regenerations used / tales in library — **wired in Phase 8**                                             |
| 3        | "Tonight's Tale" card   | One pre-seeded question featured as a prompt; "Begin tale →" / "Pick another" (static pre-seeded list)                                   |
| 4        | "Your readers"          | Child cards (avatar, name·age, interests, "+ New tale" CTA, tale count) + "Add child" card + "Manage children →" link                    |
| 5        | "In the Workshop" strip | Visible only when a generation job is active: title, progress bar, page count, ~time remaining, "Open workshop →" — **wired in Phase 5** |
| 6        | "Your library"          | Tale grid; filter chips: All / For [Child] / Books / Comics                                                                              |
| Post-MVP | "From the Wonder Jar"   | AI-personalized question suggestions (requires analysis of user's story history)                                                         |

#### `/workshop` — Story Creation Form

**Routing rule:** no active generation job → show creation form. Active job → redirect to `/workshop/[jobId]`.

Single scrollable form (no step-by-step page transitions):

| #   | Section         | Details                                                                                                                                          |
| --- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Reader selector | Child avatar, name·age, interests summary; "Change reader →" link                                                                                |
| 2   | Question        | Free-text input + 6 static suggestion chips ("pluck from the jar")                                                                               |
| 3   | Format          | Book (1 cr/page) vs Comic (2 cr/page)                                                                                                            |
| 4   | Length          | Short 5pp / Medium 8pp / Long 12pp / Big 16pp / Bedtime saga 20pp; shows credit cost vs remaining                                                |
| 5   | Art style       | Grid of 8 thumbnails loaded from `ArtStyle` DB; styles: Storybook · Watercolour · Crayon · Ink line · Felt-pen · Cut-paper · Soft 3D · Comic ink |
| 6   | Language        | English / Русский (others: "coming soon")                                                                                                        |

Sticky right panel ("Your tale so far"):

- Live summary: Reader · Format · Length · Style · Language · Credits (X / Y remaining)
- "Light the lantern →" primary CTA — triggers generation job
- "Save as draft" link

#### `/workshop/[jobId]` — Generation Progress

- Story title + descriptor (for [child] · age N · N-page [format] · [style] style)
- Large progress area: fox mascot illustration + progress bar ("page X of Y · painting · ~N min remaining")
- Pipeline stage row: **Outline** ✓ → **Words** ✓ → **Pictures** (active) → **Binding** → **Ready**
- **"Pages so far" grid**: thumbnails appear page-by-page via SSE per-page completion events; active page glows; empty pages are dim placeholders
- **Workshop log** (LIVE badge): timestamped stream; short human-friendly labels per event (no AI prose generation at MVP)
- **"Close safely" banner**: "We'll email [name] at [email] when [child]'s tale is ready."

**Constraint:** 1 concurrent generation job per user at MVP.

#### `/library/[storyId]` — Story Reader

Breadcrumb: Library / For [Child] / Tale [N]

3-column layout:

| Column | Content                                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------ |
| Left   | Chapter list — numbered, LLM-generated chapter titles                                                  |
| Center | Spread viewer — text page + illustration page; "← Previous spread" / "spread X of Y" / "Next spread →" |
| Right  | Action panels (top → bottom): Regeneration, Rating, Details                                            |

**Right panel — Regeneration** _(wired in Phase 7)_:

- "Regenerate words on this page" → opens modal (optional prompt field + submit)
- "Repaint the picture" → opens modal (optional prompt field + submit)
- "N regenerations left this month"

**Right panel — Rating** _(wired in Phase 10)_:

- "Rate this tale" — 1–5 stars + optional comment textarea
- "Share as example" opt-in toggle → sets `Story.isPublic = true`
- "Save rating" button

**Right panel — Details**: Created · Reader · Format · Style · Language · File size

**Page header**: title, subtitle (for [child], age N, N pages, style, finished [time] ago), Download PDF button

Post-MVP: "About this page" context panel (per-page generation context)
Removed: "Share with family" button

#### `/account` — Account Settings

Sidebar + content layout. Shell (routing, sidebar) created in **Phase 3 — Design System**.

| Sidebar item   | Wired in           | Notes                                           |
| -------------- | ------------------ | ----------------------------------------------- |
| Profile        | Phase 1 (existing) | Name, avatar from Google                        |
| Children       | Phase 2 (existing) | Links to child management                       |
| Subscription   | Phase 8            | Plan card, usage bars, payment, invoices        |
| Notifications  | Phase 9            | Per-event preferences (email vs in-app toggles) |
| Language       | Phase 12           | EN / RU switcher                                |
| Privacy & data | Phase 8            | GDPR info + delete account trigger              |
| Export library | Post-MVP           | ZIP of all user PDFs                            |
| Sign out       | Phase 1 (existing) |                                                 |
| Delete account | Phase 8            | Subscription must be cancelled first            |

**Subscription sub-section details:**

- Current plan card: name, billing period, description, next renewal date, renewal breakdown (plan + VAT + total)
- Usage bars: pages painted X/Y · regenerations X/Y · children profiles X/Y
- Payment details: card ("Change" → Paddle billing portal), billing email, billing address, Tax ID — **all managed by Paddle, not stored by us**
- Past parcels: invoice list from Paddle API (date, plan name, amount, status, PDF download)
- Upgrade / Cancel subscription actions

---

## Design Decisions

### Auth

| Decision              | Value             |
| --------------------- | ----------------- |
| MVP auth              | Google OAuth only |
| Magic email link      | Post-MVP          |
| Password / Apple auth | Post-MVP (v2+)    |

### Story Creation

| Decision                    | Value                                            |
| --------------------------- | ------------------------------------------------ |
| Form structure              | Single scrollable form — no wizard pagination    |
| Concurrent generation limit | 1 active job per user at MVP                     |
| Comic credit rate           | 2 credits / page (confirmed)                     |
| Art styles                  | 8 styles, admin-seeded in DB (`ArtStyle` entity) |
| Question suggestion chips   | 6 static pre-seeded strings — no AI, no DB       |
| Save as draft               | Supported                                        |

### Generation Pipeline

| Decision            | Value                                                 |
| ------------------- | ----------------------------------------------------- |
| Stage names         | Outline → Words → Pictures → Binding → Ready          |
| Progress delivery   | SSE; per-page completion events (not just %)          |
| Workshop log        | Real pipeline events with short human-friendly labels |
| Email on completion | Ships with Phase 5 (not Phase 9)                      |
| Email provider      | Resend (decided in Phase 5, not deferred to Phase 9)  |

### Ratings & Public Sharing

| Decision            | Value                                                  |
| ------------------- | ------------------------------------------------------ |
| Rating location     | Story reader page (right panel)                        |
| Rating model        | 1–5 stars + optional comment                           |
| Public sharing      | Opt-in toggle in rating flow → `Story.isPublic = true` |
| Public stories      | Appear on landing page "Tales lit this week"           |
| "Share with family" | Removed from MVP scope                                 |

### Notifications

| Decision                  | Value                                         |
| ------------------------- | --------------------------------------------- |
| Toast                     | Transient; fires when user is on-site         |
| Bell                      | Persistent inbox; accumulates across sessions |
| Dual-channel rule         | Same event → toast + bell when user is active |
| Bell shell                | Design System phase (visual only, no wiring)  |
| Story events wired        | Phase 5                                       |
| Subscription events wired | Phase 9                                       |

### Subscriptions & Billing

| Decision                | Value                                             |
| ----------------------- | ------------------------------------------------- |
| Payment provider        | Paddle                                            |
| Billing data            | Not stored by us — displayed from Paddle API      |
| VAT                     | Displayed from Paddle invoice data                |
| `childrenLimit` on Plan | Yes — enforced at Phase 8                         |
| Delete account          | Phase 8; requires subscription cancellation first |

---

## Notification Event Types

| Event                 | Toast | Bell | Email | Phase |
| --------------------- | ----- | ---- | ----- | ----- |
| story_completed       | ✅    | ✅   | ✅    | 5     |
| story_failed          | ✅    | ✅   | —     | 5     |
| payment_failed        | —     | ✅   | ✅    | 9     |
| subscription_canceled | —     | ✅   | ✅    | 9     |
| subscription_renewed  | —     | —    | ✅    | 9     |

Post-MVP: credits_low, marketing, story_expiry_warning (free tier retention)

---

## Styling Architecture

Three layers, strictly ordered:

| Layer            | File                       | Role                                                                                                                                                                                |
| ---------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Tokens        | `src/styles/tokens.css`    | CSS custom properties — primitives + semantic aliases. Imported once in `globals.css`. Never re-imported.                                                                           |
| 2. Mantine theme | `src/theme/mantine.ts`     | `createTheme()` wires Mantine's visual layer to token values globally.                                                                                                              |
| 3. CSS Modules   | `ComponentName.module.css` | One module per component. Consumes semantic tokens via `var(--token)`. Base class is the component name; modifiers use `m-` prefix (e.g. `.m-primary`). CSS Modules provides scope. |

Components consume **semantic tokens only** (`--text-primary`, `--accent-primary`). Primitive tokens (`--color-fox`) are reserved for brand assets (logo, illustrations).

**Component location** follows Next.js co-location: components live as close as possible to the route that uses them, promoted upward only when a second consumer needs them. `src/components/ui/` for design system atoms, `src/components/shared/` for cross-group structural components (`Header`, `Footer`), `_components/` folders co-located with routes for everything else.

See `frontend/.claude/rules/css.md` for full conventions (including the promotion rule) and `frontend/.claude/rules/design-system.md` for the Figma token → CSS variable mapping.

---

## Component Inventory

### Mantine-based atoms (`src/components/ui/`)

Override visually via `classNames` prop + CSS Module. Behavior stays in Mantine.

| Component  | Mantine base                              | CSS Module class | Variants                                        |
| ---------- | ----------------------------------------- | ---------------- | ----------------------------------------------- |
| `Button`   | `Button`                                  | `.button`        | `m-primary / m-secondary / m-quiet / m-on-card` |
| `Card`     | `Paper`                                   | `.card`          | `m-gradient / m-dark`                           |
| `Badge`    | `Badge`                                   | `.badge`         | `m-filled / m-warm / m-gold`                    |
| `Rating`   | `Rating`                                  | `.rating`        | —                                               |
| `Divider`  | `Divider`                                 | `.divider`       | `m-dashed / m-needle`                           |
| `Progress` | `Progress`                                | `.progress`      | —                                               |
| `Avatar`   | `Avatar`                                  | `.avatar`        | —                                               |
| `Modal`    | `Modal`                                   | `.modal`         | —                                               |
| `Link`     | `Anchor`                                  | `.link`          | `m-quiet / m-on-card`                           |
| `Toast`    | `Notification` + `@mantine/notifications` | `.toast`         | `m-success / m-error / m-warning / m-info`      |

### Form atoms (`src/components/ui/`)

Override via `classNames` slot map.

| Component   | Mantine base | CSS Module classes                      |
| ----------- | ------------ | --------------------------------------- |
| `Input`     | `TextInput`  | `.label / .input / .helper` (`m-error`) |
| `Textarea`  | `Textarea`   | `.label / .textarea / .helper`          |
| `Select`    | `Select`     | `.label / .input / .helper`             |
| `TagsInput` | `TagsInput`  | `.label / .input`                       |

### Custom CSS Module atoms (`src/components/ui/`)

No Mantine base — built entirely from tokens.

| Component          | CSS Module class | Notes                                                          |
| ------------------ | ---------------- | -------------------------------------------------------------- |
| `CapsLabel`        | `.caps`          | `m-on-card / m-gold`; `font: var(--font-mono)`, all-caps, 11px |
| `BrandMark`        | `.brand`         | Logo lockup — SVG + wordmark                                   |
| `StatCard`         | `.stat`          | `m-positive / m-negative`                                      |
| `NotificationBell` | custom           | Visual shell only at Phase 3; wired in Phase 5                 |
| `SuggestionChip`   | custom           | Workshop question chips                                        |

### Shared structural (`src/components/shared/`)

Used across multiple route groups. No Mantine base.

| Component | Notes                                                    |
| --------- | -------------------------------------------------------- |
| `Header`  | Adapts nav links based on auth state (public vs private) |
| `Footer`  | Identical across all layouts                             |

### Feature molecules (co-located)

Composed from atoms. Location determined by the promotion rule in `css.md` — start in `_components/` next to the route, lift when a second consumer needs it.

| Component                | Route                                     |
| ------------------------ | ----------------------------------------- |
| `ChildCard`              | `(private)/library/`                      |
| `TaleCard`               | `(private)/library/`, `(public)/`         |
| `SuggestionChipGroup`    | `(private)/workshop/`                     |
| `PipelineStageIndicator` | `(private)/workshop/[jobId]/`             |
| `PagesThumbnailGrid`     | `(private)/workshop/[jobId]/`             |
| `WorkshopLogEntry`       | `(private)/workshop/[jobId]/`             |
| `ChapterListItem`        | `(private)/library/[storyId]/`            |
| `PageSpread`             | `(private)/library/[storyId]/`            |
| `PlanCard`               | `(public)/pricing/`, `(private)/account/` |
| `UsageBar`               | `(private)/account/`                      |
| `InvoiceRow`             | `(private)/account/`                      |

---

## Post-MVP Items (Design-Sourced)

- Magic email link auth
- "From page X" text excerpt preview during generation (latest completed page text shown in generation view)
- "About this page" per-page generation context panel in story reader
- "Share with family" feature
- Export library (ZIP of all user PDFs)
- AI-personalized upsell banners (account + dashboard)
- "From the Wonder Jar" AI-personalized question suggestions on dashboard

---

## Ideas & Future Directions (References)

See `ROADMAP.md § Ideas & Future Directions` for the full list.
Quick references from design review:

- Workshop step-by-step wizard pagination (currently single form)
- Family plan upsell card in dashboard readers section
- AI-flavored whimsical workshop log descriptions during generation
