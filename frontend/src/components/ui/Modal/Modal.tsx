'use client';

import { Modal as MantineModal, type ModalProps as IMantineModalProps } from '@mantine/core';
import clsx from 'clsx';
import type { OmitStyling } from '@/components/ui/types';
import styles from './Modal.module.scss';

export type TModalSize = 'sm' | 'md' | 'lg';

const SIZE_PX: Record<TModalSize, number> = { sm: 380, md: 520, lg: 720 };

export interface IModalProps extends OmitStyling<
    IMantineModalProps,
    'size' | 'radius' | 'shadow' | 'padding'
> {
    size?: TModalSize;
}

export default function Modal({
    size = 'md',
    closeButtonProps,
    ...props
}: Readonly<IModalProps>): React.ReactElement {
    return (
        <MantineModal
            centered
            size={SIZE_PX[size]}
            closeButtonProps={{ 'aria-label': 'Close modal', ...closeButtonProps }}
            classNames={{
                content: clsx(styles.modal, styles[`m-${size}`]),
                header: styles['modal__header'],
                title: styles['modal__subheader'],
                close: styles['modal__close'],
                body: styles['modal__body'],
            }}
            {...props}
        />
    );
}
