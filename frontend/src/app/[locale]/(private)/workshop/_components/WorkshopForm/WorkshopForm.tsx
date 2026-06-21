'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import RadioCardGroup from '@/components/ui/RadioCard/RadioCardGroup';
import RadioCard from '@/components/ui/RadioCard/RadioCard';
import OptionPillGroup from '@/components/ui/OptionPill/OptionPillGroup';
import OptionPill from '@/components/ui/OptionPill/OptionPill';
import SuggestionChip from '@/components/ui/SuggestionChip/SuggestionChip';
import Textarea from '@/components/ui/Textarea/Textarea';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import { storiesApi } from '@/api/stories';
import {
    useCharacters,
    useCreateCharacter,
    useCreateCharacterFromPrompt,
} from '@/hooks/characters';
import type { IChild } from '@/types/child.types';
import type { IUserCharacterSource } from '@/types/character.types';
import type { IArtStyle } from '@/types/art-style.types';
import type { IStoryConfig, IStoryType, ILanguage } from '@/types/story.types';
import { LANGUAGES, LANGUAGE_CODES } from '@/constants/languages';
import ReaderChip from './components/ReaderChip/ReaderChip';
import ReaderSelector from './components/ReaderSelector/ReaderSelector';
import CharacterSelector from './components/CharacterSelector/CharacterSelector';
import ArtStyleGrid from './components/ArtStyleGrid/ArtStyleGrid';
import WorkshopSummary from './components/WorkshopSummary/WorkshopSummary';
import CharacterForm, {
    type ICharacterFormValues,
} from '../../../_components/CharacterForm/CharacterForm';
import Button from '@/components/ui/Button/Button';
import Modal from '@/components/ui/Modal/Modal';
import styles from './WorkshopForm.module.scss';

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
    const t = useTranslations('workshop.form');
    const router = useRouter();

    const pageCountLabels: Record<number, string> = {
        5: t('pageCount.option5'),
        8: t('pageCount.option8'),
        12: t('pageCount.option12'),
        16: t('pageCount.option16'),
        20: t('pageCount.option20'),
    };

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
    const { mutate: createCharacterFromPrompt, isPending: isGeneratingCharacter } =
        useCreateCharacterFromPrompt();

    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
    const [isCharacterPickerOpen, setIsCharacterPickerOpen] = useState(false);
    const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);

    const selectedChild = readers.find((r) => r.id === selectedChildId) ?? null;
    const selectedArtStyle = artStyles.find((s) => s.id === artStyleId) ?? null;
    // Characters belong to a child — only show (and allow choosing) the reader's own.
    const childCharacters = characters.filter((c) => c.childId === selectedChildId);
    const selectedCharacter = childCharacters.find((c) => c.id === selectedCharacterId) ?? null;

    const isValid =
        selectedChildId !== null &&
        storyType !== null &&
        pageCount !== null &&
        artStyleId !== null &&
        language !== null &&
        question.trim().length >= config.questionMinLength;

    function handleReaderSelect(id: string): void {
        setSelectedChildId(id);
        // Characters are scoped to a child — a previous pick no longer applies.
        setSelectedCharacterId(null);
        setIsReaderOpen(false);
    }

    function handleCharacterSelect(id: string | null): void {
        setSelectedCharacterId(id);
        setIsCharacterPickerOpen(false);
    }

    function handleCreateNewCharacter(): void {
        setIsCharacterPickerOpen(false);
        setIsCharacterModalOpen(true);
    }

    function handleCharacterSubmit(
        values: ICharacterFormValues,
        source: IUserCharacterSource,
    ): void {
        if (!selectedChildId) return;
        // Inline-created characters belong to the selected reader and are auto-selected.
        createCharacter(
            { ...values, childId: selectedChildId, source },
            {
                onSuccess: (created) => {
                    setSelectedCharacterId(created.id);
                    setIsCharacterModalOpen(false);
                },
            },
        );
    }

    function handleGenerateCharacter(prompt: string): void {
        if (!selectedChildId) return;
        createCharacterFromPrompt(
            { childId: selectedChildId, prompt },
            {
                onSuccess: (created) => {
                    setSelectedCharacterId(created.id);
                    setIsCharacterModalOpen(false);
                },
            },
        );
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
                ...(selectedCharacterId !== null && { characterId: selectedCharacterId }),
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
            setSubmitError(t('submitError'));
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
                        <span className={styles['workshop__section-number']}>
                            {t('questionInput.number')}
                        </span>
                        <div>
                            <h2 id="section-question" className={styles['workshop__section-title']}>
                                {t('questionInput.title')}
                            </h2>
                            <p className={styles['workshop__section-sub']}>
                                {t('questionInput.subheading')}
                            </p>
                        </div>
                    </div>

                    <Textarea
                        value={question}
                        onChange={(e) => setQuestion(e.currentTarget.value)}
                        placeholder={t('questionInput.placeholder')}
                        minRows={3}
                        maxRows={6}
                        maxLength={config.questionMaxLength}
                        aria-label="Story question"
                        aria-describedby="section-question"
                    />

                    <div className={styles.workshop__jar}>
                        <CapsLabel>{t('questionInput.jarLabel')}</CapsLabel>
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
                        <span className={styles['workshop__section-number']}>
                            {t('formatPicker.number')}
                        </span>
                        <h2 id="section-format" className={styles['workshop__section-title']}>
                            {t('formatPicker.title')}
                        </h2>
                    </div>
                    <RadioCardGroup
                        value={storyType}
                        onChange={(v) => setStoryType(v as IStoryType)}
                        label={t('formatPicker.label')}
                    >
                        <RadioCard
                            value="BOOK"
                            title={t('formatPicker.book.title')}
                            description={t('formatPicker.book.description')}
                        />
                        <RadioCard
                            value="COMIC"
                            title={t('formatPicker.comic.title')}
                            description={t('formatPicker.comic.description')}
                            disabled
                        />
                    </RadioCardGroup>
                </section>

                <section className={styles.workshop__section} aria-labelledby="section-length">
                    <div className={styles['workshop__section-header']}>
                        <span className={styles['workshop__section-number']}>
                            {t('pageCount.number')}
                        </span>
                        <h2 id="section-length" className={styles['workshop__section-title']}>
                            {t('pageCount.title')}
                        </h2>
                    </div>
                    <OptionPillGroup
                        value={pageCount}
                        onChange={setPageCount}
                        label={t('pageCount.label')}
                    >
                        {config.allowedPageCounts.map((count) => (
                            <OptionPill key={count} value={String(count)}>
                                {pageCountLabels[count] ?? `${count} pp`}
                            </OptionPill>
                        ))}
                    </OptionPillGroup>
                </section>

                <section className={styles.workshop__section} aria-labelledby="section-style">
                    <div className={styles['workshop__section-header']}>
                        <span className={styles['workshop__section-number']}>
                            {t('artStylePicker.number')}
                        </span>
                        <h2 id="section-style" className={styles['workshop__section-title']}>
                            {t('artStylePicker.title')}
                        </h2>
                    </div>
                    <ArtStyleGrid
                        artStyles={artStyles}
                        selectedId={artStyleId}
                        onSelect={setArtStyleId}
                    />
                    <p className={styles['workshop__section-note']}>{t('artStylePicker.note')}</p>
                </section>

                <section className={styles.workshop__section} aria-labelledby="section-language">
                    <div className={styles['workshop__section-header']}>
                        <span className={styles['workshop__section-number']}>
                            {t('languagePicker.number')}
                        </span>
                        <h2 id="section-language" className={styles['workshop__section-title']}>
                            {t('languagePicker.title')}
                        </h2>
                    </div>
                    <OptionPillGroup
                        value={language}
                        onChange={(v) => setLanguage(v as ILanguage)}
                        label={t('languagePicker.label')}
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
                onCharacterChoose={() => setIsCharacterPickerOpen(true)}
            />

            <Modal
                opened={isCharacterPickerOpen}
                onClose={() => setIsCharacterPickerOpen(false)}
                title={t('characterPicker.title')}
            >
                {isCharacterPickerOpen && (
                    <div className={styles.workshop__picker}>
                        <CharacterSelector
                            items={childCharacters}
                            selectedId={selectedCharacterId}
                            onSelect={handleCharacterSelect}
                        />
                        <Button variant="quiet" fullWidth onClick={handleCreateNewCharacter}>
                            {t('characterPicker.createNew')}
                        </Button>
                    </div>
                )}
            </Modal>

            <Modal
                opened={isCharacterModalOpen}
                onClose={() => setIsCharacterModalOpen(false)}
                title={t('characterModal.addTitle')}
            >
                {isCharacterModalOpen && (
                    <CharacterForm
                        onSubmit={handleCharacterSubmit}
                        onCancel={() => setIsCharacterModalOpen(false)}
                        isSubmitting={isCreatingCharacter}
                        onGenerateFromPrompt={handleGenerateCharacter}
                        isGenerating={isGeneratingCharacter}
                    />
                )}
            </Modal>
        </div>
    );
}
