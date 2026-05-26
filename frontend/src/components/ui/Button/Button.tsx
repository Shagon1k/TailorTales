import { Button as MantineButton, type ButtonProps as IMantineButtonProps } from '@mantine/core';
import clsx from 'clsx';
import type { OmitStyling } from '@/components/ui/types';
import styles from './Button.module.scss';

export type TButtonVariant = 'primary' | 'secondary' | 'quiet' | 'on-card';
export type TButtonSize = 'default' | 'lg';

export interface IButtonProps extends OmitStyling<IMantineButtonProps, 'variant' | 'size' | 'radius'> {
    variant?: TButtonVariant;
    size?: TButtonSize;
}

export default function Button({
    variant = 'primary',
    size = 'default',
    ...props
}: Readonly<IButtonProps>): React.ReactElement {
    return (
        <MantineButton
            variant="filled"
            classNames={{
                root: clsx(styles.button, styles[`m-${variant}`], styles[`m-${size}`]),
            }}
            {...props}
        />
    );
}
