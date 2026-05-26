---
paths:
  - "src/**/*.{ts,tsx}"
  - "src/**/*.css"
---

# Frontend — CSS Conventions

## Architecture

Three layers, strictly ordered:

1. **`src/styles/tokens.css`** — CSS custom properties. Imported once in `src/styles/globals.css`. Never import again anywhere else.
2. **`src/theme/mantine.ts`** — `createTheme()` wires Mantine's visual layer to our token values globally.
3. **`src/components/ui/*/Component.module.css`** — one CSS Module per component, consuming semantic tokens via `var(--token-name)`.

---

## CSS Modules

- Every component gets its own `.module.css`. No shared stylesheets for component styles.
- Import as `import styles from './Component.module.css'` — always named `styles`.
- Never use `style={{ }}` for static values — those belong in the module. Inline styles are only for dynamic/runtime values (e.g. a width computed from a prop).

---

## Class naming inside modules

CSS Modules provides the scope — no block-name repetition needed in modifiers.

| Class type | Pattern | Example |
| ---------- | ------- | ------- |
| Base | `.componentName` | `.button` |
| Modifier | `.m-modifierName` | `.m-primary`, `.m-sm` |
| Internal element | `.componentName__element` | `.card__header` |

```css
.button { }           /* base */
.m-primary { }        /* variant modifier */
.m-sm { }             /* size modifier */
.card__header { }     /* internal element */
.m-featured { }       /* modifier applied alongside an element */
```

Apply modifiers with `clsx`:

```tsx
import clsx from 'clsx';

<button className={clsx(styles.button, styles['m-primary'], {
  [styles['m-sm']]: size === 'sm',
})}>
```

**Reserved prefixes:**
- `m-` — component-scoped modifiers (defined in the component's own `.module.css`)
- `u-` — global utility modifiers (not yet in use; reserve the prefix)

---

## Token consumption rule

**Components consume semantic tokens only. Never use primitive tokens inside components.**

```css
/* ✅ correct */
color: var(--text-primary);
background: var(--accent-primary);
border: 1px solid var(--border-subtle);

/* ❌ wrong — use the semantic alias */
color: var(--color-moon);
background: var(--color-fox);
```

Primitives (`--color-fox`, `--color-ember`, etc.) are reserved for brand-specific assets (logo, illustrations) — never for UI components.

---

## Mantine override pattern

Two tools, applied in this order:

**1. `createTheme()` — global defaults** (`src/theme/mantine.ts`)

Override once for values that apply to every instance: color palette, font family, border-radius, shadows, focus ring.

**2. `classNames` prop — per-component slot overrides**

For Mantine components whose sub-elements (label, input, error, dropdown, etc.) need precise visual control:

```tsx
<TextInput
  classNames={{
    root: styles.field,
    label: styles.label,
    input: styles.input,
    error: styles.error,
  }}
/>
```

Never use the `styles` prop (Mantine's inline CSS API) for static values — those go in the module file.

---

## Mantine component boundaries

| Use Mantine (override visually) | Build custom CSS Module |
| ------------------------------- | ----------------------- |
| `Button` | `CapsLabel` |
| `Paper` (base for Card) | `BrandMark` |
| `Badge` (our Tag/Pill) | `StatCard` |
| `Rating` | `NotificationBell` |
| `Divider` | `SuggestionChip` |
| `Progress` | Layout components |
| `Avatar` | |
| `Modal` | |
| `Anchor` (our Link) | |
| `Notification` + `@mantine/notifications` (our Toast) | |
| `TextInput`, `Textarea`, `Select`, `TagsInput`, `DateInput` | |

---

## Component location

Next.js App Router: components live as close as possible to the route that uses them.

| Kind | Location | Rule |
| ---- | -------- | ---- |
| Design system atom | `src/components/ui/ComponentName/` | No domain knowledge, no data fetching. Could belong to any project. |
| Shared structural | `src/components/shared/ComponentName/` | Used across multiple route groups. `Header` (adapts to auth state) and `Footer` live here. |
| Route component | `src/app/[route]/_components/ComponentName/` | Used by one route or layout only. `_components/` prefix prevents Next.js treating it as a route segment. |

### Promotion rule

Start co-located. Move up only when a second consumer needs it:

- One route → `src/app/[route]/_components/`
- Multiple routes within a group → `src/app/(group)/_components/`
- Multiple route groups → `src/components/shared/`
- No domain knowledge → `src/components/ui/`

---

## What never to do

- ❌ `@import 'tokens.css'` in a component file — already global.
- ❌ `!important` — fix specificity instead.
- ❌ Hardcoded color/spacing values (`#f86e42`, `16px`) — every value must come from a token.
- ❌ Modifier class for `:hover`, `:focus`, `:disabled` — use CSS pseudo-classes and HTML attributes.
- ❌ Nested `__` (`.card__header__title`) — flatten to `.card__title`.
- ❌ `<div onClick>` — use `<button>` for actions, `<a>` for navigation.
