import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ICharacter } from '@/types/character.types';
import CharacterSelector from '../CharacterSelector';

const CHARACTER: ICharacter = {
    id: 'char-1',
    userId: 'user-1',
    childId: null,
    source: 'IMAGINED',
    name: 'Captain Pip',
    description: 'A brave little fox.',
    previewKey: null,
    previewUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('CharacterSelector', () => {
    describe('given a list of characters', () => {
        it('should render a "no character" option followed by each character', () => {
            render(<CharacterSelector items={[CHARACTER]} selectedId={null} onSelect={vi.fn()} />);

            expect(screen.getByRole('button', { name: /no character/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Captain Pip' })).toBeInTheDocument();
        });

        it('should mark the "no character" option pressed when nothing is selected', () => {
            render(<CharacterSelector items={[CHARACTER]} selectedId={null} onSelect={vi.fn()} />);

            expect(screen.getByRole('button', { name: /no character/i })).toHaveAttribute(
                'aria-pressed',
                'true',
            );
        });
    });

    describe('given the user picks an option', () => {
        it('should call onSelect with the character id', async () => {
            const onSelect = vi.fn();
            render(<CharacterSelector items={[CHARACTER]} selectedId={null} onSelect={onSelect} />);

            await userEvent.click(screen.getByRole('button', { name: 'Captain Pip' }));

            expect(onSelect).toHaveBeenCalledWith('char-1');
        });

        it('should call onSelect with null when "no character" is picked', async () => {
            const onSelect = vi.fn();
            render(
                <CharacterSelector items={[CHARACTER]} selectedId="char-1" onSelect={onSelect} />,
            );

            await userEvent.click(screen.getByRole('button', { name: /no character/i }));

            expect(onSelect).toHaveBeenCalledWith(null);
        });
    });
});
