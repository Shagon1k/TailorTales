'use client';

import { useState } from 'react';
import { Slider, Stack, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';
import Cropper, { type Area } from 'react-easy-crop';
import Button from '@/components/ui/Button/Button';
import Modal from '@/components/ui/Modal/Modal';
import styles from './AvatarCropModal.module.scss';

export interface IAvatarCropModalProps {
    opened: boolean;
    imageUrl: string | null;
    isSaving: boolean;
    onClose: () => void;
    onConfirm: (croppedAreaPixels: Area) => void;
}

export default function AvatarCropModal({
    opened,
    imageUrl,
    isSaving,
    onClose,
    onConfirm,
}: Readonly<IAvatarCropModalProps>): React.ReactElement {
    const t = useTranslations('account.profile.cropper');
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    function handleClose(): void {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        onClose();
    }

    function handleConfirm(): void {
        if (croppedAreaPixels === null) return;
        onConfirm(croppedAreaPixels);
    }

    return (
        <Modal opened={opened} onClose={handleClose} title={t('title')} size="lg">
            <>
                <Stack gap="md">
                    <Text className={styles['cropper__description']}>{t('description')}</Text>

                    <div className={styles['cropper__viewport']}>
                        {imageUrl !== null && (
                            <Cropper
                                image={imageUrl}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                objectFit="cover"
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                            />
                        )}
                    </div>

                    <div className={styles['cropper__controls']}>
                        <div className={styles['cropper__slider-row']}>
                            <Text className={styles['cropper__slider-label']}>
                                {t('zoomLabel')}
                            </Text>
                            <Slider
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.05}
                                onChange={setZoom}
                                label={(value) => `${Math.round(value * 100)}%`}
                                classNames={{
                                    root: styles['cropper__slider'],
                                    track: styles['cropper__slider-track'],
                                    thumb: styles['cropper__slider-thumb'],
                                }}
                            />
                        </div>
                    </div>
                </Stack>
                <Modal.Footer>
                    <div className={styles['cropper__actions']}>
                        <Button variant="quiet" onClick={handleClose} disabled={isSaving}>
                            {t('cancelButton')}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleConfirm}
                            disabled={croppedAreaPixels === null}
                            loading={isSaving}
                        >
                            {t('saveButton')}
                        </Button>
                    </div>
                </Modal.Footer>
            </>
        </Modal>
    );
}
