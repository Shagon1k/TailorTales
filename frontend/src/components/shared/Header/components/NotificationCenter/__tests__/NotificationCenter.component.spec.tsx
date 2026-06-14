import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { INotification } from '@/types/notification.types';
import NotificationCenter from '../NotificationCenter';

const mockGetAll = vi.hoisted(() => vi.fn());
const mockGetUnreadCount = vi.hoisted(() => vi.fn());
const mockMarkRead = vi.hoisted(() => vi.fn());
const mockMarkAllRead = vi.hoisted(() => vi.fn());
const mockStream = vi.hoisted(() => ({
    onmessage: null as ((event: { data: string }) => void) | null,
    close: vi.fn(),
}));

vi.mock('@/api/notifications', () => ({
    notificationsApi: {
        getAll: mockGetAll,
        getUnreadCount: mockGetUnreadCount,
        markRead: mockMarkRead,
        markAllRead: mockMarkAllRead,
        openUnreadCountStream: vi.fn().mockReturnValue(mockStream),
    },
}));

const NOTIFICATION: INotification = {
    id: 'notif-1',
    userId: 'user-1',
    type: 'STORY_COMPLETED',
    payload: { storyId: 'story-1', title: 'Why Mountains Breathe Smoke', childName: 'Maya' },
    readAt: null,
    createdAt: '2026-06-12T10:00:00.000Z',
};

function renderCenter(): void {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
        <MantineProvider env="test">
            <QueryClientProvider client={queryClient}>
                <NotificationCenter />
            </QueryClientProvider>
        </MantineProvider>,
    );
}

describe('NotificationCenter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStream.onmessage = null;
        mockGetAll.mockResolvedValue([NOTIFICATION]);
        mockGetUnreadCount.mockResolvedValue(0);
        mockMarkRead.mockResolvedValue(undefined);
        mockMarkAllRead.mockResolvedValue(undefined);
    });

    describe('badge', () => {
        it('should show the unread count from the initial REST fetch', async () => {
            mockGetUnreadCount.mockResolvedValue(3);
            renderCenter();

            expect(
                await screen.findByRole('button', { name: 'Notifications, 3 unread' }),
            ).toBeInTheDocument();
        });

        it('should update the unread count from SSE events', async () => {
            renderCenter();
            await waitFor(() => expect(mockStream.onmessage).not.toBeNull());

            act(() => {
                mockStream.onmessage?.({
                    data: JSON.stringify({ type: 'unread-count', count: 5 }),
                });
            });

            expect(
                screen.getByRole('button', { name: 'Notifications, 5 unread' }),
            ).toBeInTheDocument();
        });

        it('should ignore malformed SSE events', async () => {
            renderCenter();
            await waitFor(() => expect(mockStream.onmessage).not.toBeNull());

            act(() => {
                mockStream.onmessage?.({ data: 'not-json' });
            });

            expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
        });
    });

    describe('when the bell is clicked', () => {
        it('should open the dropdown with the notifications list', async () => {
            renderCenter();

            await userEvent.click(screen.getByRole('button', { name: /notifications/i }));

            expect(await screen.findByRole('link', { name: /Maya's tale/ })).toBeInTheDocument();
        });
    });

    describe('when an unread notification is clicked', () => {
        it('should mark it as read', async () => {
            renderCenter();

            await userEvent.click(screen.getByRole('button', { name: /notifications/i }));
            await userEvent.click(await screen.findByRole('link', { name: /Maya's tale/ }));

            expect(mockMarkRead).toHaveBeenCalledWith('notif-1', expect.anything());
        });
    });

    describe('mark all as read', () => {
        it('should be hidden when there are no unread notifications', async () => {
            renderCenter();

            await userEvent.click(screen.getByRole('button', { name: /notifications/i }));
            await screen.findByRole('link', { name: /Maya's tale/ });

            expect(
                screen.queryByRole('button', { name: /mark all as read/i }),
            ).not.toBeInTheDocument();
        });

        it('should call the mark-all endpoint when clicked', async () => {
            mockGetUnreadCount.mockResolvedValue(2);
            renderCenter();

            await userEvent.click(
                await screen.findByRole('button', { name: 'Notifications, 2 unread' }),
            );
            await userEvent.click(await screen.findByRole('button', { name: /mark all as read/i }));

            expect(mockMarkAllRead).toHaveBeenCalledOnce();
        });
    });

    describe('on unmount', () => {
        it('should close the SSE stream', async () => {
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false } },
            });
            const { unmount } = render(
                <MantineProvider env="test">
                    <QueryClientProvider client={queryClient}>
                        <NotificationCenter />
                    </QueryClientProvider>
                </MantineProvider>,
            );
            await waitFor(() => expect(mockStream.onmessage).not.toBeNull());

            unmount();

            expect(mockStream.close).toHaveBeenCalled();
        });
    });
});
