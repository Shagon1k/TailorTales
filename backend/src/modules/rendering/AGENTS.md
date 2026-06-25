# Rendering (PDF)

Turns a Story's `Page` rows into an A5 PDF: one Handlebars template per page -> Puppeteer prints each -> pdf-lib stitches them.

## PageTemplate Contract

`page-templates.config.ts` (`PAGE_TEMPLATES`) is the single source of truth read by three consumers: the prompt builder, `StoryPlanValidator`, and this renderer. Each entry declares `htmlFile`, `type` (`BOOK`/`COMIC`), `role` (`cover`/`interior`/`final`), `narrativePurpose`, `maxChars` per text zone, and `images` (`{ name, aspect, size }`, with pixel sizes matched to the display area).

Adding or changing a template touches three places; keep them in sync:

1. the `*.hbs` file in `templates/` (must include `_base.hbs`),
2. its entry in `page-templates.config.ts`,
3. the `PRIMARY_TEXT_ZONE` map in `../generation/story-plan.validator.ts` (book templates).

The LLM only picks a template name and writes the text/illustration prompt; it never emits `size` or character counts.

## Rendering Invariants

- Fonts are self-hosted (`assets/fonts/*.woff2`); the renderer waits for `document.fonts.ready` before printing so PDFs are deterministic. Don't add remote/CDN fonts.
- A5 = 148 x 210 mm; the `@page` size lives in `_base.hbs`.
- Text overflow is clipped by CSS (the auto-fit safety net) by design. Don't "fix" overflow by truncating text in code.
- Watermark is tier-driven. `QuotaService.getWatermarkForUser()` reads `PricingTier.watermark` from the DB and passes it through `IStoryToRender`. `_base.hbs` conditionally injects the CSS class and `<div>` only when `watermark = true` (Free Chapter). Paid tiers get a clean PDF.
- `comic-*` templates are Post-MVP stubs: present in the config but not generated.
