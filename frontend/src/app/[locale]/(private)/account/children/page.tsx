'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Loader from '@/components/ui/Loader/Loader';
import Modal from '@/components/ui/Modal/Modal';
import Button from '@/components/ui/Button/Button';
import InlineMetrics from '@/components/ui/InlineMetrics/InlineMetrics';
import ChildCard from './_components/ChildCard/ChildCard';
import ChildForm, { type IChildFormValues } from './_components/ChildForm/ChildForm';
import CharacterForm, {
    type ICharacterFormValues,
} from '../../_components/CharacterForm/CharacterForm';
import { useChildren, useCreateChild, useDeleteChild, useUpdateChild } from '@/hooks/children';
import {
    useCharacters,
    useCreateCharacter,
    useDeleteCharacter,
    useGenerateCharacterPreview,
    useUpdateCharacter,
} from '@/hooks/characters';
import { useSubscription } from '@/hooks/subscription';
import type { IChild } from '@/types/child.types';
import type { ICharacter, IUserCharacterSource } from '@/types/character.types';
import styles from './page.module.scss';

type TModalState =
    | { kind: 'closed' }
    | { kind: 'add' }
    | { kind: 'edit'; child: IChild }
    | { kind: 'delete'; child: IChild }
    | { kind: 'character'; child: IChild; character: ICharacter | null }
    | { kind: 'deleteCharacter'; character: ICharacter };

export default function ChildrenPage(): React.ReactElement {
    const t = useTranslations('account.children');
    const tCharModal = useTranslations('workshop.form.characterModal');
    const { data: children = [], isLoading } = useChildren();
    const { data: characters = [] } = useCharacters();
    const { data: subscription } = useSubscription();
    const { mutate: createChild, isPending: isCreating } = useCreateChild();
    const { mutate: updateChild, isPending: isUpdating } = useUpdateChild();
    const { mutate: deleteChild, isPending: isDeleting } = useDeleteChild();
    const { mutate: createCharacter, isPending: isCreatingCharacter } = useCreateCharacter();
    const { mutate: updateCharacter, isPending: isUpdatingCharacter } = useUpdateCharacter();
    const { mutate: deleteCharacter, isPending: isDeletingCharacter } = useDeleteCharacter();
    const { mutate: generateCharacterPreview } = useGenerateCharacterPreview();

    const childrenLimit = subscription?.tier.childrenLimit ?? null;
    const atChildrenLimit = childrenLimit !== null && children.length >= childrenLimit;
    const charactersLimit = subscription?.tier.charactersLimit ?? null;
    const charactersLeft =
        charactersLimit === null ? null : Math.max(charactersLimit - characters.length, 0);
    const characterGenerationLimit = subscription?.tier.characterGenerationsPerMonth ?? 0;
    const characterGenerationsUsed = subscription?.characterGenerationsUsed ?? 0;
    const characterGenerationsLeft = Math.max(
        characterGenerationLimit - characterGenerationsUsed,
        0,
    );
    const canCreateCharacter =
        characterGenerationsLeft > 0 && (charactersLeft === null || charactersLeft > 0);

    const [modal, setModal] = useState<TModalState>({ kind: 'closed' });
    const [generatingCharacterPreviewId, setGeneratingCharacterPreviewId] = useState<string | null>(
        null,
    );
    const close = (): void => setModal({ kind: 'closed' });

    // A child may own several characters — group them all (Model B).
    const charactersByChildId = new Map<string, ICharacter[]>();
    for (const character of characters) {
        const list = charactersByChildId.get(character.childId) ?? [];
        list.push(character);
        charactersByChildId.set(character.childId, list);
    }

    const isFormOpen = modal.kind === 'add' || modal.kind === 'edit';
    const activeCharacterModal = modal.kind === 'character' ? modal : null;
    const isCharacterFormOpen = activeCharacterModal !== null;

    function handleChildSubmit(values: IChildFormValues): void {
        if (modal.kind === 'edit') {
            updateChild({ id: modal.child.id, payload: values }, { onSuccess: close });
        } else {
            createChild(values, { onSuccess: close });
        }
    }

    function handleCharacterSubmit(
        values: ICharacterFormValues,
        source: IUserCharacterSource,
    ): void {
        if (!activeCharacterModal) return;
        if (activeCharacterModal.character) {
            updateCharacter(
                { id: activeCharacterModal.character.id, payload: values },
                { onSuccess: close },
            );
        } else {
            createCharacter(
                { ...values, childId: activeCharacterModal.child.id, source },
                { onSuccess: close },
            );
        }
    }

    function handleCharacterPreviewGenerate(character: ICharacter): void {
        setGeneratingCharacterPreviewId(character.id);
        generateCharacterPreview(character.id, {
            onSettled: () => setGeneratingCharacterPreviewId(null),
        });
    }

    if (isLoading) {
        return (
            <div className={styles.page}>
                <Loader label={t('loading')} />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {children.length === 0 ? (
                <div className={styles.empty}>
                    <p className={styles['empty__text']}>{t('empty')}</p>
                    <Button
                        variant="primary"
                        onClick={() => setModal({ kind: 'add' })}
                        disabled={atChildrenLimit}
                    >
                        {t('addFirstButton')}
                    </Button>
                </div>
            ) : (
                <div className={styles.content}>
                    <div className={styles.main}>
                        <div className={styles.grid}>
                            {children.map((child) => (
                                <ChildCard
                                    key={child.id}
                                    child={child}
                                    characters={charactersByChildId.get(child.id) ?? []}
                                    onEdit={(c) => setModal({ kind: 'edit', child: c })}
                                    onDelete={(c) => setModal({ kind: 'delete', child: c })}
                                    onCharacterAdd={(c) =>
                                        setModal({ kind: 'character', child: c, character: null })
                                    }
                                    onCharacterEdit={(c, character) =>
                                        setModal({ kind: 'character', child: c, character })
                                    }
                                    onCharacterDelete={(character) =>
                                        setModal({ kind: 'deleteCharacter', character })
                                    }
                                    onCharacterGeneratePreview={handleCharacterPreviewGenerate}
                                    canAddCharacter={canCreateCharacter}
                                    canGenerateCharacterPreview={characterGenerationsLeft > 0}
                                    generatingCharacterPreviewId={generatingCharacterPreviewId}
                                    addCharacterHint={
                                        !canCreateCharacter
                                            ? characterGenerationsLeft === 0
                                                ? t('characterGenerationLimitHint')
                                                : t('characterLimitHint')
                                            : null
                                    }
                                />
                            ))}
                        </div>
                    </div>
                    <aside className={styles.aside}>
                        <section className={styles.utility} aria-label={t('quotaLabel')}>
                            <div className={styles['add-row']}>
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => setModal({ kind: 'add' })}
                                    disabled={atChildrenLimit}
                                >
                                    {t('addButton')}
                                </Button>
                                {atChildrenLimit && (
                                    <p className={styles['add-row__limit-hint']}>
                                        {t('limitHint')}
                                    </p>
                                )}
                            </div>
                            <InlineMetrics
                                align="center"
                                items={[
                                    {
                                        id: 'generations',
                                        value: characterGenerationsLeft,
                                        label: t('characterQuotaMetricLabel', {
                                            count: characterGenerationsLeft,
                                        }),
                                    },
                                    {
                                        id: 'slots',
                                        value: charactersLeft === null ? '∞' : charactersLeft,
                                        label:
                                            charactersLeft === null
                                                ? t('characterSlotsUnlimitedMetricLabel')
                                                : t('characterSlotsMetricLabel', {
                                                      count: charactersLeft,
                                                  }),
                                    },
                                ]}
                            />
                        </section>
                    </aside>
                </div>
            )}

            <Modal
                opened={isFormOpen}
                onClose={close}
                title={modal.kind === 'edit' ? t('editModal.title') : t('addModal.title')}
            >
                {isFormOpen && (
                    <ChildForm
                        initialValues={
                            modal.kind === 'edit'
                                ? {
                                      name: modal.child.name,
                                      birthdate: modal.child.birthdate.split('T')[0],
                                      gender: modal.child.gender,
                                      interests: modal.child.interests,
                                  }
                                : undefined
                        }
                        onSubmit={handleChildSubmit}
                        onCancel={close}
                        isSubmitting={modal.kind === 'edit' ? isUpdating : isCreating}
                    />
                )}
            </Modal>

            <Modal
                opened={isCharacterFormOpen}
                onClose={close}
                title={
                    activeCharacterModal?.character
                        ? tCharModal('editTitle')
                        : tCharModal('addTitle')
                }
            >
                {activeCharacterModal && (
                    <CharacterForm
                        initialValues={
                            activeCharacterModal.character
                                ? {
                                      name: activeCharacterModal.character.name,
                                      description: activeCharacterModal.character.description,
                                  }
                                : undefined
                        }
                        onSubmit={handleCharacterSubmit}
                        onCancel={close}
                        isSubmitting={
                            activeCharacterModal.character
                                ? isUpdatingCharacter
                                : isCreatingCharacter
                        }
                    />
                )}
            </Modal>

            <Modal
                opened={modal.kind === 'delete'}
                onClose={close}
                title={t('deleteModal.title')}
                size="sm"
            >
                {modal.kind === 'delete' && (
                    <div className={styles['delete-confirm']}>
                        <p className={styles['delete-confirm__text']}>
                            {t('deleteConfirm', { childName: modal.child.name })}
                        </p>
                        <div className={styles['delete-confirm__actions']}>
                            <Button variant="quiet" onClick={close} disabled={isDeleting}>
                                {t('deleteModal.cancelButton')}
                            </Button>
                            <Button
                                variant="primary"
                                loading={isDeleting}
                                onClick={() => deleteChild(modal.child.id, { onSuccess: close })}
                            >
                                {t('deleteModal.deleteButton')}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                opened={modal.kind === 'deleteCharacter'}
                onClose={close}
                title={t('deleteCharacterModal.title')}
                size="sm"
            >
                {modal.kind === 'deleteCharacter' && (
                    <div className={styles['delete-confirm']}>
                        <p className={styles['delete-confirm__text']}>
                            {t('deleteCharacterConfirm', { characterName: modal.character.name })}
                        </p>
                        <div className={styles['delete-confirm__actions']}>
                            <Button variant="quiet" onClick={close} disabled={isDeletingCharacter}>
                                {t('deleteModal.cancelButton')}
                            </Button>
                            <Button
                                variant="primary"
                                loading={isDeletingCharacter}
                                onClick={() =>
                                    deleteCharacter(modal.character.id, { onSuccess: close })
                                }
                            >
                                {t('deleteModal.deleteButton')}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
