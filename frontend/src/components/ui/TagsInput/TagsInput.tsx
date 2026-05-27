import {
    TagsInput as MantineTagsInput,
    type TagsInputProps as IMantineTagsInputProps,
} from '@mantine/core';
import clsx from 'clsx';
import type { OmitStyling } from '@/components/ui/types';
import styles from './TagsInput.module.scss';

export type TTagsInputSurface = 'twilight' | 'cream';

export interface ITagsInputProps extends OmitStyling<
    IMantineTagsInputProps,
    'variant' | 'size' | 'radius'
> {
    surface?: TTagsInputSurface;
}

export default function TagsInput({
    surface = 'twilight',
    ...props
}: Readonly<ITagsInputProps>): React.ReactElement {
    return (
        <MantineTagsInput
            variant="unstyled"
            classNames={{
                root: clsx(styles['tags-input'], styles[`m-${surface}`]),
                label: styles['tags-input__label'],
                wrapper: styles['tags-input__wrapper'],
                pillsList: styles['tags-input__pills-list'],
                pill: styles['tags-input__pill'],
                inputField: styles['tags-input__input-field'],
                description: styles['tags-input__helper'],
                error: styles['tags-input__error'],
                dropdown: styles['tags-input__dropdown'],
                option: styles['tags-input__option'],
            }}
            {...props}
        />
    );
}
