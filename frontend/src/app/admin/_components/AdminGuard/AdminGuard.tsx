'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/context/UserContext';
import { isAdmin } from '@/utils/role.utils';

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
        if (!isLoading && user && !isAdmin(user.role)) router.replace('/library');
    }, [user, isLoading, router]);

    if (isLoading || !user || !isAdmin(user.role)) return null;

    return <>{children}</>;
}
