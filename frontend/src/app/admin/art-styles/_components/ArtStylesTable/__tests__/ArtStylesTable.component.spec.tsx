import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import ArtStylesTable, { type IArtStylesTableProps } from '../ArtStylesTable';
import type { IArtStyle } from '@/types/art-style.types';

const STYLE_A: IArtStyle = {
    id: 'a',
    name: 'Watercolor',
    slug: 'watercolor',
    thumbnailUrl: null,
    promptPrefix: 'in a soft watercolor style',
    isActive: true,
    order: 0,
    createdAt: '2026-01-01T00:00:00Z',
};

const STYLE_B: IArtStyle = {
    ...STYLE_A,
    id: 'b',
    name: 'Oil Paint',
    slug: 'oil-paint',
    isActive: false,
    order: 1,
};

const defaults: IArtStylesTableProps = {
    artStyles: [STYLE_A, STYLE_B],
    onEdit: vi.fn(),
    onToggleActive: vi.fn(),
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    onGenerateThumbnail: vi.fn(),
    isMutating: false,
    updatingId: undefined,
    generatingId: undefined,
};

function renderTable(props: Partial<IArtStylesTableProps> = {}): void {
    render(
        <MantineProvider env="test">
            <ArtStylesTable {...defaults} {...props} />
        </MantineProvider>,
    );
}

function rowFor(name: string): HTMLElement {
    return screen.getByText(name).closest('tr') as HTMLElement;
}

describe('ArtStylesTable', () => {
    it('should call onEdit when the Edit button is clicked', async () => {
        const onEdit = vi.fn();
        renderTable({ onEdit });

        await userEvent.click(within(rowFor('Watercolor')).getByRole('button', { name: 'Edit' }));

        expect(onEdit).toHaveBeenCalledWith(STYLE_A);
    });

    it('should call onToggleActive when the switch is toggled', async () => {
        const onToggleActive = vi.fn();
        renderTable({ onToggleActive });

        await userEvent.click(within(rowFor('Watercolor')).getByRole('switch', { name: 'Active' }));

        expect(onToggleActive).toHaveBeenCalledWith(STYLE_A);
    });

    it('should disable Move up for the first item', () => {
        renderTable();

        expect(
            within(rowFor('Watercolor')).getByRole('button', { name: /move watercolor up/i }),
        ).toBeDisabled();
    });

    it('should disable Move down for the last item', () => {
        renderTable();

        expect(
            within(rowFor('Oil Paint')).getByRole('button', { name: /move oil paint down/i }),
        ).toBeDisabled();
    });

    it('should call onGenerateThumbnail when the generate button is clicked', async () => {
        const onGenerateThumbnail = vi.fn();
        renderTable({ onGenerateThumbnail });

        await userEvent.click(
            within(rowFor('Watercolor')).getByRole('button', { name: 'Generate thumbnail' }),
        );

        expect(onGenerateThumbnail).toHaveBeenCalledWith(STYLE_A);
    });

    it('should show Regenerate label when a thumbnail exists', () => {
        renderTable({
            artStyles: [{ ...STYLE_A, thumbnailUrl: 'https://example.com/thumb.jpg' }, STYLE_B],
        });

        expect(
            within(rowFor('Watercolor')).getByRole('button', { name: 'Regenerate' }),
        ).toBeInTheDocument();
    });
});
