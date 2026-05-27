import {
    Textarea as MantineTextarea,
    type TextareaProps as IMantineTextareaProps,
} from '@mantine/core';
import clsx from 'clsx';
import type { OmitStyling } from '@/components/ui/types';
import styles from './Textarea.module.scss';

export type TTextareaSurface = 'twilight' | 'cream';

export interface ITextareaProps extends OmitStyling<
    IMantineTextareaProps,
    'variant' | 'size' | 'radius'
> {
    surface?: TTextareaSurface;
}

export default function Textarea({
    surface = 'twilight',
    ...props
}: Readonly<ITextareaProps>): React.ReactElement {
    return (
        <MantineTextarea
            variant="unstyled"
            classNames={{
                root: clsx(styles.textarea, styles[`m-${surface}`]),
                label: styles['textarea__label'],
                wrapper: styles['textarea__wrapper'],
                input: styles['textarea__field'],
                description: styles['textarea__helper'],
                error: styles['textarea__error'],
            }}
            {...props}
        />
    );
}
