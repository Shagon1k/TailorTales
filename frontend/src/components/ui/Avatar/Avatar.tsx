'use client';

import { useState } from 'react';
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
    src,
    ...props
}: Readonly<IAvatarProps>): React.ReactElement {
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const resolvedSrc = src && failedSrc !== src ? src : undefined;

    return (
        <MantineAvatar
            size={SIZE_PX[size]}
            src={resolvedSrc}
            imageProps={{ onError: () => setFailedSrc(src ?? null) }}
            classNames={{
                root: styles.avatar,
                placeholder: styles['avatar__placeholder'],
            }}
            {...props}
        />
    );
}
