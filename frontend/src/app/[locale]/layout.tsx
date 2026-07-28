import type { Metadata } from 'next';
import { Newsreader, Plus_Jakarta_Sans, Caveat, Geist_Mono } from 'next/font/google';
import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import '@mantine/core/styles.css';
import '../../styles/globals.scss';
import { getServerSubscription } from '@/api/subscription.server';
import { getServerUser } from '@/api/user.server';
import { buildJsonLd } from '@/utils/seo.utils';
import CookieConsent from '@/components/shared/CookieConsent/CookieConsent';
import StarField from '@/components/shared/StarField/StarField';
import Providers from '../providers';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const newsreader = Newsreader({
    subsets: ['latin'],
    style: ['normal', 'italic'],
    variable: '--font-newsreader',
    display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-jakarta',
    display: 'swap',
});

const caveat = Caveat({
    subsets: ['latin'],
    variable: '--font-caveat',
    display: 'swap',
});

const geistMono = Geist_Mono({
    subsets: ['latin'],
    variable: '--font-geist-mono',
    display: 'swap',
});

interface ILocaleLayoutProps {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}

export async function generateMetadata({
    params,
}: Pick<ILocaleLayoutProps, 'params'>): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'seo' });

    return {
        metadataBase: new URL(SITE_URL),
        title: {
            default: 'TailorTales',
            template: 'TailorTales | %s',
        },
        description: t('defaultDescription'),
        applicationName: 'TailorTales',
        openGraph: {
            type: 'website',
            siteName: t('siteName'),
            description: t('defaultDescription'),
            images: [{ url: '/og-default.png', width: 1200, height: 630, alt: t('ogImageAlt') }],
        },
        twitter: {
            card: 'summary_large_image',
            description: t('defaultDescription'),
            images: ['/og-default.png'],
        },
    };
}

export default async function LocaleLayout({
    children,
    params,
}: Readonly<ILocaleLayoutProps>): Promise<React.ReactElement> {
    const { locale } = await params;
    const [initialUser, messages, tSeo] = await Promise.all([
        getServerUser(),
        getMessages(),
        getTranslations({ locale, namespace: 'seo' }),
    ]);
    // Sequential: subscription requires auth, so we fetch only when user exists.
    const initialSubscription = initialUser ? await getServerSubscription() : null;
    const fontClasses = `${newsreader.variable} ${jakarta.variable} ${caveat.variable} ${geistMono.variable}`;

    return (
        <html lang={locale} {...mantineHtmlProps} className={fontClasses}>
            <head>
                <ColorSchemeScript />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: buildJsonLd(SITE_URL, tSeo('siteName'), tSeo('defaultDescription')),
                    }}
                />
            </head>
            <body>
                <StarField />
                <NextIntlClientProvider messages={messages}>
                    <Providers initialUser={initialUser} initialSubscription={initialSubscription}>
                        {children}
                        <CookieConsent />
                    </Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
