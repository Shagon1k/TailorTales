import Link from 'next/link';
import clsx from 'clsx';
import MascotImage from '@/components/shared/MascotImage/MascotImage';
import styles from './BrandMark.module.scss';

type TBrandMarkSize = 'default' | 'lg';

const LOGO_SIZE: Record<TBrandMarkSize, number> = {
    default: 36,
    lg: 56,
};

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
                [styles['m-default']]: size === 'default',
                [styles['m-lg']]: size === 'lg',
            })}
        >
            <MascotImage image="fox-logo" size={LOGO_SIZE[size]} />
            <span className={styles.brand__name}>TailorTales</span>
        </Link>
    );
}
