'use client';

import { MantineProvider } from '@mantine/core';

interface IProvidersProps {
    children: React.ReactNode;
}

export default function Providers({ children }: IProvidersProps): React.ReactElement {
    return <MantineProvider>{children}</MantineProvider>;
}
