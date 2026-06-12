'use client';

import { useState } from 'react';
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
            setError('Account deletion failed — nothing was removed. Please try again.');
            setIsDeleting(false);
        }
    }

    return (
        <Card variant="default" size="md">
            <Stack gap="sm">
                <CapsLabel>Delete account</CapsLabel>
                <p className={styles['delete-account__copy']}>
                    Deleting your account removes your profile, readers, characters, every generated
                    story and PDF, and your subscription record. This cannot be undone.
                </p>
                {hasPaidSubscription && (
                    <p className={styles['delete-account__blocked']}>
                        You have an active paid subscription — cancel it first on the Subscription
                        page, then return here.
                    </p>
                )}
                <Group>
                    <Button
                        variant="secondary"
                        disabled={hasPaidSubscription}
                        onClick={() => setModalOpen(true)}
                    >
                        Delete my account
                    </Button>
                </Group>
            </Stack>

            <Modal
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Delete your account forever?"
                size="sm"
            >
                <Stack gap="md">
                    <p className={styles['delete-account__copy']}>
                        Every tale, illustration, and reader profile will be permanently erased.
                        There is no recovery. Type <strong>{CONFIRM_WORD}</strong> to confirm.
                    </p>
                    <Input
                        label="Confirmation"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.currentTarget.value)}
                        placeholder={CONFIRM_WORD}
                    />
                    {error && <p className={styles['delete-account__error']}>{error}</p>}
                    <Group justify="flex-end" gap="sm">
                        <Button variant="quiet" onClick={() => setModalOpen(false)}>
                            Keep my account
                        </Button>
                        <Button
                            variant="primary"
                            disabled={confirmText !== CONFIRM_WORD}
                            loading={isDeleting}
                            onClick={() => void handleDelete()}
                        >
                            Delete forever
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Card>
    );
}
