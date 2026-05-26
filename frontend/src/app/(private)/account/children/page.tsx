'use client';

import { Button, Container, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { modals } from '@mantine/modals';
import ChildCard from './_components/ChildCard/ChildCard';
import ChildForm, { type IChildFormValues } from './_components/ChildForm/ChildForm';
import { useChildren, useCreateChild, useDeleteChild, useUpdateChild } from '@/hooks/children';
import type { IChild } from '@/types/child.types';

export default function ChildrenPage(): React.ReactElement {
    const { data: children = [], isLoading } = useChildren();
    const { mutate: createChild, isPending: isCreating } = useCreateChild();
    const { mutate: updateChild, isPending: isUpdating } = useUpdateChild();
    const { mutate: deleteChild } = useDeleteChild();

    function openAddModal(): void {
        modals.open({
            title: 'Add child',
            children: (
                <ChildForm
                    onSubmit={(values: IChildFormValues) => {
                        createChild(
                            {
                                name: values.name,
                                birthdate: values.birthdate,
                                gender: values.gender,
                                interests: values.interests,
                            },
                            { onSuccess: () => modals.closeAll() },
                        );
                    }}
                    onCancel={() => modals.closeAll()}
                    isSubmitting={isCreating}
                />
            ),
        });
    }

    function openEditModal(child: IChild): void {
        modals.open({
            title: 'Edit child',
            children: (
                <ChildForm
                    initialValues={{
                        name: child.name,
                        birthdate: child.birthdate.split('T')[0],
                        gender: child.gender,
                        interests: child.interests,
                    }}
                    onSubmit={(values: IChildFormValues) => {
                        updateChild(
                            { id: child.id, payload: values },
                            { onSuccess: () => modals.closeAll() },
                        );
                    }}
                    onCancel={() => modals.closeAll()}
                    isSubmitting={isUpdating}
                />
            ),
        });
    }

    function openDeleteModal(child: IChild): void {
        modals.openConfirmModal({
            title: 'Delete child',
            children: (
                <Text size="sm">
                    Are you sure you want to delete <strong>{child.name}</strong>? This cannot be
                    undone.
                </Text>
            ),
            labels: { confirm: 'Delete', cancel: 'Cancel' },
            confirmProps: { color: 'red' },
            onConfirm: () => deleteChild(child.id),
        });
    }

    if (isLoading) {
        return (
            <Container py="xl">
                <Loader />
            </Container>
        );
    }

    return (
        <Container py="xl">
            <Stack gap="lg">
                <Title order={2}>Children</Title>

                {children.length === 0 ? (
                    <Stack align="center" gap="sm" py="xl">
                        <Text c="dimmed">No children yet.</Text>
                        <Button onClick={openAddModal}>Add your first child</Button>
                    </Stack>
                ) : (
                    <>
                        <Button onClick={openAddModal} ml="auto">
                            Add child
                        </Button>
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                            {children.map((child) => (
                                <ChildCard
                                    key={child.id}
                                    child={child}
                                    onEdit={openEditModal}
                                    onDelete={openDeleteModal}
                                />
                            ))}
                        </SimpleGrid>
                    </>
                )}
            </Stack>
        </Container>
    );
}
