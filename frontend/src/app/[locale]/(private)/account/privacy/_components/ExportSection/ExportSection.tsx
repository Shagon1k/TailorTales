'use client';

import { useState } from 'react';
import { Group, Stack } from '@mantine/core';
import { accountApi } from '@/api/account';
import Button from '@/components/ui/Button/Button';
import Card from '@/components/ui/Card/Card';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import styles from './ExportSection.module.scss';

export default function ExportSection(): React.ReactElement {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleExport(): Promise<void> {
        setIsExporting(true);
        setError(null);
        try {
            await accountApi.exportData();
        } catch {
            setError('Export failed — please try again.');
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <Card variant="default" size="md">
            <Stack gap="sm">
                <CapsLabel>Export my data</CapsLabel>
                <p className={styles['export-section__copy']}>
                    Download everything we hold about you — profile, readers, characters, stories
                    (with download links for files that still exist) — as a single JSON file.
                </p>
                <Group>
                    <Button
                        variant="secondary"
                        onClick={() => handleExport()}
                        loading={isExporting}
                    >
                        Export my data
                    </Button>
                </Group>
                {error && <p className={styles['export-section__error']}>{error}</p>}
            </Stack>
        </Card>
    );
}
