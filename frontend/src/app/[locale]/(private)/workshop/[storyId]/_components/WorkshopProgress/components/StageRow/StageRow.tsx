'use client';

import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import { STAGE_STEPS } from '../../utils/stage.utils';
import styles from './StageRow.module.scss';

const ROMAN_NUMERALS = ['i', 'ii', 'iii', 'iv', 'v'] as const;

export interface IStageRowProps {
    currentStepIndex: number;
    isCompleted: boolean;
}

export default function StageRow({
    currentStepIndex,
    isCompleted,
}: Readonly<IStageRowProps>): React.ReactElement {
    const t = useTranslations('workshopProgress.stages');

    const stageLabels: Record<string, { label: string; sub: string }> = {
        planning: { label: t('planning.label'), sub: t('planning.subheading') },
        words: { label: t('words.label'), sub: t('words.subheading') },
        pictures: { label: t('pictures.label'), sub: t('pictures.subheading') },
        binding: { label: t('binding.label'), sub: t('binding.subheading') },
        ready: { label: t('ready.label'), sub: t('ready.subheading') },
    };

    return (
        <div className={styles.row}>
            {STAGE_STEPS.map((step, i) => {
                const done = i < currentStepIndex || isCompleted;
                const active = i === currentStepIndex && !isCompleted;
                const { label, sub } = stageLabels[step.key] ?? { label: step.key, sub: '' };
                return (
                    <div
                        key={step.key}
                        className={clsx(styles.step, {
                            [styles['m-done']]: done,
                            [styles['m-active']]: active,
                        })}
                    >
                        <span className={styles.step__num}>
                            {done ? '✓' : `${ROMAN_NUMERALS[i]}.`}
                        </span>
                        <strong className={styles.step__label}>{label}</strong>
                        <span className={styles.step__sub}>{sub}</span>
                    </div>
                );
            })}
        </div>
    );
}
