'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/context/UserContext';

interface IAuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: Readonly<IAuthGuardProps>): React.ReactElement | null {
    const { user } = useCurrentUser();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.replace('/login');
        }
    }, [user, router]);

    if (!user) return null;

    return <>{children}</>;
}
