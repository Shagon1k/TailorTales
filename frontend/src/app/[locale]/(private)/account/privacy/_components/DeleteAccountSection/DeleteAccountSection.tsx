'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Group, Stack } from '@mantine/core';
import { accountApi } from '@/api/account';
import Button from '@/components/ui/Button/Button';
import Card from '@/components/ui/Card/Card';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import Input from '@/components/ui/Input/Input';
import Modal from '@/components/ui/Modal/Modal';
import styles from './DeleteAccountSection.module.scss';

const CONFIRM_WORD = 'DELETE';

interface IDeleteAccountSectionProps {
    hasPaidSubscription: boolean;
}

export default function DeleteAccountSection({
    hasPaidSubscription,
}: Readonly<IDeleteAccountSectionProps>): React.ReactElement {
    const t = useTranslations('account.privacy.delete');
    const [modalOpen, setModalOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete(): Promise<void> {
        setIsDeleting(true);
        setError(null);
        try {
            await accountApi.deleteAccount();
            window.location.href = '/';
        } catch {
            setError(t('modal.error'));
            setIsDeleting(false);
        }
    }

    return (
        <Card variant="default" size="md">
            <Stack gap="sm">
                <CapsLabel>{t('eyebrow')}</CapsLabel>
                <p className={styles['delete-account__copy']}>{t('body')}</p>
                {hasPaidSubscription && (
                    <p className={styles['delete-account__blocked']}>{t('blocked')}</p>
                )}
                <Group>
                    <Button
                        variant="secondary"
                        disabled={hasPaidSubscription}
                        onClick={() => setModalOpen(true)}
                    >
                        {t('button')}
                    </Button>
                </Group>
            </Stack>

            <Modal
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                title={t('modal.title')}
                size="sm"
            >
                <Stack gap="md">
                    <p className={styles['delete-account__copy']}>{t('modal.body')}</p>
                    <Input
                        label={t('modal.confirmLabel')}
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.currentTarget.value)}
                        placeholder={t('modal.confirmPlaceholder')}
                    />
                    {error && <p className={styles['delete-account__error']}>{error}</p>}
                    <Group justify="flex-end" gap="sm">
                        <Button variant="quiet" onClick={() => setModalOpen(false)}>
                            {t('modal.keepButton')}
                        </Button>
                        <Button
                            variant="primary"
                            disabled={confirmText !== CONFIRM_WORD}
                            loading={isDeleting}
                            onClick={() => void handleDelete()}
                        >
                            {t('modal.confirmButton')}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Card>
    );
}
