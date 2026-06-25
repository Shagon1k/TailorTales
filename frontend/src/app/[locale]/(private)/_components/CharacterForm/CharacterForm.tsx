'use client';

import { useState } from 'react';
import { Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslations } from 'next-intl';
import Input from '@/components/ui/Input/Input';
import Textarea from '@/components/ui/Textarea/Textarea';
import Button from '@/components/ui/Button/Button';
import Select from '@/components/ui/Select/Select';
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
    /** When provided, offers a second mode that asks the AI to draft the character. */
    onGenerateFromPrompt?: (prompt: string) => void;
    isGenerating?: boolean;
}

const DEFAULT_VALUES: ICharacterFormValues = {
    name: '',
    description: '',
};

type TMode = 'manual' | 'quiz' | 'prompt';

function isMode(value: string | null): value is TMode {
    return value === 'manual' || value === 'quiz' || value === 'prompt';
}

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
                <Select
                    label={t('modeGroupLabel')}
                    value={mode}
                    data={[
                        { value: 'manual', label: t('modeManual') },
                        { value: 'quiz', label: t('modeQuiz') },
                        { value: 'prompt', label: t('modePrompt') },
                    ]}
                    allowDeselect={false}
                    onChange={(value) => {
                        if (isMode(value)) setMode(value);
                    }}
                />
            )}

            {mode === 'manual' && (
                <form onSubmit={form.onSubmit((v) => onSubmit(v, 'IMAGINED'))}>
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
                        <div className={styles.actions}>
                            <Button variant="quiet" onClick={onCancel} disabled={isSubmitting}>
                                {t('cancelButton')}
                            </Button>
                            <Button type="submit" variant="primary" loading={isSubmitting}>
                                {t('saveButton')}
                            </Button>
                        </div>
                    </Stack>
                </form>
            )}

            {mode === 'quiz' && (
                <CharacterQuiz
                    onSubmit={(v) => onSubmit(v, 'QUIZ')}
                    onCancel={onCancel}
                    isSubmitting={isSubmitting}
                />
            )}

            {mode === 'prompt' && (
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
