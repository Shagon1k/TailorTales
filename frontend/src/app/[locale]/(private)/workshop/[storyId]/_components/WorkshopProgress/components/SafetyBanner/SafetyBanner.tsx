'use client';

import { useTranslations } from 'next-intl';
import styles from './SafetyBanner.module.scss';

export interface ISafetyBannerProps {
    childName: string;
}

export default function SafetyBanner({
    childName,
}: Readonly<ISafetyBannerProps>): React.ReactElement {
    const t = useTranslations('workshopProgress');

    return (
        <div className={styles.banner}>
            <span aria-hidden="true">🤍</span>
            <span>{t('safety', { childName })}</span>
        </div>
    );
}
