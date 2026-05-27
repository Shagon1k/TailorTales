import { Paper as MantinePaper, type PaperProps as IMantinePaperProps } from '@mantine/core';
import clsx from 'clsx';
import type { OmitStyling } from '@/components/ui/types';
import styles from './Card.module.scss';

export type TCardVariant = 'default' | 'dark' | 'gradient' | 'outlined';
export type TCardSize = 'sm' | 'md' | 'lg' | 'hero';

export interface ICardProps extends OmitStyling<IMantinePaperProps, 'shadow' | 'radius' | 'withBorder'> {
    variant?: TCardVariant;
    size?: TCardSize;
    children?: React.ReactNode;
}

export default function Card({
    variant = 'default',
    size = 'md',
    ...props
}: Readonly<ICardProps>): React.ReactElement {
    return (
        <MantinePaper
            classNames={{
                root: clsx(styles.card, styles[`m-${variant}`], styles[`m-${size}`]),
            }}
            {...props}
        />
    );
}
