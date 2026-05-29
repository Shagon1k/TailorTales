'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/context/UserContext';

interface IAdminGuardProps {
    children: React.ReactNode;
}

export default function AdminGuard({
    children,
}: Readonly<IAdminGuardProps>): React.ReactElement | null {
    const { user, isLoading } = useCurrentUser();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) router.replace('/login');
        if (!isLoading && user && user.role !== 'ADMIN') router.replace('/library');
    }, [user, isLoading, router]);

    if (isLoading || user?.role !== 'ADMIN') return null;

    return <>{children}</>;
}
