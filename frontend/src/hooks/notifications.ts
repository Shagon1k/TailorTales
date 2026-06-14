import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications';
import type { INotification } from '@/types/notification.types';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

/** `enabled` gates fetching — the dropdown only loads the list when opened. */
export function useNotifications(enabled: boolean): ReturnType<typeof useQuery<INotification[]>> {
    return useQuery({
        queryKey: NOTIFICATIONS_QUERY_KEY,
        queryFn: notificationsApi.getAll,
        enabled,
    });
}

export function useMarkNotificationRead(): ReturnType<typeof useMutation<void, Error, string>> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: notificationsApi.markRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
    });
}

export function useMarkAllNotificationsRead(): ReturnType<typeof useMutation<void, Error, void>> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: notificationsApi.markAllRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
    });
}
