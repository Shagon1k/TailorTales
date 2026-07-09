'use client';

import { useId } from 'react';
import { SimpleGrid, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslations } from 'next-intl';
import Input from '@/components/ui/Input/Input';
import Modal from '@/components/ui/Modal/Modal';
import Select from '@/components/ui/Select/Select';
import Button from '@/components/ui/Button/Button';
import type { ICharacterFormValues } from '../../CharacterForm';
import styles from './CharacterQuiz.module.scss';

interface ICharacterQuizProps {
    onSubmit: (values: ICharacterFormValues) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
    isEditing?: boolean;
}

interface IQuizValues {
    name: string;
    characterKind: string;
    gender: string;
    hairColor: string;
    hairLength: string;
    eyeColor: string;
    skinTone: string;
    clothingColor: string;
    clothingItem: string;
    creatureColor: string;
    creatureMarking: string;
    accessory: string;
    detail: string;
}

const DEFAULTS: IQuizValues = {
    name: '',
    characterKind: 'child',
    gender: 'girl',
    hairColor: 'brown',
    hairLength: 'medium',
    eyeColor: 'brown',
    skinTone: 'medium',
    clothingColor: 'blue',
    clothingItem: '',
    creatureColor: 'gray',
    creatureMarking: 'whitePaws',
    accessory: '',
    detail: '',
};

// Option keys per dimension — labels resolved via i18n at render and assembly time.
const OPTIONS = {
    characterKind: ['child', 'cat', 'dog', 'bunny', 'dragon'],
    gender: ['girl', 'boy'],
    hairColor: ['black', 'brown', 'blonde', 'red'],
    hairLength: ['short', 'medium', 'long'],
    eyeColor: ['brown', 'blue', 'green', 'gray'],
    skinTone: ['fair', 'medium', 'tan', 'dark'],
    clothingColor: ['red', 'blue', 'green', 'yellow', 'pink'],
    creatureColor: ['gray', 'golden', 'white', 'black', 'orange', 'emerald'],
    creatureMarking: ['whitePaws', 'spots', 'stripes', 'fluffyTail', 'tinyHorns'],
} as const;

export default function CharacterQuiz({
    onSubmit,
    onCancel,
    isSubmitting = false,
    isEditing = false,
}: Readonly<ICharacterQuizProps>): React.ReactElement {
    const t = useTranslations('workshop.characterQuiz');
    const formId = useId();

    const form = useForm<IQuizValues>({
        initialValues: DEFAULTS,
    });

    const isChild = form.values.characterKind === 'child';
    const optionsFor = (dimension: keyof typeof OPTIONS): { value: string; label: string }[] =>
        OPTIONS[dimension].map((key) => ({ value: key, label: t(`${dimension}.${key}`) }));

    function buildChildDescription(values: IQuizValues): string {
        const clothing = values.clothingItem.trim()
            ? t('descriptionClothing', {
                  color: t(`clothingColor.${values.clothingColor}`),
                  item: values.clothingItem.trim(),
              })
            : t('descriptionClothingGeneric', {
                  color: t(`clothingColor.${values.clothingColor}`),
              });

        return t('descriptionTemplate', {
            gender: t(`gender.${values.gender}`),
            hairLength: t(`hairLength.${values.hairLength}`),
            hairColor: t(`hairColor.${values.hairColor}`),
            eyeColor: t(`eyeColor.${values.eyeColor}`),
            skinTone: t(`skinTone.${values.skinTone}`),
            clothing,
        });
    }

    function buildCreatureDescription(values: IQuizValues): string {
        const accessory = values.accessory.trim()
            ? t('descriptionAccessory', { accessory: values.accessory.trim() })
            : t('descriptionAccessoryGeneric');

        return t('descriptionCreatureTemplate', {
            kind: t(`characterKind.${values.characterKind}`),
            color: t(`creatureColor.${values.creatureColor}`),
            marking: t(`creatureMarking.${values.creatureMarking}`),
            accessory,
        });
    }

    function handleSubmit(values: IQuizValues): void {
        const base =
            values.characterKind === 'child'
                ? buildChildDescription(values)
                : buildCreatureDescription(values);

        const detail = values.detail.trim();
        onSubmit({ name: values.name.trim(), description: detail ? `${base} ${detail}` : base });
    }

    return (
        <>
            <form id={formId} onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <Input
                        label={t('nameLabel')}
                        placeholder={t('namePlaceholder')}
                        {...form.getInputProps('name')}
                    />
                    <Select
                        label={t('characterKindLabel')}
                        data={optionsFor('characterKind')}
                        {...form.getInputProps('characterKind')}
                    />
                    <SimpleGrid cols={2} spacing="sm">
                        {isChild ? (
                            <>
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
                            </>
                        ) : (
                            <>
                                <Select
                                    label={t('creatureColorLabel')}
                                    data={optionsFor('creatureColor')}
                                    {...form.getInputProps('creatureColor')}
                                />
                                <Select
                                    label={t('creatureMarkingLabel')}
                                    data={optionsFor('creatureMarking')}
                                    {...form.getInputProps('creatureMarking')}
                                />
                            </>
                        )}
                    </SimpleGrid>
                    {isChild ? (
                        <Input
                            label={t('clothingItemLabel')}
                            placeholder={t('clothingItemPlaceholder')}
                            {...form.getInputProps('clothingItem')}
                        />
                    ) : (
                        <Input
                            label={t('accessoryLabel')}
                            placeholder={t('accessoryPlaceholder')}
                            {...form.getInputProps('accessory')}
                        />
                    )}
                    <Input
                        label={t('detailLabel')}
                        placeholder={t('detailPlaceholder')}
                        {...form.getInputProps('detail')}
                    />
                </Stack>
            </form>
            <Modal.Footer>
                <div className={styles.actions}>
                    <Button variant="quiet" onClick={onCancel} disabled={isSubmitting}>
                        {t('cancelButton')}
                    </Button>
                    <Button type="submit" form={formId} variant="primary" loading={isSubmitting}>
                        {isEditing ? t('saveButton') : t('createButton')}
                    </Button>
                </div>
            </Modal.Footer>
        </>
    );
}
