'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RadioCardGroup from '@/components/ui/RadioCard/RadioCardGroup';
import RadioCard from '@/components/ui/RadioCard/RadioCard';
import OptionPillGroup from '@/components/ui/OptionPill/OptionPillGroup';
import OptionPill from '@/components/ui/OptionPill/OptionPill';
import SuggestionChip from '@/components/ui/SuggestionChip/SuggestionChip';
import Textarea from '@/components/ui/Textarea/Textarea';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import { storiesApi } from '@/api/stories';
import { useCharacters, useCreateCharacter, useUpdateCharacter } from '@/hooks/characters';
import type { IChild } from '@/types/child.types';
import type { ICharacter } from '@/types/character.types';
import type { IArtStyle } from '@/types/art-style.types';
import type { IStoryConfig, IStoryType, ILanguage } from '@/types/story.types';
import { LANGUAGES, LANGUAGE_CODES } from '@/constants/languages';
import ReaderChip from './components/ReaderChip/ReaderChip';
import ReaderSelector from './components/ReaderSelector/ReaderSelector';
import ArtStyleGrid from './components/ArtStyleGrid/ArtStyleGrid';
import WorkshopSummary from './components/WorkshopSummary/WorkshopSummary';
import CharacterForm, {
    type ICharacterFormValues,
} from '../../../_components/CharacterForm/CharacterForm';
import Modal from '@/components/ui/Modal/Modal';
import styles from './WorkshopForm.module.scss';

// Display labels for page count pills — matches backend ALLOWED_PAGE_COUNTS order.
const PAGE_COUNT_LABELS: Record<number, string> = {
    5: 'Short · 5 pp',
    8: 'Medium · 8 pp',
    12: 'Long · 12 pp',
    16: 'Big · 16 pp',
    20: 'Bedtime saga · 20 pp',
};

export interface IWorkshopFormProps {
    readers: IChild[];
    artStyles: IArtStyle[];
    config: IStoryConfig;
    /** Pre-selected child — from `?childId=` param or a failed story retry. */
    initialChildId?: string | null;
    /** Pre-filled question — from `?question=` param or a failed story retry. */
    initialQuestion?: string;
    /** Pre-selected story type — from a failed story retry. */
    initialStoryType?: IStoryType | null;
    /** Pre-selected page count — from a failed story retry. */
    initialPageCount?: number | null;
    /** Pre-selected art style — from a failed story retry. */
    initialArtStyleId?: string | null;
    /** Pre-selected language — from a failed story retry. */
    initialLanguage?: ILanguage | null;
}

export default function WorkshopForm({
    readers,
    artStyles,
    config,
    initialChildId = null,
    initialQuestion = '',
    initialStoryType = null,
    initialPageCount = null,
    initialArtStyleId = null,
    initialLanguage = null,
}: Readonly<IWorkshopFormProps>): React.ReactElement {
    const router = useRouter();

    const [selectedChildId, setSelectedChildId] = useState<string | null>(
        initialChildId ?? (readers.length === 1 ? readers[0].id : null),
    );
    const [isReaderOpen, setIsReaderOpen] = useState(false);
    const [storyType, setStoryType] = useState<IStoryType | null>(initialStoryType);
    const [pageCount, setPageCount] = useState<string | null>(
        initialPageCount !== null ? String(initialPageCount) : null,
    );
    const [artStyleId, setArtStyleId] = useState<string | null>(initialArtStyleId);
    const [language, setLanguage] = useState<ILanguage | null>(initialLanguage);
    const [question, setQuestion] = useState(initialQuestion);
    const [isPending, setIsPending] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const { data: characters = [] } = useCharacters();
    const { mutate: createCharacter, isPending: isCreatingCharacter } = useCreateCharacter();
    const { mutate: updateCharacter, isPending: isUpdatingCharacter } = useUpdateCharacter();

    const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);

    const characterByChildId = new Map(
        characters
            .filter((c): c is ICharacter & { childId: string } => c.childId !== null)
            .map((c) => [c.childId, c]),
    );

    const selectedChild = readers.find((r) => r.id === selectedChildId) ?? null;
    const selectedArtStyle = artStyles.find((s) => s.id === artStyleId) ?? null;
    const selectedCharacter = selectedChildId
        ? (characterByChildId.get(selectedChildId) ?? null)
        : null;

    const isValid =
        selectedChildId !== null &&
        storyType !== null &&
        pageCount !== null &&
        artStyleId !== null &&
        language !== null &&
        question.trim().length >= config.questionMinLength;

    function handleReaderSelect(id: string): void {
        setSelectedChildId(id);
        setIsReaderOpen(false);
    }

    function handleCharacterSubmit(values: ICharacterFormValues): void {
        if (!selectedChildId) return;
        if (selectedCharacter) {
            updateCharacter(
                { id: selectedCharacter.id, payload: values },
                { onSuccess: () => setIsCharacterModalOpen(false) },
            );
        } else {
            createCharacter(
                { ...values, childId: selectedChildId },
                { onSuccess: () => setIsCharacterModalOpen(false) },
            );
        }
    }

    async function handleSubmit(): Promise<void> {
        if (!isValid || isPending) return;
        // Type guard — isValid already ensures these are non-null.
        if (!selectedChildId || !storyType || !pageCount || !artStyleId || !language) return;

        setSubmitError(null);
        setIsPending(true);
        try {
            const story = await storiesApi.create({
                childId: selectedChildId,
                type: storyType,
                question: question.trim(),
                pageCount: Number(pageCount),
                artStyleId,
                language,
            });
            await storiesApi.generate(story.id);
            router.push(`/workshop/${story.id}`);
        } catch (err: unknown) {
            console.error('Failed to start generation', err);
            setSubmitError('Could not start generation. Please try again.');
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className={styles.workshop}>
            <div className={styles.workshop__form}>
                <div className={styles.workshop__reader}>
                    <ReaderChip
                        child={selectedChild}
                        isOpen={isReaderOpen}
                        hasChildren={readers.length > 0}
                        onToggle={() => setIsReaderOpen((prev) => !prev)}
                    />
                    {isReaderOpen && readers.length > 0 && (
                        <ReaderSelector
                            items={readers}
                            selectedId={selectedChildId}
                            onSelect={handleReaderSelect}
                        />
                    )}
                </div>

                <section className={styles.workshop__section} aria-labelledby="section-question">
                    <div className={styles['workshop__section-header']}>
                        <span className={styles['workshop__section-number']}>1.</span>
                        <div>
                            <h2 id="section-question" className={styles['workshop__section-title']}>
                                A question to begin with
                            </h2>
                            <p className={styles['workshop__section-sub']}>
                                Type their question, or pluck one from the jar below.
                            </p>
                        </div>
                    </div>

                    <Textarea
                        value={question}
                        onChange={(e) => setQuestion(e.currentTarget.value)}
                        placeholder="e.g. Why do mountains breathe smoke?"
                        minRows={3}
                        maxRows={6}
                        maxLength={config.questionMaxLength}
                        aria-label="Story question"
                        aria-describedby="section-question"
                    />

                    <div className={styles.workshop__jar}>
                        <CapsLabel>Or pluck one from the jar</CapsLabel>
                        <div className={styles.workshop__chips}>
                            {config.questionSuggestions.map((suggestion) => (
                                <SuggestionChip
                                    key={suggestion}
                                    label={suggestion}
                                    onClick={() => setQuestion(suggestion)}
                                    disabled={isPending}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                <section className={styles.workshop__section} aria-labelledby="section-format">
                    <div className={styles['workshop__section-header']}>
                        <span className={styles['workshop__section-number']}>2.</span>
                        <h2 id="section-format" className={styles['workshop__section-title']}>
                            A book, or a comic
                        </h2>
                    </div>
                    <RadioCardGroup
                        value={storyType}
                        onChange={(v) => setStoryType(v as IStoryType)}
                        label="Story format"
                    >
                        <RadioCard
                            value="BOOK"
                            title="Book"
                            description="One illustration per page, gentle prose, the slow kind. 1 credit / page."
                        />
                        <RadioCard
                            value="COMIC"
                            title="Comic — coming soon"
                            description="Panels, speech bubbles, more zip. Great for readers 6+. 2 credits / page"
                            disabled
                        />
                    </RadioCardGroup>
                </section>

                <section className={styles.workshop__section} aria-labelledby="section-length">
                    <div className={styles['workshop__section-header']}>
                        <span className={styles['workshop__section-number']}>3.</span>
                        <h2 id="section-length" className={styles['workshop__section-title']}>
                            How long the tale should be
                        </h2>
                    </div>
                    <OptionPillGroup value={pageCount} onChange={setPageCount} label="Page count">
                        {config.allowedPageCounts.map((count) => (
                            <OptionPill key={count} value={String(count)}>
                                {PAGE_COUNT_LABELS[count] ?? `${count} pp`}
                            </OptionPill>
                        ))}
                    </OptionPillGroup>
                </section>

                <section className={styles.workshop__section} aria-labelledby="section-style">
                    <div className={styles['workshop__section-header']}>
                        <span className={styles['workshop__section-number']}>4.</span>
                        <h2 id="section-style" className={styles['workshop__section-title']}>
                            A look for the pictures
                        </h2>
                    </div>
                    <ArtStyleGrid
                        artStyles={artStyles}
                        selectedId={artStyleId}
                        onSelect={setArtStyleId}
                    />
                    <p className={styles['workshop__section-note']}>
                        All styles are consistent across the book — the fox in chapter 1 is the same
                        fox in chapter 12.
                    </p>
                </section>

                <section className={styles.workshop__section} aria-labelledby="section-language">
                    <div className={styles['workshop__section-header']}>
                        <span className={styles['workshop__section-number']}>5.</span>
                        <h2 id="section-language" className={styles['workshop__section-title']}>
                            The language of the tale
                        </h2>
                    </div>
                    <OptionPillGroup
                        value={language}
                        onChange={(v) => setLanguage(v as ILanguage)}
                        label="Story language"
                    >
                        {LANGUAGE_CODES.map((code) => (
                            <OptionPill key={code} value={code}>
                                {LANGUAGES[code].nativeName}
                            </OptionPill>
                        ))}
                    </OptionPillGroup>
                </section>
                {submitError !== null && (
                    <p role="alert" className={styles['workshop__error']}>
                        {submitError}
                    </p>
                )}
            </div>

            <WorkshopSummary
                child={selectedChild}
                character={selectedCharacter}
                storyType={storyType}
                pageCount={pageCount}
                artStyle={selectedArtStyle}
                language={language}
                question={question}
                isValid={isValid}
                isPending={isPending}
                onSubmit={handleSubmit}
                onCharacterEdit={() => setIsCharacterModalOpen(true)}
            />

            <Modal
                opened={isCharacterModalOpen}
                onClose={() => setIsCharacterModalOpen(false)}
                title={selectedCharacter ? 'Edit character' : 'Add character'}
            >
                {isCharacterModalOpen && (
                    <CharacterForm
                        initialValues={
                            selectedCharacter
                                ? {
                                      name: selectedCharacter.name,
                                      description: selectedCharacter.description,
                                  }
                                : undefined
                        }
                        onSubmit={handleCharacterSubmit}
                        onCancel={() => setIsCharacterModalOpen(false)}
                        isSubmitting={selectedCharacter ? isUpdatingCharacter : isCreatingCharacter}
                    />
                )}
            </Modal>
        </div>
    );
}
