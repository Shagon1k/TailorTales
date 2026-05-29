'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input/Input';
import Textarea from '@/components/ui/Textarea/Textarea';
import RadioCardGroup from '@/components/ui/RadioCard/RadioCardGroup';
import RadioCard from '@/components/ui/RadioCard/RadioCard';
import Button from '@/components/ui/Button/Button';
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
    const router = useRouter();
    const isEdit = Boolean(blueprint);

    const [name, setName] = useState(blueprint?.name ?? '');
    const [description, setDescription] = useState(blueprint?.description ?? '');
    const [type, setType] = useState<IStoryType | null>(blueprint?.type ?? null);
    const [systemPrompt, setSystemPrompt] = useState(blueprint?.systemPrompt ?? '');
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isValid =
        name.trim().length > 0 &&
        description.trim().length > 0 &&
        type !== null &&
        systemPrompt.trim().length > 0;

    const submitReadyLabel = isEdit ? 'Save changes' : 'Create blueprint';
    const submitLabel = isPending ? 'Saving…' : submitReadyLabel;

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
            setError('Could not save the blueprint. Please try again.');
        } finally {
            setIsPending(false);
        }
    }

    async function handleDelete(): Promise<void> {
        if (!isEdit || isPending) return;
        if (!confirm(`Delete "${blueprint!.name}"? This cannot be undone.`)) return;

        setIsPending(true);
        try {
            await storyBlueprintsApi.remove(blueprint!.id);
            router.push('/admin/blueprints');
            router.refresh();
        } catch (err: unknown) {
            console.error('Failed to delete blueprint', err);
            setError('Could not delete the blueprint. Please try again.');
            setIsPending(false);
        }
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.form__field}>
                <label htmlFor="bp-name" className={styles.form__label}>
                    Name
                </label>
                <Input
                    id="bp-name"
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                    placeholder="e.g. Storybook — gentle adventure"
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
                    Description
                </label>
                <Textarea
                    id="bp-description"
                    value={description}
                    onChange={(e) => setDescription(e.currentTarget.value)}
                    placeholder="Short summary of what this blueprint produces"
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
                    Story type
                </p>
                <RadioCardGroup
                    value={type}
                    onChange={(v) => setType(v as IStoryType)}
                    label="Story type"
                >
                    <RadioCard
                        value="BOOK"
                        title="Book"
                        description="Prose pages with one illustration per spread."
                    />
                    <RadioCard
                        value="COMIC"
                        title="Comic"
                        description="Panels and speech bubbles."
                    />
                </RadioCardGroup>
            </div>

            <div className={styles.form__field}>
                <label htmlFor="bp-prompt" className={styles.form__label}>
                    System prompt
                </label>
                <Textarea
                    id="bp-prompt"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.currentTarget.value)}
                    placeholder="Use XML markers: <intro_prompt>…</intro_prompt>"
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
                    Cancel
                </Button>
                {isEdit && (
                    <div className={styles['form__delete-wrap']}>
                        <Button
                            type="button"
                            variant="quiet"
                            onClick={handleDelete}
                            disabled={isPending}
                        >
                            Delete blueprint
                        </Button>
                    </div>
                )}
            </div>
        </form>
    );
}
