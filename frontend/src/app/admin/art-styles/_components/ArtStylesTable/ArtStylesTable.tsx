import Button from '@/components/ui/Button/Button';
import Switch from '@/components/ui/Switch/Switch';
import Table from '@/components/ui/Table/Table';
import type { IArtStyle } from '@/types/art-style.types';
import styles from './ArtStylesTable.module.scss';

export interface IArtStylesTableProps {
    artStyles: IArtStyle[];
    onEdit: (style: IArtStyle) => void;
    onToggleActive: (style: IArtStyle) => void;
    onMoveUp: (style: IArtStyle) => void;
    onMoveDown: (style: IArtStyle) => void;
    onGenerateThumbnail: (style: IArtStyle) => void;
    /** Blocks reorder / create / generate-thumbnail actions globally. */
    isMutating: boolean;
    /** ID of the row whose isActive is being saved — only that switch is disabled. */
    updatingId: string | undefined;
    generatingId: string | undefined;
}

export default function ArtStylesTable({
    artStyles,
    onEdit,
    onToggleActive,
    onMoveUp,
    onMoveDown,
    onGenerateThumbnail,
    isMutating,
    updatingId,
    generatingId,
}: Readonly<IArtStylesTableProps>): React.ReactElement {
    return (
        <Table>
            <Table.Head>
                <Table.Row>
                    <Table.HeaderCell>Thumbnail</Table.HeaderCell>
                    <Table.HeaderCell>Name / Slug</Table.HeaderCell>
                    <Table.HeaderCell>Prompt prefix</Table.HeaderCell>
                    <Table.HeaderCell>Active</Table.HeaderCell>
                    <Table.HeaderCell>Order</Table.HeaderCell>
                    <Table.HeaderCell>
                        <span className="sr-only">Actions</span>
                    </Table.HeaderCell>
                </Table.Row>
            </Table.Head>
            <Table.Body>
                {artStyles.map((artStyle, idx) => (
                    <Table.Row key={artStyle.id}>
                        <Table.Cell>
                            {artStyle.thumbnailUrl ? (
                                <img
                                    src={artStyle.thumbnailUrl}
                                    alt={artStyle.name}
                                    className={styles.table__thumbnail}
                                />
                            ) : (
                                <div className={styles['table__thumbnail-placeholder']}>none</div>
                            )}
                        </Table.Cell>
                        <Table.Cell>
                            <span className={styles.table__name}>{artStyle.name}</span>
                            <span className={styles.table__slug}>{artStyle.slug}</span>
                        </Table.Cell>
                        <Table.Cell>
                            <span className={styles.table__prompt}>{artStyle.promptPrefix}</span>
                        </Table.Cell>
                        <Table.Cell>
                            <Switch
                                checked={artStyle.isActive}
                                onChange={() => onToggleActive(artStyle)}
                                label="Active"
                                disabled={updatingId === artStyle.id}
                            />
                        </Table.Cell>
                        <Table.Cell>
                            <div className={styles.table__reorder}>
                                <Button
                                    variant="quiet"
                                    disabled={idx === 0 || isMutating}
                                    onClick={() => onMoveUp(artStyle)}
                                    aria-label={`Move ${artStyle.name} up`}
                                >
                                    ↑
                                </Button>
                                <Button
                                    variant="quiet"
                                    disabled={idx === artStyles.length - 1 || isMutating}
                                    onClick={() => onMoveDown(artStyle)}
                                    aria-label={`Move ${artStyle.name} down`}
                                >
                                    ↓
                                </Button>
                            </div>
                        </Table.Cell>
                        <Table.Cell>
                            <div className={styles.table__actions}>
                                <Button
                                    variant="secondary"
                                    disabled={isMutating}
                                    onClick={() => onEdit(artStyle)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="quiet"
                                    disabled={isMutating}
                                    loading={generatingId === artStyle.id}
                                    onClick={() => onGenerateThumbnail(artStyle)}
                                >
                                    {artStyle.thumbnailUrl ? 'Regenerate' : 'Generate thumbnail'}
                                </Button>
                            </div>
                        </Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
    );
}
