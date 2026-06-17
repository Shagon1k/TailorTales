'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { MantineProvider } from '@mantine/core';
import { useState } from 'react';
import { UserProvider } from '@/context/UserContext';
import { SUBSCRIPTION_QUERY_KEY } from '@/hooks/subscription';
import { theme } from '@/theme/mantine';
import type { IUsageSummary } from '@/types/subscription.types';
import type { IUser } from '@/types/user.types';

interface IProvidersProps {
    children: React.ReactNode;
    initialUser: IUser | null;
    initialSubscription: IUsageSummary | null;
}

export default function Providers({
    children,
    initialUser,
    initialSubscription,
}: Readonly<IProvidersProps>): React.ReactElement {
    const [queryClient] = useState(() => {
        const client = new QueryClient();
        // Pre-seed the cache so HeaderUserChip never shows "…" on mount.
        // Locale navigation can recreate this client (empty cache); server data
        // guarantees subscription is available before the first render.
        if (initialSubscription) {
            client.setQueryData(SUBSCRIPTION_QUERY_KEY, initialSubscription);
        }
        return client;
    });

    return (
        <QueryClientProvider client={queryClient}>
            <MantineProvider theme={theme}>
                <UserProvider initialUser={initialUser}>{children}</UserProvider>
            </MantineProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
