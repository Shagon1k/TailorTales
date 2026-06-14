import { apiFetch, getApiBaseUrl } from '@/lib/api';
import type { INotification } from '@/types/notification.types';

export const notificationsApi = {
    /** Last 20 notifications, newest first. */
    getAll: (): Promise<INotification[]> => apiFetch<INotification[]>('/notifications'),

    getUnreadCount: async (): Promise<number> => {
        const data = await apiFetch<{ count: number }>('/notifications/unread-count');
        return data.count;
    },

    markRead: (id: string): Promise<void> =>
        apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),

    markAllRead: (): Promise<void> => apiFetch('/notifications/read-all', { method: 'PATCH' }),

    /**
     * SSE stream pushing `{ type: 'unread-count', count }` on connect and on
     * every change. Returns an EventSource; caller is responsible for closing it.
     */
    openUnreadCountStream: (): EventSource =>
        new EventSource(`${getApiBaseUrl()}/notifications/stream`, { withCredentials: true }),
};
