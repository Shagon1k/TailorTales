import {
    Progress as MantineProgress,
    type ProgressProps as IMantineProgressProps,
} from '@mantine/core';
import clsx from 'clsx';
import type { OmitStyling } from '@/components/ui/types';
import styles from './Progress.module.scss';

export type TProgressSize = 'sm' | 'md' | 'lg';

const SIZE_PX: Record<TProgressSize, number> = { sm: 4, md: 8, lg: 14 };

export interface IProgressProps extends OmitStyling<
    IMantineProgressProps,
    'size' | 'radius' | 'color'
> {
    size?: TProgressSize;
}

export default function Progress({
    size = 'md',
    ...props
}: Readonly<IProgressProps>): React.ReactElement {
    return (
        <MantineProgress
            size={SIZE_PX[size]}
            classNames={{
                root: clsx(styles.progress, styles[`m-${size}`]),
                section: styles['progress__section'],
            }}
            {...props}
        />
    );
}
