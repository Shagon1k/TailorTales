import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import BlueprintForm from '../_components/BlueprintForm/BlueprintForm';
import styles from './page.module.scss';

export const metadata: Metadata = { title: 'New Blueprint' };

export default async function NewBlueprintPage(): Promise<React.ReactElement> {
    const t = await getTranslations('admin.blueprints');

    return (
        <div className={styles.page}>
            <Link href="/admin/blueprints" className={styles.page__back}>
                {t('backLink')}
            </Link>
            <h2 className={styles.page__title}>{t('newHeading')}</h2>
            <BlueprintForm />
        </div>
    );
}
