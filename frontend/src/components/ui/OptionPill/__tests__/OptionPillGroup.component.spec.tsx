import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OptionPill from '../OptionPill';
import OptionPillGroup from '../OptionPillGroup';

function renderGroup(
    value: string | null,
    onChange = vi.fn(),
    disabled = false,
): ReturnType<typeof render> {
    return render(
        <OptionPillGroup value={value} onChange={onChange} label="Story length" disabled={disabled}>
            <OptionPill value="short">Short · 5 pp</OptionPill>
            <OptionPill value="medium">Medium · 8 pp</OptionPill>
            <OptionPill value="long">Long · 12 pp</OptionPill>
        </OptionPillGroup>,
    );
}

describe('OptionPillGroup', () => {
    describe('given no selection', () => {
        it('should render a radiogroup', () => {
            renderGroup(null);
            expect(screen.getByRole('radiogroup', { name: 'Story length' })).toBeInTheDocument();
        });

        it('should render all options unchecked', () => {
            renderGroup(null);
            const radios = screen.getAllByRole('radio');
            expect(radios).toHaveLength(3);
            radios.forEach((radio) => expect(radio).not.toBeChecked());
        });
    });

    describe('given a value', () => {
        it('should mark the matching option as checked', () => {
            renderGroup('long');
            expect(screen.getByRole('radio', { name: 'Long · 12 pp' })).toBeChecked();
        });

        it('should leave other options unchecked', () => {
            renderGroup('long');
            expect(screen.getByRole('radio', { name: 'Short · 5 pp' })).not.toBeChecked();
            expect(screen.getByRole('radio', { name: 'Medium · 8 pp' })).not.toBeChecked();
        });
    });

    describe('given an option is clicked', () => {
        it('should call onChange with the selected value', async () => {
            const onChange = vi.fn();
            renderGroup(null, onChange);
            await userEvent.click(screen.getByRole('radio', { name: 'Short · 5 pp' }));
            expect(onChange).toHaveBeenCalledWith('short');
        });
    });

    describe('given disabled', () => {
        it('should disable all options', () => {
            renderGroup(null, vi.fn(), true);
            screen.getAllByRole('radio').forEach((radio) => expect(radio).toBeDisabled());
        });
    });
});
