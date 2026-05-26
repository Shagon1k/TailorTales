import { Avatar as MantineAvatar, type AvatarProps as IMantineAvatarProps } from '@mantine/core';
import type { OmitStyling } from '@/components/ui/types';
import styles from './Avatar.module.scss';

export type TAvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_PX: Record<TAvatarSize, number> = {
    sm: 28,
    md: 40,
    lg: 56,
    xl: 72,
};

export interface IAvatarProps extends OmitStyling<
    IMantineAvatarProps,
    'size' | 'variant' | 'color' | 'radius' | 'gradient' | 'autoContrast' | 'allowedInitialsColors'
> {
    size?: TAvatarSize;
}

export default function Avatar({
    size = 'md',
    ...props
}: Readonly<IAvatarProps>): React.ReactElement {
    return (
        <MantineAvatar
            size={SIZE_PX[size]}
            classNames={{
                root: styles.avatar,
                placeholder: styles['avatar__placeholder'],
            }}
            {...props}
        />
    );
}
