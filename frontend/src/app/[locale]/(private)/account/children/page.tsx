'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Loader from '@/components/ui/Loader/Loader';
import Modal from '@/components/ui/Modal/Modal';
import Button from '@/components/ui/Button/Button';
import ChildCard from './_components/ChildCard/ChildCard';
import ChildForm, { type IChildFormValues } from './_components/ChildForm/ChildForm';
import CharacterForm, {
    type ICharacterFormValues,
} from '../../_components/CharacterForm/CharacterForm';
import { useChildren, useCreateChild, useDeleteChild, useUpdateChild } from '@/hooks/children';
import {
    useCharacters,
    useCreateCharacter,
    useCreateCharacterFromPrompt,
    useDeleteCharacter,
    useUpdateCharacter,
} from '@/hooks/characters';
import { useSubscription } from '@/hooks/subscription';
import type { IChild } from '@/types/child.types';
import type { ICharacter } from '@/types/character.types';
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
    const { mutate: createCharacterFromPrompt, isPending: isGeneratingCharacter } =
        useCreateCharacterFromPrompt();

    const childrenLimit = subscription?.tier.childrenLimit ?? null;
    const atChildrenLimit = childrenLimit !== null && children.length >= childrenLimit;

    const [modal, setModal] = useState<TModalState>({ kind: 'closed' });
    const close = (): void => setModal({ kind: 'closed' });

    // A child may own several characters — group them all (Model B).
    const charactersByChildId = new Map<string, ICharacter[]>();
    for (const character of characters) {
        if (character.childId === null) continue;
        const list = charactersByChildId.get(character.childId) ?? [];
        list.push(character);
        charactersByChildId.set(character.childId, list);
    }

    const isFormOpen = modal.kind === 'add' || modal.kind === 'edit';
    const isCharacterFormOpen = modal.kind === 'character';

    function handleChildSubmit(values: IChildFormValues): void {
        if (modal.kind === 'edit') {
            updateChild({ id: modal.child.id, payload: values }, { onSuccess: close });
        } else {
            createChild(values, { onSuccess: close });
        }
    }

    function handleCharacterSubmit(values: ICharacterFormValues): void {
        if (modal.kind !== 'character') return;
        if (modal.character) {
            updateCharacter({ id: modal.character.id, payload: values }, { onSuccess: close });
        } else {
            createCharacter({ ...values, childId: modal.child.id }, { onSuccess: close });
        }
    }

    function handleGenerateCharacter(prompt: string): void {
        if (modal.kind !== 'character') return;
        createCharacterFromPrompt({ childId: modal.child.id, prompt }, { onSuccess: close });
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
            <h2 className={styles.heading}>{t('heading')}</h2>

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
                <>
                    <div className={styles['add-row']}>
                        <Button
                            variant="secondary"
                            onClick={() => setModal({ kind: 'add' })}
                            disabled={atChildrenLimit}
                        >
                            {t('addButton')}
                        </Button>
                        {atChildrenLimit && (
                            <p className={styles['add-row__limit-hint']}>{t('limitHint')}</p>
                        )}
                    </div>
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
                            />
                        ))}
                    </div>
                </>
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
                    modal.kind === 'character' && modal.character
                        ? tCharModal('editTitle')
                        : tCharModal('addTitle')
                }
            >
                {isCharacterFormOpen && (
                    <CharacterForm
                        initialValues={
                            modal.character
                                ? {
                                      name: modal.character.name,
                                      description: modal.character.description,
                                  }
                                : undefined
                        }
                        onSubmit={handleCharacterSubmit}
                        onCancel={close}
                        isSubmitting={
                            modal.kind === 'character' && modal.character
                                ? isUpdatingCharacter
                                : isCreatingCharacter
                        }
                        onGenerateFromPrompt={
                            modal.kind === 'character' && !modal.character
                                ? handleGenerateCharacter
                                : undefined
                        }
                        isGenerating={isGeneratingCharacter}
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
