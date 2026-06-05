import { apiFetch } from '@/lib/api';

export async function fetchUnreadCount(): Promise<number> {
    const data = await apiFetch<{ count: number }>('/notifications/unread-count');
    return data.count;
}

export async function markAllNotificationsRead(): Promise<void> {
    await apiFetch('/notifications/read-all', { method: 'PATCH' });
}
