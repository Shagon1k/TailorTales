'use client';

import Link from 'next/link';
import Avatar from '@/components/ui/Avatar/Avatar';
import type { IChild } from '@/types/child.types';
import styles from './ReaderChip.module.scss';

function getAge(birthdate: string): number {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

export interface IReaderChipProps {
    child: IChild | null;
    isOpen: boolean;
    hasChildren: boolean;
    onToggle: () => void;
}

export default function ReaderChip({
    child,
    isOpen,
    hasChildren,
    onToggle,
}: Readonly<IReaderChipProps>): React.ReactElement {
    if (!hasChildren) {
        return (
            <div className={styles['reader-chip']}>
                <p className={styles['reader-chip__empty']}>No readers yet —</p>
                <Link href="/account/children" className={styles['reader-chip__add-link']}>
                    Add a reader first →
                </Link>
            </div>
        );
    }

    return (
        <div className={styles['reader-chip']}>
            <div className={styles['reader-chip__left']}>
                <Avatar size="md" name={child?.name} />
                <div className={styles['reader-chip__info']}>
                    <span className={styles['reader-chip__for']}>For</span>
                    {child ? (
                        <>
                            <span className={styles['reader-chip__name']}>
                                {child.name}, age {getAge(child.birthdate)}
                            </span>
                            {child.interests.length > 0 && (
                                <span className={styles['reader-chip__interests']}>
                                    loves: {child.interests.join(', ')}
                                </span>
                            )}
                        </>
                    ) : (
                        <span className={styles['reader-chip__placeholder']}>Choose a reader</span>
                    )}
                </div>
            </div>

            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isOpen}
                className={styles['reader-chip__toggle']}
            >
                {isOpen ? 'Close ×' : 'Change reader →'}
            </button>
        </div>
    );
}
