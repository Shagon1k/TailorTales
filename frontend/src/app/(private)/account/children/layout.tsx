import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Readers' };

export default function ChildrenLayout({
    children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
    return <>{children}</>;
}
