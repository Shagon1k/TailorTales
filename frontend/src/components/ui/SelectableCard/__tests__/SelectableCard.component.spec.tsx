import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SelectableCard, { SelectableCardGroup } from '../SelectableCard';

describe('SelectableCard', () => {
    it('should render a radio button', () => {
        render(<SelectableCard ariaLabel="Book">Book</SelectableCard>);

        expect(screen.getByRole('radio', { name: /book/i })).toBeInTheDocument();
    });

    it('should be checked when selected', () => {
        render(
            <SelectableCard ariaLabel="Book" selected>
                Book
            </SelectableCard>,
        );

        expect(screen.getByRole('radio', { name: /book/i })).toBeChecked();
    });

    it('should call onSelect when clicked standalone', async () => {
        const onSelect = vi.fn();
        render(
            <SelectableCard ariaLabel="Book" onSelect={onSelect}>
                Book
            </SelectableCard>,
        );

        await userEvent.click(screen.getByRole('radio', { name: /book/i }));

        expect(onSelect).toHaveBeenCalledOnce();
    });

    it('should use group state and callback when nested in a group', async () => {
        const onChange = vi.fn();
        render(
            <SelectableCardGroup value="comic" onChange={onChange} label="Format">
                <SelectableCard value="book" ariaLabel="Book">
                    Book
                </SelectableCard>
                <SelectableCard value="comic" ariaLabel="Comic">
                    Comic
                </SelectableCard>
            </SelectableCardGroup>,
        );

        expect(screen.getByRole('radio', { name: /comic/i })).toBeChecked();

        await userEvent.click(screen.getByRole('radio', { name: /book/i }));

        expect(onChange).toHaveBeenCalledWith('book');
    });
});
