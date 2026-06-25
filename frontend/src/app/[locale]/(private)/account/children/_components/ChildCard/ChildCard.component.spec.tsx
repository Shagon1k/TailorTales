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
    source: 'IMAGINED',
    name: 'Princess Mia',
    description: 'A girl with curly red hair and blue overalls.',
    previewKey: null,
    previewUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

function renderCard(
    overrides: Partial<IChild> = {},
    characters: ICharacter[] = [],
    handlers: {
        onEdit?: () => void;
        onDelete?: () => void;
        onCharacterAdd?: () => void;
        onCharacterEdit?: (child: IChild, character: ICharacter) => void;
        onCharacterDelete?: (character: ICharacter) => void;
    } = {},
): ReturnType<typeof render> {
    return render(
        <MantineProvider>
            <ChildCard
                child={{ ...MOCK_CHILD, ...overrides }}
                characters={characters}
                onEdit={handlers.onEdit ?? vi.fn()}
                onDelete={handlers.onDelete ?? vi.fn()}
                onCharacterAdd={handlers.onCharacterAdd ?? vi.fn()}
                onCharacterEdit={handlers.onCharacterEdit ?? vi.fn()}
                onCharacterDelete={handlers.onCharacterDelete ?? vi.fn()}
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
        renderCard({}, [], { onEdit });

        await userEvent.click(screen.getByRole('button', { name: `Edit ${MOCK_CHILD.name}` }));

        expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'child-1' }));
    });

    it('should call onDelete with the child when Delete is clicked', async () => {
        const onDelete = vi.fn();
        renderCard({}, [], { onDelete });

        await userEvent.click(screen.getByRole('button', { name: `Delete ${MOCK_CHILD.name}` }));

        expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'child-1' }));
    });

    describe('given the child has no characters', () => {
        it('should render the empty placeholder', () => {
            renderCard();
            expect(screen.getByText('No characters yet.')).toBeInTheDocument();
        });

        it('should render the "Add character" button', () => {
            renderCard();
            expect(
                screen.getByRole('button', { name: `Add character for ${MOCK_CHILD.name}` }),
            ).toBeInTheDocument();
        });

        it('should call onCharacterAdd with the child when "Add character" is clicked', async () => {
            const onCharacterAdd = vi.fn();
            renderCard({}, [], { onCharacterAdd });

            await userEvent.click(
                screen.getByRole('button', { name: `Add character for ${MOCK_CHILD.name}` }),
            );

            expect(onCharacterAdd).toHaveBeenCalledWith(expect.objectContaining({ id: 'child-1' }));
        });
    });

    describe('given the child has characters', () => {
        const SECOND_CHARACTER: ICharacter = {
            ...MOCK_CHARACTER,
            id: 'char-2',
            name: 'Captain Pip',
            description: 'A brave little fox.',
        };

        it('should render every character', () => {
            renderCard({}, [MOCK_CHARACTER, SECOND_CHARACTER]);
            expect(screen.getByText('Princess Mia')).toBeInTheDocument();
            expect(screen.getByText('Captain Pip')).toBeInTheDocument();
        });

        it('should call onCharacterEdit with the child and character when Edit is clicked', async () => {
            const onCharacterEdit = vi.fn();
            renderCard({}, [MOCK_CHARACTER], { onCharacterEdit });

            await userEvent.click(
                screen.getByRole('button', { name: 'Edit character Princess Mia' }),
            );

            expect(onCharacterEdit).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'child-1' }),
                expect.objectContaining({ id: 'char-1' }),
            );
        });

        it('should call onCharacterDelete with the character when Delete is clicked', async () => {
            const onCharacterDelete = vi.fn();
            renderCard({}, [MOCK_CHARACTER], { onCharacterDelete });

            await userEvent.click(
                screen.getByRole('button', { name: 'Delete character Princess Mia' }),
            );

            expect(onCharacterDelete).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'char-1' }),
            );
        });
    });
});
