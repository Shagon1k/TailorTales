'use client';

import Link from 'next/link';
import { useCurrentUser } from '@/context/UserContext';
import { useSubscription } from '@/hooks/subscription';
import Avatar from '@/components/ui/Avatar/Avatar';
import styles from './HeaderUserChip.module.scss';

export default function HeaderUserChip(): React.ReactElement {
    const { user } = useCurrentUser();
    const { data: subscription } = useSubscription();
    const firstName = user?.name?.split(' ')[0] ?? '';

    return (
        <Link href="/account/profile" className={styles.chip} aria-label="Account settings">
            <Avatar size="sm" name={user?.name ?? '?'} aria-hidden="true" />
            <span className={styles.chip__info}>
                <span className={styles.chip__name}>{firstName}</span>
                <span className={styles.chip__plan}>{subscription?.tier.name ?? '…'}</span>
            </span>
        </Link>
    );
}
