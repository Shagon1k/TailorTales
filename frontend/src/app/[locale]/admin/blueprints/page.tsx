import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { storyBlueprintsServerApi } from '@/api/story-blueprints.server';
import BlueprintList from './_components/BlueprintList/BlueprintList';
import styles from './page.module.scss';

export const metadata: Metadata = { title: 'Blueprints' };

export default async function BlueprintsPage(): Promise<React.ReactElement> {
    const blueprints = await storyBlueprintsServerApi.getAll();

    return (
        <div className={styles.page}>
            <div className={styles.page__header}>
                <h2 className={styles.page__title}>Story blueprints</h2>
                <Link href="/admin/blueprints/new" className={styles.page__action}>
                    + New blueprint
                </Link>
            </div>

            <BlueprintList blueprints={blueprints} />
        </div>
    );
}
