import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RadioCard from '../RadioCard';
import RadioCardGroup from '../RadioCardGroup';

function renderGroup(
    value: string | null,
    onChange = vi.fn(),
    disabled = false,
): ReturnType<typeof render> {
    return render(
        <RadioCardGroup value={value} onChange={onChange} label="Story format" disabled={disabled}>
            <RadioCard value="book" title="Book" description="One illustration per page" />
            <RadioCard value="comic" title="Comic" description="Panels and speech bubbles" />
        </RadioCardGroup>,
    );
}

describe('RadioCardGroup', () => {
    describe('given no selection', () => {
        it('should render a radiogroup', () => {
            renderGroup(null);
            expect(screen.getByRole('radiogroup', { name: 'Story format' })).toBeInTheDocument();
        });

        it('should render all cards unchecked', () => {
            renderGroup(null);
            const radios = screen.getAllByRole('radio');
            expect(radios).toHaveLength(2);
            radios.forEach((radio) => expect(radio).not.toBeChecked());
        });
    });

    describe('given a value', () => {
        it('should mark the matching card as checked', () => {
            renderGroup('book');
            expect(screen.getByRole('radio', { name: /book/i })).toBeChecked();
        });

        it('should leave other cards unchecked', () => {
            renderGroup('book');
            expect(screen.getByRole('radio', { name: /comic/i })).not.toBeChecked();
        });
    });

    describe('given a card is clicked', () => {
        it('should call onChange with the selected value', async () => {
            const onChange = vi.fn();
            renderGroup(null, onChange);
            await userEvent.click(screen.getByRole('radio', { name: /comic/i }));
            expect(onChange).toHaveBeenCalledWith('comic');
        });
    });

    describe('given disabled', () => {
        it('should disable all cards', () => {
            renderGroup(null, vi.fn(), true);
            screen.getAllByRole('radio').forEach((card) => expect(card).toBeDisabled());
        });
    });
});
