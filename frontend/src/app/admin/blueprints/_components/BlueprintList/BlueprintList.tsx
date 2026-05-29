import Link from 'next/link';
import type { IStoryBlueprintSummary } from '@/types/story-blueprint.types';
import styles from './BlueprintList.module.scss';

export interface IBlueprintListProps {
    blueprints: IStoryBlueprintSummary[];
}

export default function BlueprintList({
    blueprints,
}: Readonly<IBlueprintListProps>): React.ReactElement {
    if (blueprints.length === 0) {
        return (
            <p className={styles['blueprint-list__empty']}>
                No blueprints yet.{' '}
                <Link
                    href="/admin/blueprints/new"
                    className={styles['blueprint-list__create-link']}
                >
                    Create the first one →
                </Link>
            </p>
        );
    }

    return (
        <table className={styles['blueprint-list']}>
            <thead>
                <tr>
                    <th className={styles['blueprint-list__th']}>Name</th>
                    <th className={styles['blueprint-list__th']}>Type</th>
                    <th className={styles['blueprint-list__th']}>Created</th>
                    <th className={styles['blueprint-list__th']}>
                        <span className="sr-only">Actions</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {blueprints.map((bp) => (
                    <tr key={bp.id} className={styles['blueprint-list__row']}>
                        <td className={styles['blueprint-list__td']}>
                            <span className={styles['blueprint-list__name']}>{bp.name}</span>
                            <span className={styles['blueprint-list__desc']}>{bp.description}</span>
                        </td>
                        <td className={styles['blueprint-list__td']}>
                            <span className={styles['blueprint-list__badge']}>{bp.type}</span>
                        </td>
                        <td className={styles['blueprint-list__td']}>
                            {new Date(bp.createdAt).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </td>
                        <td className={styles['blueprint-list__td']}>
                            <Link
                                href={`/admin/blueprints/${bp.id}`}
                                className={styles['blueprint-list__edit-link']}
                            >
                                Edit →
                            </Link>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
