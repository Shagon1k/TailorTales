'use client';

import { useTranslations } from 'next-intl';
import { Stack } from '@mantine/core';
import Card from '@/components/ui/Card/Card';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import styles from './PrivacyInfo.module.scss';

export default function PrivacyInfo(): React.ReactElement {
    const t = useTranslations('account.privacy.info');

    const sections = [
        { title: t('whatWeCollect.title'), body: t('whatWeCollect.body') },
        { title: t('whyWeProcessIt.title'), body: t('whyWeProcessIt.body') },
        { title: t('whoHelpUs.title'), body: t('whoHelpUs.body') },
        { title: t('howLongWeKeepIt.title'), body: t('howLongWeKeepIt.body') },
        { title: t('yourRights.title'), body: t('yourRights.body') },
    ];

    return (
        <Card variant="gradient" size="md">
            <Stack gap="md">
                <CapsLabel variant="gold">{t('eyebrow')}</CapsLabel>
                {sections.map((section) => (
                    <div key={section.title}>
                        <h3 className={styles['privacy-info__title']}>{section.title}</h3>
                        <p className={styles['privacy-info__body']}>{section.body}</p>
                    </div>
                ))}
            </Stack>
        </Card>
    );
}
