# Frontend — CSS Conventions

## Architecture

Four layers, strictly ordered:

1. **`src/styles/_tokens.scss`** — CSS custom properties only. Used once via `globals.scss`. Never import directly anywhere else.
2. **`src/styles/_typography.scss`** — Sass `@mixin` definitions (one per Figma text style). Use in component modules with `@use 'styles/typography' as *` then `@include t-body-base`. Never produces CSS output on its own.
3. **`src/theme/mantine.ts`** — `createTheme()` wires Mantine's visual layer to our token values globally.
4. **`src/components/ui/*/Component.module.scss`** — one SCSS Module per component, consuming semantic tokens via `var(--token-name)`.

`src/styles/globals.scss` is the entry point: it `@use`s `_tokens.scss` (emitting all CSS custom properties), then defines the global reset, body defaults, focus ring, and scrollbar styles.

All component stylesheets use `.module.scss`. Typography mixins are available anywhere via `@use 'styles/typography' as *` (no relative path needed — `src/` is in `sassOptions.includePaths`).

---

## CSS Modules

- Every component gets its own `.module.css`. No shared stylesheets for component styles.
- Import as `import styles from './Component.module.css'` — always named `styles`.
- Never use `style={{ }}` for static values — those belong in the module. Inline styles are only for dynamic/runtime values (e.g. a width computed from a prop).

---

## Class naming inside modules

CSS Modules provides the scope — no block-name repetition needed in modifiers.

| Class type                    | Pattern                        | Example                                  |
| ----------------------------- | ------------------------------ | ---------------------------------------- |
| Base                          | `.componentName`               | `.button`                                |
| Modifier                      | `.m-modifierName`              | `.m-primary`, `.m-sm`                    |
| Internal element              | `.componentName__element`      | `.card__header`                          |
| Internal element (multi-word) | `.componentName__element-name` | `.card__action-btn`, `.header__icon-btn` |

Element names after `__` are always kebab-case — never underscores.

```css
.button {
} /* base */
.m-primary {
} /* variant modifier */
.m-sm {
} /* size modifier */
.card__header {
} /* internal element — single word */
.card__action-btn {
} /* internal element — multi-word, kebab-case */
.m-featured {
} /* modifier applied alongside an element */
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

Three tools, applied in this order:

**1. `createTheme()` — global defaults** (`src/theme/mantine.ts`)

Override once for values that apply to every instance: color palette, font family, border-radius, shadows, focus ring.

**2. Compound modifier classes — variant and size overrides in atom components**

Mantine applies its own styles via single-class selectors (`[0,1,0]` specificity). A compound selector like `.button.m-primary` has specificity `[0,2,0]` and **always wins** regardless of CSS injection order.

In the SCSS module, nest modifier rules inside the base class using `&`:

```scss
.button {
    /* base styles */

    &.m-primary {
        background: var(--gradient-fox-bevel);
        color: var(--text-on-card);
        border: none;

        &:not([data-disabled]):hover {
            box-shadow: 0 6px 9px rgba(0, 0, 0, 0.35);
        }
    }

    &.m-secondary {
        background: transparent;
        border: 1.5px solid var(--border-strong);
    }
}
```

Wire them up in the component via `classNames`:

```tsx
<MantineButton
    variant="filled"
    classNames={{
        root: clsx(styles.button, styles[`m-${variant}`], styles[`m-${size}`]),
    }}
/>
```

**Atom components do not expose `className`, `classNames`, `style`, `styles`, or `vars` props.** Atoms are closed — all visual variation comes from semantic props (`variant`, `size`, etc.) that map to modifier classes internally.

**3. `classNames` prop — sub-element slot overrides**

For Mantine components whose internal slots (label, input, error, dropdown, etc.) need precise visual control:

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

| Use Mantine (override visually)                             | Build custom CSS Module |
| ----------------------------------------------------------- | ----------------------- |
| `Button`                                                    | `CapsLabel`             |
| `Paper` (base for Card)                                     | `BrandMark`             |
| `Badge` (our Tag/Pill)                                      | `StatCard`              |
| `Rating`                                                    | `NotificationBell`      |
| `Divider`                                                   | `SuggestionChip`        |
| `Progress`                                                  | Layout components       |
| `Avatar`                                                    |                         |
| `Modal`                                                     |                         |
| `Anchor` (our Link)                                         |                         |
| `Notification` + `@mantine/notifications` (our Toast)       |                         |
| `TextInput`, `Textarea`, `Select`, `TagsInput`, `DateInput` |                         |

---

## Component location

Next.js App Router: components live as close as possible to the route that uses them.

| Kind               | Location                                     | Rule                                                                                                     |
| ------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Design system atom | `src/components/ui/ComponentName/`           | No domain knowledge, no data fetching. Could belong to any project.                                      |
| Shared structural  | `src/components/shared/ComponentName/`       | Used across multiple route groups. `Header` (adapts to auth state) and `Footer` live here.               |
| Route component    | `src/app/[route]/_components/ComponentName/` | Used by one route or layout only. `_components/` prefix prevents Next.js treating it as a route segment. |

### Promotion rule

Start co-located. Move up only when a second consumer needs it:

- One route → `src/app/[route]/_components/`
- Multiple routes within a group → `src/app/(group)/_components/`
- Multiple route groups → `src/components/shared/`
- No domain knowledge → `src/components/ui/`

### Sub-component rule

When a component owns private sub-components (used only by that parent), place them in a `components/` subfolder. Each sub-component gets its own named directory with all its files inside:

```
ParentComponent/
  ParentComponent.tsx
  ParentComponent.module.scss
  __tests__/
    ParentComponent.component.spec.tsx
  components/
    SubComponent/
      SubComponent.tsx
      SubComponent.module.scss
      __tests__/
        SubComponent.component.spec.tsx
```

Example: `Header/components/NotificationBell/`, `Header/components/HeaderUserChip/`.

This applies at every level — route components, shared components, and ui atoms alike. Never place sub-component files flat in the parent directory.

---

## What never to do

- ❌ `@import 'tokens.css'` in a component file — already global.
- ❌ `!important` — fix specificity instead.
- ❌ Hardcoded color/spacing values (`#f86e42`, `16px`) — every value must come from a token.
- ❌ Modifier class for `:hover`, `:focus`, `:disabled` — use CSS pseudo-classes and HTML attributes.
- ❌ Nested `__` (`.card__header__title`) — flatten to `.card__title`.
- ❌ `<div onClick>` — use `<button>` for actions, `<a>` for navigation.
- ❌ Per-component `:focus-visible` — the global rule in `globals.scss` already covers all interactive elements. Duplicating it in component modules is dead code.
