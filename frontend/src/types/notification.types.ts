export type INotificationType =
    | 'STORY_COMPLETED'
    | 'STORY_FAILED'
    | 'PAYMENT_FAILED'
    | 'SUBSCRIPTION_CANCELED';

/**
 * Union of the per-type payload fields (backend stores them as Json).
 * Story events carry story fields; billing events have an empty payload.
 */
export interface INotificationPayload {
    storyId?: string;
    title?: string;
    childName?: string;
    question?: string;
    error?: string;
}

export interface INotification {
    id: string;
    userId: string;
    type: INotificationType;
    payload: INotificationPayload;
    readAt: string | null;
    createdAt: string;
}
