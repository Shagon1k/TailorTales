'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { IPage, IRegenerateWhat } from '@/types/story.types';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import Button from '@/components/ui/Button/Button';
import { useSubscription } from '@/hooks/subscription';
import RegenerationModal from './components/RegenerationModal/RegenerationModal';
import styles from './RegenerationPanel.module.scss';

export interface IRegenerationPanelProps {
    storyId: string;
    page: IPage;
    onRegenerated?: () => void;
}

export default function RegenerationPanel({
    storyId,
    page,
    onRegenerated,
}: Readonly<IRegenerationPanelProps>): React.ReactElement {
    const t = useTranslations('storyReader.regeneration');
    const [modalWhat, setModalWhat] = useState<IRegenerateWhat | null>(null);
    const { data: subscription } = useSubscription();

    const hasIllustrationPrompt = page.illustrationPrompt !== null;
    const regenerationsLeft = subscription
        ? Math.max(subscription.tier.regenerationsPerMonth - subscription.regenerationsUsed, 0)
        : null;
    const quotaExhausted = regenerationsLeft === 0;

    return (
        <section className={styles.panel} aria-label={t('ariaLabel')}>
            <div className={styles.panel__header}>
                <CapsLabel>{t('eyebrow')}</CapsLabel>
            </div>

            <div className={styles.panel__actions}>
                <Button
                    variant="secondary"
                    disabled={quotaExhausted}
                    onClick={() => setModalWhat('text')}
                >
                    {t('textButton')}
                </Button>
                <Button
                    variant="secondary"
                    disabled={!hasIllustrationPrompt || quotaExhausted}
                    onClick={() => setModalWhat('illustration')}
                >
                    {t('illustrationButton')}
                </Button>
                <Button
                    variant="secondary"
                    disabled={!hasIllustrationPrompt || quotaExhausted}
                    onClick={() => setModalWhat('both')}
                >
                    {t('bothButton')}
                </Button>
            </div>

            {regenerationsLeft !== null && (
                <p className={styles.panel__quota} data-exhausted={quotaExhausted || undefined}>
                    {quotaExhausted
                        ? t('quotaExhausted')
                        : t('quotaInfo', { count: regenerationsLeft })}
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
                onSuccess={onRegenerated}
            />
        </section>
    );
}
