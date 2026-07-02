'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Container, Group, Stack } from '@mantine/core';
import type { Area } from 'react-easy-crop';
import Avatar from '@/components/ui/Avatar/Avatar';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import { useCurrentUser } from '@/context/UserContext';
import { useUpdateUser, useUploadAvatar } from '@/hooks/user';
import AvatarCropModal from './components/AvatarCropModal/AvatarCropModal';
import { buildCroppedAvatarFile } from './utils/crop-image.utils';
import styles from './page.module.scss';

function CameraIcon(): React.ReactElement {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M4 8a2 2 0 0 1 2-2h2.2a2 2 0 0 0 1.6-.8l.6-.8A2 2 0 0 1 12 4h0a2 2 0 0 1 1.6.8l.6.8A2 2 0 0 0 15.8 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
            <circle cx="12" cy="12.5" r="3.5" />
        </svg>
    );
}

export default function ProfilePage(): React.ReactElement {
    const t = useTranslations('account.profile');
    const { user } = useCurrentUser();
    const { mutate: updateUser, isPending: isSaving } = useUpdateUser();
    const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useUploadAvatar();

    const [editedName, setEditedName] = useState<string | null>(null);
    const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
    const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const isAvatarBusy = isUploadingAvatar;

    useEffect(() => {
        return () => {
            if (selectedAvatarUrl !== null) {
                URL.revokeObjectURL(selectedAvatarUrl);
            }
        };
    }, [selectedAvatarUrl]);

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
        if (selectedAvatarUrl !== null) {
            URL.revokeObjectURL(selectedAvatarUrl);
        }

        setSelectedAvatarFile(file);
        setSelectedAvatarUrl(URL.createObjectURL(file));
        setIsCropModalOpen(true);
    }

    function resetAvatarSelection(): void {
        if (selectedAvatarUrl !== null) {
            URL.revokeObjectURL(selectedAvatarUrl);
        }

        setSelectedAvatarFile(null);
        setSelectedAvatarUrl(null);
        setIsCropModalOpen(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    async function handleAvatarCropConfirm(croppedAreaPixels: Area): Promise<void> {
        if (selectedAvatarFile === null || selectedAvatarUrl === null) return;

        const croppedFile = await buildCroppedAvatarFile(
            selectedAvatarUrl,
            croppedAreaPixels,
            selectedAvatarFile.name,
            selectedAvatarFile.type,
        );

        uploadAvatar(croppedFile, {
            onSuccess: () => resetAvatarSelection(),
        });
    }

    return (
        <Container size="xs" py="xl">
            <Stack align="center" gap="lg">
                <button
                    type="button"
                    className={styles['profile__avatar-button']}
                    onClick={openFilePicker}
                    disabled={isAvatarBusy}
                    aria-label={t('changeAvatarButton')}
                >
                    <Avatar
                        name={user?.name ?? undefined}
                        src={user?.avatarUrl ?? undefined}
                        alt={user?.name ?? 'User avatar'}
                        size="xl"
                    />
                    <span className={styles['profile__avatar-overlay']}>
                        <span className={styles['profile__avatar-camera']}>
                            <CameraIcon />
                        </span>
                    </span>
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className={styles['profile__file-input']}
                    onChange={handleAvatarSelect}
                />
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

            <AvatarCropModal
                opened={isCropModalOpen}
                imageUrl={selectedAvatarUrl}
                isSaving={isUploadingAvatar}
                onClose={resetAvatarSelection}
                onConfirm={(croppedAreaPixels) => handleAvatarCropConfirm(croppedAreaPixels)}
            />
        </Container>
    );
}
