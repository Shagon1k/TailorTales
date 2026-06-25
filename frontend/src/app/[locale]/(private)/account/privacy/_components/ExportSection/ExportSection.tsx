'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Group, Stack } from '@mantine/core';
import { accountApi } from '@/api/account';
import Button from '@/components/ui/Button/Button';
import Card from '@/components/ui/Card/Card';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import styles from './ExportSection.module.scss';

export default function ExportSection(): React.ReactElement {
    const t = useTranslations('account.privacy.export');
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleExport(): Promise<void> {
        setIsExporting(true);
        setError(null);
        try {
            await accountApi.exportData();
        } catch {
            setError(t('error'));
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <Card variant="gradient" size="md">
            <Stack gap="sm">
                <CapsLabel>{t('eyebrow')}</CapsLabel>
                <p className={styles['export-section__copy']}>{t('body')}</p>
                <Group>
                    <Button
                        variant="secondary"
                        onClick={() => handleExport()}
                        loading={isExporting}
                    >
                        {t('button')}
                    </Button>
                </Group>
                {error && <p className={styles['export-section__error']}>{error}</p>}
            </Stack>
        </Card>
    );
}
