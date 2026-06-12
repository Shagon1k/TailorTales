'use client';

import Button from '@/components/ui/Button/Button';
import { useSubscription } from '@/hooks/subscription';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import MascotImage from '@/components/shared/MascotImage/MascotImage';
import type { IChild } from '@/types/child.types';
import type { ICharacter } from '@/types/character.types';
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

// 1 book page = 1 credit (comics — post-MVP — cost 2 per page).
const CREDITS_PER_BOOK_PAGE = 1;

export interface IWorkshopSummaryProps {
    child: IChild | null;
    character: ICharacter | null;
    storyType: IStoryType | null;
    pageCount: string | null;
    artStyle: IArtStyle | null;
    language: ILanguage | null;
    question: string;
    isValid: boolean;
    isPending: boolean;
    onSubmit: () => void;
    onCharacterEdit: () => void;
}

export default function WorkshopSummary({
    child,
    character,
    storyType,
    pageCount,
    artStyle,
    language,
    question,
    isValid,
    isPending,
    onSubmit,
    onCharacterEdit,
}: Readonly<IWorkshopSummaryProps>): React.ReactElement {
    const hasQuestion = question.trim().length > 0;

    const { data: subscription } = useSubscription();
    const creditCost = pageCount ? Number(pageCount) * CREDITS_PER_BOOK_PAGE : 0;
    const creditsRemaining = subscription
        ? Math.max(subscription.tier.pagesPerMonth - subscription.pagesUsed, 0)
        : null;
    const overBudget = creditsRemaining !== null && creditCost > creditsRemaining;

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
                <SummaryRow
                    label="Character"
                    value={character?.name ?? null}
                    action={{
                        label: character ? 'Edit' : 'Add',
                        onClick: onCharacterEdit,
                        disabled: child === null,
                    }}
                />
                <SummaryRow label="Format" value={storyType ? FORMAT_LABEL[storyType] : null} />
                <SummaryRow label="Length" value={pageCount ? `${pageCount} pages` : null} />
                <SummaryRow label="Language" value={language ? LANGUAGE_LABEL[language] : null} />
                <SummaryRow label="Style" value={artStyle?.name ?? null} />
            </ul>

            <hr className={styles.summary__divider} aria-hidden="true" />

            <p className={styles.summary__credits}>
                <span className={styles['summary__credits-cost']}>{creditCost} credits</span>
                <span className={styles['summary__credits-remaining']}>
                    {' '}
                    · {creditsRemaining ?? '--'} remaining
                </span>
            </p>

            {pageCount && creditsRemaining !== null && (
                <p className={styles.summary__quota} data-over={overBudget || undefined}>
                    {overBudget
                        ? `This tale needs ${creditCost} credits but only ${creditsRemaining} remain this cycle — pick a shorter length or upgrade your plan.`
                        : `${pageCount} pages will use ${creditCost} of your ${creditsRemaining} remaining credits this cycle.`}
                </p>
            )}

            <div className={styles.summary__actions}>
                {/* Phase 4: both buttons create a DRAFT. Phase 5: "Light the lantern" triggers generation. */}
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={!isValid || isPending || overBudget}
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

interface ISummaryRowAction {
    label: string;
    onClick: () => void;
    disabled?: boolean;
}

interface ISummaryRowProps {
    label: string;
    value: string | null;
    action?: ISummaryRowAction;
}

function SummaryRow({ label, value, action }: Readonly<ISummaryRowProps>): React.ReactElement {
    return (
        <li className={styles['summary__row']}>
            <span className={styles['summary__row-label']}>{label}</span>
            <div className={styles['summary__row-value-group']}>
                <span className={styles['summary__row-value']}>
                    {value ?? <span className={styles['summary__row-empty']}>—</span>}
                </span>
                {action && (
                    <button
                        type="button"
                        className={styles['summary__row-action']}
                        onClick={action.onClick}
                        disabled={action.disabled}
                    >
                        {action.label}
                    </button>
                )}
            </div>
        </li>
    );
}
