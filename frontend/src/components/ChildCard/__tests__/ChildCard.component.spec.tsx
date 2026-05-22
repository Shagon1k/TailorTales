import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import ChildCard from '../ChildCard';
import type { IChild } from '@/types/child.types';

const MOCK_CHILD: IChild = {
    id: 'child-1',
    userId: 'user-123',
    name: 'Max',
    birthdate: new Date(Date.now() - 4 * 365.25 * 24 * 60 * 60 * 1000).toISOString(),
    gender: 'MALE',
    interests: ['dinosaurs', 'space'],
    avatarUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

function renderCard(
    overrides: Partial<IChild> = {},
    onEdit = vi.fn(),
    onDelete = vi.fn(),
): ReturnType<typeof render> {
    return render(
        <MantineProvider>
            <ChildCard
                child={{ ...MOCK_CHILD, ...overrides }}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        </MantineProvider>,
    );
}

describe('ChildCard', () => {
    it('should render the child name', () => {
        renderCard();
        expect(screen.getByText('Max')).toBeInTheDocument();
    });

    it('should render the age computed from birthdate', () => {
        renderCard();
        expect(screen.getByText(/4 years old/i)).toBeInTheDocument();
    });

    it('should render "Boy" for MALE gender', () => {
        renderCard({ gender: 'MALE' });
        expect(screen.getByText(/boy/i)).toBeInTheDocument();
    });

    it('should render "Girl" for FEMALE gender', () => {
        renderCard({ gender: 'FEMALE' });
        expect(screen.getByText(/girl/i)).toBeInTheDocument();
    });

    it('should render interests as badges', () => {
        renderCard();
        expect(screen.getByText('dinosaurs')).toBeInTheDocument();
        expect(screen.getByText('space')).toBeInTheDocument();
    });

    it('should not render interests section when interests are empty', () => {
        renderCard({ interests: [] });
        expect(screen.queryByText('dinosaurs')).not.toBeInTheDocument();
    });

    it('should call onEdit with the child when Edit is clicked', async () => {
        const onEdit = vi.fn();
        renderCard({}, onEdit);

        await userEvent.click(screen.getByRole('button', { name: /edit/i }));

        expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'child-1' }));
    });

    it('should call onDelete with the child when Delete is clicked', async () => {
        const onDelete = vi.fn();
        renderCard({}, vi.fn(), onDelete);

        await userEvent.click(screen.getByRole('button', { name: /delete/i }));

        expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'child-1' }));
    });
});
