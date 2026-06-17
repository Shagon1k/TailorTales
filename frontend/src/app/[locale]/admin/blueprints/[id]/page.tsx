import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { storyBlueprintsServerApi } from '@/api/story-blueprints.server';
import BlueprintForm from '../_components/BlueprintForm/BlueprintForm';
import styles from './page.module.scss';

export const metadata: Metadata = { title: 'Edit Blueprint' };

interface IEditBlueprintPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditBlueprintPage({
    params,
}: Readonly<IEditBlueprintPageProps>): Promise<React.ReactElement> {
    const { id } = await params;

    let blueprint;
    try {
        blueprint = await storyBlueprintsServerApi.getOne(id);
    } catch {
        notFound();
    }

    const t = await getTranslations('admin.blueprints');

    return (
        <div className={styles.page}>
            <Link href="/admin/blueprints" className={styles.page__back}>
                {t('backLink')}
            </Link>
            <h2 className={styles.page__title}>
                {t('editHeading')} <span className={styles.page__name}>{blueprint.name}</span>
            </h2>
            <BlueprintForm blueprint={blueprint} />
        </div>
    );
}
