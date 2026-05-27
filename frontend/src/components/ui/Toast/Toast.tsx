'use client';

import clsx from 'clsx';
import styles from './Toast.module.scss';

export type TToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface IToastProps {
    variant?: TToastVariant;
    title?: React.ReactNode;
    children?: React.ReactNode;
    icon?: React.ReactNode;
}

function InfoIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path
                d="M9 8v4M9 5.5v.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

function SuccessIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path
                d="M5.5 9l2.5 2.5 4.5-5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function WarningIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
                d="M9 2L1.5 15.5h15L9 2z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            <path
                d="M9 7.5v3M9 12.5v.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

function ErrorIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path
                d="M6 6l6 6M12 6l-6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

const DEFAULT_ICONS: Record<TToastVariant, React.ReactElement> = {
    info: <InfoIcon />,
    success: <SuccessIcon />,
    warning: <WarningIcon />,
    error: <ErrorIcon />,
};

export default function Toast({
    variant = 'info',
    title,
    children,
    icon,
}: Readonly<IToastProps>): React.ReactElement {
    return (
        <div role="alert" className={clsx(styles.toast, styles[`m-${variant}`])}>
            <div className={styles['toast__icon']} aria-hidden="true">
                {icon ?? DEFAULT_ICONS[variant]}
            </div>
            <div className={styles['toast__body']}>
                {title && <p className={styles['toast__title']}>{title}</p>}
                {children && <p className={styles['toast__description']}>{children}</p>}
            </div>
        </div>
    );
}
