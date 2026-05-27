import Link from 'next/link';
import clsx from 'clsx';
import styles from './BrandMark.module.scss';

type TBrandMarkSize = 'sm' | 'default' | 'lg';

interface IBrandMarkProps {
    size?: TBrandMarkSize;
}

export default function BrandMark({
    size = 'default',
}: Readonly<IBrandMarkProps>): React.ReactElement {
    return (
        <Link
            href="/"
            className={clsx(styles.brand, {
                [styles['m-sm']]: size === 'sm',
                [styles['m-lg']]: size === 'lg',
            })}
        >
            <span className={styles.brand__mark} aria-hidden="true" />
            <span className={styles.brand__name}>TailorTales</span>
        </Link>
    );
}
