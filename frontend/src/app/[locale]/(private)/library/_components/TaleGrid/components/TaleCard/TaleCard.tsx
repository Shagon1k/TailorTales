'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import { getAge } from '@/utils/date.utils';
import Button from '@/components/ui/Button/Button';
import ButtonLink from '@/components/ui/Button/ButtonLink';
import Modal from '@/components/ui/Modal/Modal';
import { storiesApi } from '@/api/stories';
import type { IStorySummary } from '@/types/story.types';
import styles from './TaleCard.module.scss';

/** Stable cover color derived from story id — consistent across re-renders. */
function getCoverColor(id: string): string {
    const palette = [
        'var(--color-ember)',
        'var(--color-fox)',
        'var(--color-plum)',
        'var(--color-gold)',
        'var(--color-ink-2)',
    ];
    const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return palette[hash % palette.length];
}

export interface ITaleCardProps {
    story: IStorySummary;
}

export default function TaleCard({ story }: Readonly<ITaleCardProps>): React.ReactElement {
    const t = useTranslations('library.taleCard');
    const router = useRouter();
    const displayTitle = story.title ?? `"${story.question}"`;
    const coverColor = getCoverColor(story.id);
    const age = getAge(story.child.birthdate);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const isFailed = story.status === 'FAILED';
    const hasCoverImage = Boolean(story.coverImageUrl);
    const href = isFailed ? `/workshop?storyId=${story.id}` : `/library/${story.id}`;
    const ariaLabel = isFailed ? t('failedAriaLabel', { displayTitle }) : displayTitle;

    async function handleDelete(): Promise<void> {
        if (isDeleting) return;

        setDeleteError(null);
        setIsDeleting(true);
        try {
            await storiesApi.remove(story.id);
            setIsDeleteOpen(false);
            router.refresh();
        } catch (err) {
            console.error('Failed to delete story', err);
            setDeleteError(t('deleteError'));
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <>
            <article className={styles['tale-card']} data-failed={isFailed ? 'true' : undefined}>
                <Link
                    href={href}
                    className={styles['tale-card__cover-link']}
                    aria-label={ariaLabel}
                >
                    <div
                        className={styles['tale-card__cover']}
                        style={{ backgroundColor: coverColor }}
                        aria-hidden="true"
                    >
                        {hasCoverImage ? (
                            <Image
                                src={story.coverImageUrl}
                                alt=""
                                fill
                                sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 480px) 33vw, 50vw"
                                unoptimized
                                className={styles['tale-card__cover-img']}
                            />
                        ) : (
                            <div className={styles['tale-card__cover-placeholder']} />
                        )}

                        {!hasCoverImage && !isFailed && (
                            <p className={styles['tale-card__cover-title']}>{displayTitle}</p>
                        )}
                    </div>
                </Link>

                <div className={styles['tale-card__content']}>
                    {isFailed && (
                        <span className={styles['tale-card__status']} aria-hidden="true">
                            {t('failedOverlay')}
                        </span>
                    )}

                    <p className={styles['tale-card__title']}>{displayTitle}</p>
                    <div className={styles['tale-card__meta']}>
                        <span>{t('age', { age })}</span>
                        <span>·</span>
                        <span>{t('pageCount', { pageCount: story.pageCount })}</span>
                        <span>·</span>
                        <span>{story.type.toLowerCase()}</span>
                    </div>
                </div>

                <div className={styles['tale-card__actions']}>
                    {isFailed && (
                        <ButtonLink href={href} variant="secondary">
                            {t('retryLabel')}
                        </ButtonLink>
                    )}
                    <Button
                        variant="quiet"
                        onClick={() => setIsDeleteOpen(true)}
                        aria-label={t('deleteAriaLabel', { displayTitle })}
                    >
                        {t('deleteButton')}
                    </Button>
                </div>

                {deleteError && (
                    <p className={styles['tale-card__error']} role="alert">
                        {deleteError}
                    </p>
                )}
            </article>

            <Modal
                opened={isDeleteOpen}
                onClose={() => {
                    if (isDeleting) return;
                    setIsDeleteOpen(false);
                }}
                title={t('deleteModal.title')}
                size="sm"
            >
                <div className={styles['delete-confirm']}>
                    <p className={styles['delete-confirm__text']}>
                        {t('deleteConfirm', { displayTitle })}
                    </p>
                    <div className={styles['delete-confirm__actions']}>
                        <Button
                            variant="quiet"
                            onClick={() => setIsDeleteOpen(false)}
                            disabled={isDeleting}
                        >
                            {t('deleteModal.cancelButton')}
                        </Button>
                        <Button variant="primary" onClick={handleDelete} loading={isDeleting}>
                            {t('deleteModal.deleteButton')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
