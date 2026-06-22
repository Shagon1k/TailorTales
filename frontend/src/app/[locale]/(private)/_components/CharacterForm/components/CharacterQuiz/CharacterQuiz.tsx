'use client';

import { SimpleGrid, Stack, Tooltip } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslations } from 'next-intl';
import Input from '@/components/ui/Input/Input';
import Select from '@/components/ui/Select/Select';
import Button from '@/components/ui/Button/Button';
import type { ICharacterFormValues } from '../../CharacterForm';
import styles from './CharacterQuiz.module.scss';

interface ICharacterQuizProps {
    onSubmit: (values: ICharacterFormValues) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

interface IQuizValues {
    name: string;
    gender: string;
    hairColor: string;
    hairLength: string;
    eyeColor: string;
    skinTone: string;
    clothingColor: string;
    clothingItem: string;
    detail: string;
}

const DEFAULTS: IQuizValues = {
    name: '',
    gender: 'girl',
    hairColor: 'brown',
    hairLength: 'medium',
    eyeColor: 'brown',
    skinTone: 'medium',
    clothingColor: 'blue',
    clothingItem: '',
    detail: '',
};

// Option keys per dimension — labels resolved via i18n at render and assembly time.
const OPTIONS = {
    gender: ['girl', 'boy'],
    hairColor: ['black', 'brown', 'blonde', 'red'],
    hairLength: ['short', 'medium', 'long'],
    eyeColor: ['brown', 'blue', 'green', 'gray'],
    skinTone: ['fair', 'medium', 'tan', 'dark'],
    clothingColor: ['red', 'blue', 'green', 'yellow', 'pink'],
} as const;

export default function CharacterQuiz({
    onSubmit,
    onCancel,
    isSubmitting = false,
}: Readonly<ICharacterQuizProps>): React.ReactElement {
    const t = useTranslations('workshop.characterQuiz');

    const form = useForm<IQuizValues>({
        initialValues: DEFAULTS,
        validate: {
            name: (v) => (v.trim().length < 1 ? t('errors.nameRequired') : null),
        },
    });

    const optionsFor = (dimension: keyof typeof OPTIONS): { value: string; label: string }[] =>
        OPTIONS[dimension].map((key) => ({ value: key, label: t(`${dimension}.${key}`) }));

    function handleSubmit(values: IQuizValues): void {
        const clothing = values.clothingItem.trim()
            ? t('descriptionClothing', {
                  color: t(`clothingColor.${values.clothingColor}`),
                  item: values.clothingItem.trim(),
              })
            : t('descriptionClothingGeneric', {
                  color: t(`clothingColor.${values.clothingColor}`),
              });

        const base = t('descriptionTemplate', {
            gender: t(`gender.${values.gender}`),
            hairLength: t(`hairLength.${values.hairLength}`),
            hairColor: t(`hairColor.${values.hairColor}`),
            eyeColor: t(`eyeColor.${values.eyeColor}`),
            skinTone: t(`skinTone.${values.skinTone}`),
            clothing,
        });

        const detail = values.detail.trim();
        onSubmit({ name: values.name.trim(), description: detail ? `${base} ${detail}` : base });
    }

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
                {/* Photo seam — disabled until the GDPR-gated photo flow ships (Deferred #10). */}
                <Tooltip label={t('photoTooltip')} multiline w={280} withArrow position="bottom">
                    <div className={styles.photo}>
                        <Button type="button" variant="quiet" fullWidth disabled>
                            {t('photoButton')}
                        </Button>
                    </div>
                </Tooltip>
                <Input
                    label={t('nameLabel')}
                    placeholder={t('namePlaceholder')}
                    {...form.getInputProps('name')}
                />
                <SimpleGrid cols={2} spacing="sm">
                    <Select
                        label={t('genderLabel')}
                        data={optionsFor('gender')}
                        {...form.getInputProps('gender')}
                    />
                    <Select
                        label={t('skinToneLabel')}
                        data={optionsFor('skinTone')}
                        {...form.getInputProps('skinTone')}
                    />
                    <Select
                        label={t('hairColorLabel')}
                        data={optionsFor('hairColor')}
                        {...form.getInputProps('hairColor')}
                    />
                    <Select
                        label={t('hairLengthLabel')}
                        data={optionsFor('hairLength')}
                        {...form.getInputProps('hairLength')}
                    />
                    <Select
                        label={t('eyeColorLabel')}
                        data={optionsFor('eyeColor')}
                        {...form.getInputProps('eyeColor')}
                    />
                    <Select
                        label={t('clothingColorLabel')}
                        data={optionsFor('clothingColor')}
                        {...form.getInputProps('clothingColor')}
                    />
                </SimpleGrid>
                <Input
                    label={t('clothingItemLabel')}
                    placeholder={t('clothingItemPlaceholder')}
                    {...form.getInputProps('clothingItem')}
                />
                <Input
                    label={t('detailLabel')}
                    placeholder={t('detailPlaceholder')}
                    {...form.getInputProps('detail')}
                />
                <div className={styles.actions}>
                    <Button variant="quiet" onClick={onCancel} disabled={isSubmitting}>
                        {t('cancelButton')}
                    </Button>
                    <Button type="submit" variant="primary" loading={isSubmitting}>
                        {t('createButton')}
                    </Button>
                </div>
            </Stack>
        </form>
    );
}
