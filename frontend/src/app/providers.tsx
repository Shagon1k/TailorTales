'use client';

import { MantineProvider } from '@mantine/core';
import { UserProvider } from '@/context/UserContext';
import type { IUser } from '@/types/user.types';

interface IProvidersProps {
    children: React.ReactNode;
    initialUser: IUser | null;
}

export default function Providers({ children, initialUser }: IProvidersProps): React.ReactElement {
    return (
        <MantineProvider>
            <UserProvider initialUser={initialUser}>{children}</UserProvider>
        </MantineProvider>
    );
}
