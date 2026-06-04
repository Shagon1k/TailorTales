'use client';

import { useState } from 'react';
import { Loader } from '@mantine/core';
import Modal from '@/components/ui/Modal/Modal';
import Button from '@/components/ui/Button/Button';
import ChildCard from './_components/ChildCard/ChildCard';
import ChildForm, { type IChildFormValues } from './_components/ChildForm/ChildForm';
import { useChildren, useCreateChild, useDeleteChild, useUpdateChild } from '@/hooks/children';
import type { IChild } from '@/types/child.types';
import styles from './page.module.scss';

type TModalState =
    | { kind: 'closed' }
    | { kind: 'add' }
    | { kind: 'edit'; child: IChild }
    | { kind: 'delete'; child: IChild };

export default function ChildrenPage(): React.ReactElement {
    const { data: children = [], isLoading } = useChildren();
    const { mutate: createChild, isPending: isCreating } = useCreateChild();
    const { mutate: updateChild, isPending: isUpdating } = useUpdateChild();
    const { mutate: deleteChild, isPending: isDeleting } = useDeleteChild();

    const [modal, setModal] = useState<TModalState>({ kind: 'closed' });
    const close = (): void => setModal({ kind: 'closed' });

    const isFormOpen = modal.kind === 'add' || modal.kind === 'edit';

    function handleSubmit(values: IChildFormValues): void {
        if (modal.kind === 'edit') {
            updateChild({ id: modal.child.id, payload: values }, { onSuccess: close });
        } else {
            createChild(values, { onSuccess: close });
        }
    }

    if (isLoading) {
        return (
            <div className={styles.page}>
                <Loader />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <h2 className={styles.heading}>Children</h2>

            {children.length === 0 ? (
                <div className={styles.empty}>
                    <p className={styles['empty__text']}>No children yet.</p>
                    <Button variant="primary" onClick={() => setModal({ kind: 'add' })}>
                        Add your first child
                    </Button>
                </div>
            ) : (
                <>
                    <Button variant="secondary" onClick={() => setModal({ kind: 'add' })}>
                        Add child
                    </Button>
                    <div className={styles.grid}>
                        {children.map((child) => (
                            <ChildCard
                                key={child.id}
                                child={child}
                                onEdit={(c) => setModal({ kind: 'edit', child: c })}
                                onDelete={(c) => setModal({ kind: 'delete', child: c })}
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
                        onSubmit={handleSubmit}
                        onCancel={close}
                        isSubmitting={modal.kind === 'edit' ? isUpdating : isCreating}
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
