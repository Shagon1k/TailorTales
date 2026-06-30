import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IChild } from '@/types/child.types';
import type { IArtStyle } from '@/types/art-style.types';
import type { IStoryConfig } from '@/types/story.types';
import type { IUsageSummary } from '@/types/subscription.types';
import WorkshopForm from '../WorkshopForm';

const mockRouterPush = vi.hoisted(() => vi.fn());

vi.mock('@/i18n/navigation', () => ({
    Link: ({
        href,
        children,
        ...rest
    }: {
        href: string;
        children: React.ReactNode;
        [key: string]: unknown;
    }) => (
        <a href={href} {...(rest as object)}>
            {children}
        </a>
    ),
    useRouter: vi.fn().mockReturnValue({ push: mockRouterPush }),
}));

const SUBSCRIPTION: IUsageSummary = {
    tier: {
        id: 'tier-free',
        name: 'Free Chapter',
        priceMonthly: 0,
        watermark: true,
        pagesPerMonth: 12,
        regenerationsPerMonth: 3,
        childrenLimit: 1,
        charactersLimit: 3,
        characterGenerationsPerMonth: 3,
        retentionDays: 30,
    },
    status: 'ACTIVE',
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    pagesUsed: 0,
    regenerationsUsed: 0,
    characterGenerationsUsed: 0,
    childrenUsed: 1,
    talesCount: 2,
};

vi.mock('@/hooks/subscription', () => ({
    useSubscription: () => ({ data: SUBSCRIPTION }),
}));

const mockStoriesCreate = vi.hoisted(() => vi.fn());
const mockStoriesGenerate = vi.hoisted(() => vi.fn());
const mockStoriesRetry = vi.hoisted(() => vi.fn());

vi.mock('@/api/stories', () => ({
    storiesApi: {
        create: mockStoriesCreate,
        generate: mockStoriesGenerate,
        retry: mockStoriesRetry,
    },
}));

vi.mock('@/utils/question-suggestions.utils', () => ({
    QUESTION_SUGGESTION_COUNT: 6,
    getLocalizedQuestionSuggestions: () => [
        'Why is the sky blue?',
        'How do bees find their flowers?',
        'Where does the rain go?',
        'Why do stars twinkle?',
        'Why do cats purr?',
        'How do spiders spin webs?',
    ],
    getRandomQuestionSuggestions: (suggestions: string[]) => suggestions,
}));

// WorkshopForm uses the character hooks — mock the entire module so tests focus on
// WorkshopForm behaviour and don't need a real API.
vi.mock('@/hooks/characters', () => ({
    useCharacters: vi.fn().mockReturnValue({ data: [] }),
    useCreateCharacter: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    useCreateCharacterFromPrompt: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    useUpdateCharacter: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}));

const READER: IChild = {
    id: 'child-1',
    userId: 'user-123',
    name: 'Maya',
    birthdate: '2020-03-10',
    gender: 'FEMALE',
    interests: ['dragons'],
    avatarUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
};

const ART_STYLE: IArtStyle = {
    id: 'style-1',
    name: 'Storybook',
    slug: 'storybook',
    order: 1,
    promptPrefix: 'Illustrate in a storybook style:',
    isActive: true,
    thumbnailUrl: 'https://example.com/thumb.jpg',
    createdAt: '2026-01-01T00:00:00.000Z',
};

const CONFIG: IStoryConfig = {
    allowedPageCounts: [5, 8, 12],
    questionMinLength: 3,
    questionMaxLength: 500,
    questionSuggestions: ['Why is the sky blue?', 'How do bees find flowers?'],
};

function renderForm(overrides: Partial<Parameters<typeof WorkshopForm>[0]> = {}): void {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
        <QueryClientProvider client={queryClient}>
            <MantineProvider>
                <WorkshopForm
                    readers={[READER]}
                    artStyles={[ART_STYLE]}
                    config={CONFIG}
                    {...overrides}
                />
            </MantineProvider>
        </QueryClientProvider>,
    );
}

describe('WorkshopForm', () => {
    beforeEach(() => {
        mockRouterPush.mockClear();
        mockStoriesCreate.mockClear();
        mockStoriesGenerate.mockClear();
        mockStoriesRetry.mockClear();
        mockStoriesGenerate.mockResolvedValue({ jobId: 'job-1', storyId: 'story-new' });
        mockStoriesRetry.mockResolvedValue({ jobId: 'job-1', storyId: 'story-retry' });
    });

    describe('given the form is rendered', () => {
        it('should display the main workshop sections including character selection', () => {
            renderForm();

            expect(screen.getByText(/a question to begin with/i)).toBeInTheDocument();
            expect(screen.getByText(/choose a character/i)).toBeInTheDocument();
            expect(screen.getByText(/a book, or a comic/i)).toBeInTheDocument();
            expect(screen.getByText(/how long the tale should be/i)).toBeInTheDocument();
            expect(screen.getByText(/a look for the pictures/i)).toBeInTheDocument();
            expect(screen.getByText(/the language of the tale/i)).toBeInTheDocument();
        });

        it('should auto-select the reader when only one reader is provided', () => {
            renderForm();

            expect(screen.getByText('Maya')).toBeInTheDocument();
        });

        it('should pre-fill the question textarea when initialQuestion is provided', () => {
            renderForm({ initialQuestion: 'Why do mountains breathe smoke?' });

            expect(screen.getByRole('textbox', { name: /story question/i })).toHaveValue(
                'Why do mountains breathe smoke?',
            );
        });

        it('should render localized suggestion chips', () => {
            renderForm();

            expect(screen.getByText('Why is the sky blue?')).toBeInTheDocument();
            expect(screen.getByText('How do bees find their flowers?')).toBeInTheDocument();
        });

        it('should render art style thumbnails when they are available', () => {
            renderForm();

            expect(screen.getByRole('img', { name: 'Storybook' })).toHaveAttribute(
                'src',
                'https://example.com/thumb.jpg',
            );
        });

        it('should pre-select the current app locale as the story language', () => {
            renderForm();

            const langGroup = screen.getByRole('radiogroup', { name: /story language/i });
            expect(within(langGroup).getByRole('radio', { name: /^English/i })).toBeChecked();
        });
    });

    describe('given the form is empty', () => {
        it('should disable the submit button until all required fields are filled', () => {
            renderForm();

            // Reader is auto-selected (only 1), but format/length/style/language/question are all empty
            expect(screen.getByRole('button', { name: /light the lantern/i })).toBeDisabled();
        });
    });

    describe('given a suggestion chip is clicked', () => {
        it('should populate the question textarea', async () => {
            renderForm();
            const textarea = screen.getByRole('textbox', { name: /story question/i });

            await userEvent.click(screen.getByText('Why is the sky blue?'));

            expect(textarea).toHaveValue('Why is the sky blue?');
        });
    });

    describe('given a failed-story retry pre-fills the flavour knobs', () => {
        it('should pre-select the provided genre and writing style', () => {
            renderForm({ initialGenre: 'ADVENTURE', initialWritingStyle: 'IMAGINATIVE' });

            const genreGroup = screen.getByRole('radiogroup', { name: /story genre/i });
            expect(within(genreGroup).getByRole('radio', { name: /adventure/i })).toBeChecked();
            const styleGroup = screen.getByRole('radiogroup', { name: /writing style/i });
            expect(within(styleGroup).getByRole('radio', { name: /imaginative/i })).toBeChecked();
        });
    });

    describe('given all required fields are filled', () => {
        async function fillAndClick(
            buttonName: RegExp,
            beforeSubmit?: () => Promise<void>,
        ): Promise<void> {
            renderForm({ initialQuestion: 'Why is the sky blue?' });

            // Format — RadioCard accessible name = title + description; use ^Book to anchor the match
            const formatGroup = screen.getByRole('radiogroup', { name: /story format/i });
            await userEvent.click(within(formatGroup).getByRole('radio', { name: /^Book/i }));

            // Length — "Short · 5 pp" is unique in the page count group
            const lengthGroup = screen.getByRole('radiogroup', { name: /page count/i });
            await userEvent.click(within(lengthGroup).getByRole('radio', { name: /short/i }));

            // Art style — accessible name is the art style name (alt text)
            const artGroup = screen.getByRole('radiogroup', { name: /art style/i });
            await userEvent.click(within(artGroup).getByRole('radio', { name: /storybook/i }));

            // Language — scope to the "Story language" radiogroup
            const langGroup = screen.getByRole('radiogroup', { name: /story language/i });
            await userEvent.click(within(langGroup).getByRole('radio', { name: /^English/i }));

            // Optional flavour knobs, selected by individual tests before submit.
            if (beforeSubmit) await beforeSubmit();

            await userEvent.click(screen.getByRole('button', { name: buttonName }));
        }

        async function fillAndSubmit(beforeSubmit?: () => Promise<void>): Promise<void> {
            await fillAndClick(/light the lantern/i, beforeSubmit);
        }

        it('should call storiesApi.create with the correct payload', async () => {
            mockStoriesCreate.mockResolvedValue({ id: 'story-new' });

            await fillAndSubmit();

            await waitFor(() => {
                expect(mockStoriesCreate).toHaveBeenCalledWith(
                    expect.objectContaining({
                        childId: 'child-1',
                        type: 'BOOK',
                        question: 'Why is the sky blue?',
                        pageCount: 5,
                        artStyleId: 'style-1',
                        language: 'EN',
                    }),
                );
            });
        });

        it('should include the chosen genre and writing style in the payload', async () => {
            mockStoriesCreate.mockResolvedValue({ id: 'story-new' });

            await fillAndSubmit(async () => {
                const genreGroup = screen.getByRole('radiogroup', { name: /story genre/i });
                await userEvent.click(
                    within(genreGroup).getByRole('radio', { name: /fairy tale/i }),
                );
                const styleGroup = screen.getByRole('radiogroup', { name: /writing style/i });
                await userEvent.click(within(styleGroup).getByRole('radio', { name: /poetic/i }));
            });

            await waitFor(() => {
                expect(mockStoriesCreate).toHaveBeenCalledWith(
                    expect.objectContaining({ genre: 'FAIRY_TALE', writingStyle: 'POETIC' }),
                );
            });
        });

        it('should redirect to /workshop/[storyId] after successful submission', async () => {
            mockStoriesCreate.mockResolvedValue({ id: 'story-new' });

            await fillAndSubmit();

            await waitFor(() => {
                expect(mockStoriesGenerate).toHaveBeenCalledWith('story-new');
                expect(mockRouterPush).toHaveBeenCalledWith('/workshop/story-new');
            });
        });

        it('should save a draft without starting generation', async () => {
            mockStoriesCreate.mockResolvedValue({ id: 'story-draft' });

            await fillAndClick(/save as draft/i);

            await waitFor(() => {
                expect(mockStoriesCreate).toHaveBeenCalledWith(
                    expect.objectContaining({
                        childId: 'child-1',
                        type: 'BOOK',
                        question: 'Why is the sky blue?',
                        pageCount: 5,
                        artStyleId: 'style-1',
                        language: 'EN',
                    }),
                );
                expect(mockStoriesGenerate).not.toHaveBeenCalled();
                expect(mockStoriesRetry).not.toHaveBeenCalled();
                expect(mockRouterPush).toHaveBeenCalledWith('/library');
            });
        });

        it('should retry the existing failed story instead of creating a new one', async () => {
            renderForm({
                initialStoryId: 'story-failed',
                initialQuestion: 'Why is the sky blue?',
            });

            const formatGroup = screen.getByRole('radiogroup', { name: /story format/i });
            await userEvent.click(within(formatGroup).getByRole('radio', { name: /^Book/i }));

            const lengthGroup = screen.getByRole('radiogroup', { name: /page count/i });
            await userEvent.click(within(lengthGroup).getByRole('radio', { name: /short/i }));

            const artGroup = screen.getByRole('radiogroup', { name: /art style/i });
            await userEvent.click(within(artGroup).getByRole('radio', { name: /storybook/i }));

            const langGroup = screen.getByRole('radiogroup', { name: /story language/i });
            await userEvent.click(within(langGroup).getByRole('radio', { name: /^English/i }));

            await userEvent.click(screen.getByRole('button', { name: /light the lantern/i }));

            await waitFor(() => {
                expect(mockStoriesCreate).not.toHaveBeenCalled();
                expect(mockStoriesGenerate).not.toHaveBeenCalled();
                expect(mockStoriesRetry).toHaveBeenCalledWith(
                    'story-failed',
                    expect.objectContaining({
                        childId: 'child-1',
                        type: 'BOOK',
                        question: 'Why is the sky blue?',
                        pageCount: 5,
                        artStyleId: 'style-1',
                        language: 'EN',
                    }),
                );
                expect(mockRouterPush).toHaveBeenCalledWith('/workshop/story-retry');
            });
        });

        it('should show an error message when the API call fails', async () => {
            mockStoriesCreate.mockRejectedValue(new Error('Network error'));

            await fillAndSubmit();

            await waitFor(() => {
                expect(screen.getByText(/could not start generation/i)).toBeInTheDocument();
            });
        });
    });
});
