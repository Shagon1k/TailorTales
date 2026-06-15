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
    const label = isFailed
        ? 'Generation failed'
        : isCompleted
          ? 'Your tale is ready!'
          : `page ${completedPages} of ${totalPages} · ${stage ?? 'starting'}`;

    return (
        <div className={styles.hero}>
            <MascotImage image="fox-books" size={140} glow="aura" />
            <progress
                className={styles.hero__progress}
                value={completedPages}
                max={totalPages}
                aria-label={`Generation progress: ${completedPages} of ${totalPages} pages`}
            >
                {completedPages} / {totalPages}
            </progress>
            <p className={styles.hero__label}>{label}</p>
        </div>
    );
}
