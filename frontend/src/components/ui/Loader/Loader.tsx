import { Loader as MantineLoader } from '@mantine/core';
import styles from './Loader.module.scss';

export type TLoaderSize = 'sm' | 'md' | 'lg';

export interface ILoaderProps {
    size?: TLoaderSize;
    /** Wrap the spinner in a centered block with vertical breathing room. Default true. */
    centered?: boolean;
    /** Accessible label announced to screen readers. */
    label?: string;
}

export default function Loader({
    size = 'md',
    centered = true,
    label = 'Loading',
}: Readonly<ILoaderProps>): React.ReactElement {
    const spinner = <MantineLoader size={size} aria-label={label} />;

    if (!centered) return spinner;

    return <div className={styles.loader}>{spinner}</div>;
}
