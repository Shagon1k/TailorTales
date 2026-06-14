import type { INotification } from '@/types/notification.types';

export interface INotificationContent {
    text: string;
    href: string;
}

/** Maps a notification to its display text and navigation target. */
export function getNotificationContent(notification: INotification): INotificationContent {
    const { type, payload } = notification;
    switch (type) {
        case 'STORY_COMPLETED':
            return {
                text: `${payload.childName}'s tale "${payload.title}" is ready to read`,
                href: `/library/${payload.storyId}`,
            };
        case 'STORY_FAILED':
            return {
                text: `We couldn't finish ${payload.childName}'s tale — no credits were spent`,
                href: '/workshop',
            };
        case 'PAYMENT_FAILED':
            return {
                text: `We couldn't process your payment — please review billing`,
                href: '/account/subscription',
            };
        case 'SUBSCRIPTION_CANCELED':
            return {
                text: `Your subscription has ended — you're now on the free plan`,
                href: '/pricing',
            };
    }
}
