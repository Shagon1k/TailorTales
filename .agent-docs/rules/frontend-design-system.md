# Frontend — Design System Reference

> Distilled from Figma design system v0.3. Use when reading Figma via MCP or implementing any styled component.
> Full Figma file: https://www.figma.com/design/T8GDg3vsU9vvxgHi3q6WJc/TailorTales-Design-System

---

## Figma token path → CSS variable

| Figma path prefix          | CSS variable prefix |
| -------------------------- | ------------------- |
| `primitives/color/X`       | `--color-X`         |
| `semantic/bg/X`            | `--bg-X`            |
| `semantic/text/X`          | `--text-X`          |
| `semantic/accent/X`        | `--accent-X`        |
| `semantic/border/X`        | `--border-X`        |
| `spacing/N`                | `--space-N`         |
| `radii/X`                  | `--radius-X`        |
| `shadows/X`                | `--shadow-X`        |
| `opacity/X`                | `--opacity-X`       |
| `typography/font-family/X` | `--font-X`          |
| `typography/font-size/X`   | `--text-X`          |
| `gradient/X`               | `--gradient-X`      |

---

## Color primitives

| Name       | Hex       | CSS variable         |
| ---------- | --------- | -------------------- |
| paper      | `#fff4e6` | `--color-paper`      |
| paper-2    | `#faead8` | `--color-paper-2`    |
| paper-3    | `#f4ddc8` | `--color-paper-3`    |
| ink        | `#4e191e` | `--color-ink`        |
| ink-2      | `#734847` | `--color-ink-2`      |
| ink-3      | `#977774` | `--color-ink-3`      |
| twilight   | `#2e1011` | `--color-twilight`   |
| twilight-2 | `#421c19` | `--color-twilight-2` |
| moon       | `#f8eace` | `--color-moon`       |
| fox        | `#f86e42` | `--color-fox`        |
| fox-soft   | `#fbb08e` | `--color-fox-soft`   |
| ember      | `#b23641` | `--color-ember`      |
| flame      | `#ff6470` | `--color-flame`      |
| plum       | `#672131` | `--color-plum`       |
| leaf       | `#547e4b` | `--color-leaf`       |
| gold       | `#dbb155` | `--color-gold`       |

---

## Semantic tokens

```
SURFACES   --bg-canvas · --bg-elevated · --bg-card · --bg-card-2
TEXT       --text-primary · --text-secondary · --text-muted
           --text-on-card · --text-on-card-2 · --text-on-card-3
           --text-accent · --text-inverse
BORDERS    --border-subtle · --border-strong · --border-on-card
ACCENTS    --accent-primary (fox) · --accent-warm (ember) · --accent-gold
           --accent-danger (flame) · --accent-cool · --accent-deep
OPACITY    --opacity-disabled (0.40) · --opacity-muted (0.55)
           --opacity-secondary (0.78) · --opacity-full (1.00)
```

---

## Typography

| Token           | Family            | Use for                   |
| --------------- | ----------------- | ------------------------- |
| `--font-serif`  | Newsreader        | Display, headings, lede   |
| `--font-sans`   | Plus Jakarta Sans | Body, UI, labels          |
| `--font-script` | Caveat            | Decorative accent moments |
| `--font-mono`   | Geist Mono        | Caps eyebrow labels       |

| Text style    | Size | Family       | Use                       |
| ------------- | ---- | ------------ | ------------------------- |
| `display/5xl` | 72   | serif        | Page heroes               |
| `heading/4xl` | 56   | serif        | Section heroes            |
| `heading/3xl` | 42   | serif        | Section headings          |
| `heading/2xl` | 32   | serif        | Card headings             |
| `subhead/xl`  | 24   | sans         | Subheadings               |
| `lede/lg`     | 20   | serif italic | Intro paragraphs          |
| `body/md`     | 17   | sans         | Long-form body            |
| `body/base`   | 15   | sans         | Default UI                |
| `body/sm`     | 13   | sans         | Helpers, captions         |
| `caps/xs`     | 11   | mono         | Eyebrow labels (all-caps) |
| `script/xl`   | 24   | script       | Decorative moments        |

---

## Spacing scale

`--space-0` 0 · `--space-1` 4px · `--space-2` 8px · `--space-3` 12px · `--space-4` 16px · `--space-5` 20px · `--space-6` 24px · `--space-8` 32px · `--space-10` 40px · `--space-12` 48px · `--space-16` 64px · `--space-20` 80px · `--space-24` 96px · `--space-32` 128px

---

## Radii

`--radius-none` 0 · `--radius-sm` · `--radius-md` · `--radius-lg` · `--radius-xl` · `--radius-pill` 999px

---

## Shadows

`--shadow-sm` · `--shadow-md` · `--shadow-lg` · `--shadow-glow-fox` (warm brand ambient glow)

---

## Gradients

| Variable                   | Use case                                                     |
| -------------------------- | ------------------------------------------------------------ |
| `--gradient-page`          | Page canvas background (landing, dashboard, generating page) |
| `--gradient-glow-fox`      | Warm ambient bloom behind hero CTAs and sign-in card         |
| `--gradient-card-twilight` | Elevated dark card on twilight canvas                        |
| `--gradient-fox-bevel`     | 135° warm bevel for avatars and primary buttons              |
| `--gradient-progress`      | Progress bar fill: ember → fox → gold                        |
| `--gradient-hatch-light`   | Diagonal hatch on dark cards (image placeholder)             |
| `--gradient-hatch-dark`    | Diagonal hatch on cream cards                                |

---

## Motion & focus tokens (not in Figma — implement from spec)

```css
--duration-base: 200ms;
--duration-slow: 400ms;
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--focus-ring-color: var(--color-fox);
--hit-min: 44px;
```

All transition durations collapse to `0.01ms` under `prefers-reduced-motion`.

---

## Figma component → CSS Module class

When MCP returns a component instance, translate to a local CSS Module class. Figma variant properties → `m-` modifier classes (see `css.md` for the naming convention).

| Figma component    | Base class  | Modifier classes                                    | Mantine base           |
| ------------------ | ----------- | --------------------------------------------------- | ---------------------- |
| `Button`           | `.button`   | `.m-primary / .m-secondary / .m-quiet / .m-on-card` | `Button`               |
| `Tag`              | `.badge`    | `.m-filled / .m-warm / .m-gold`                     | `Badge`                |
| `Caps Label`       | `.caps`     | `.m-on-card / .m-gold`                              | custom                 |
| `Link`             | `.link`     | `.m-quiet / .m-on-card`                             | `Anchor`               |
| `Field / Input`    | `.input`    | —                                                   | `TextInput` classNames |
| `Field / Textarea` | `.textarea` | —                                                   | `Textarea` classNames  |
| `Field / Label`    | `.label`    | —                                                   | `TextInput` classNames |
| `Field / Helper`   | `.helper`   | `.m-error`                                          | `TextInput` classNames |
| `Card`             | `.card`     | `.m-gradient / .m-dark`                             | `Paper`                |
| `Avatar`           | `.avatar`   | —                                                   | `Avatar`               |
| `Progress`         | `.progress` | —                                                   | `Progress`             |
| `Divider`          | `.divider`  | `.m-dashed / .m-needle`                             | `Divider`              |
| `Brand Mark`       | `.brand`    | —                                                   | custom                 |
| `Modal`            | `.modal`    | —                                                   | `Modal`                |
| `Toast`            | `.toast`    | `.m-success / .m-error / .m-warning / .m-info`      | `Notification`         |
| `Stat Card`        | `.stat`     | `.m-positive / .m-negative`                         | custom                 |
| `Rating`           | `.rating`   | —                                                   | `Rating`               |

---

## Accessibility baseline

All of these are non-negotiable. Fix violations; don't document exceptions.

- **Contrast**: body text ≥ 4.5:1 (AA); large text (≥24px) ≥ 3:1.
- **Focus ring**: `:focus-visible` on every interactive element — 2px solid `--focus-ring-color`, 2px offset.
- **Hit target**: min 44×44px (`--hit-min`) for all interactive surfaces.
- **Semantics**: `<button>` for actions, `<a>` for navigation, never `<div onClick>`.
- **Motion**: honor `prefers-reduced-motion` — collapse all durations.
- **Forms**: every input has a `<label>`. Helpers and errors linked via `aria-describedby`. Required fields marked in the label, not just by color.
- **Disabled state**: `disabled` attribute or `aria-disabled="true"` — not a CSS class.
- **Loading state**: `aria-busy="true"`.
