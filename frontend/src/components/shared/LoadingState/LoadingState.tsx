import clsx from 'clsx';
import Loader from '@/components/ui/Loader/Loader';
import styles from './LoadingState.module.scss';

export type TLoadingStateVariant = 'page' | 'container' | 'overlay';

export interface ILoadingStateProps {
    label: string;
    variant?: TLoadingStateVariant;
    showLabel?: boolean;
}

export default function LoadingState({
    label,
    variant = 'page',
    showLabel = false,
}: Readonly<ILoadingStateProps>): React.ReactElement {
    return (
        <section className={clsx(styles.state, styles[`m-${variant}`])} role="status">
            <div className={styles.state__content}>
                <Loader size="lg" centered={false} decorative />
                {showLabel ? (
                    <p className={styles.state__label}>{label}</p>
                ) : (
                    <span className={styles['state__sr-label']}>{label}</span>
                )}
            </div>
        </section>
    );
}
