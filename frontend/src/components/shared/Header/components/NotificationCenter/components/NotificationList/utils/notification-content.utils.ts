import type { INotification } from '@/types/notification.types';

export interface INotificationContent {
    textKey: string;
    textValues: Record<string, string>;
    href: string;
}

/** Maps a notification to its translation key, interpolation values, and navigation target. */
export function getNotificationContent(notification: INotification): INotificationContent {
    const { type, payload } = notification;
    switch (type) {
        case 'STORY_COMPLETED':
            return {
                textKey: 'storyCompleted',
                textValues: { childName: payload.childName ?? '', title: payload.title ?? '' },
                href: `/library/${payload.storyId}`,
            };
        case 'STORY_FAILED':
            return {
                textKey: 'storyFailed',
                textValues: { childName: payload.childName ?? '' },
                href: '/workshop',
            };
        case 'PAYMENT_FAILED':
            return {
                textKey: 'paymentFailed',
                textValues: {},
                href: '/account/subscription',
            };
        case 'SUBSCRIPTION_CANCELED':
            return {
                textKey: 'subscriptionCanceled',
                textValues: {},
                href: '/pricing',
            };
    }
}
