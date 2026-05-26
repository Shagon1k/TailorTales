'use client';

import Link from 'next/link';
import { useCurrentUser } from '@/context/UserContext';
import styles from './HeaderUserChip.module.scss';

export default function HeaderUserChip(): React.ReactElement {
    const { user } = useCurrentUser();
    const initial = user?.name?.charAt(0).toUpperCase() ?? '?';
    const firstName = user?.name?.split(' ')[0] ?? '';

    return (
        <Link href="/account/profile" className={styles.chip} aria-label="Account settings">
            <span className={styles.chip__avatar} aria-hidden="true">{initial}</span>
            <span className={styles.chip__info}>
                <span className={styles.chip__name}>{firstName}</span>
                <span className={styles.chip__plan}>Story Hour</span>
            </span>
        </Link>
    );
}
