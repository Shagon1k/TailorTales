import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/**
 * Allow crawling of public marketing pages; block auth-gated areas and the API.
 * Paths use a wildcard for the locale segment (e.g. /en/library, /de/library).
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/*/admin', '/*/account', '/*/library', '/*/workshop', '/*/login', '/api'],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}
