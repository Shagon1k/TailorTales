'use client';

import { useId, useState } from 'react';
import { Stack, Tooltip } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslations } from 'next-intl';
import Input from '@/components/ui/Input/Input';
import Textarea from '@/components/ui/Textarea/Textarea';
import Button from '@/components/ui/Button/Button';
import Modal from '@/components/ui/Modal/Modal';
import type { IUserCharacterSource } from '@/types/character.types';
import CharacterQuiz from './components/CharacterQuiz/CharacterQuiz';
import styles from './CharacterForm.module.scss';

export interface ICharacterFormValues {
    name: string;
    description: string;
}

interface ICharacterFormProps {
    initialValues?: Partial<ICharacterFormValues>;
    /** `source` reports how it was made: `IMAGINED` (manual) or `QUIZ`. Ignored on edit. */
    onSubmit: (values: ICharacterFormValues, source: IUserCharacterSource) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const DEFAULT_VALUES: ICharacterFormValues = {
    name: '',
    description: '',
};

type TMode = 'manual' | 'quiz';

export default function CharacterForm({
    initialValues,
    onSubmit,
    onCancel,
    isSubmitting = false,
}: Readonly<ICharacterFormProps>): React.ReactElement {
    const t = useTranslations('workshop.characterForm');
    const [mode, setMode] = useState<TMode>('manual');
    const formId = useId();
    const isEditing = initialValues !== undefined;
    const canChooseMode = !isEditing;

    const form = useForm<ICharacterFormValues>({
        initialValues: { ...DEFAULT_VALUES, ...initialValues },
        validateInputOnBlur: true,
        validate: {
            description: (v) => (v.trim().length < 1 ? t('errors.descriptionRequired') : null),
        },
    });

    return (
        <Stack gap="md">
            {canChooseMode && (
                <div className={styles['mode-switch']}>
                    <div
                        className={styles['mode-switch__track']}
                        role="tablist"
                        aria-label={t('modeGroupLabel')}
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={mode === 'manual'}
                            className={styles['mode-switch__option']}
                            data-active={mode === 'manual' || undefined}
                            onClick={() => setMode('manual')}
                        >
                            {t('modeWrite')}
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={mode === 'quiz'}
                            className={styles['mode-switch__option']}
                            data-active={mode === 'quiz' || undefined}
                            onClick={() => setMode('quiz')}
                        >
                            {t('modeGuided')}
                        </button>
                    </div>
                </div>
            )}

            {mode === 'manual' && (
                <>
                    <form id={formId} onSubmit={form.onSubmit((v) => onSubmit(v, 'IMAGINED'))}>
                        <Stack gap="md">
                            <Input
                                label={t('nameLabel')}
                                placeholder={t('namePlaceholder')}
                                {...form.getInputProps('name')}
                            />
                            <Textarea
                                label={isEditing ? t('descriptionLabel') : t('ideaLabel')}
                                placeholder={
                                    isEditing ? t('descriptionPlaceholder') : t('ideaPlaceholder')
                                }
                                required
                                autosize
                                minRows={4}
                                maxRows={8}
                                {...form.getInputProps('description')}
                            />
                            {!isEditing && <p className={styles['mode-hint']}>{t('writeHint')}</p>}
                            {!isEditing && (
                                <div className={styles.photo}>
                                    <Tooltip
                                        label={t('photoTooltip')}
                                        multiline
                                        w={280}
                                        withArrow
                                        position="bottom"
                                    >
                                        <div>
                                            <Button
                                                type="button"
                                                variant="quiet"
                                                fullWidth
                                                disabled
                                            >
                                                {t('photoButton')}
                                            </Button>
                                        </div>
                                    </Tooltip>
                                    <p className={styles.photo__note}>{t('photoDeferredNote')}</p>
                                </div>
                            )}
                        </Stack>
                    </form>
                    <Modal.Footer>
                        <div className={styles.actions}>
                            <Button variant="quiet" onClick={onCancel} disabled={isSubmitting}>
                                {t('cancelButton')}
                            </Button>
                            <Button
                                type="submit"
                                form={formId}
                                variant="primary"
                                loading={isSubmitting}
                            >
                                {isEditing ? t('saveButton') : t('createButton')}
                            </Button>
                        </div>
                    </Modal.Footer>
                </>
            )}

            {mode === 'quiz' && (
                <CharacterQuiz
                    onSubmit={(v) => onSubmit(v, 'QUIZ')}
                    onCancel={onCancel}
                    isSubmitting={isSubmitting}
                    isEditing={isEditing}
                />
            )}
        </Stack>
    );
}
