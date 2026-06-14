'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
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
            const message =
                err instanceof Error ? err.message : 'Something went wrong. Please try again.';
            setError(message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <section className={styles.rating} aria-labelledby="rating-heading">
            <div className={styles.rating__header}>
                <CapsLabel>· Rate this tale ·</CapsLabel>
            </div>

            <p id="rating-heading" className={styles.rating__sub}>
                {`How did ${childName} like it? It helps the workshop write the next one.`}
            </p>

            <Rating
                value={score}
                onChange={(value) => {
                    setScore(value);
                    clearStatus();
                }}
                aria-label="Story rating"
            />

            <Textarea
                value={note}
                onChange={(e) => {
                    setNote(e.currentTarget.value);
                    clearStatus();
                }}
                placeholder="Write a small note (optional)…"
                minRows={3}
                maxRows={5}
                aria-label="Rating note"
            />

            <Switch
                checked={isPublic}
                onChange={(checked) => {
                    setIsPublic(checked);
                    clearStatus();
                }}
                label="Share this story as an example for other families"
            />

            <Button
                variant="primary"
                onClick={handleSave}
                loading={isSaving}
                disabled={score === 0}
            >
                Save rating
            </Button>

            {saved && (
                <p className={styles.rating__status} role="status">
                    Saved — thank you!
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
