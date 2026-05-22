import type { Metadata } from 'next';
import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import '@mantine/core/styles.css';
import { getServerUser } from '@/api/user.server';
import Providers from './providers';

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

    return (
        <html lang="en" {...mantineHtmlProps}>
            <head>
                <ColorSchemeScript />
            </head>
            <body>
                <Providers initialUser={initialUser}>{children}</Providers>
            </body>
        </html>
    );
}
