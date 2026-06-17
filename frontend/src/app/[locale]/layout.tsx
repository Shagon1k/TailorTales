import type { Metadata } from 'next';
import { Newsreader, Plus_Jakarta_Sans, Caveat, Geist_Mono } from 'next/font/google';
import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import '@mantine/core/styles.css';
import '../../styles/globals.scss';
import { getServerSubscription } from '@/api/subscription.server';
import { getServerUser } from '@/api/user.server';
import StarField from '@/components/shared/StarField/StarField';
import type { ILocale } from '@/i18n/config';
import Providers from '../providers';

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

export const metadata: Metadata = {
    title: {
        default: 'TailorTales',
        template: 'TailorTales | %s',
    },
    description: 'Personalized AI-generated storybooks & comics for curious kids',
};

interface ILocaleLayoutProps {
    children: React.ReactNode;
    params: Promise<{ locale: ILocale }>;
}

export default async function LocaleLayout({
    children,
    params,
}: Readonly<ILocaleLayoutProps>): Promise<React.ReactElement> {
    const { locale } = await params;
    const [initialUser, messages] = await Promise.all([getServerUser(), getMessages()]);
    // Sequential: subscription requires auth, so we fetch only when user exists.
    const initialSubscription = initialUser ? await getServerSubscription() : null;
    const fontClasses = `${newsreader.variable} ${jakarta.variable} ${caveat.variable} ${geistMono.variable}`;

    return (
        <html lang={locale} {...mantineHtmlProps} className={fontClasses}>
            <head>
                <ColorSchemeScript />
            </head>
            <body>
                <StarField />
                <NextIntlClientProvider messages={messages}>
                    <Providers initialUser={initialUser} initialSubscription={initialSubscription}>
                        {children}
                    </Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
