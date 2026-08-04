'use client';

import { useId } from 'react';
import { Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslations } from 'next-intl';
import Input from '@/components/ui/Input/Input';
import Select from '@/components/ui/Select/Select';
import TagsInput from '@/components/ui/TagsInput/TagsInput';
import Button from '@/components/ui/Button/Button';
import Modal from '@/components/ui/Modal/Modal';
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
const CHILD_MAX_AGE_YEARS = 18;
const MAX_INTERESTS = 10;

function getEarliestAllowedBirthdate(): string {
    const earliest = new Date();
    earliest.setFullYear(earliest.getFullYear() - CHILD_MAX_AGE_YEARS);
    return earliest.toISOString().split('T')[0];
}

const EARLIEST_ALLOWED_BIRTHDATE = getEarliestAllowedBirthdate();

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
    const formId = useId();

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
                if (v < EARLIEST_ALLOWED_BIRTHDATE) {
                    return t('errors.birthDateTooOld', { maxAge: CHILD_MAX_AGE_YEARS });
                }
                return null;
            },
            gender: (v) => (v ? null : t('errors.genderRequired')),
        },
    });

    const hasReachedInterestsLimit = form.values.interests.length >= MAX_INTERESTS;

    return (
        <>
            <form id={formId} noValidate onSubmit={form.onSubmit(onSubmit)}>
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
                        min={EARLIEST_ALLOWED_BIRTHDATE}
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
                        description={
                            hasReachedInterestsLimit ? t('interestsLimitReached') : undefined
                        }
                        maxTags={MAX_INTERESTS}
                        {...form.getInputProps('interests')}
                    />
                </Stack>
            </form>
            <Modal.Footer>
                <div className={styles.actions}>
                    <Button variant="quiet" onClick={onCancel} disabled={isSubmitting}>
                        {t('cancelButton')}
                    </Button>
                    <Button type="submit" form={formId} variant="primary" loading={isSubmitting}>
                        {t('saveButton')}
                    </Button>
                </div>
            </Modal.Footer>
        </>
    );
}
