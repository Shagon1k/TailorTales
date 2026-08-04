# SEO

> How TailorTales is structured for search-engine discoverability and social sharing.

## Environment variable

| Variable               | Required for prod | Notes                                                                                                                                                   |
| ---------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | yes               | Canonical public origin, e.g. `https://tailortales.app`. No trailing slash. Must match the non-www, HTTPS form used in Cloudflare/dokploy 301 redirect. |

In dev the value defaults to `http://localhost:3000` when unset.

## Sitemap

`frontend/src/app/sitemap.ts` — Next.js App Router built-in (`MetadataRoute.Sitemap`).

- 5 static public paths: `/`, `/how-it-works`, `/pricing`, `/contact`, `/privacy`
- 3 locales: `en`, `de`, `ru`
- Each entry sets `url` to the `en` (default) locale path and includes an `alternates.languages`
  map covering all three locales — consumed by crawlers as hreflang hints.

Access: `GET /sitemap.xml`

## Google Search Console

Use a production **Domain property** for `tailortales.app`, verify it through DNS, then submit
`https://tailortales.app/sitemap.xml` in **Sitemaps**. Do not submit the UAT host: it returns a
`noindex` response header by design.

## Robots

`frontend/src/app/robots.ts` — Next.js App Router built-in (`MetadataRoute.Robots`).

Disallowed paths (locale-wildcard):

```
/*/admin
/*/account
/*/library
/*/workshop
/*/login
/api
```

All other paths (`/`) are allowed. `sitemap` and `host` are set from `NEXT_PUBLIC_SITE_URL`.

Access: `GET /robots.txt`

## PWA manifest

`frontend/src/app/manifest.ts` — Next.js App Router built-in (`MetadataRoute.Manifest`).

Key fields: `name: 'TailorTales'`, `display: 'standalone'`, `theme_color / background_color: '#1a0a00'`.

Icons currently reuse the 32×32 favicon and 180×180 apple-touch icon. 192×192 and 512×512
dedicated PWA icons are not yet present in `frontend/public/`.

Access: `GET /manifest.webmanifest`

## JSON-LD structured data

Inlined directly in `frontend/src/app/[locale]/layout.tsx` as a `<script type="application/ld+json" dangerouslySetInnerHTML={...}>` tag inside the `<head>` JSX. React 19 throws when a `<script>` tag is rendered inside a React wrapper component during hydration, so the script must live directly in the RSC layout — not in a separate component.

Emits a single `@graph` with two nodes:

- `Organization` — name, url, logo (`/apple-icon.png`), description
- `WebSite` — name, url, description, publisher reference to the Organization node

These are the only schema.org types relevant to TailorTales at MVP. No `Product` schema
(subscription pricing is handled by Paddle, not direct e-commerce).

## Per-page metadata

### Layout-level defaults (`[locale]/layout.tsx`)

`generateMetadata` runs on every locale layout and sets:

- `metadataBase: new URL(NEXT_PUBLIC_SITE_URL)` — **required** for relative OG image paths
  (e.g. `/og-default.png`) to resolve to full URLs in crawlers.
- `title.template: 'TailorTales | %s'` — pages provide the `%s` portion; the template
  wraps it automatically.
- `description` — locale-aware default from `seo.defaultDescription` translation key.
- `openGraph` + `twitter` — site-wide fallback OG/Twitter card.
- Inline JSON-LD `<script>` — Organization + WebSite structured data, rendered once per page load.

### Page-level overrides (shared helper)

`frontend/src/utils/seo.utils.ts` exports `buildMetadata()`. All 5 public pages call it:

```typescript
buildMetadata({
    locale, // active locale string ('en' | 'de' | 'ru')
    path, // route path without locale prefix, e.g. '/pricing'
    title, // page-specific title (injected into layout template)
    description, // page-specific description from locale JSON
    siteName, // from seo.siteName translation key
    ogImageAlt, // from seo.ogImageAlt translation key
});
```

What it produces:

| Field                       | Value                                                                             |
| --------------------------- | --------------------------------------------------------------------------------- |
| `alternates.canonical`      | `/{locale}{path}` (relative — `metadataBase` resolves it)                         |
| `alternates.languages`      | `{ en: '/en{path}', de: '/de{path}', ru: '/ru{path}', 'x-default': '/en{path}' }` |
| `openGraph.locale`          | `en_US` / `de_DE` / `ru_RU` mapped from locale                                    |
| `openGraph.alternateLocale` | The two non-active OG locale codes                                                |
| `openGraph.images`          | `[{ url: '/og-default.png', width: 1200, height: 630 }]`                          |
| `twitter.card`              | `summary_large_image`                                                             |

### Login noindex

`[locale]/login/layout.tsx` sets `robots: { index: false, follow: true }` so the login
page is excluded from search results but its links are still followed.

## Translation keys

SEO copy lives in each locale file (`en.json`, `de.json`, `ru.json`):

```
seo.siteName          — "TailorTales"
seo.defaultDescription — site-wide fallback description
seo.ogImageAlt        — alt text for the default OG image

home.page.description
howItWorks.page.description
pricing.page.description
contact.page.description
privacy.page.description
```

## OG image

The sitemap and all OG tags reference `/og-default.png` (1200×630). This file **does not
exist yet** in `frontend/public/` — social shares render without a thumbnail until it is
added.
