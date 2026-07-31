'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import LoadingState from '@/components/shared/LoadingState/LoadingState';
import { useRouter } from '@/i18n/navigation';
import { getPaddle } from '@/lib/paddle';

export default function PaddlePaymentLink(): React.ReactElement {
    const router = useRouter();
    const t = useTranslations('common');

    useEffect(() => {
        let isActive = true;

        const initializePaymentLink = async (): Promise<void> => {
            try {
                const paddle = await getPaddle();
                if (!paddle && isActive) {
                    router.replace('/pricing');
                }
            } catch {
                if (isActive) {
                    router.replace('/pricing');
                }
            }
        };

        initializePaymentLink();

        return () => {
            isActive = false;
        };
    }, [router]);

    return <LoadingState label={t('loadingPage')} />;
}
