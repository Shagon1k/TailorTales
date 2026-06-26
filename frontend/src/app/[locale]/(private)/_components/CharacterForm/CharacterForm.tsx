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

export interface ICharacterQuotaInfo {
    charactersLeft: number | null;
    generationsLeft: number;
}

interface ICharacterFormProps {
    initialValues?: Partial<ICharacterFormValues>;
    /** `source` reports how it was made: `IMAGINED` (manual) or `QUIZ`. Ignored on edit. */
    onSubmit: (values: ICharacterFormValues, source: IUserCharacterSource) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
    quota?: ICharacterQuotaInfo;
}

const DEFAULT_VALUES: ICharacterFormValues = {
    name: '',
    description: '',
};

type TMode = 'manual' | 'quiz';

function isMode(value: string | null): value is TMode {
    return value === 'manual' || value === 'quiz';
}

export default function CharacterForm({
    initialValues,
    onSubmit,
    onCancel,
    isSubmitting = false,
    quota,
}: Readonly<ICharacterFormProps>): React.ReactElement {
    const t = useTranslations('workshop.characterForm');
    const [mode, setMode] = useState<TMode>('manual');
    const isEditing = initialValues !== undefined;
    const canChooseMode = !isEditing;

    const form = useForm<ICharacterFormValues>({
        initialValues: { ...DEFAULT_VALUES, ...initialValues },
        validate: {
            description: (v) => (v.trim().length < 1 ? t('errors.descriptionRequired') : null),
        },
    });

    return (
        <Stack gap="sm">
            {quota && !isEditing && (
                <div className={styles.quota}>
                    <p className={styles['quota__line']}>
                        {t('quota.generations', { count: quota.generationsLeft })}
                    </p>
                    <p className={styles['quota__line']}>
                        {quota.charactersLeft === null
                            ? t('quota.charactersUnlimited')
                            : t('quota.characters', { count: quota.charactersLeft })}
                    </p>
                </div>
            )}

            {canChooseMode && (
                <Select
                    label={t('modeGroupLabel')}
                    value={mode}
                    data={[
                        { value: 'manual', label: t('modeWrite') },
                        { value: 'quiz', label: t('modeGuided') },
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
                            description={t('nameHint')}
                            {...form.getInputProps('name')}
                        />
                        <Textarea
                            label={isEditing ? t('descriptionLabel') : t('ideaLabel')}
                            placeholder={
                                isEditing ? t('descriptionPlaceholder') : t('ideaPlaceholder')
                            }
                            autosize
                            minRows={4}
                            maxRows={8}
                            {...form.getInputProps('description')}
                        />
                        {!isEditing && <p className={styles['mode-hint']}>{t('writeHint')}</p>}
                        <div className={styles.actions}>
                            <Button variant="quiet" onClick={onCancel} disabled={isSubmitting}>
                                {t('cancelButton')}
                            </Button>
                            <Button type="submit" variant="primary" loading={isSubmitting}>
                                {isEditing ? t('saveButton') : t('createButton')}
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
                    isEditing={isEditing}
                />
            )}
        </Stack>
    );
}
