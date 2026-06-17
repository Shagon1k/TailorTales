import { render, screen, within } from '@testing-library/react';
import RatingsTable, { type IRatingsTableProps } from '../RatingsTable';
import type { IAdminStoryRating } from '@/types/admin.types';

const RATING_A: IAdminStoryRating = {
    id: 'r1',
    storyId: 's1',
    userId: 'u1',
    score: 5,
    comment: 'Wonderful story!',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    story: { id: 's1', title: 'The Fox Tale', question: 'Why do foxes run?', isPublic: true },
    user: { id: 'u1', name: 'Alice', email: 'alice@example.com' },
};

const RATING_B: IAdminStoryRating = {
    ...RATING_A,
    id: 'r2',
    storyId: 's2',
    userId: 'u2',
    score: 3,
    comment: null,
    story: { id: 's2', title: null, question: 'What is courage?', isPublic: false },
    user: { id: 'u2', name: 'Bob', email: 'bob@example.com' },
};

const defaults: IRatingsTableProps = { ratings: [RATING_A, RATING_B] };

function renderTable(props: Partial<IRatingsTableProps> = {}): void {
    render(<RatingsTable {...defaults} {...props} />);
}

function rowFor(name: string): HTMLElement {
    return screen.getByText(name).closest('tr') as HTMLElement;
}

describe('RatingsTable', () => {
    it('should render user name and email', () => {
        renderTable();

        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    it('should render story title and question', () => {
        renderTable();

        expect(screen.getByText('The Fox Tale')).toBeInTheDocument();
        expect(screen.getByText('Why do foxes run?')).toBeInTheDocument();
    });

    it('should show (untitled) when story has no title', () => {
        renderTable();

        expect(within(rowFor('Bob')).getByText('(untitled)')).toBeInTheDocument();
    });

    it('should render score as accessible star label', () => {
        renderTable();

        expect(screen.getByLabelText('5 out of 5')).toBeInTheDocument();
        expect(screen.getByLabelText('3 out of 5')).toBeInTheDocument();
    });

    it('should render comment text when present', () => {
        renderTable();

        expect(screen.getByText('Wonderful story!')).toBeInTheDocument();
    });

    it('should render em-dash when comment is absent', () => {
        renderTable();

        expect(within(rowFor('Bob')).getByText('—')).toBeInTheDocument();
    });
});
