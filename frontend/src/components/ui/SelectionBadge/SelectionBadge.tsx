'use client';

import styles from './SelectionBadge.module.scss';

export default function SelectionBadge(): React.ReactElement {
    return (
        <span className={styles.badge} aria-hidden="true">
            <svg
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="m2.5 6.25 2.2 2.2 4.8-5" />
            </svg>
        </span>
    );
}
