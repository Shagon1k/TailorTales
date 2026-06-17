import type {
    INotificationPreferences,
    INotificationPreferencesUpdate,
} from '@/types/notification.types';

export interface IPreferenceToggle {
    /** Channel name shown beside the switch. */
    label: string;
    isOn: (prefs: INotificationPreferences) => boolean;
    toPatch: (enabled: boolean) => INotificationPreferencesUpdate;
}

export interface IPreferenceRow {
    label: string;
    description: string;
    toggles: IPreferenceToggle[];
    /** Optional note for a channel that can't be turned off. */
    note?: string;
}

/**
 * Declarative event rows. Each toggle reads/writes one channel with explicit,
 * type-safe accessors — no dynamic keys, so the asymmetric shape stays honest
 * (paymentFailed has no email toggle; subscriptionRenewed has no in-app one).
 */
export const PREFERENCE_ROWS: IPreferenceRow[] = [
    {
        label: 'Tale is ready',
        description: 'When a new story finishes generating.',
        toggles: [
            {
                label: 'Email',
                isOn: (p) => p.storyCompleted.email,
                toPatch: (v) => ({ storyCompleted: { email: v } }),
            },
            {
                label: 'In-app',
                isOn: (p) => p.storyCompleted.inApp,
                toPatch: (v) => ({ storyCompleted: { inApp: v } }),
            },
        ],
    },
    {
        label: "Tale didn't finish",
        description: 'When a story fails to generate. No credits are spent.',
        toggles: [
            {
                label: 'Email',
                isOn: (p) => p.storyFailed.email,
                toPatch: (v) => ({ storyFailed: { email: v } }),
            },
            {
                label: 'In-app',
                isOn: (p) => p.storyFailed.inApp,
                toPatch: (v) => ({ storyFailed: { inApp: v } }),
            },
        ],
    },
    {
        label: 'Payment failed',
        description: 'When a subscription payment cannot be processed.',
        note: 'Email is always sent for billing issues.',
        toggles: [
            {
                label: 'In-app',
                isOn: (p) => p.paymentFailed.inApp,
                toPatch: (v) => ({ paymentFailed: { inApp: v } }),
            },
        ],
    },
    {
        label: 'Plan renewed',
        description: 'When your subscription renews for another month.',
        toggles: [
            {
                label: 'Email',
                isOn: (p) => p.subscriptionRenewed.email,
                toPatch: (v) => ({ subscriptionRenewed: { email: v } }),
            },
        ],
    },
    {
        label: 'Subscription ended',
        description: 'When your subscription ends and you return to the free plan.',
        toggles: [
            {
                label: 'Email',
                isOn: (p) => p.subscriptionCanceled.email,
                toPatch: (v) => ({ subscriptionCanceled: { email: v } }),
            },
            {
                label: 'In-app',
                isOn: (p) => p.subscriptionCanceled.inApp,
                toPatch: (v) => ({ subscriptionCanceled: { inApp: v } }),
            },
        ],
    },
];
