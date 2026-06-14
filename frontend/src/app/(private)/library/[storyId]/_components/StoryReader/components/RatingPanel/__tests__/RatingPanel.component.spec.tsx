import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import RatingPanel, { type IRatingPanelProps } from '../RatingPanel';

const mockRouterRefresh = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
    useRouter: vi.fn().mockReturnValue({ refresh: mockRouterRefresh }),
}));

const mockSubmitRating = vi.hoisted(() => vi.fn());

vi.mock('@/api/stories', () => ({
    storiesApi: { submitRating: mockSubmitRating },
}));

function renderPanel(props: Partial<IRatingPanelProps> = {}): void {
    const defaults: IRatingPanelProps = {
        storyId: 'story-1',
        childName: 'Maya',
        initialRating: null,
        initialIsPublic: false,
    };
    render(
        <MantineProvider>
            <RatingPanel {...defaults} {...props} />
        </MantineProvider>,
    );
}

describe('RatingPanel', () => {
    beforeEach(() => {
        mockSubmitRating.mockReset();
        mockRouterRefresh.mockReset();
        mockSubmitRating.mockResolvedValue({ score: 5, comment: null });
    });

    describe('when the story is unrated', () => {
        it('should disable the save button until a score is picked', () => {
            renderPanel();

            expect(screen.getByRole('button', { name: /save rating/i })).toBeDisabled();
        });
    });

    describe('given an existing rating', () => {
        it('should pre-fill the note and enable saving', () => {
            renderPanel({ initialRating: { score: 4, comment: 'Loved it' } });

            expect(screen.getByLabelText(/rating note/i)).toHaveValue('Loved it');
            expect(screen.getByRole('button', { name: /save rating/i })).toBeEnabled();
        });
    });

    describe('when saving a rating', () => {
        it('should submit the score and public toggle, then confirm', async () => {
            const user = userEvent.setup();
            renderPanel({ initialRating: { score: 3, comment: null } });

            await user.click(screen.getByLabelText(/share this story as an example/i));
            await user.click(screen.getByRole('button', { name: /save rating/i }));

            await waitFor(() =>
                expect(mockSubmitRating).toHaveBeenCalledWith('story-1', {
                    score: 3,
                    comment: undefined,
                    isPublic: true,
                }),
            );
            expect(mockRouterRefresh).toHaveBeenCalledTimes(1);
            expect(await screen.findByText(/saved — thank you/i)).toBeInTheDocument();
        });
    });
});
