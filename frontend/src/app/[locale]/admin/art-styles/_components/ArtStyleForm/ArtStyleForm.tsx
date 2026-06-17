'use client';

import { Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import Textarea from '@/components/ui/Textarea/Textarea';

export interface IArtStyleFormValues {
    name: string;
    slug: string;
    promptPrefix: string;
}

interface IArtStyleFormProps {
    initialValues?: Partial<IArtStyleFormValues>;
    onSubmit: (values: IArtStyleFormValues) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const DEFAULT_VALUES: IArtStyleFormValues = {
    name: '',
    slug: '',
    promptPrefix: '',
};

export default function ArtStyleForm({
    initialValues,
    onSubmit,
    onCancel,
    isSubmitting = false,
}: Readonly<IArtStyleFormProps>): React.ReactElement {
    const t = useTranslations('admin.artStyles.form');

    const form = useForm<IArtStyleFormValues>({
        initialValues: { ...DEFAULT_VALUES, ...initialValues },
        validate: {
            name: (v) => (v.trim().length < 1 ? t('errors.nameRequired') : null),
            slug: (v) => {
                if (!v.trim()) return t('errors.slugRequired');
                if (!SLUG_PATTERN.test(v)) return t('errors.slugFormat');
                return null;
            },
            promptPrefix: (v) => (v.trim().length < 1 ? t('errors.promptPrefixRequired') : null),
        },
    });

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack gap="md">
                <Input
                    label={t('nameLabel')}
                    placeholder={t('namePlaceholder')}
                    {...form.getInputProps('name')}
                />
                <Input
                    label={t('slugLabel')}
                    placeholder={t('slugPlaceholder')}
                    description={t('slugDescription')}
                    {...form.getInputProps('slug')}
                />
                <Textarea
                    label={t('promptPrefixLabel')}
                    placeholder={t('promptPrefixPlaceholder')}
                    description={t('promptPrefixDescription')}
                    rows={4}
                    {...form.getInputProps('promptPrefix')}
                />
                <Stack gap="xs" align="flex-end">
                    <Button variant="secondary" type="button" onClick={onCancel}>
                        {t('cancel')}
                    </Button>
                    <Button type="submit" loading={isSubmitting}>
                        {t('save')}
                    </Button>
                </Stack>
            </Stack>
        </form>
    );
}
