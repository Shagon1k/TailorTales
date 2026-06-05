import { Anchor as MantineAnchor, type AnchorProps as IMantineAnchorProps } from '@mantine/core';
import clsx from 'clsx';
import type { OmitStyling } from '@/components/ui/types';
import styles from './Link.module.scss';

export type TLinkVariant = 'default' | 'quiet' | 'on-card' | 'gold';

export interface ILinkProps extends OmitStyling<IMantineAnchorProps, 'variant' | 'underline'> {
    variant?: TLinkVariant;
    href?: string;
    target?: string;
    rel?: string;
    children?: React.ReactNode;
}

export default function Link({
    variant = 'default',
    ...props
}: Readonly<ILinkProps>): React.ReactElement {
    return (
        <MantineAnchor
            classNames={{
                root: clsx(styles.link, styles[`m-${variant}`]),
            }}
            {...props}
        />
    );
}
