import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Subscription' };

export default function SubscriptionLayout({
    children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
    return <>{children}</>;
}
