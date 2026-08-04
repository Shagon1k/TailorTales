'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import RadioCardGroup from '@/components/ui/RadioCard/RadioCardGroup';
import RadioCard from '@/components/ui/RadioCard/RadioCard';
import OptionPillGroup from '@/components/ui/OptionPill/OptionPillGroup';
import OptionPill from '@/components/ui/OptionPill/OptionPill';
import SuggestionChip from '@/components/ui/SuggestionChip/SuggestionChip';
import Textarea from '@/components/ui/Textarea/Textarea';
import { storiesApi } from '@/api/stories';
import { ANALYTICS_EVENTS, useTrackAnalytics } from '@/lib/analytics';
import { useCharacters, useCreateCharacter } from '@/hooks/characters';
import { useSubscription } from '@/hooks/subscription';
import type { IChild } from '@/types/child.types';
import type { IUserCharacterSource } from '@/types/character.types';
import type { IArtStyle } from '@/types/art-style.types';
import type {
    IStoryConfig,
    IStoryType,
    ILanguage,
    IStoryGenre,
    IWritingStyle,
    ICreateStoryPayload,
} from '@/types/story.types';
import { LANGUAGES, LANGUAGE_CODES, LOCALE_TO_LANGUAGE } from '@/constants/languages';
import {
    getLocalizedQuestionSuggestions,
    getRandomQuestionSuggestions,
} from '@/utils/question-suggestions.utils';
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

// Optional flavour knobs — value is the enum sent to the API, key resolves the i18n copy.
const GENRES: { value: IStoryGenre; key: string }[] = [
    { value: 'FAIRY_TALE', key: 'fairyTale' },
    { value: 'BEDTIME', key: 'bedtime' },
    { value: 'EDUCATIONAL', key: 'educational' },
    { value: 'ADVENTURE', key: 'adventure' },
];

const WRITING_STYLES: { value: IWritingStyle; key: string }[] = [
    { value: 'SIMPLE', key: 'simple' },
    { value: 'POETIC', key: 'poetic' },
    { value: 'IMAGINATIVE', key: 'imaginative' },
];

export interface IWorkshopFormProps {
    readers: IChild[];
    artStyles: IArtStyle[];
    config: IStoryConfig;
    /** Story being retried in-place after a failed generation. */
    initialStoryId?: string | null;
    /** Pre-selected child — from `?childId=` param or a failed story retry. */
    initialChildId?: string | null;
    /** Pre-selected character — from a failed story retry. */
    initialCharacterId?: string | null;
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
    /** Pre-selected genre — from a failed story retry. */
    initialGenre?: IStoryGenre | null;
    /** Pre-selected writing style — from a failed story retry; defaults to a simple voice. */
    initialWritingStyle?: IWritingStyle | null;
}

export default function WorkshopForm({
    readers,
    artStyles,
    config,
    initialStoryId = null,
    initialChildId = null,
    initialCharacterId = null,
    initialQuestion = '',
    initialStoryType = null,
    initialPageCount = null,
    initialArtStyleId = null,
    initialLanguage = null,
    initialGenre = null,
    initialWritingStyle = 'SIMPLE',
}: Readonly<IWorkshopFormProps>): React.ReactElement {
    const t = useTranslations('workshop.form');
    const tStoryOptions = useTranslations('storyOptions');
    const locale = useLocale();
    const router = useRouter();
    const { track } = useTrackAnalytics();
    const questionSuggestions = useMemo(
        () => getRandomQuestionSuggestions(getLocalizedQuestionSuggestions((key) => t(key))),
        [t],
    );

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
    const [language, setLanguage] = useState<ILanguage | null>(
        initialLanguage ?? LOCALE_TO_LANGUAGE[locale] ?? null,
    );
    // Optional flavour knobs. Genre defaults to none; writing style defaults to a clear, simple
    // voice. Both restore from a failed-story retry via the initial props.
    const [genre, setGenre] = useState<IStoryGenre | null>(initialGenre);
    const [writingStyle, setWritingStyle] = useState<IWritingStyle | null>(initialWritingStyle);
    const [question, setQuestion] = useState(initialQuestion);
    const [isQuestionTouched, setIsQuestionTouched] = useState(initialQuestion.trim().length > 0);
    const [isPending, setIsPending] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const { data: characters = [] } = useCharacters();
    const { data: subscription } = useSubscription();
    const { mutate: createCharacter, isPending: isCreatingCharacter } = useCreateCharacter();

    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
        initialCharacterId,
    );
    const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);

    const selectedChild = readers.find((r) => r.id === selectedChildId) ?? null;
    const selectedArtStyle = artStyles.find((s) => s.id === artStyleId) ?? null;
    // Characters belong to a child — only show (and allow choosing) the reader's own.
    const childCharacters = characters.filter((c) => c.childId === selectedChildId);
    const charactersLimit = subscription?.tier.charactersLimit ?? null;
    const charactersLeft =
        charactersLimit === null ? null : Math.max(charactersLimit - characters.length, 0);
    const characterGenerationLimit = subscription?.tier.characterGenerationsPerMonth ?? 0;
    const characterGenerationsUsed = subscription?.characterGenerationsUsed ?? 0;
    const characterGenerationsLeft = Math.max(
        characterGenerationLimit - characterGenerationsUsed,
        0,
    );
    const canCreateCharacter =
        characterGenerationsLeft > 0 && (charactersLeft === null || charactersLeft > 0);
    const selectedCharacter = childCharacters.find((c) => c.id === selectedCharacterId) ?? null;
    const selectedGenreKey = GENRES.find((g) => g.value === genre)?.key ?? null;
    const selectedStyleKey = WRITING_STYLES.find((s) => s.value === writingStyle)?.key ?? null;
    const trimmedQuestion = question.trim();
    const isQuestionTooShort = trimmedQuestion.length < config.questionMinLength;
    const questionError =
        isQuestionTouched && isQuestionTooShort
            ? trimmedQuestion.length === 0
                ? t('questionInput.errors.required')
                : t('questionInput.errors.tooShort', { min: config.questionMinLength })
            : null;
    const isValid =
        selectedChildId !== null &&
        storyType !== null &&
        pageCount !== null &&
        artStyleId !== null &&
        language !== null &&
        !isQuestionTooShort;

    function handleReaderSelect(id: string): void {
        setSelectedChildId(id);
        // Characters are scoped to a child — a previous pick no longer applies.
        setSelectedCharacterId(null);
        setIsReaderOpen(false);
    }

    function handleCharacterSelect(id: string | null): void {
        setSelectedCharacterId(id);
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

    function buildStoryPayload(): ICreateStoryPayload | null {
        if (!isValid || !selectedChildId || !storyType || !pageCount || !artStyleId || !language) {
            return null;
        }

        return {
            childId: selectedChildId,
            ...(selectedCharacterId !== null && { characterId: selectedCharacterId }),
            type: storyType,
            question: question.trim(),
            pageCount: Number(pageCount),
            artStyleId,
            language,
            ...(genre !== null && { genre }),
            ...(writingStyle !== null && { writingStyle }),
        };
    }

    async function handleGenerate(): Promise<void> {
        if (!isValid || isPending) return;
        const payload = buildStoryPayload();
        if (!payload) return;

        setSubmitError(null);
        setIsPending(true);
        try {
            const job =
                initialStoryId !== null
                    ? await storiesApi.retry(initialStoryId, payload)
                    : await (async () => {
                          const story = await storiesApi.create(payload);
                          return storiesApi.generate(story.id);
                      })();
            track({
                name: ANALYTICS_EVENTS.storyGenerationStarted,
                parameters: {
                    story_type: payload.type,
                    page_count: payload.pageCount,
                    language: payload.language,
                },
            });
            router.push(`/workshop/${job.storyId}`);
        } catch (err: unknown) {
            console.error('Failed to start generation', err);
            setSubmitError(t('submitError'));
        } finally {
            setIsPending(false);
        }
    }

    async function handleSaveDraft(): Promise<void> {
        if (!isValid || isPending) return;
        const payload = buildStoryPayload();
        if (!payload) return;

        setSubmitError(null);
        setIsPending(true);
        try {
            await storiesApi.create(payload);
            router.push('/library');
        } catch (err: unknown) {
            console.error('Failed to save draft', err);
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
                        onBlur={() => setIsQuestionTouched(true)}
                        placeholder={t('questionInput.placeholder')}
                        minRows={3}
                        maxRows={6}
                        maxLength={config.questionMaxLength}
                        required
                        error={questionError}
                        aria-label="Story question"
                        aria-describedby="section-question"
                    />

                    <div className={styles.workshop__jar}>
                        <p className={styles['workshop__jar-label']}>
                            {t('questionInput.jarLabel')}
                        </p>
                        <div className={styles.workshop__chips}>
                            {questionSuggestions.map((suggestion) => (
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

                <section className={styles.workshop__section} aria-labelledby="section-character">
                    <div className={styles['workshop__section-header']}>
                        <span className={styles['workshop__section-number']}>
                            {t('characterPicker.number')}
                        </span>
                        <div>
                            <h2
                                id="section-character"
                                className={styles['workshop__section-title']}
                            >
                                {t('characterPicker.title')}
                            </h2>
                            <p className={styles['workshop__section-sub']}>
                                {t('characterPicker.note')}
                            </p>
                        </div>
                    </div>

                    {selectedChild !== null ? (
                        <div className={styles.workshop__picker}>
                            <CharacterSelector
                                items={childCharacters}
                                selectedId={selectedCharacterId}
                                onSelect={handleCharacterSelect}
                            />
                            <Button
                                variant="secondary"
                                onClick={() => setIsCharacterModalOpen(true)}
                                disabled={!canCreateCharacter}
                            >
                                {t('characterPicker.createNew')}
                            </Button>
                            {!canCreateCharacter && (
                                <p className={styles['workshop__section-note']}>
                                    {characterGenerationsLeft === 0
                                        ? t('characterPicker.noGenerationsLeft')
                                        : t('characterPicker.noCharacterSlotsLeft')}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className={styles['workshop__empty-guidance']}>
                            {t('characterPicker.selectReaderFirst')}
                        </p>
                    )}
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
                    <p className={styles['workshop__section-note']}>
                        {t('formatPicker.comicDeferredNote')}
                    </p>
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
                        layout="grid"
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
                        layout="grid"
                    >
                        {LANGUAGE_CODES.map((code) => (
                            <OptionPill key={code} value={code}>
                                {LANGUAGES[code].nativeName}
                            </OptionPill>
                        ))}
                    </OptionPillGroup>
                </section>

                <section className={styles.workshop__section} aria-labelledby="section-genre">
                    <div className={styles['workshop__section-header']}>
                        <span className={styles['workshop__section-number']}>
                            {t('genrePicker.number')}
                        </span>
                        <h2 id="section-genre" className={styles['workshop__section-title']}>
                            {t('genrePicker.title')}
                        </h2>
                    </div>
                    <OptionPillGroup
                        value={genre}
                        onChange={(v) => setGenre(v as IStoryGenre)}
                        label={t('genrePicker.label')}
                        layout="grid"
                    >
                        {GENRES.map(({ value, key }) => (
                            <OptionPill key={value} value={value}>
                                {tStoryOptions(`genres.${key}`)}
                            </OptionPill>
                        ))}
                    </OptionPillGroup>
                    <p className={styles['workshop__section-note']}>
                        {selectedGenreKey
                            ? t(`genrePicker.${selectedGenreKey}.hint`)
                            : t('genrePicker.note')}
                    </p>
                </section>

                <section className={styles.workshop__section} aria-labelledby="section-writing">
                    <div className={styles['workshop__section-header']}>
                        <span className={styles['workshop__section-number']}>
                            {t('writingStylePicker.number')}
                        </span>
                        <h2 id="section-writing" className={styles['workshop__section-title']}>
                            {t('writingStylePicker.title')}
                        </h2>
                    </div>
                    <OptionPillGroup
                        value={writingStyle}
                        onChange={(v) => setWritingStyle(v as IWritingStyle)}
                        label={t('writingStylePicker.label')}
                        layout="grid"
                    >
                        {WRITING_STYLES.map(({ value, key }) => (
                            <OptionPill key={value} value={value}>
                                {tStoryOptions(`writingStyles.${key}`)}
                            </OptionPill>
                        ))}
                    </OptionPillGroup>
                    <p className={styles['workshop__section-note']}>
                        {selectedStyleKey
                            ? t(`writingStylePicker.${selectedStyleKey}.hint`)
                            : t('writingStylePicker.note')}
                    </p>
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
                onGenerate={handleGenerate}
                onSaveDraft={handleSaveDraft}
            />

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
                    />
                )}
            </Modal>
        </div>
    );
}
