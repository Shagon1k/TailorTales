'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { useState } from 'react';
import { UserProvider } from '@/context/UserContext';
import { theme } from '@/theme/mantine';
import type { IUser } from '@/types/user.types';

interface IProvidersProps {
    children: React.ReactNode;
    initialUser: IUser | null;
}

export default function Providers({ children, initialUser }: Readonly<IProvidersProps>): React.ReactElement {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <MantineProvider theme={theme}>
                <ModalsProvider>
                    <UserProvider initialUser={initialUser}>{children}</UserProvider>
                </ModalsProvider>
            </MantineProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
