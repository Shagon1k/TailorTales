import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import ChildCard from './ChildCard';
import type { IChild } from '@/types/child.types';
import type { ICharacter } from '@/types/character.types';

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

const MOCK_CHARACTER: ICharacter = {
    id: 'char-1',
    userId: 'user-123',
    childId: 'child-1',
    source: 'FROM_CHILD',
    name: 'Princess Mia',
    description: 'A girl with curly red hair and blue overalls.',
    previewKey: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

function renderCard(
    overrides: Partial<IChild> = {},
    character: ICharacter | null = null,
    onEdit = vi.fn(),
    onDelete = vi.fn(),
    onCharacterEdit = vi.fn(),
): ReturnType<typeof render> {
    return render(
        <MantineProvider>
            <ChildCard
                child={{ ...MOCK_CHILD, ...overrides }}
                character={character}
                onEdit={onEdit}
                onDelete={onDelete}
                onCharacterEdit={onCharacterEdit}
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
        renderCard({}, null, onEdit);

        await userEvent.click(screen.getByRole('button', { name: `Edit ${MOCK_CHILD.name}` }));

        expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'child-1' }));
    });

    it('should call onDelete with the child when Delete is clicked', async () => {
        const onDelete = vi.fn();
        renderCard({}, null, vi.fn(), onDelete);

        await userEvent.click(screen.getByRole('button', { name: `Delete ${MOCK_CHILD.name}` }));

        expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'child-1' }));
    });

    describe('given no character is linked', () => {
        it('should render "No character yet." placeholder', () => {
            renderCard();
            expect(screen.getByText('No character yet.')).toBeInTheDocument();
        });

        it('should render "Add character" button', () => {
            renderCard();
            expect(
                screen.getByRole('button', { name: `Add character for ${MOCK_CHILD.name}` }),
            ).toBeInTheDocument();
        });
    });

    describe('given a character is linked', () => {
        it('should render the character name and description', () => {
            renderCard({}, MOCK_CHARACTER);
            expect(screen.getByText('Princess Mia')).toBeInTheDocument();
            expect(
                screen.getByText('A girl with curly red hair and blue overalls.'),
            ).toBeInTheDocument();
        });

        it('should render "Edit character" button', () => {
            renderCard({}, MOCK_CHARACTER);
            expect(
                screen.getByRole('button', { name: `Edit character for ${MOCK_CHILD.name}` }),
            ).toBeInTheDocument();
        });

        it('should call onCharacterEdit with the child when the character button is clicked', async () => {
            const onCharacterEdit = vi.fn();
            renderCard({}, MOCK_CHARACTER, vi.fn(), vi.fn(), onCharacterEdit);

            await userEvent.click(
                screen.getByRole('button', { name: `Edit character for ${MOCK_CHILD.name}` }),
            );

            expect(onCharacterEdit).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'child-1' }),
            );
        });
    });
});
