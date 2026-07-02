'use client';

import { useTranslations } from 'next-intl';
import { Group, Stack } from '@mantine/core';
import Button from '@/components/ui/Button/Button';
import Card from '@/components/ui/Card/Card';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import DeleteAccountAction from '@/app/[locale]/(private)/account/_components/DeleteAccountAction/DeleteAccountAction';
import styles from './DeleteAccountSection.module.scss';

interface IDeleteAccountSectionProps {
    hasPaidSubscription: boolean;
}

export default function DeleteAccountSection({
    hasPaidSubscription,
}: Readonly<IDeleteAccountSectionProps>): React.ReactElement {
    const t = useTranslations('account.privacy.delete');

    return (
        <Card variant="gradient" size="md">
            <Stack gap="sm">
                <CapsLabel variant="gold">{t('eyebrow')}</CapsLabel>
                <p className={styles['delete-account__copy']}>{t('body')}</p>
                {hasPaidSubscription && (
                    <p className={styles['delete-account__blocked']}>{t('blocked')}</p>
                )}
                <Group>
                    <DeleteAccountAction>
                        {({ disabled, openModal }) => (
                            <Button
                                variant="secondary"
                                disabled={disabled}
                                onClick={() => openModal()}
                            >
                                {t('button')}
                            </Button>
                        )}
                    </DeleteAccountAction>
                </Group>
            </Stack>
        </Card>
    );
}
