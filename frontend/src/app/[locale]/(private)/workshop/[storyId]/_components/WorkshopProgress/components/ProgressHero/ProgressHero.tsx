'use client';

import { useTranslations } from 'next-intl';
import MascotImage from '@/components/shared/MascotImage/MascotImage';
import styles from './ProgressHero.module.scss';

export interface IProgressHeroProps {
    completedPages: number;
    totalPages: number;
    stage: string | null;
    isCompleted: boolean;
    isFailed: boolean;
}

export default function ProgressHero({
    completedPages,
    totalPages,
    stage,
    isCompleted,
    isFailed,
}: Readonly<IProgressHeroProps>): React.ReactElement {
    const t = useTranslations('workshopProgress.hero');

    const label = isFailed
        ? t('failed')
        : isCompleted
          ? t('completed')
          : t('inProgress', { completedPages, totalPages, stage: stage ?? t('startingStage') });

    return (
        <div className={styles.hero}>
            <MascotImage image="fox-books" size={140} glow="aura" />
            <progress
                className={styles.hero__progress}
                value={completedPages}
                max={totalPages}
                aria-label={t('ariaLabel', { completedPages, totalPages })}
            >
                {completedPages} / {totalPages}
            </progress>
            <p className={styles.hero__label}>{label}</p>
        </div>
    );
}
