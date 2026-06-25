import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import type { IUsageSummary } from '@/types/subscription.types';
import WorkshopSummary, { type IWorkshopSummaryProps } from '../WorkshopSummary';

const mockUseSubscription = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/subscription', () => ({
    useSubscription: mockUseSubscription,
}));

function makeSubscription(overrides: Partial<IUsageSummary> = {}): IUsageSummary {
    return {
        tier: {
            id: 'tier-free',
            name: 'Free Chapter',
            priceMonthly: 0,
            watermark: true,
            pagesPerMonth: 12,
            regenerationsPerMonth: 3,
            childrenLimit: 1,
            retentionDays: 30,
        },
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        pagesUsed: 0,
        regenerationsUsed: 0,
        childrenUsed: 1,
        talesCount: 2,
        ...overrides,
    };
}

function renderSummary(props: Partial<IWorkshopSummaryProps> = {}): void {
    const defaults: IWorkshopSummaryProps = {
        child: null,
        character: null,
        storyType: 'BOOK',
        pageCount: '8',
        artStyle: null,
        language: 'EN',
        question: 'Why is the sky blue?',
        isValid: true,
        isPending: false,
        onSubmit: vi.fn(),
    };
    render(
        <MantineProvider>
            <WorkshopSummary {...defaults} {...props} />
        </MantineProvider>,
    );
}

describe('WorkshopSummary', () => {
    beforeEach(() => {
        mockUseSubscription.mockReturnValue({ data: makeSubscription() });
    });

    it('should show the credit cost and the real remaining balance', () => {
        renderSummary({ pageCount: '8' });

        expect(screen.getByText('8 credits')).toBeInTheDocument();
        expect(screen.getByText(/· 12 remaining/)).toBeInTheDocument();
        expect(
            screen.getByText('8 pages will use 8 of your 12 remaining credits this cycle.'),
        ).toBeInTheDocument();
    });

    it('should subtract already-used pages from the remaining balance', () => {
        mockUseSubscription.mockReturnValue({ data: makeSubscription({ pagesUsed: 5 }) });

        renderSummary({ pageCount: '5' });

        expect(screen.getByText(/· 7 remaining/)).toBeInTheDocument();
    });

    it('should disable submission and warn when the tale exceeds the remaining credits', () => {
        mockUseSubscription.mockReturnValue({ data: makeSubscription({ pagesUsed: 8 }) });

        renderSummary({ pageCount: '12' });

        expect(screen.getByRole('button', { name: /light the lantern/i })).toBeDisabled();
        expect(screen.getByText(/only 4 remain this cycle/i)).toBeInTheDocument();
    });

    it('should fall back to placeholders while the subscription is loading', () => {
        mockUseSubscription.mockReturnValue({ data: undefined });

        renderSummary({ pageCount: '8' });

        expect(screen.getByText(/· -- remaining/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /light the lantern/i })).toBeEnabled();
    });
});
