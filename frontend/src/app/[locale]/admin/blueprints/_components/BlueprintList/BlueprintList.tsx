import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Table from '@/components/ui/Table/Table';
import type { IStoryBlueprintSummary } from '@/types/story-blueprint.types';
import styles from './BlueprintList.module.scss';

export interface IBlueprintListProps {
    blueprints: IStoryBlueprintSummary[];
}

export default async function BlueprintList({
    blueprints,
}: Readonly<IBlueprintListProps>): Promise<React.ReactElement> {
    const t = await getTranslations('admin.blueprints.list');

    if (blueprints.length === 0) {
        return (
            <p className={styles['blueprint-list__empty']}>
                {t('empty')}{' '}
                <Link
                    href="/admin/blueprints/new"
                    className={styles['blueprint-list__create-link']}
                >
                    {t('createFirst')}
                </Link>
            </p>
        );
    }

    return (
        <Table>
            <Table.Head>
                <Table.Row>
                    <Table.HeaderCell>{t('name')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('type')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('created')}</Table.HeaderCell>
                    <Table.HeaderCell>
                        <span className="sr-only">{t('actions')}</span>
                    </Table.HeaderCell>
                </Table.Row>
            </Table.Head>
            <Table.Body>
                {blueprints.map((bp) => (
                    <Table.Row key={bp.id}>
                        <Table.Cell>
                            <span className={styles['blueprint-list__name']}>{bp.name}</span>
                            <span className={styles['blueprint-list__desc']}>{bp.description}</span>
                        </Table.Cell>
                        <Table.Cell>
                            <span className={styles['blueprint-list__badge']}>{bp.type}</span>
                        </Table.Cell>
                        <Table.Cell>
                            {new Date(bp.createdAt).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </Table.Cell>
                        <Table.Cell>
                            <Link
                                href={`/admin/blueprints/${bp.id}`}
                                className={styles['blueprint-list__edit-link']}
                            >
                                {t('edit')}
                            </Link>
                        </Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
    );
}
