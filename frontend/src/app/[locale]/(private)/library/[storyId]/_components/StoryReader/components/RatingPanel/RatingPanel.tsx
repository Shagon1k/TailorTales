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
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function clearStatus(): void {
        setSaved(false);
        setError(null);
    }

    async function handleSave(): Promise<void> {
        setIsSaving(true);
        setError(null);
        setSaved(false);
        try {
            await storiesApi.submitRating(storyId, {
                score,
                comment: note.trim() || undefined,
                isPublic,
            });
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

            <Button
                variant="primary"
                onClick={handleSave}
                loading={isSaving}
                disabled={score === 0}
            >
                {t('saveButton')}
            </Button>

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
