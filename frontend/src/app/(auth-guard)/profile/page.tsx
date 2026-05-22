'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Container, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { authApi } from '@/api/auth';
import { userApi } from '@/api/user';
import { useCurrentUser } from '@/context/UserContext';

export default function ProfilePage(): React.ReactElement {
    const { user, refetch } = useCurrentUser();
    const router = useRouter();

    // null = not editing; string = active edit value
    const [editedName, setEditedName] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    function startEditing(): void {
        setEditedName(user?.name ?? '');
    }

    async function handleSave(): Promise<void> {
        if (editedName === null) return;
        setIsSaving(true);
        try {
            await userApi.updateMe(editedName);
            await refetch();
            setEditedName(null);
        } catch (err: unknown) {
            console.error('Failed to update name', err);
        } finally {
            setIsSaving(false);
        }
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
                <Avatar src={user?.avatarUrl} size={80} radius="xl" />
                <Title order={2}>{user?.name}</Title>
                <Text c="dimmed">{user?.email}</Text>

                {editedName !== null ? (
                    <Stack w="100%" gap="sm">
                        <TextInput
                            label="Name"
                            value={editedName}
                            onChange={(e) => setEditedName(e.currentTarget.value)}
                        />
                        <Group>
                            <Button onClick={handleSave} loading={isSaving} flex={1}>
                                Save
                            </Button>
                            <Button
                                variant="subtle"
                                onClick={() => setEditedName(null)}
                                disabled={isSaving}
                                flex={1}
                            >
                                Cancel
                            </Button>
                        </Group>
                    </Stack>
                ) : (
                    <Button variant="subtle" onClick={startEditing}>
                        Edit name
                    </Button>
                )}

                <Button variant="subtle" color="red" onClick={handleLogout}>
                    Sign out
                </Button>
            </Stack>
        </Container>
    );
}
