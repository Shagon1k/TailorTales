'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { IRegenerateWhat } from '@/types/story.types';
import Modal from '@/components/ui/Modal/Modal';
import Button from '@/components/ui/Button/Button';
import Textarea from '@/components/ui/Textarea/Textarea';
import { storiesApi } from '@/api/stories';
import { SUBSCRIPTION_QUERY_KEY } from '@/hooks/subscription';
import styles from './RegenerationModal.module.scss';

export interface IRegenerationModalProps {
    storyId: string;
    pageOrder: number;
    what: IRegenerateWhat;
    opened: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function RegenerationModal({
    storyId,
    pageOrder,
    what,
    opened,
    onClose,
    onSuccess,
}: Readonly<IRegenerationModalProps>): React.ReactElement {
    const t = useTranslations('storyReader.regeneration');
    const router = useRouter();
    const queryClient = useQueryClient();
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
            await queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
            router.refresh();
            onSuccess?.();
            onClose();
        } catch (err) {
            const message = err instanceof Error ? err.message : t('modal.defaultError');
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }

    const errorDescriptionId = 'regen-modal-error';

    const title =
        what === 'text'
            ? t('modal.titles.text')
            : what === 'illustration'
              ? t('modal.titles.illustration')
              : t('modal.titles.both');

    const description =
        what === 'text'
            ? t('modal.descriptions.text')
            : what === 'illustration'
              ? t('modal.descriptions.illustration')
              : t('modal.descriptions.both');

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={title}
            size="sm"
            closeOnClickOutside={!isLoading}
            closeOnEscape={!isLoading}
        >
            <div className={styles.body}>
                <p className={styles.body__description}>{description}</p>

                <Textarea
                    label={t('modal.authorNoteLabel')}
                    description={t('modal.authorNoteDescription')}
                    placeholder={t('modal.authorNotePlaceholder')}
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
                        {t('modal.cancelButton')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        loading={isLoading}
                        aria-busy={isLoading}
                    >
                        {t('modal.confirmButton')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
