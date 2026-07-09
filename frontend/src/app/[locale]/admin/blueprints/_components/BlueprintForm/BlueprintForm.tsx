'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import Input from '@/components/ui/Input/Input';
import Textarea from '@/components/ui/Textarea/Textarea';
import RadioCardGroup from '@/components/ui/RadioCard/RadioCardGroup';
import RadioCard from '@/components/ui/RadioCard/RadioCard';
import Button from '@/components/ui/Button/Button';
import Modal from '@/components/ui/Modal/Modal';
import { storyBlueprintsApi } from '@/api/story-blueprints';
import type { IStoryBlueprintDetail } from '@/types/story-blueprint.types';
import type { IStoryType } from '@/types/story.types';
import styles from './BlueprintForm.module.scss';

const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;
const SYSTEM_PROMPT_MAX = 5000;

export interface IBlueprintFormProps {
    /** Provide to pre-fill the form for editing. Omit for create mode. */
    blueprint?: IStoryBlueprintDetail;
}

export default function BlueprintForm({
    blueprint,
}: Readonly<IBlueprintFormProps>): React.ReactElement {
    const t = useTranslations('admin.blueprints.form');
    const router = useRouter();
    const isEdit = Boolean(blueprint);

    const [name, setName] = useState(blueprint?.name ?? '');
    const [description, setDescription] = useState(blueprint?.description ?? '');
    const [type, setType] = useState<IStoryType | null>(blueprint?.type ?? null);
    const [systemPrompt, setSystemPrompt] = useState(blueprint?.systemPrompt ?? '');
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const isValid =
        name.trim().length > 0 &&
        description.trim().length > 0 &&
        type !== null &&
        systemPrompt.trim().length > 0;

    const submitLabel = isPending ? t('saving') : isEdit ? t('saveChanges') : t('create');

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();
        if (!isValid || isPending || !type) return;

        setError(null);
        setIsPending(true);

        try {
            const payload = {
                name: name.trim(),
                description: description.trim(),
                type,
                systemPrompt: systemPrompt.trim(),
            };

            if (isEdit) {
                await storyBlueprintsApi.update(blueprint!.id, payload);
            } else {
                await storyBlueprintsApi.create(payload);
            }

            router.push('/admin/blueprints');
            router.refresh();
        } catch (err: unknown) {
            console.error('Failed to save blueprint', err);
            setError(t('saveError'));
        } finally {
            setIsPending(false);
        }
    }

    async function handleDeleteConfirm(): Promise<void> {
        if (!isEdit || isPending) return;

        setDeleteError(null);
        setIsPending(true);
        try {
            await storyBlueprintsApi.remove(blueprint!.id);
            router.push('/admin/blueprints');
            router.refresh();
        } catch (err: unknown) {
            console.error('Failed to delete blueprint', err);
            setDeleteError(t('deleteError'));
            setIsPending(false);
        }
    }

    return (
        <>
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
                <div className={styles.form__field}>
                    <label htmlFor="bp-name" className={styles.form__label}>
                        {t('nameLabel')}
                    </label>
                    <Input
                        id="bp-name"
                        value={name}
                        onChange={(e) => setName(e.currentTarget.value)}
                        placeholder={t('namePlaceholder')}
                        maxLength={NAME_MAX}
                        required
                        aria-required="true"
                    />
                    <p className={styles.form__hint}>
                        {name.length} / {NAME_MAX}
                    </p>
                </div>

                <div className={styles.form__field}>
                    <label htmlFor="bp-description" className={styles.form__label}>
                        {t('descriptionLabel')}
                    </label>
                    <Textarea
                        id="bp-description"
                        value={description}
                        onChange={(e) => setDescription(e.currentTarget.value)}
                        placeholder={t('descriptionPlaceholder')}
                        minRows={3}
                        maxRows={6}
                        maxLength={DESCRIPTION_MAX}
                        aria-required="true"
                    />
                    <p className={styles.form__hint}>
                        {description.length} / {DESCRIPTION_MAX}
                    </p>
                </div>

                <div className={styles.form__field}>
                    <p className={styles.form__label} id="bp-type-label">
                        {t('typeLabel')}
                    </p>
                    <RadioCardGroup
                        value={type}
                        onChange={(v) => setType(v as IStoryType)}
                        label={t('typeLabel')}
                    >
                        <RadioCard
                            value="BOOK"
                            title={t('typeBook.title')}
                            description={t('typeBook.description')}
                        />
                        <RadioCard
                            value="COMIC"
                            title={t('typeComic.title')}
                            description={t('typeComic.description')}
                        />
                    </RadioCardGroup>
                </div>

                <div className={styles.form__field}>
                    <label htmlFor="bp-prompt" className={styles.form__label}>
                        {t('systemPromptLabel')}
                    </label>
                    <Textarea
                        id="bp-prompt"
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.currentTarget.value)}
                        placeholder={t('systemPromptPlaceholder')}
                        minRows={12}
                        maxRows={30}
                        maxLength={SYSTEM_PROMPT_MAX}
                        aria-required="true"
                    />
                    <p className={styles.form__hint}>
                        {systemPrompt.length} / {SYSTEM_PROMPT_MAX}
                    </p>
                </div>

                {error && (
                    <p className={styles.form__error} role="alert">
                        {error}
                    </p>
                )}

                <div className={styles.form__actions}>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={!isValid || isPending}
                        aria-busy={isPending}
                    >
                        {submitLabel}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.push('/admin/blueprints')}
                        disabled={isPending}
                    >
                        {t('cancel')}
                    </Button>
                    {isEdit && (
                        <div className={styles['form__delete-wrap']}>
                            <Button
                                type="button"
                                variant="quiet"
                                onClick={() => {
                                    setDeleteError(null);
                                    setIsDeleteModalOpen(true);
                                }}
                                disabled={isPending}
                            >
                                {t('delete')}
                            </Button>
                        </div>
                    )}
                </div>
            </form>

            <Modal
                opened={isDeleteModalOpen}
                onClose={() => {
                    if (isPending) return;
                    setDeleteError(null);
                    setIsDeleteModalOpen(false);
                }}
                title={t('deleteModal.title')}
                size="sm"
            >
                <div className={styles['form__confirm']}>
                    <p className={styles['form__confirm-text']}>
                        {t('deleteConfirm', { name: blueprint?.name ?? '' })}
                    </p>
                    {deleteError && (
                        <p className={styles.form__error} role="alert">
                            {deleteError}
                        </p>
                    )}
                    <div className={styles['form__confirm-actions']}>
                        <Button
                            type="button"
                            variant="quiet"
                            onClick={() => {
                                setDeleteError(null);
                                setIsDeleteModalOpen(false);
                            }}
                            disabled={isPending}
                        >
                            {t('deleteModal.cancel')}
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            onClick={handleDeleteConfirm}
                            loading={isPending}
                        >
                            {t('deleteModal.confirm')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
