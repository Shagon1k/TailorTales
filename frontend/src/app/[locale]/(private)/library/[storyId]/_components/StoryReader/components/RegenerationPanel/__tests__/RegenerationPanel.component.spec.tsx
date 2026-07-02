import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import type { IPage } from '@/types/story.types';
import RegenerationPanel from '../RegenerationPanel';

const mockUseSubscription = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/subscription', () => ({
    useSubscription: mockUseSubscription,
}));

vi.mock('../components/RegenerationModal/RegenerationModal', () => ({
    default: () => null,
}));

const MOCK_PAGE: IPage = {
    id: 'page-1',
    storyId: 'story-1',
    order: 2,
    chapterTitle: null,
    text: 'Once upon a time…',
    illustrations: [],
    layout: 'book-text-image',
    illustrationPrompt: 'A fox under the moon',
};

function makeSubscriptionData(regenerationsUsed: number) {
    return {
        data: {
            tier: { regenerationsPerMonth: 3 },
            regenerationsUsed,
        },
    };
}

function renderPanel(): void {
    render(
        <MantineProvider>
            <RegenerationPanel storyId="story-1" page={MOCK_PAGE} />
        </MantineProvider>,
    );
}

describe('RegenerationPanel', () => {
    it('should show how many regenerations are left this month', () => {
        mockUseSubscription.mockReturnValue(makeSubscriptionData(1));

        renderPanel();

        expect(screen.getByLabelText(/regenerations left this cycle/i)).toHaveTextContent(
            '2 regenerations left this cycle',
        );
        expect(screen.getByRole('button', { name: /regenerate text/i })).toBeEnabled();
    });

    it('should disable all actions when the quota is exhausted', () => {
        mockUseSubscription.mockReturnValue(makeSubscriptionData(3));

        renderPanel();

        expect(screen.getByText(/no regenerations left this cycle/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /regenerate text/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /repaint illustration/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /remake everything/i })).toBeDisabled();
    });
});
