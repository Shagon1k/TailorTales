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

/**
 * Per-event channel toggles. Mirrors the backend shape: channels a user cannot
 * turn off are absent (paymentFailed email is always sent; subscriptionRenewed
 * has no in-app bell record).
 */
export interface INotificationPreferences {
    storyCompleted: { email: boolean; inApp: boolean };
    storyFailed: { email: boolean; inApp: boolean };
    paymentFailed: { inApp: boolean };
    subscriptionCanceled: { email: boolean; inApp: boolean };
    subscriptionRenewed: { email: boolean };
}

/** Partial patch sent to PATCH /notifications/preferences. */
export type INotificationPreferencesUpdate = {
    [K in keyof INotificationPreferences]?: Partial<INotificationPreferences[K]>;
};
