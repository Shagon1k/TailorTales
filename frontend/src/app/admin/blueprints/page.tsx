import type { Metadata } from 'next';
import Link from 'next/link';
import { storyBlueprintsServerApi } from '@/api/story-blueprints.server';

export const metadata: Metadata = { title: 'Blueprints' };
import BlueprintList from './_components/BlueprintList/BlueprintList';
import styles from './page.module.scss';

export default async function BlueprintsPage(): Promise<React.ReactElement> {
    const blueprints = await storyBlueprintsServerApi.getAll();

    return (
        <div className={styles.page}>
            <div className={styles.page__header}>
                <div>
                    <h1 className={styles.page__title}>Story Blueprints</h1>
                    <p className={styles.page__sub}>
                        {blueprints.length} blueprint{blueprints.length === 1 ? '' : 's'}
                    </p>
                </div>
                <Link href="/admin/blueprints/new" className={styles.page__new}>
                    + New blueprint
                </Link>
            </div>

            <BlueprintList blueprints={blueprints} />
        </div>
    );
}
