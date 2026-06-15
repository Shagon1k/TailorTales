import type { Metadata } from 'next';
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

    return (
        <div className={styles.page}>
            <Link href="/admin/blueprints" className={styles.page__back}>
                ← Blueprints
            </Link>
            <h2 className={styles.page__title}>
                Edit: <span className={styles.page__name}>{blueprint.name}</span>
            </h2>
            <BlueprintForm blueprint={blueprint} />
        </div>
    );
}
