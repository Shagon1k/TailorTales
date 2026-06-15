import { Link } from '@/i18n/navigation';
import Table from '@/components/ui/Table/Table';
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
        <Table>
            <Table.Head>
                <Table.Row>
                    <Table.HeaderCell>Name</Table.HeaderCell>
                    <Table.HeaderCell>Type</Table.HeaderCell>
                    <Table.HeaderCell>Created</Table.HeaderCell>
                    <Table.HeaderCell>
                        <span className="sr-only">Actions</span>
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
                                Edit →
                            </Link>
                        </Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
    );
}
