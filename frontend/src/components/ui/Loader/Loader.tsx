import styles from './Loader.module.scss';
import BookLoader from './components/BookLoader/BookLoader';

export type TLoaderSize = 'sm' | 'md' | 'lg';

export interface ILoaderProps {
    size?: TLoaderSize;
    /** Wrap the spinner in a centered block with vertical breathing room. Default true. */
    centered?: boolean;
    /** Accessible label announced to screen readers. */
    label?: string;
    /** Use when a parent loading state already exposes an accessible status message. */
    decorative?: boolean;
}

export default function Loader({
    size = 'md',
    centered = true,
    label = 'Loading',
    decorative = false,
}: Readonly<ILoaderProps>): React.ReactElement {
    const indicator = (
        <span
            aria-hidden={decorative || undefined}
            aria-label={decorative ? undefined : label}
            role={decorative ? undefined : 'status'}
        >
            <BookLoader size={size} />
        </span>
    );

    if (!centered) return indicator;

    return <div className={styles.loader}>{indicator}</div>;
}
