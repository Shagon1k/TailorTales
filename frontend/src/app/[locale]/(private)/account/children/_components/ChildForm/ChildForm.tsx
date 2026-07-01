'use client';

import { Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslations } from 'next-intl';
import Input from '@/components/ui/Input/Input';
import Select from '@/components/ui/Select/Select';
import TagsInput from '@/components/ui/TagsInput/TagsInput';
import Button from '@/components/ui/Button/Button';
import type { IGender } from '@/types/child.types';
import styles from './ChildForm.module.scss';

export interface IChildFormValues {
    name: string;
    birthdate: string;
    gender: IGender;
    interests: string[];
}

interface IChildFormProps {
    initialValues?: Partial<IChildFormValues>;
    onSubmit: (values: IChildFormValues) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const TODAY = new Date().toISOString().split('T')[0];

const DEFAULT_VALUES: IChildFormValues = {
    name: '',
    birthdate: '',
    gender: 'MALE',
    interests: [],
};

export default function ChildForm({
    initialValues,
    onSubmit,
    onCancel,
    isSubmitting = false,
}: Readonly<IChildFormProps>): React.ReactElement {
    const t = useTranslations('account.childForm');

    const genderOptions = [
        { value: 'MALE', label: t('genderOptions.male') },
        { value: 'FEMALE', label: t('genderOptions.female') },
    ];

    const form = useForm<IChildFormValues>({
        initialValues: { ...DEFAULT_VALUES, ...initialValues },
        validateInputOnBlur: true,
        validate: {
            name: (v) => (v.trim().length < 1 ? t('errors.nameRequired') : null),
            birthdate: (v) => {
                if (!v) return t('errors.birthdateRequired');
                const date = new Date(v);
                if (Number.isNaN(date.getTime())) return t('errors.invalidDate');
                if (date > new Date()) return t('errors.birthDateFuture');
                return null;
            },
            gender: (v) => (v ? null : t('errors.genderRequired')),
        },
    });

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack gap="sm">
                <Input
                    label={t('nameLabel')}
                    placeholder={t('namePlaceholder')}
                    required
                    {...form.getInputProps('name')}
                />
                <Input
                    label={t('birthdateLabel')}
                    type="date"
                    max={TODAY}
                    required
                    {...form.getInputProps('birthdate')}
                />
                <Select
                    label={t('genderLabel')}
                    data={genderOptions}
                    required
                    {...form.getInputProps('gender')}
                />
                <TagsInput
                    label={t('interestsLabel')}
                    placeholder={t('interestsPlaceholder')}
                    {...form.getInputProps('interests')}
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
