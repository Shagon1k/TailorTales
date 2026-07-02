'use client';

import { useState, type ReactNode } from 'react';
import { Stack } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { accountApi } from '@/api/account';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import Modal from '@/components/ui/Modal/Modal';
import { useSubscription } from '@/hooks/subscription';
import styles from './DeleteAccountAction.module.scss';

interface IDeleteAccountActionRenderProps {
    disabled: boolean;
    openModal: () => void;
}

interface IDeleteAccountActionProps {
    children: (props: IDeleteAccountActionRenderProps) => ReactNode;
}

export default function DeleteAccountAction({
    children,
}: Readonly<IDeleteAccountActionProps>): React.ReactElement {
    const t = useTranslations('account.privacy.delete');
    const { data: subscription } = useSubscription();
    const confirmWord = t('modal.confirmWord');
    const [modalOpen, setModalOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasPaidSubscription =
        subscription !== undefined &&
        subscription.tier.priceMonthly > 0 &&
        !subscription.cancelAtPeriodEnd;

    function closeModal(): void {
        setModalOpen(false);
        setConfirmText('');
        setError(null);
        setIsDeleting(false);
    }

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
        <>
            {children({
                disabled: hasPaidSubscription,
                openModal: () => {
                    if (!hasPaidSubscription) setModalOpen(true);
                },
            })}

            <Modal opened={modalOpen} onClose={closeModal} title={t('modal.title')} size="sm">
                <>
                    <Stack gap="md">
                        <p className={styles.copy}>{t('modal.body')}</p>
                        <Input
                            label={t('modal.confirmLabel')}
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.currentTarget.value)}
                            placeholder={t('modal.confirmPlaceholder')}
                        />
                        {error && <p className={styles.error}>{error}</p>}
                    </Stack>
                    <Modal.Footer>
                        <div className={styles.actions}>
                            <Button variant="quiet" onClick={closeModal}>
                                {t('modal.keepButton')}
                            </Button>
                            <Button
                                variant="primary"
                                disabled={confirmText !== confirmWord}
                                loading={isDeleting}
                                onClick={() => handleDelete()}
                            >
                                {t('modal.confirmButton')}
                            </Button>
                        </div>
                    </Modal.Footer>
                </>
            </Modal>
        </>
    );
}
