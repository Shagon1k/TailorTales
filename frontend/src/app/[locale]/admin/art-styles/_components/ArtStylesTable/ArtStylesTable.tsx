'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button/Button';
import Modal from '@/components/ui/Modal/Modal';
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
    const t = useTranslations('admin.artStyles.table');
    const [previewStyle, setPreviewStyle] = useState<IArtStyle | null>(null);

    return (
        <>
            <div className={styles.table}>
                <Table>
                    <colgroup>
                        <col className={styles.table__colThumbnail} />
                        <col className={styles.table__colName} />
                        <col className={styles.table__colPrompt} />
                        <col className={styles.table__colActive} />
                        <col className={styles.table__colOrder} />
                        <col className={styles.table__colActions} />
                    </colgroup>
                    <Table.Head>
                        <Table.Row>
                            <Table.HeaderCell>{t('thumbnail')}</Table.HeaderCell>
                            <Table.HeaderCell>{t('nameSlug')}</Table.HeaderCell>
                            <Table.HeaderCell>{t('promptPrefix')}</Table.HeaderCell>
                            <Table.HeaderCell>{t('active')}</Table.HeaderCell>
                            <Table.HeaderCell>{t('order')}</Table.HeaderCell>
                            <Table.HeaderCell>
                                <span className="sr-only">{t('actions')}</span>
                            </Table.HeaderCell>
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {artStyles.map((artStyle, idx) => (
                            <Table.Row key={artStyle.id}>
                                <Table.Cell>
                                    {artStyle.thumbnailUrl ? (
                                        <button
                                            type="button"
                                            className={styles.table__thumbnail}
                                            onClick={() => setPreviewStyle(artStyle)}
                                            aria-label={t('previewThumbnail', {
                                                name: artStyle.name,
                                            })}
                                        >
                                            <img src={artStyle.thumbnailUrl} alt="" />
                                        </button>
                                    ) : (
                                        <div className={styles['table__thumbnail-placeholder']}>
                                            {t('noThumbnail')}
                                        </div>
                                    )}
                                </Table.Cell>
                                <Table.Cell>
                                    <span className={styles.table__name}>{artStyle.name}</span>
                                    <span className={styles.table__slug}>{artStyle.slug}</span>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className={styles.table__prompt}>
                                        {artStyle.promptPrefix}
                                    </span>
                                </Table.Cell>
                                <Table.Cell>
                                    <Switch
                                        checked={artStyle.isActive}
                                        onChange={() => onToggleActive(artStyle)}
                                        label={t('activeLabel')}
                                        disabled={updatingId === artStyle.id}
                                    />
                                </Table.Cell>
                                <Table.Cell>
                                    <div className={styles.table__reorder}>
                                        <Button
                                            variant="quiet"
                                            disabled={idx === 0 || isMutating}
                                            onClick={() => onMoveUp(artStyle)}
                                            aria-label={t('moveUp', { name: artStyle.name })}
                                        >
                                            ↑
                                        </Button>
                                        <Button
                                            variant="quiet"
                                            disabled={idx === artStyles.length - 1 || isMutating}
                                            onClick={() => onMoveDown(artStyle)}
                                            aria-label={t('moveDown', { name: artStyle.name })}
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
                                            {t('edit')}
                                        </Button>
                                        <Button
                                            variant="quiet"
                                            disabled={isMutating}
                                            loading={generatingId === artStyle.id}
                                            onClick={() => onGenerateThumbnail(artStyle)}
                                        >
                                            {artStyle.thumbnailUrl
                                                ? t('regenerateThumbnail')
                                                : t('generateThumbnail')}
                                        </Button>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </div>

            <Modal
                opened={previewStyle !== null}
                onClose={() => setPreviewStyle(null)}
                title={previewStyle?.name ?? ''}
                size="lg"
            >
                {previewStyle?.thumbnailUrl && (
                    <div className={styles.preview}>
                        <div className={styles.preview__image}>
                            <img
                                src={previewStyle.thumbnailUrl}
                                alt={previewStyle.name}
                                className={styles.preview__img}
                            />
                        </div>
                        <p className={styles.preview__description}>{previewStyle.promptPrefix}</p>
                    </div>
                )}
            </Modal>
        </>
    );
}
