import {
    Divider as MantineDivider,
    type DividerProps as IMantineDividerProps,
} from '@mantine/core';
import clsx from 'clsx';
import type { OmitStyling } from '@/components/ui/types';
import styles from './Divider.module.scss';

export type TDividerVariant = 'solid' | 'dashed' | 'needle';

export interface IDividerProps extends OmitStyling<
    IMantineDividerProps,
    'variant' | 'color' | 'size'
> {
    variant?: TDividerVariant;
}

function NeedleSvg(): React.ReactElement {
    return (
        <svg
            width="44"
            height="5"
            viewBox="0 0 44 5"
            fill="none"
            aria-hidden="true"
            className={styles['divider__needle']}
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2 0H41L44 2.5L41 5H2C0.666667 5 0 4.33333 0 3V2C0 0.666667 0.666667 0 2 0ZM5.75 2.5C5.75 2.83152 5.8817 3.14946 6.11612 3.38388C6.35054 3.6183 6.66848 3.75 7 3.75C7.33152 3.75 7.64946 3.6183 7.88388 3.38388C8.1183 3.14946 8.25 2.83152 8.25 2.5C8.25 2.16848 8.1183 1.85054 7.88388 1.61612C7.64946 1.3817 7.33152 1.25 7 1.25C6.66848 1.25 6.35054 1.3817 6.11612 1.61612C5.8817 1.85054 5.75 2.16848 5.75 2.5Z"
            />
        </svg>
    );
}

export default function Divider({
    variant = 'solid',
    orientation = 'horizontal',
    ...props
}: Readonly<IDividerProps>): React.ReactElement {
    if (variant === 'needle') {
        return (
            <div
                role="separator"
                aria-orientation={orientation}
                className={clsx(styles.divider, styles['m-needle'])}
            >
                <NeedleSvg />
            </div>
        );
    }

    return (
        <MantineDivider
            classNames={{
                root: clsx(styles.divider, styles[`m-${variant}`]),
            }}
            orientation={orientation}
            {...props}
        />
    );
}
