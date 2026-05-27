import { Badge as MantineBadge, type BadgeProps as IMantineBadgeProps } from '@mantine/core';
import clsx from 'clsx';
import type { OmitStyling } from '@/components/ui/types';
import styles from './Tag.module.scss';

export type TTagVariant = 'filled' | 'warm' | 'gold';

export interface ITagProps extends OmitStyling<IMantineBadgeProps, 'variant' | 'size' | 'radius'> {
    variant?: TTagVariant;
}

export default function Tag({
    variant = 'filled',
    ...props
}: Readonly<ITagProps>): React.ReactElement {
    return (
        <MantineBadge
            variant="filled"
            classNames={{
                root: clsx(styles.tag, styles[`m-${variant}`]),
            }}
            {...props}
        />
    );
}
