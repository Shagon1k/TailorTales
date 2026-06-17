'use client';

import {
    Popover as MantinePopover,
    type PopoverProps as IMantinePopoverProps,
} from '@mantine/core';
import type { OmitStyling } from '@/components/ui/types';
import styles from './Popover.module.scss';

export interface IPopoverProps extends OmitStyling<
    IMantinePopoverProps,
    'children' | 'radius' | 'shadow'
> {
    /** The trigger element — receives the ref Mantine needs for positioning. */
    target: React.ReactElement;
    /** Dropdown content. */
    children: React.ReactNode;
    /** Dropdown max width in px; clamps to the viewport on small screens. */
    maxWidth?: number;
}

const DEFAULT_MAX_WIDTH = 380;

export default function Popover({
    target,
    children,
    maxWidth = DEFAULT_MAX_WIDTH,
    ...props
}: Readonly<IPopoverProps>): React.ReactElement {
    return (
        <MantinePopover position="bottom-end" offset={8} returnFocus {...props}>
            <MantinePopover.Target>{target}</MantinePopover.Target>
            <MantinePopover.Dropdown
                className={styles.popover}
                style={{ maxWidth: `min(${maxWidth}px, calc(100vw - 2 * var(--layout-gutter)))` }}
            >
                {children}
            </MantinePopover.Dropdown>
        </MantinePopover>
    );
}
