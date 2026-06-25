import type { Metadata } from 'next';
import { routing } from '@/i18n/config';

const OG_IMAGE_PATH = '/og-default.png';
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

const OG_LOCALE: Record<string, string> = {
    en: 'en_US',
    de: 'de_DE',
    ru: 'ru_RU',
};

interface IBuildMetadataParams {
    /** Route param — already guaranteed to be a configured locale by the i18n middleware. */
    locale: string;
    /** Route after the locale segment: `''` for home, `'/pricing'` otherwise. */
    path: string;
    /** Page-specific title; omit on the home page to use the site default. */
    title?: string;
    description: string;
    siteName: string;
    ogImageAlt: string;
}

export function buildJsonLd(siteUrl: string, siteName: string, description: string): string {
    return JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Organization',
                '@id': `${siteUrl}/#organization`,
                name: siteName,
                url: siteUrl,
                logo: `${siteUrl}/apple-icon.png`,
                description,
            },
            {
                '@type': 'WebSite',
                '@id': `${siteUrl}/#website`,
                name: siteName,
                url: siteUrl,
                description,
                publisher: { '@id': `${siteUrl}/#organization` },
            },
        ],
    });
}

/**
 * Builds canonical + hreflang alternates and Open Graph / Twitter tags for a public page.
 * URLs are relative — Next resolves them against `metadataBase` (set in the locale layout).
 * Canonical is self-referencing per locale; hreflang covers every locale plus `x-default`.
 */
export function buildMetadata({
    locale,
    path,
    title,
    description,
    siteName,
    ogImageAlt,
}: IBuildMetadataParams): Metadata {
    const languages: Record<string, string> = {};
    for (const supportedLocale of routing.locales) {
        languages[supportedLocale] = `/${supportedLocale}${path}`;
    }
    languages['x-default'] = `/${routing.defaultLocale}${path}`;

    const canonical = `/${locale}${path}`;
    const socialTitle = title ? `${siteName} | ${title}` : siteName;

    return {
        title: title ?? { absolute: siteName },
        description,
        alternates: { canonical, languages },
        openGraph: {
            type: 'website',
            siteName,
            locale: OG_LOCALE[locale] ?? OG_LOCALE[routing.defaultLocale],
            alternateLocale: routing.locales
                .filter((supportedLocale) => supportedLocale !== locale)
                .map((supportedLocale) => OG_LOCALE[supportedLocale]),
            url: canonical,
            title: socialTitle,
            description,
            images: [
                {
                    url: OG_IMAGE_PATH,
                    width: OG_IMAGE_WIDTH,
                    height: OG_IMAGE_HEIGHT,
                    alt: ogImageAlt,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: socialTitle,
            description,
            images: [OG_IMAGE_PATH],
        },
    };
}
