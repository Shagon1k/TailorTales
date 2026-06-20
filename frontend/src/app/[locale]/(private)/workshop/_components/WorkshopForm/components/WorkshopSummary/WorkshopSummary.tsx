'use client';

import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button/Button';
import { useSubscription } from '@/hooks/subscription';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import MascotImage from '@/components/shared/MascotImage/MascotImage';
import type { IChild } from '@/types/child.types';
import type { ICharacter } from '@/types/character.types';
import type { IArtStyle } from '@/types/art-style.types';
import type { IStoryType, ILanguage } from '@/types/story.types';
import { LANGUAGES } from '@/constants/languages';
import styles from './WorkshopSummary.module.scss';

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
    onCharacterChoose: () => void;
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
    onCharacterChoose,
}: Readonly<IWorkshopSummaryProps>): React.ReactElement {
    const t = useTranslations('workshop.summary');
    const hasQuestion = question.trim().length > 0;

    const storyTypeLabel =
        storyType === 'BOOK' ? t('format.book') : storyType === 'COMIC' ? t('format.comic') : null;

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
            <CapsLabel variant="gold">{t('eyebrow')}</CapsLabel>

            <blockquote className={styles.summary__question}>
                {hasQuestion ? (
                    <span className={styles['summary__question-text']}>{question.trim()}</span>
                ) : (
                    <span className={styles['summary__question-placeholder']}>
                        {t('questionPlaceholder')}
                    </span>
                )}
            </blockquote>

            <ul className={styles.summary__rows}>
                <SummaryRow label={t('labels.reader')} value={child?.name ?? null} />
                <SummaryRow
                    label={t('labels.character')}
                    value={character?.name ?? null}
                    action={{
                        label: character
                            ? t('characterAction.change')
                            : t('characterAction.choose'),
                        onClick: onCharacterChoose,
                        disabled: child === null,
                    }}
                />
                <SummaryRow label={t('labels.format')} value={storyTypeLabel} />
                <SummaryRow
                    label={t('labels.length')}
                    value={pageCount ? t('lengthValue', { pageCount }) : null}
                />
                <SummaryRow
                    label={t('labels.language')}
                    value={language ? LANGUAGES[language].nativeName : null}
                />
                <SummaryRow label={t('labels.style')} value={artStyle?.name ?? null} />
            </ul>

            <hr className={styles.summary__divider} aria-hidden="true" />

            <p className={styles.summary__credits}>
                <span className={styles['summary__credits-cost']}>
                    {t('creditCost', { creditCost })}
                </span>
                <span className={styles['summary__credits-remaining']}>
                    {t('creditsRemaining', { creditsRemaining: creditsRemaining ?? '--' })}
                </span>
            </p>

            {pageCount && creditsRemaining !== null && (
                <p className={styles.summary__quota} data-over={overBudget || undefined}>
                    {overBudget
                        ? t('quotaExhausted', { creditCost, creditsRemaining })
                        : t('quotaInfo', { pageCount, creditCost, creditsRemaining })}
                </p>
            )}

            <div className={styles.summary__actions}>
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={!isValid || isPending || overBudget}
                    loading={isPending}
                    onClick={onSubmit}
                >
                    {t('generateButton')}
                </Button>
                <Button
                    variant="quiet"
                    fullWidth
                    disabled={!isValid || isPending}
                    onClick={onSubmit}
                >
                    {t('draftButton')}
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
