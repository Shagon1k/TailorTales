'use client';

import { useState } from 'react';
import type { IPage, IRegenerateWhat } from '@/types/story.types';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import Button from '@/components/ui/Button/Button';
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

    const hasIllustrationPrompt = page.illustrationPrompt !== null;

    return (
        <section className={styles.panel} aria-label="Remake this page">
            <div className={styles.panel__header}>
                <CapsLabel>· Remake this page ·</CapsLabel>
            </div>

            <div className={styles.panel__actions}>
                <Button variant="secondary" onClick={() => setModalWhat('text')}>
                    Regenerate text
                </Button>
                <Button
                    variant="secondary"
                    disabled={!hasIllustrationPrompt}
                    onClick={() => setModalWhat('illustration')}
                >
                    Repaint illustration
                </Button>
                <Button
                    variant="secondary"
                    disabled={!hasIllustrationPrompt}
                    onClick={() => setModalWhat('both')}
                >
                    Remake everything
                </Button>
            </div>

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
