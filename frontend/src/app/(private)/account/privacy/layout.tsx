import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy & data' };

export default function PrivacyLayout({
    children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
    return <>{children}</>;
}
