import { Select as MantineSelect, type SelectProps as IMantineSelectProps } from '@mantine/core';
import clsx from 'clsx';
import type { OmitStyling } from '@/components/ui/types';
import styles from './Select.module.scss';

export type TSelectSurface = 'twilight' | 'cream';

export interface ISelectProps extends OmitStyling<IMantineSelectProps, 'variant' | 'size' | 'radius'> {
    surface?: TSelectSurface;
}

export default function Select({ surface = 'twilight', ...props }: Readonly<ISelectProps>): React.ReactElement {
    return (
        <MantineSelect
            variant="unstyled"
            classNames={{
                root: clsx(styles.select, styles[`m-${surface}`]),
                label: styles['select__label'],
                wrapper: styles['select__wrapper'],
                input: styles['select__field'],
                section: styles['select__chevron'],
                description: styles['select__helper'],
                error: styles['select__error'],
                dropdown: styles['select__dropdown'],
                option: styles['select__option'],
            }}
            {...props}
        />
    );
}
