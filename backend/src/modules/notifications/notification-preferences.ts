/**
 * Per-event notification channel toggles. Channels a user cannot turn off are
 * simply absent from the shape:
 * - paymentFailed email is billing-critical — always sent, no toggle.
 * - subscriptionRenewed is email-only (no bell record per ROADMAP).
 */
export interface INotificationPreferences {
    storyCompleted: { email: boolean; inApp: boolean };
    storyFailed: { email: boolean; inApp: boolean };
    paymentFailed: { inApp: boolean };
    subscriptionCanceled: { email: boolean; inApp: boolean };
    subscriptionRenewed: { email: boolean };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

/**
 * Merges the stored partial JSON (`User.notificationPreferences`, possibly null)
 * over the defaults. Every toggle defaults to ON; falling back per field (instead
 * of validating the whole object) keeps existing user toggles intact when a new
 * event type is added later.
 */
export function mergePreferences(stored: unknown): INotificationPreferences {
    const isOn = (event: string, channel: string): boolean => {
        if (!isRecord(stored)) return true;
        const eventPrefs = stored[event];
        if (!isRecord(eventPrefs)) return true;
        const value = eventPrefs[channel];
        return typeof value === 'boolean' ? value : true;
    };

    return {
        storyCompleted: {
            email: isOn('storyCompleted', 'email'),
            inApp: isOn('storyCompleted', 'inApp'),
        },
        storyFailed: {
            email: isOn('storyFailed', 'email'),
            inApp: isOn('storyFailed', 'inApp'),
        },
        paymentFailed: {
            inApp: isOn('paymentFailed', 'inApp'),
        },
        subscriptionCanceled: {
            email: isOn('subscriptionCanceled', 'email'),
            inApp: isOn('subscriptionCanceled', 'inApp'),
        },
        subscriptionRenewed: {
            email: isOn('subscriptionRenewed', 'email'),
        },
    };
}
