'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import type { IRegenerateWhat } from '@/types/story.types';
import Modal from '@/components/ui/Modal/Modal';
import Button from '@/components/ui/Button/Button';
import Textarea from '@/components/ui/Textarea/Textarea';
import { storiesApi } from '@/api/stories';
import styles from './RegenerationModal.module.scss';

const TITLE: Record<IRegenerateWhat, string> = {
    text: 'Regenerate text',
    illustration: 'Repaint illustration',
    both: 'Regenerate page',
};

const DESCRIPTION: Record<IRegenerateWhat, string> = {
    text: 'The story text on this page will be rewritten. The illustration stays.',
    illustration: 'The picture will be repainted. The text stays.',
    both: 'Both the text and the illustration on this page will be remade.',
};

export interface IRegenerationModalProps {
    storyId: string;
    pageOrder: number;
    what: IRegenerateWhat;
    opened: boolean;
    onClose: () => void;
}

export default function RegenerationModal({
    storyId,
    pageOrder,
    what,
    opened,
    onClose,
}: Readonly<IRegenerationModalProps>): React.ReactElement {
    const router = useRouter();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleConfirm(): Promise<void> {
        setIsLoading(true);
        setError(null);
        try {
            await storiesApi.regeneratePage(storyId, pageOrder, {
                what,
                prompt: prompt.trim() || undefined,
            });
            router.refresh();
            onClose();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Something went wrong. Please try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }

    const errorDescriptionId = 'regen-modal-error';

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={TITLE[what]}
            size="sm"
            closeOnClickOutside={!isLoading}
            closeOnEscape={!isLoading}
        >
            <div className={styles.body}>
                <p className={styles.body__description}>{DESCRIPTION[what]}</p>

                <Textarea
                    label="Author note (optional)"
                    description='Guide the AI — e.g. "make it funnier" or "add a dragon".'
                    placeholder="Leave blank to let the AI decide…"
                    value={prompt}
                    onChange={(e) => setPrompt(e.currentTarget.value)}
                    minRows={3}
                    maxRows={6}
                    aria-describedby={error ? errorDescriptionId : undefined}
                />

                {error && (
                    <p id={errorDescriptionId} className={styles.body__error} role="alert">
                        {error}
                    </p>
                )}

                <div className={styles.body__actions}>
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        loading={isLoading}
                        aria-busy={isLoading}
                    >
                        Confirm
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
