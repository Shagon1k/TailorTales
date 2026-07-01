'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Container, Group, Stack } from '@mantine/core';
import Avatar from '@/components/ui/Avatar/Avatar';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import { useCurrentUser } from '@/context/UserContext';
import { useDeleteAvatar, useUpdateUser, useUploadAvatar } from '@/hooks/user';
import styles from './page.module.scss';

export default function ProfilePage(): React.ReactElement {
    const t = useTranslations('account.profile');
    const { user } = useCurrentUser();
    const { mutate: updateUser, isPending: isSaving } = useUpdateUser();
    const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useUploadAvatar();
    const { mutate: deleteAvatar, isPending: isDeletingAvatar } = useDeleteAvatar();

    const [editedName, setEditedName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const isAvatarBusy = isUploadingAvatar || isDeletingAvatar;

    function startEditing(): void {
        setEditedName(user?.name ?? '');
    }

    function handleSave(): void {
        if (editedName === null) return;
        updateUser(editedName, { onSuccess: () => setEditedName(null) });
    }

    function openFilePicker(): void {
        fileInputRef.current?.click();
    }

    function handleAvatarSelect(event: React.ChangeEvent<HTMLInputElement>): void {
        const file = event.currentTarget.files?.[0];
        if (!file) return;

        uploadAvatar(file, {
            onSettled: () => {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        });
    }

    return (
        <Container size="xs" py="xl">
            <Stack align="center" gap="lg">
                <Avatar
                    name={user?.name ?? undefined}
                    src={user?.avatarUrl ?? undefined}
                    alt={user?.name ?? 'User avatar'}
                    size="xl"
                />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className={styles['profile__file-input']}
                    onChange={handleAvatarSelect}
                />
                <Group justify="center">
                    <Button variant="quiet" onClick={openFilePicker} loading={isUploadingAvatar}>
                        {t('changeAvatarButton')}
                    </Button>
                    {user?.hasCustomAvatar && (
                        <Button
                            variant="quiet"
                            onClick={() => deleteAvatar()}
                            loading={isDeletingAvatar}
                        >
                            {t('removeAvatarButton')}
                        </Button>
                    )}
                </Group>
                <h2 className={styles.name}>{user?.name}</h2>
                <p className={styles.email}>{user?.email}</p>

                {editedName === null ? (
                    <Button variant="quiet" onClick={startEditing} disabled={isAvatarBusy}>
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
