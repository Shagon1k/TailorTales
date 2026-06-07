# Decision: Puppeteer + Handlebars + pdf-lib for PDF generation

## Decision

Use **Puppeteer** (headless Chromium) to print HTML pages to PDF, **Handlebars** to render
page templates, and **pdf-lib** to stitch per-page PDFs into the final document.

## Context

TailorTales produces illustrated A5 PDF storybooks. Each page has a fixed layout (cover,
text-only, text + image, full-image, final) with precise typography, image placement, and
optional watermarks. The output must be print-ready.

## Why HTML → PDF via Puppeteer?

- **Full CSS/font control.** Designers write page layouts in HTML/CSS with web fonts. Puppeteer
  renders them with full browser fidelity — the exact same layout engine as a browser.
- **No PDF layout library.** Alternatives like PDFKit or pdfmake require programming layouts
  imperatively in JavaScript. HTML/CSS layouts are declarative, reviewable in a browser, and
  trivially iterable — a developer can open the template HTML file directly to see what the
  page looks like.
- **Known output.** Puppeteer prints each page to A5 and waits on `document.fonts.ready` for
  deterministic font rendering before capturing the PDF.

## Why Handlebars?

- **Simple, logic-free templates.** Each page layout is a Handlebars template that receives a
  flat data object (text, illustration data URL, chapter title). No control flow needed beyond
  conditional blocks for optional fields.
- **Server-safe.** Handlebars has no browser dependency — it compiles and renders server-side.

## Why pdf-lib for stitching?

- Puppeteer generates one PDF per page. `pdf-lib` merges them into a single document.
  It is the lightest tool for this single operation.

## Known constraints

- **Image embedding via base64.** Puppeteer runs inside Node.js and cannot follow private S3
  pre-signed URLs from within the headless browser context. The Binding stage fetches each
  illustration from S3 and embeds it as a base64 data URL before rendering.
- **Chromium binary.** `pnpm install` downloads Chromium via Puppeteer's post-install hook
  (allow-listed in root `package.json`). Missing Chromium is the most common local setup
  failure — re-run `pnpm install`.
- **Memory.** Headless Chromium is heavier than a pure-JS PDF library. Not a concern at
  MVP scale (one generation at a time per user).

## Revisit if

- Memory becomes a bottleneck under concurrent generation load.
- A pure-JS layout-driven alternative (e.g. React PDF) reaches the fidelity needed for the
  template designs.
