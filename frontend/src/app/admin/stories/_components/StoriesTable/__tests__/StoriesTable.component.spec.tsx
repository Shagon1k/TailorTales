import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import StoriesTable, { type IStoriesTableProps } from '../StoriesTable';
import type { IAdminStorySummary } from '@/types/admin.types';

const OWNER = { id: 'owner-1', name: 'Alice Smith', email: 'alice@example.com' };

const COMPLETED_STORY: IAdminStorySummary = {
    id: 'story-1',
    title: 'The Fox Adventure',
    question: 'Tell me a story about a fox',
    type: 'BOOK',
    status: 'COMPLETED',
    isPublic: true,
    pageCount: 8,
    createdAt: '2026-01-15T00:00:00Z',
    coverImageUrl: null,
    owner: OWNER,
    childName: 'Tom',
    artStyleName: 'Watercolor',
};

const DRAFT_STORY: IAdminStorySummary = {
    ...COMPLETED_STORY,
    id: 'story-2',
    title: null,
    status: 'DRAFT',
    pageCount: 0,
};

function renderTable(props: Partial<IStoriesTableProps> = {}): void {
    render(
        <MantineProvider env="test">
            <StoriesTable
                stories={[COMPLETED_STORY, DRAFT_STORY]}
                onDelete={vi.fn()}
                isMutating={false}
                {...props}
            />
        </MantineProvider>,
    );
}

function rowFor(text: string): HTMLElement {
    return screen.getByText(text).closest('tr') as HTMLElement;
}

describe('StoriesTable', () => {
    it('should render the story title when available', () => {
        renderTable();

        expect(screen.getByText('The Fox Adventure')).toBeInTheDocument();
    });

    it('should fall back to the question when title is null', () => {
        renderTable();

        expect(screen.getByText('Tell me a story about a fox')).toBeInTheDocument();
    });

    it('should call onDelete with the story when the delete button is clicked', async () => {
        const onDelete = vi.fn();
        renderTable({ stories: [COMPLETED_STORY], onDelete });

        await userEvent.click(
            within(rowFor('The Fox Adventure')).getByRole('button', { name: 'Delete' }),
        );

        expect(onDelete).toHaveBeenCalledWith(COMPLETED_STORY);
    });

    it('should disable the delete button while mutating', () => {
        renderTable({ stories: [COMPLETED_STORY], isMutating: true });

        expect(
            within(rowFor('The Fox Adventure')).getByRole('button', { name: 'Delete' }),
        ).toBeDisabled();
    });
});
