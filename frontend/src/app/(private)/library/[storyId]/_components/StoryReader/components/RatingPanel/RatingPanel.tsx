'use client';

import { useState } from 'react';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import Rating from '@/components/ui/Rating/Rating';
import Button from '@/components/ui/Button/Button';
import Textarea from '@/components/ui/Textarea/Textarea';
import styles from './RatingPanel.module.scss';

export interface IRatingPanelProps {
    childName: string;
}

export default function RatingPanel({
    childName,
}: Readonly<IRatingPanelProps>): React.ReactElement {
    // Phase 10 — rating submission wired here.
    // Controlled state kept so the panel feels interactive in Phase 4.
    const [rating, setRating] = useState(0);
    const [note, setNote] = useState('');

    return (
        <section className={styles.rating} aria-labelledby="rating-heading">
            <div className={styles.rating__header}>
                <CapsLabel>· Rate this tale ·</CapsLabel>
            </div>

            <p id="rating-heading" className={styles.rating__sub}>
                {`How did ${childName} like it? It helps the workshop write the next one.`}
            </p>

            <Rating value={rating} onChange={setRating} aria-label="Story rating" />

            <Textarea
                value={note}
                onChange={(e) => setNote(e.currentTarget.value)}
                placeholder="Write a small note (optional)…"
                minRows={3}
                maxRows={5}
                aria-label="Rating note"
            />

            {/* Disabled until Phase 10 wires the rating API */}
            <Button variant="primary" disabled>
                Save rating
            </Button>
        </section>
    );
}
