import type { Metadata } from 'next';
import { Newsreader, Plus_Jakarta_Sans, Caveat, Geist_Mono } from 'next/font/google';
import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import '@mantine/core/styles.css';
import '../styles/globals.scss';
import { getServerUser } from '@/api/user.server';
import StarField from '@/components/shared/StarField/StarField';
import Providers from './providers';

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
    title: 'TailorTales',
    description: 'Personalized AI-generated storybooks & comics for curious kids',
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>): Promise<React.ReactElement> {
    const initialUser = await getServerUser();
    const fontClasses = `${newsreader.variable} ${jakarta.variable} ${caveat.variable} ${geistMono.variable}`;

    return (
        <html lang="en" {...mantineHtmlProps} className={fontClasses}>
            <head>
                <ColorSchemeScript />
            </head>
            <body>
                <StarField />
                <Providers initialUser={initialUser}>{children}</Providers>
            </body>
        </html>
    );
}
