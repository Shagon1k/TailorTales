import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign In', robots: { index: false, follow: true } };

export default function LoginLayout({
    children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
    return <>{children}</>;
}
