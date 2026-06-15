'use client';

import { useState } from 'react';
import Loader from '@/components/ui/Loader/Loader';
import Modal from '@/components/ui/Modal/Modal';
import Button from '@/components/ui/Button/Button';
import ChildCard from './_components/ChildCard/ChildCard';
import ChildForm, { type IChildFormValues } from './_components/ChildForm/ChildForm';
import CharacterForm, {
    type ICharacterFormValues,
} from '../../_components/CharacterForm/CharacterForm';
import { useChildren, useCreateChild, useDeleteChild, useUpdateChild } from '@/hooks/children';
import { useCharacters, useCreateCharacter, useUpdateCharacter } from '@/hooks/characters';
import { useSubscription } from '@/hooks/subscription';
import type { IChild } from '@/types/child.types';
import type { ICharacter } from '@/types/character.types';
import styles from './page.module.scss';

type TModalState =
    | { kind: 'closed' }
    | { kind: 'add' }
    | { kind: 'edit'; child: IChild }
    | { kind: 'delete'; child: IChild }
    | { kind: 'character'; child: IChild; character: ICharacter | null };

export default function ChildrenPage(): React.ReactElement {
    const { data: children = [], isLoading } = useChildren();
    const { data: characters = [] } = useCharacters();
    const { data: subscription } = useSubscription();
    const { mutate: createChild, isPending: isCreating } = useCreateChild();
    const { mutate: updateChild, isPending: isUpdating } = useUpdateChild();
    const { mutate: deleteChild, isPending: isDeleting } = useDeleteChild();
    const { mutate: createCharacter, isPending: isCreatingCharacter } = useCreateCharacter();
    const { mutate: updateCharacter, isPending: isUpdatingCharacter } = useUpdateCharacter();

    const childrenLimit = subscription?.tier.childrenLimit ?? null;
    const atChildrenLimit = childrenLimit !== null && children.length >= childrenLimit;

    const [modal, setModal] = useState<TModalState>({ kind: 'closed' });
    const close = (): void => setModal({ kind: 'closed' });

    const characterByChildId = new Map(
        characters
            .filter((c): c is ICharacter & { childId: string } => c.childId !== null)
            .map((c) => [c.childId, c]),
    );

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

    if (isLoading) {
        return (
            <div className={styles.page}>
                <Loader label="Loading children" />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <h2 className={styles.heading}>Children</h2>

            {children.length === 0 ? (
                <div className={styles.empty}>
                    <p className={styles['empty__text']}>No children yet.</p>
                    <Button
                        variant="primary"
                        onClick={() => setModal({ kind: 'add' })}
                        disabled={atChildrenLimit}
                    >
                        Add your first child
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
                            Add child
                        </Button>
                        {atChildrenLimit && (
                            <p className={styles['add-row__limit-hint']}>
                                You&apos;ve reached the child limit for your plan.{' '}
                                <a href="/pricing">Upgrade</a> to add more.
                            </p>
                        )}
                    </div>
                    <div className={styles.grid}>
                        {children.map((child) => (
                            <ChildCard
                                key={child.id}
                                child={child}
                                character={characterByChildId.get(child.id) ?? null}
                                onEdit={(c) => setModal({ kind: 'edit', child: c })}
                                onDelete={(c) => setModal({ kind: 'delete', child: c })}
                                onCharacterEdit={(c) =>
                                    setModal({
                                        kind: 'character',
                                        child: c,
                                        character: characterByChildId.get(c.id) ?? null,
                                    })
                                }
                            />
                        ))}
                    </div>
                </>
            )}

            <Modal
                opened={isFormOpen}
                onClose={close}
                title={modal.kind === 'edit' ? 'Edit child' : 'Add child'}
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
                        ? 'Edit character'
                        : 'Add character'
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
                    />
                )}
            </Modal>

            <Modal opened={modal.kind === 'delete'} onClose={close} title="Delete child" size="sm">
                {modal.kind === 'delete' && (
                    <div className={styles['delete-confirm']}>
                        <p className={styles['delete-confirm__text']}>
                            Are you sure you want to delete <strong>{modal.child.name}</strong>?
                            This cannot be undone.
                        </p>
                        <div className={styles['delete-confirm__actions']}>
                            <Button variant="quiet" onClick={close} disabled={isDeleting}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                loading={isDeleting}
                                onClick={() => deleteChild(modal.child.id, { onSuccess: close })}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
