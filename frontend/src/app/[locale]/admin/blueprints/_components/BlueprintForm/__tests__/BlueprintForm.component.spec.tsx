import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { NextIntlClientProvider } from 'next-intl';
import BlueprintForm from '../BlueprintForm';
import messages from '@/i18n/locales/en.json';

const mockPush = vi.hoisted(() => vi.fn());
const mockRefresh = vi.hoisted(() => vi.fn());
const mockRemove = vi.hoisted(() => vi.fn());

vi.mock('@/i18n/navigation', () => ({
    useRouter: vi.fn().mockReturnValue({
        push: mockPush,
        refresh: mockRefresh,
    }),
}));

vi.mock('@/api/story-blueprints', () => ({
    storyBlueprintsApi: {
        create: vi.fn(),
        update: vi.fn(),
        remove: mockRemove,
    },
}));

vi.mock('@/components/ui/Modal/Modal', () => ({
    default: ({
        opened,
        title,
        children,
    }: {
        opened: boolean;
        title: React.ReactNode;
        children: React.ReactNode;
    }) =>
        opened ? (
            <div>
                <h2>{title}</h2>
                {children}
            </div>
        ) : null,
}));

const BLUEPRINT = {
    id: 'bp-1',
    name: 'Ocean explainer',
    description: 'Teaches a science topic through a story.',
    type: 'BOOK' as const,
    createdById: 'user-1',
    coverImageUrl: null,
    previewPageUrls: [],
    systemPrompt: 'You are a kind educational storyteller.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
};

function renderForm(): void {
    render(
        <NextIntlClientProvider locale="en" messages={messages}>
            <MantineProvider>
                <BlueprintForm blueprint={BLUEPRINT} />
            </MantineProvider>
        </NextIntlClientProvider>,
    );
}

describe('BlueprintForm', () => {
    beforeEach(() => {
        mockPush.mockClear();
        mockRefresh.mockClear();
        mockRemove.mockReset();
        mockRemove.mockResolvedValue(undefined);
    });

    it('should open a confirmation modal before deleting a blueprint', async () => {
        renderForm();

        await userEvent.click(screen.getByRole('button', { name: /delete blueprint/i }));

        expect(screen.getByRole('heading', { name: /delete blueprint/i })).toBeInTheDocument();
        expect(screen.getByText(/ocean explainer/i)).toBeInTheDocument();
    });

    it('should delete only after the modal confirmation', async () => {
        renderForm();

        await userEvent.click(screen.getByRole('button', { name: /delete blueprint/i }));
        await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));

        await waitFor(() => {
            expect(mockRemove).toHaveBeenCalledWith('bp-1');
        });
        expect(mockPush).toHaveBeenCalledWith('/admin/blueprints');
        expect(mockRefresh).toHaveBeenCalled();
    });
});
