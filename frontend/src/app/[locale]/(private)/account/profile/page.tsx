'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Container, Group, Stack } from '@mantine/core';
import Avatar from '@/components/ui/Avatar/Avatar';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import { useCurrentUser } from '@/context/UserContext';
import { useUpdateUser } from '@/hooks/user';
import styles from './page.module.scss';

export default function ProfilePage(): React.ReactElement {
    const t = useTranslations('account.profile');
    const { user } = useCurrentUser();
    const { mutate: updateUser, isPending: isSaving } = useUpdateUser();

    const [editedName, setEditedName] = useState<string | null>(null);

    function startEditing(): void {
        setEditedName(user?.name ?? '');
    }

    function handleSave(): void {
        if (editedName === null) return;
        updateUser(editedName, { onSuccess: () => setEditedName(null) });
    }

    return (
        <Container size="xs" py="xl">
            <Stack align="center" gap="lg">
                <Avatar name={user?.name ?? undefined} size="xl" />
                <h2 className={styles.name}>{user?.name}</h2>
                <p className={styles.email}>{user?.email}</p>

                {editedName === null ? (
                    <Button variant="quiet" onClick={startEditing}>
                        {t('editButton')}
                    </Button>
                ) : (
                    <Stack w="100%" gap="sm">
                        <Input
                            label={t('nameLabel')}
                            value={editedName}
                            onChange={(e) => setEditedName(e.currentTarget.value)}
                        />
                        <Group>
                            <Button variant="primary" onClick={handleSave} loading={isSaving}>
                                {t('saveButton')}
                            </Button>
                            <Button
                                variant="quiet"
                                onClick={() => setEditedName(null)}
                                disabled={isSaving}
                            >
                                {t('cancelButton')}
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Stack>
        </Container>
    );
}
