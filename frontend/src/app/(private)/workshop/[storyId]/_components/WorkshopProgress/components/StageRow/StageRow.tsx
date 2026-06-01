import clsx from 'clsx';
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
    return (
        <div className={styles.row}>
            {STAGE_STEPS.map((step, i) => {
                const done = i < currentStepIndex || isCompleted;
                const active = i === currentStepIndex && !isCompleted;
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
                        <strong className={styles.step__label}>{step.label}</strong>
                        <span className={styles.step__sub}>{step.sub}</span>
                    </div>
                );
            })}
        </div>
    );
}
