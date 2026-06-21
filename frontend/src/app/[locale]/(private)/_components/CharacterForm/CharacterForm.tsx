'use client';

import { useState } from 'react';
import { Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslations } from 'next-intl';
import clsx from 'clsx';
import Input from '@/components/ui/Input/Input';
import Textarea from '@/components/ui/Textarea/Textarea';
import Button from '@/components/ui/Button/Button';
import styles from './CharacterForm.module.scss';

export interface ICharacterFormValues {
    name: string;
    description: string;
}

interface ICharacterFormProps {
    initialValues?: Partial<ICharacterFormValues>;
    onSubmit: (values: ICharacterFormValues) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
    /** When provided, offers a second mode that asks the AI to draft the character. */
    onGenerateFromPrompt?: (prompt: string) => void;
    isGenerating?: boolean;
}

const DEFAULT_VALUES: ICharacterFormValues = {
    name: '',
    description: '',
};

type TMode = 'manual' | 'prompt';

export default function CharacterForm({
    initialValues,
    onSubmit,
    onCancel,
    isSubmitting = false,
    onGenerateFromPrompt,
    isGenerating = false,
}: Readonly<ICharacterFormProps>): React.ReactElement {
    const t = useTranslations('workshop.characterForm');
    const [mode, setMode] = useState<TMode>('manual');
    const canGenerate = onGenerateFromPrompt !== undefined;

    const form = useForm<ICharacterFormValues>({
        initialValues: { ...DEFAULT_VALUES, ...initialValues },
        validate: {
            name: (v) => (v.trim().length < 1 ? t('errors.nameRequired') : null),
            description: (v) => (v.trim().length < 1 ? t('errors.descriptionRequired') : null),
        },
    });

    const promptForm = useForm<{ prompt: string }>({
        initialValues: { prompt: '' },
        validate: {
            prompt: (v) => (v.trim().length < 1 ? t('errors.promptRequired') : null),
        },
    });

    return (
        <Stack gap="sm">
            {canGenerate && (
                <div className={styles.modes} role="group" aria-label={t('modeGroupLabel')}>
                    <Button
                        type="button"
                        variant={mode === 'manual' ? 'primary' : 'quiet'}
                        onClick={() => setMode('manual')}
                    >
                        {t('modeManual')}
                    </Button>
                    <Button
                        type="button"
                        variant={mode === 'prompt' ? 'primary' : 'quiet'}
                        onClick={() => setMode('prompt')}
                    >
                        {t('modePrompt')}
                    </Button>
                </div>
            )}

            {mode === 'manual' ? (
                <form onSubmit={form.onSubmit(onSubmit)}>
                    <Stack gap="sm">
                        <Input
                            label={t('nameLabel')}
                            placeholder={t('namePlaceholder')}
                            {...form.getInputProps('name')}
                        />
                        <Textarea
                            label={t('descriptionLabel')}
                            placeholder={t('descriptionPlaceholder')}
                            autosize
                            minRows={4}
                            maxRows={8}
                            {...form.getInputProps('description')}
                        />
                        <div className={clsx(styles.actions)}>
                            <Button variant="quiet" onClick={onCancel} disabled={isSubmitting}>
                                {t('cancelButton')}
                            </Button>
                            <Button type="submit" variant="primary" loading={isSubmitting}>
                                {t('saveButton')}
                            </Button>
                        </div>
                    </Stack>
                </form>
            ) : (
                <form
                    onSubmit={promptForm.onSubmit((v) => onGenerateFromPrompt?.(v.prompt.trim()))}
                >
                    <Stack gap="sm">
                        <Textarea
                            label={t('promptLabel')}
                            placeholder={t('promptPlaceholder')}
                            autosize
                            minRows={3}
                            maxRows={6}
                            {...promptForm.getInputProps('prompt')}
                        />
                        <div className={styles.actions}>
                            <Button variant="quiet" onClick={onCancel} disabled={isGenerating}>
                                {t('cancelButton')}
                            </Button>
                            <Button type="submit" variant="primary" loading={isGenerating}>
                                {t('generateButton')}
                            </Button>
                        </div>
                    </Stack>
                </form>
            )}
        </Stack>
    );
}
