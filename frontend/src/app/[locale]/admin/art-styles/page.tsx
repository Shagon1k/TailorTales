'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button/Button';
import Loader from '@/components/ui/Loader/Loader';
import Modal from '@/components/ui/Modal/Modal';
import {
    useAdminArtStyles,
    useCreateArtStyle,
    useGenerateArtStyleThumbnail,
    useReorderArtStyles,
    useUpdateArtStyle,
} from '@/hooks/admin';
import type { IArtStyle } from '@/types/art-style.types';
import ArtStyleForm, { type IArtStyleFormValues } from './_components/ArtStyleForm/ArtStyleForm';
import ArtStylesTable from './_components/ArtStylesTable/ArtStylesTable';
import styles from './page.module.scss';

type TModalState = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; style: IArtStyle };

export default function ArtStylesPage(): React.ReactElement {
    const t = useTranslations('admin.artStyles');
    const { data, isLoading } = useAdminArtStyles();
    const { mutate: createStyle, isPending: isCreating } = useCreateArtStyle();
    const {
        mutate: updateStyle,
        isPending: isUpdating,
        variables: updateVariables,
    } = useUpdateArtStyle();
    const { mutate: reorderStyles, isPending: isReordering } = useReorderArtStyles();
    const {
        mutate: generateThumbnail,
        isPending: isGenerating,
        variables: generatingId,
    } = useGenerateArtStyleThumbnail();

    const isMutating = isCreating || isReordering || isGenerating;
    const updatingId = isUpdating ? updateVariables?.id : undefined;

    const [modal, setModal] = useState<TModalState>({ kind: 'closed' });
    const sorted = [...(data ?? [])].sort((a, b) => a.order - b.order);

    function handleCreate(values: IArtStyleFormValues): void {
        createStyle(
            { ...values, order: sorted.length },
            { onSuccess: () => setModal({ kind: 'closed' }) },
        );
    }

    function handleEdit(values: IArtStyleFormValues): void {
        if (modal.kind !== 'edit') return;
        updateStyle(
            { id: modal.style.id, payload: values },
            { onSuccess: () => setModal({ kind: 'closed' }) },
        );
    }

    function handleToggleActive(style: IArtStyle): void {
        updateStyle({ id: style.id, payload: { isActive: !style.isActive } });
    }

    function handleMoveUp(style: IArtStyle): void {
        const idx = sorted.findIndex((s) => s.id === style.id);
        if (idx <= 0) return;
        const newIds = sorted.map((s) => s.id);
        [newIds[idx - 1], newIds[idx]] = [newIds[idx], newIds[idx - 1]];
        reorderStyles(newIds);
    }

    function handleMoveDown(style: IArtStyle): void {
        const idx = sorted.findIndex((s) => s.id === style.id);
        if (idx < 0 || idx >= sorted.length - 1) return;
        const newIds = sorted.map((s) => s.id);
        [newIds[idx], newIds[idx + 1]] = [newIds[idx + 1], newIds[idx]];
        reorderStyles(newIds);
    }

    return (
        <div className={styles.page}>
            <div className={styles.page__header}>
                <h2 className={styles.page__title}>{t('heading')}</h2>
                <Button onClick={() => setModal({ kind: 'create' })}>{t('add')}</Button>
            </div>

            {isLoading || !data ? (
                <Loader label={t('loading')} />
            ) : sorted.length === 0 ? (
                <p className={styles.page__empty}>{t('empty')}</p>
            ) : (
                <div className={styles['page__table-wrap']}>
                    <ArtStylesTable
                        artStyles={sorted}
                        onEdit={(style) => setModal({ kind: 'edit', style })}
                        onToggleActive={handleToggleActive}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        onGenerateThumbnail={(style) => generateThumbnail(style.id)}
                        isMutating={isMutating}
                        updatingId={updatingId}
                        generatingId={isGenerating ? generatingId : undefined}
                    />
                </div>
            )}

            <Modal
                opened={modal.kind !== 'closed'}
                onClose={() => setModal({ kind: 'closed' })}
                title={modal.kind === 'edit' ? t('editModalTitle') : t('createModalTitle')}
            >
                {modal.kind === 'create' && (
                    <ArtStyleForm
                        onSubmit={handleCreate}
                        onCancel={() => setModal({ kind: 'closed' })}
                        isSubmitting={isCreating}
                    />
                )}
                {modal.kind === 'edit' && (
                    <ArtStyleForm
                        initialValues={{
                            name: modal.style.name,
                            slug: modal.style.slug,
                            promptPrefix: modal.style.promptPrefix,
                        }}
                        onSubmit={handleEdit}
                        onCancel={() => setModal({ kind: 'closed' })}
                        isSubmitting={isUpdating}
                    />
                )}
            </Modal>
        </div>
    );
}
