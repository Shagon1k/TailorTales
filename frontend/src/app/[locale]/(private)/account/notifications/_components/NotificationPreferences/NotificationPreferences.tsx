'use client';

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
    const { data: preferences, isError } = useNotificationPreferences();
    const update = useUpdateNotificationPreferences();

    return (
        <Card variant="dark" size="md">
            <Stack gap="sm">
                <CapsLabel>Notification preferences</CapsLabel>
                <p className={styles.prefs__copy}>
                    Choose how you hear from us. Email goes to your inbox; in-app shows up in the
                    bell at the top of the page.
                </p>

                {isError && (
                    <p className={styles.prefs__error}>
                        We couldn&apos;t load your preferences — please refresh the page.
                    </p>
                )}

                {preferences && (
                    <ul className={styles.prefs__rows}>
                        {PREFERENCE_ROWS.map((row) => (
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
