'use client';

import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react';
import { Modal as MantineModal, type ModalProps as IMantineModalProps } from '@mantine/core';
import clsx from 'clsx';
import type { OmitStyling } from '@/components/ui/types';
import styles from './Modal.module.scss';

export type TModalSize = 'sm' | 'md' | 'lg';

const SIZE_PX: Record<TModalSize, number> = { sm: 430, md: 570, lg: 770 };

interface IModalFooterContextValue {
    setFooterContent: (content: ReactNode | null) => void;
}

const ModalFooterContext = createContext<IModalFooterContextValue | null>(null);

export interface IModalProps extends OmitStyling<
    IMantineModalProps,
    'size' | 'radius' | 'shadow' | 'padding'
> {
    size?: TModalSize;
}

interface IModalFooterProps {
    children: ReactNode;
}

function ModalFooter({ children }: Readonly<IModalFooterProps>): React.ReactElement {
    const context = useContext(ModalFooterContext);

    useLayoutEffect(() => {
        if (context === null) return;

        context.setFooterContent(children);
        return () => context.setFooterContent(null);
    }, [children, context]);

    if (context === null) return <>{children}</>;
    return <></>;
}

function ModalComponent({
    size = 'md',
    closeButtonProps,
    children,
    ...props
}: Readonly<IModalProps>): React.ReactElement {
    const [footerContent, setFooterContent] = useState<ReactNode | null>(null);

    return (
        <ModalFooterContext.Provider value={{ setFooterContent }}>
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
            >
                <div className={styles['modal__body-shell']}>
                    <div className={styles['modal__scroll']}>{children}</div>
                    {footerContent !== null && (
                        <div className={styles['modal__footer']}>{footerContent}</div>
                    )}
                </div>
            </MantineModal>
        </ModalFooterContext.Provider>
    );
}

const Modal = Object.assign(ModalComponent, { Footer: ModalFooter });

export default Modal;
