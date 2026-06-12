'use client';

import { useState } from 'react';
import type { IPage, IRegenerateWhat } from '@/types/story.types';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import Button from '@/components/ui/Button/Button';
import { useSubscription } from '@/hooks/subscription';
import RegenerationModal from './components/RegenerationModal/RegenerationModal';
import styles from './RegenerationPanel.module.scss';

export interface IRegenerationPanelProps {
    storyId: string;
    page: IPage;
}

export default function RegenerationPanel({
    storyId,
    page,
}: Readonly<IRegenerationPanelProps>): React.ReactElement {
    const [modalWhat, setModalWhat] = useState<IRegenerateWhat | null>(null);
    const { data: subscription } = useSubscription();

    const hasIllustrationPrompt = page.illustrationPrompt !== null;
    const regenerationsLeft = subscription
        ? Math.max(subscription.tier.regenerationsPerMonth - subscription.regenerationsUsed, 0)
        : null;
    const quotaExhausted = regenerationsLeft === 0;
    const regenerationsPluralSuffix = regenerationsLeft === 1 ? '' : 's';

    return (
        <section className={styles.panel} aria-label="Remake this page">
            <div className={styles.panel__header}>
                <CapsLabel>· Remake this page ·</CapsLabel>
            </div>

            <div className={styles.panel__actions}>
                <Button
                    variant="secondary"
                    disabled={quotaExhausted}
                    onClick={() => setModalWhat('text')}
                >
                    Regenerate text
                </Button>
                <Button
                    variant="secondary"
                    disabled={!hasIllustrationPrompt || quotaExhausted}
                    onClick={() => setModalWhat('illustration')}
                >
                    Repaint illustration
                </Button>
                <Button
                    variant="secondary"
                    disabled={!hasIllustrationPrompt || quotaExhausted}
                    onClick={() => setModalWhat('both')}
                >
                    Remake everything
                </Button>
            </div>

            {regenerationsLeft !== null && (
                <p className={styles.panel__quota} data-exhausted={quotaExhausted || undefined}>
                    {quotaExhausted
                        ? 'No regenerations left this cycle — they refresh when your plan renews.'
                        : `${regenerationsLeft} regeneration${regenerationsPluralSuffix} left this cycle.`}
                </p>
            )}

            {/* key forces remount on each open — cleanly resets form state without useEffect */}
            <RegenerationModal
                key={modalWhat ?? 'closed'}
                storyId={storyId}
                pageOrder={page.order}
                what={modalWhat ?? 'text'}
                opened={modalWhat !== null}
                onClose={() => setModalWhat(null)}
            />
        </section>
    );
}
