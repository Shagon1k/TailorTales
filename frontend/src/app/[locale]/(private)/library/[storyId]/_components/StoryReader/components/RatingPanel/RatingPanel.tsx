'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import Rating from '@/components/ui/Rating/Rating';
import Button from '@/components/ui/Button/Button';
import Switch from '@/components/ui/Switch/Switch';
import Textarea from '@/components/ui/Textarea/Textarea';
import { storiesApi } from '@/api/stories';
import type { IMyRating } from '@/types/story.types';
import styles from './RatingPanel.module.scss';

type TRatingPanelMode = 'view' | 'edit';

export interface IRatingPanelProps {
    storyId: string;
    childName: string;
    /** The owner's existing rating, so the panel pre-fills. Null when never rated. */
    initialRating: IMyRating | null;
    /** Current public-visibility state, driving the "share as example" toggle. */
    initialIsPublic: boolean;
}

export default function RatingPanel({
    storyId,
    childName,
    initialRating,
    initialIsPublic,
}: Readonly<IRatingPanelProps>): React.ReactElement {
    const t = useTranslations('storyReader.rating');
    const router = useRouter();
    const [score, setScore] = useState(initialRating?.score ?? 0);
    const [note, setNote] = useState(initialRating?.comment ?? '');
    const [isPublic, setIsPublic] = useState(initialIsPublic);
    const [savedRating, setSavedRating] = useState<IMyRating | null>(initialRating);
    const [savedIsPublic, setSavedIsPublic] = useState(initialIsPublic);
    const [mode, setMode] = useState<TRatingPanelMode>(initialRating ? 'view' : 'edit');
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function clearStatus(): void {
        setSaved(false);
        setError(null);
    }

    function handleEdit(): void {
        if (!savedRating) return;
        setScore(savedRating.score);
        setNote(savedRating.comment ?? '');
        setIsPublic(savedIsPublic);
        setMode('edit');
        clearStatus();
    }

    async function handleSave(): Promise<void> {
        setIsSaving(true);
        setError(null);
        setSaved(false);
        const trimmedNote = note.trim();
        const effectiveIsPublic = isPublic && score >= 4;
        try {
            await storiesApi.submitRating(storyId, {
                score,
                comment: trimmedNote || undefined,
                isPublic: effectiveIsPublic,
            });
            setSavedRating({ score, comment: trimmedNote || null });
            setSavedIsPublic(effectiveIsPublic);
            setMode('view');
            setSaved(true);
            // Refresh so the detail (myRating, isPublic) reflects the saved state.
            router.refresh();
        } catch (err) {
            const message = err instanceof Error ? err.message : t('defaultError');
            setError(message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <section className={styles.rating} aria-labelledby="rating-heading">
            <div className={styles.rating__header}>
                <CapsLabel>{t('eyebrow')}</CapsLabel>
            </div>

            <p id="rating-heading" className={styles.rating__sub}>
                {t('subheading', { childName })}
            </p>

            {mode === 'view' && savedRating ? (
                <>
                    <Rating value={savedRating.score} readOnly aria-label={t('ariaLabel')} />
                    {savedRating.comment && (
                        <p className={styles['rating__readonly-note']}>{savedRating.comment}</p>
                    )}
                    <p className={styles.rating__visibility}>
                        {savedIsPublic ? t('sharedStatus') : t('privateStatus')}
                    </p>
                    <Button variant="secondary" onClick={handleEdit}>
                        {t('editButton')}
                    </Button>
                </>
            ) : (
                <>
                    <Rating
                        value={score}
                        onChange={(value) => {
                            setScore(value);
                            clearStatus();
                        }}
                        aria-label={t('ariaLabel')}
                    />

                    <Textarea
                        value={note}
                        onChange={(e) => {
                            setNote(e.currentTarget.value);
                            clearStatus();
                        }}
                        placeholder={t('notePlaceholder')}
                        minRows={3}
                        maxRows={5}
                        aria-label={t('noteAriaLabel')}
                    />

                    <Switch
                        checked={isPublic}
                        onChange={(checked) => {
                            setIsPublic(checked);
                            clearStatus();
                        }}
                        label={t('shareLabel')}
                    />
                    <p className={styles.rating__visibility}>{t('shareHint')}</p>

                    <Button
                        variant="primary"
                        onClick={handleSave}
                        loading={isSaving}
                        disabled={score === 0}
                    >
                        {savedRating ? t('updateButton') : t('saveButton')}
                    </Button>
                </>
            )}

            {saved && (
                <p className={styles.rating__status} role="status">
                    {t('savedStatus')}
                </p>
            )}
            {error && (
                <p className={clsx(styles.rating__status, styles['m-error'])} role="alert">
                    {error}
                </p>
            )}
        </section>
    );
}
