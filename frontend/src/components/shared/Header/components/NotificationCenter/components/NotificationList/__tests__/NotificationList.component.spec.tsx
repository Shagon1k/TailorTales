import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import type { INotification } from '@/types/notification.types';
import NotificationList from '../NotificationList';

function buildNotification(overrides: Partial<INotification> = {}): INotification {
    return {
        id: 'notif-1',
        userId: 'user-1',
        type: 'STORY_COMPLETED',
        payload: { storyId: 'story-1', title: 'Why Mountains Breathe Smoke', childName: 'Maya' },
        readAt: null,
        createdAt: new Date(Date.now() - 3_600_000).toISOString(),
        ...overrides,
    };
}

function renderList(props: React.ComponentProps<typeof NotificationList>): void {
    render(
        <MantineProvider env="test">
            <NotificationList {...props} />
        </MantineProvider>,
    );
}

describe('NotificationList', () => {
    describe('given no notifications', () => {
        it('should show the empty state copy', () => {
            renderList({ notifications: [] });
            expect(screen.getByText(/all quiet for now/i)).toBeInTheDocument();
        });
    });

    describe('given a STORY_COMPLETED notification', () => {
        it('should link to the story with child name and title in the text', () => {
            renderList({ notifications: [buildNotification()] });

            const link = screen.getByRole('link', {
                name: /Maya's tale "Why Mountains Breathe Smoke" is ready to read/,
            });
            expect(link).toHaveAttribute('href', '/library/story-1');
        });
    });

    describe('given a STORY_FAILED notification', () => {
        it('should link to the workshop', () => {
            renderList({
                notifications: [
                    buildNotification({
                        type: 'STORY_FAILED',
                        payload: { storyId: 'story-1', childName: 'Maya', question: 'Why?' },
                    }),
                ],
            });

            const link = screen.getByRole('link', { name: /couldn't finish Maya's tale/ });
            expect(link).toHaveAttribute('href', '/workshop');
        });
    });

    describe('given a PAYMENT_FAILED notification', () => {
        it('should link to the subscription page', () => {
            renderList({
                notifications: [buildNotification({ type: 'PAYMENT_FAILED', payload: {} })],
            });

            const link = screen.getByRole('link', { name: /couldn't process your payment/ });
            expect(link).toHaveAttribute('href', '/account/subscription');
        });
    });

    describe('given a SUBSCRIPTION_CANCELED notification', () => {
        it('should link to the pricing page', () => {
            renderList({
                notifications: [buildNotification({ type: 'SUBSCRIPTION_CANCELED', payload: {} })],
            });

            const link = screen.getByRole('link', { name: /subscription has ended/ });
            expect(link).toHaveAttribute('href', '/pricing');
        });
    });

    describe('given unread and read notifications', () => {
        it('should expose the unread state to assistive tech', () => {
            renderList({
                notifications: [
                    buildNotification({ id: 'unread-1', readAt: null }),
                    buildNotification({
                        id: 'read-1',
                        readAt: '2026-06-12T10:00:00.000Z',
                        payload: { storyId: 'story-2', title: 'Read Tale', childName: 'Ben' },
                    }),
                ],
            });

            expect(screen.getByRole('link', { name: /\(unread\)/ })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /Read Tale/ })).not.toHaveAccessibleName(
                expect.stringContaining('(unread)'),
            );
        });
    });

    describe('when a notification is clicked', () => {
        it('should call onItemClick with the notification', async () => {
            const onItemClick = vi.fn();
            const notification = buildNotification();
            renderList({ notifications: [notification], onItemClick });

            await userEvent.click(screen.getByRole('link'));

            expect(onItemClick).toHaveBeenCalledWith(notification);
        });
    });
});
