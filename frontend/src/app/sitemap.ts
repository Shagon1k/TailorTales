import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** Indexable public routes (after the locale segment). Private/admin routes are excluded — see robots.ts. */
const PUBLIC_PATHS = ['', '/how-it-works', '/pricing', '/contact', '/privacy'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
    return PUBLIC_PATHS.map((path) => {
        const languages: Record<string, string> = {};
        for (const locale of routing.locales) {
            languages[locale] = `${SITE_URL}/${locale}${path}`;
        }

        return {
            url: `${SITE_URL}/${routing.defaultLocale}${path}`,
            lastModified: new Date(),
            alternates: { languages },
        };
    });
}
