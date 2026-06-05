import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const metadata: Metadata = { title: 'Edit Blueprint' };
import { storyBlueprintsServerApi } from '@/api/story-blueprints.server';
import BlueprintForm from '../_components/BlueprintForm/BlueprintForm';
import styles from './page.module.scss';

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
            <nav aria-label="Breadcrumb" className={styles.page__breadcrumb}>
                <Link href="/admin/blueprints" className={styles.page__back}>
                    ← Blueprints
                </Link>
            </nav>
            <h1 className={styles.page__title}>
                Edit: <span className={styles.page__name}>{blueprint.name}</span>
            </h1>
            <BlueprintForm blueprint={blueprint} />
        </div>
    );
}
