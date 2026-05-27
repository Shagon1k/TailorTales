'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Group, Stack } from '@mantine/core';
import Avatar from '@/components/ui/Avatar/Avatar';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import { authApi } from '@/api/auth';
import { useCurrentUser } from '@/context/UserContext';
import { useUpdateUser } from '@/hooks/user';
import styles from './page.module.scss';

export default function ProfilePage(): React.ReactElement {
    const { user } = useCurrentUser();
    const router = useRouter();
    const { mutate: updateUser, isPending: isSaving } = useUpdateUser();

    const [editedName, setEditedName] = useState<string | null>(null);

    function startEditing(): void {
        setEditedName(user?.name ?? '');
    }

    function handleSave(): void {
        if (editedName === null) return;
        updateUser(editedName, { onSuccess: () => setEditedName(null) });
    }

    async function handleLogout(): Promise<void> {
        try {
            await authApi.logout();
        } catch (err: unknown) {
            console.error('Logout failed', err);
        }
        router.replace('/login');
    }

    return (
        <Container size="xs" py="xl">
            <Stack align="center" gap="lg">
                <Avatar src={user?.avatarUrl ?? undefined} size="xl" />
                <h2 className={styles.name}>{user?.name}</h2>
                <p className={styles.email}>{user?.email}</p>

                {editedName === null ? (
                    <Button variant="quiet" onClick={startEditing}>
                        Edit name
                    </Button>
                ) : (
                    <Stack w="100%" gap="sm">
                        <Input
                            label="Name"
                            value={editedName}
                            onChange={(e) => setEditedName(e.currentTarget.value)}
                        />
                        <Group>
                            <Button
                                variant="primary"
                                onClick={handleSave}
                                loading={isSaving}
                            >
                                Save
                            </Button>
                            <Button
                                variant="quiet"
                                onClick={() => setEditedName(null)}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                        </Group>
                    </Stack>
                )}

                <Button variant="quiet" onClick={handleLogout}>
                    Sign out
                </Button>
            </Stack>
        </Container>
    );
}
