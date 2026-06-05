'use client';

import Button from '@/components/ui/Button/Button';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import MascotImage from '@/components/shared/MascotImage/MascotImage';
import type { IChild } from '@/types/child.types';
import type { IArtStyle } from '@/types/art-style.types';
import type { IStoryType, ILanguage } from '@/types/story.types';
import styles from './WorkshopSummary.module.scss';

const FORMAT_LABEL: Record<IStoryType, string> = {
    BOOK: 'Book',
    COMIC: 'Comic',
};

const LANGUAGE_LABEL: Record<ILanguage, string> = {
    EN: 'English',
    RU: 'Russian',
};

// Stub: 1 credit = 1 page; cost = pageCount. Real balance wired in Phase 9.
// STUB_REMAINING reflects Story Hour quota (60 pages/month).
const CREDIT_COST = 5;
const STUB_REMAINING = 60;

export interface IWorkshopSummaryProps {
    child: IChild | null;
    storyType: IStoryType | null;
    pageCount: string | null;
    artStyle: IArtStyle | null;
    language: ILanguage | null;
    question: string;
    isValid: boolean;
    isPending: boolean;
    onSubmit: () => void;
}

export default function WorkshopSummary({
    child,
    storyType,
    pageCount,
    artStyle,
    language,
    question,
    isValid,
    isPending,
    onSubmit,
}: Readonly<IWorkshopSummaryProps>): React.ReactElement {
    const hasQuestion = question.trim().length > 0;

    return (
        <aside className={styles.summary}>
            <div className={styles['summary__mascot']} aria-hidden="true">
                <MascotImage image="fox-write" size={120} glow="outline" />
            </div>
            <CapsLabel variant="gold">Your tale so far</CapsLabel>

            <blockquote className={styles.summary__question}>
                {hasQuestion ? (
                    <span className={styles['summary__question-text']}>{question.trim()}</span>
                ) : (
                    <span className={styles['summary__question-placeholder']}>
                        Your question will appear here…
                    </span>
                )}
            </blockquote>

            <ul className={styles.summary__rows}>
                <SummaryRow label="Reader" value={child?.name ?? null} />
                <SummaryRow label="Format" value={storyType ? FORMAT_LABEL[storyType] : null} />
                <SummaryRow label="Length" value={pageCount ? `${pageCount} pages` : null} />
                <SummaryRow label="Language" value={language ? LANGUAGE_LABEL[language] : null} />
                <SummaryRow label="Style" value={artStyle?.name ?? null} />
            </ul>

            <hr className={styles.summary__divider} aria-hidden="true" />

            <p className={styles.summary__credits}>
                <span className={styles['summary__credits-cost']}>{CREDIT_COST} credits</span>
                <span className={styles['summary__credits-remaining']}>
                    {' '}
                    · {STUB_REMAINING} remaining
                </span>
            </p>

            <div className={styles.summary__actions}>
                {/* Phase 4: both buttons create a DRAFT. Phase 5: "Light the lantern" triggers generation. */}
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={!isValid || isPending}
                    loading={isPending}
                    onClick={onSubmit}
                >
                    Light the lantern →
                </Button>
                <Button
                    variant="quiet"
                    fullWidth
                    disabled={!isValid || isPending}
                    onClick={onSubmit}
                >
                    Save as draft
                </Button>
            </div>
        </aside>
    );
}

// ── Private sub-component ─────────────────────────────────────────────────────

interface ISummaryRowProps {
    label: string;
    value: string | null;
}

function SummaryRow({ label, value }: ISummaryRowProps): React.ReactElement {
    return (
        <li className={styles.summary__row}>
            <span className={styles['summary__row-label']}>{label}</span>
            <span className={styles['summary__row-value']}>
                {value ?? <span className={styles['summary__row-empty']}>—</span>}
            </span>
        </li>
    );
}
