import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications';
import type {
    INotificationPreferences,
    INotificationPreferencesUpdate,
    INotification,
} from '@/types/notification.types';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;
export const NOTIFICATION_PREFERENCES_QUERY_KEY = ['notification-preferences'] as const;

/** Merges a partial patch over the full preferences — used for optimistic updates. */
function applyPreferencesPatch(
    current: INotificationPreferences,
    patch: INotificationPreferencesUpdate,
): INotificationPreferences {
    return {
        storyCompleted: { ...current.storyCompleted, ...patch.storyCompleted },
        storyFailed: { ...current.storyFailed, ...patch.storyFailed },
        paymentFailed: { ...current.paymentFailed, ...patch.paymentFailed },
        subscriptionCanceled: { ...current.subscriptionCanceled, ...patch.subscriptionCanceled },
        subscriptionRenewed: { ...current.subscriptionRenewed, ...patch.subscriptionRenewed },
    };
}

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

export function useNotificationPreferences(): ReturnType<
    typeof useQuery<INotificationPreferences>
> {
    return useQuery({
        queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY,
        queryFn: notificationsApi.getPreferences,
    });
}

export function useUpdateNotificationPreferences(): ReturnType<
    typeof useMutation<
        INotificationPreferences,
        Error,
        INotificationPreferencesUpdate,
        { previous: INotificationPreferences | undefined }
    >
> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: notificationsApi.updatePreferences,
        // Optimistic: flip the toggle instantly, roll back on error.
        onMutate: async (patch) => {
            await queryClient.cancelQueries({ queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY });
            const previous = queryClient.getQueryData<INotificationPreferences>(
                NOTIFICATION_PREFERENCES_QUERY_KEY,
            );
            if (previous) {
                queryClient.setQueryData(
                    NOTIFICATION_PREFERENCES_QUERY_KEY,
                    applyPreferencesPatch(previous, patch),
                );
            }
            return { previous };
        },
        onError: (_error, _patch, context) => {
            if (context?.previous) {
                queryClient.setQueryData(NOTIFICATION_PREFERENCES_QUERY_KEY, context.previous);
            }
        },
        // Server returns the authoritative full set.
        onSuccess: (updated) =>
            queryClient.setQueryData(NOTIFICATION_PREFERENCES_QUERY_KEY, updated),
    });
}
