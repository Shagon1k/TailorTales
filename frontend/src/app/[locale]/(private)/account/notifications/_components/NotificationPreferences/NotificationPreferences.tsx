'use client';

import { useTranslations } from 'next-intl';
import { Stack } from '@mantine/core';
import Card from '@/components/ui/Card/Card';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import Switch from '@/components/ui/Switch/Switch';
import {
    useNotificationPreferences,
    useUpdateNotificationPreferences,
} from '@/hooks/notifications';
import { PREFERENCE_ROWS } from './notification-preferences.config';
import styles from './NotificationPreferences.module.scss';

export default function NotificationPreferences(): React.ReactElement {
    const t = useTranslations('account.notifications');
    const { data: preferences, isError } = useNotificationPreferences();
    const update = useUpdateNotificationPreferences();

    const translatedRows = [
        {
            ...PREFERENCE_ROWS[0],
            label: t('events.storyCompleted.label'),
            description: t('events.storyCompleted.description'),
            toggles: [
                { ...PREFERENCE_ROWS[0].toggles[0], label: t('channels.email') },
                { ...PREFERENCE_ROWS[0].toggles[1], label: t('channels.inApp') },
            ],
        },
        {
            ...PREFERENCE_ROWS[1],
            label: t('events.storyFailed.label'),
            description: t('events.storyFailed.description'),
            toggles: [
                { ...PREFERENCE_ROWS[1].toggles[0], label: t('channels.email') },
                { ...PREFERENCE_ROWS[1].toggles[1], label: t('channels.inApp') },
            ],
        },
        {
            ...PREFERENCE_ROWS[2],
            label: t('events.paymentFailed.label'),
            description: t('events.paymentFailed.description'),
            note: t('events.paymentFailed.note'),
            toggles: [{ ...PREFERENCE_ROWS[2].toggles[0], label: t('channels.inApp') }],
        },
        {
            ...PREFERENCE_ROWS[3],
            label: t('events.subscriptionRenewed.label'),
            description: t('events.subscriptionRenewed.description'),
            toggles: [{ ...PREFERENCE_ROWS[3].toggles[0], label: t('channels.email') }],
        },
        {
            ...PREFERENCE_ROWS[4],
            label: t('events.subscriptionCanceled.label'),
            description: t('events.subscriptionCanceled.description'),
            toggles: [
                { ...PREFERENCE_ROWS[4].toggles[0], label: t('channels.email') },
                { ...PREFERENCE_ROWS[4].toggles[1], label: t('channels.inApp') },
            ],
        },
    ];

    return (
        <Card variant="dark" size="md">
            <Stack gap="sm">
                <CapsLabel>{t('eyebrow')}</CapsLabel>
                <p className={styles.prefs__copy}>{t('body')}</p>

                {isError && <p className={styles.prefs__error}>{t('loadError')}</p>}

                {preferences && (
                    <ul className={styles.prefs__rows}>
                        {translatedRows.map((row) => (
                            <li key={row.label} className={styles.prefs__row}>
                                <div className={styles['prefs__row-text']}>
                                    <span className={styles['prefs__row-label']}>{row.label}</span>
                                    <span className={styles['prefs__row-desc']}>
                                        {row.description}
                                    </span>
                                    {row.note && (
                                        <span className={styles['prefs__row-note']}>
                                            {row.note}
                                        </span>
                                    )}
                                </div>
                                <div className={styles['prefs__row-toggles']}>
                                    {row.toggles.map((toggle) => (
                                        <Switch
                                            key={toggle.label}
                                            label={toggle.label}
                                            checked={toggle.isOn(preferences)}
                                            onChange={(enabled) =>
                                                update.mutate(toggle.toPatch(enabled))
                                            }
                                        />
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Stack>
        </Card>
    );
}
