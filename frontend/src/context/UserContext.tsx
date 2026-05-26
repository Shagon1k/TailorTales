'use client';

import { useQuery } from '@tanstack/react-query';
import { createContext, use } from 'react';
import { userApi } from '@/api/user';
import { USER_QUERY_KEY } from '@/hooks/user';
import type { IUser } from '@/types/user.types';

export interface IUserContext {
    user: IUser | null;
    isLoading: boolean;
    refetch: () => Promise<unknown>;
}

const UserContext = createContext<IUserContext | null>(null);

interface IUserProviderProps {
    children: React.ReactNode;
    initialUser: IUser | null;
}

export function UserProvider({ children, initialUser }: Readonly<IUserProviderProps>): React.ReactElement {
    const {
        data: user = null,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: USER_QUERY_KEY,
        queryFn: userApi.getMe,
        initialData: initialUser ?? undefined,
        retry: false,
    });

    return <UserContext value={{ user, isLoading, refetch }}>{children}</UserContext>;
}

export function useCurrentUser(): IUserContext {
    const context = use(UserContext);
    if (!context) throw new Error('useCurrentUser must be used within UserProvider');
    return context;
}
