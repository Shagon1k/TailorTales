import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IChild } from '@/types/child.types';
import type { IArtStyle } from '@/types/art-style.types';
import type { IStoryConfig } from '@/types/story.types';
import WorkshopForm from '../WorkshopForm';

const mockRouterPush = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
    useRouter: vi.fn().mockReturnValue({ push: mockRouterPush }),
}));

vi.mock('@/hooks/subscription', () => ({
    useSubscription: () => ({ data: undefined }),
}));

const mockStoriesCreate = vi.hoisted(() => vi.fn());
const mockStoriesGenerate = vi.hoisted(() => vi.fn());

vi.mock('@/api/stories', () => ({
    storiesApi: { create: mockStoriesCreate, generate: mockStoriesGenerate },
}));

// WorkshopForm uses useCharacters/useCreateCharacter/useUpdateCharacter — mock the entire module
// so tests focus on WorkshopForm behaviour and don't need a real API.
vi.mock('@/hooks/characters', () => ({
    useCharacters: vi.fn().mockReturnValue({ data: [] }),
    useCreateCharacter: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
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
        mockStoriesGenerate.mockResolvedValue({ jobId: 'job-1', storyId: 'story-new' });
    });

    describe('given the form is rendered', () => {
        it('should display all five section headings', () => {
            renderForm();

            expect(screen.getByText(/a question to begin with/i)).toBeInTheDocument();
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

        it('should render suggestion chips from config', () => {
            renderForm();

            expect(screen.getByText('Why is the sky blue?')).toBeInTheDocument();
            expect(screen.getByText('How do bees find flowers?')).toBeInTheDocument();
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

    describe('given all required fields are filled', () => {
        async function fillAndSubmit(): Promise<void> {
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

            // Submit
            await userEvent.click(screen.getByRole('button', { name: /light the lantern/i }));
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

        it('should redirect to /workshop/[storyId] after successful submission', async () => {
            mockStoriesCreate.mockResolvedValue({ id: 'story-new' });

            await fillAndSubmit();

            await waitFor(() => {
                expect(mockStoriesGenerate).toHaveBeenCalledWith('story-new');
                expect(mockRouterPush).toHaveBeenCalledWith('/workshop/story-new');
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
