import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { storyBlueprintsServerApi } from '@/api/story-blueprints.server';
import BlueprintList from './_components/BlueprintList/BlueprintList';
import styles from './page.module.scss';

export const metadata: Metadata = { title: 'Blueprints' };

export default async function BlueprintsPage(): Promise<React.ReactElement> {
    const [blueprints, t] = await Promise.all([
        storyBlueprintsServerApi.getAll(),
        getTranslations('admin.blueprints'),
    ]);

    return (
        <div className={styles.page}>
            <div className={styles.page__header}>
                <h2 className={styles.page__title}>{t('heading')}</h2>
                <Link href="/admin/blueprints/new" className={styles.page__action}>
                    {t('add')}
                </Link>
            </div>

            <BlueprintList blueprints={blueprints} />
        </div>
    );
}
