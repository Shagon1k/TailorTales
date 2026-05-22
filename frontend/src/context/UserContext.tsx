'use client';

import { createContext, use, useCallback, useState } from 'react';
import { ApiError } from '@/lib/api';
import { userApi } from '@/api/user';
import type { IUser } from '@/types/user.types';

interface IUserContext {
    user: IUser | null;
    isLoading: boolean;
    refetch: () => Promise<void>;
}

const UserContext = createContext<IUserContext | null>(null);

interface IUserProviderProps {
    children: React.ReactNode;
    initialUser: IUser | null;
}

export function UserProvider({ children, initialUser }: IUserProviderProps): React.ReactElement {
    // Seeded from the server — no useEffect or client fetch needed on initial render
    const [user, setUser] = useState<IUser | null>(initialUser);
    // isLoading is only true during an explicit refetch (e.g. after profile update)
    const [isLoading, setIsLoading] = useState(false);

    const refetch = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        try {
            const data = await userApi.getMe();
            setUser(data);
        } catch (err: unknown) {
            if (err instanceof ApiError && err.status === 401) {
                setUser(null);
            } else {
                console.error('Failed to fetch current user', err);
                setUser(null);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    return <UserContext value={{ user, isLoading, refetch }}>{children}</UserContext>;
}

export function useCurrentUser(): IUserContext {
    const context = use(UserContext);
    if (!context) throw new Error('useCurrentUser must be used within UserProvider');
    return context;
}
