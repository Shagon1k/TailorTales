import { TextInput as MantineTextInput, type TextInputProps as IMantineTextInputProps } from '@mantine/core';
import clsx from 'clsx';
import type { OmitStyling } from '@/components/ui/types';
import styles from './Input.module.scss';

export type TInputSurface = 'twilight' | 'cream';

export interface IInputProps extends OmitStyling<IMantineTextInputProps, 'variant' | 'size' | 'radius'> {
    surface?: TInputSurface;
}

export default function Input({ surface = 'twilight', ...props }: Readonly<IInputProps>): React.ReactElement {
    return (
        <MantineTextInput
            variant="unstyled"
            classNames={{
                root: clsx(styles.input, styles[`m-${surface}`]),
                label: styles['input__label'],
                wrapper: styles['input__wrapper'],
                input: styles['input__field'],
                description: styles['input__helper'],
                error: styles['input__error'],
            }}
            {...props}
        />
    );
}
