'use client';

import { Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslations } from 'next-intl';
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
}

const DEFAULT_VALUES: ICharacterFormValues = {
    name: '',
    description: '',
};

export default function CharacterForm({
    initialValues,
    onSubmit,
    onCancel,
    isSubmitting = false,
}: Readonly<ICharacterFormProps>): React.ReactElement {
    const t = useTranslations('workshop.characterForm');

    const form = useForm<ICharacterFormValues>({
        initialValues: { ...DEFAULT_VALUES, ...initialValues },
        validate: {
            name: (v) => (v.trim().length < 1 ? t('errors.nameRequired') : null),
            description: (v) => (v.trim().length < 1 ? t('errors.descriptionRequired') : null),
        },
    });

    return (
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
    );
}
