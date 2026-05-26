import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import TagsInput from '../TagsInput';

function renderTagsInput(props: React.ComponentProps<typeof TagsInput> = {}): ReturnType<typeof render> {
    return render(
        <MantineProvider>
            <TagsInput {...props} />
        </MantineProvider>,
    );
}

describe('TagsInput', () => {
    describe('given no props', () => {
        it('should render a combobox', () => {
            renderTagsInput();
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });
    });

    describe('given a label', () => {
        it('should render an accessible label', () => {
            renderTagsInput({ label: 'Interests' });
            expect(screen.getByRole('combobox', { name: 'Interests' })).toBeInTheDocument();
        });
    });

    describe('given a description', () => {
        it('should display the helper text', () => {
            renderTagsInput({ description: 'Press Enter to add a tag' });
            expect(screen.getByText('Press Enter to add a tag')).toBeInTheDocument();
        });
    });

    describe('given an error', () => {
        it('should display the error message', () => {
            renderTagsInput({ error: 'At least one interest is required' });
            expect(screen.getByText('At least one interest is required')).toBeInTheDocument();
        });
    });

    describe('given disabled', () => {
        it('should render a disabled combobox', () => {
            renderTagsInput({ disabled: true });
            expect(screen.getByRole('combobox')).toBeDisabled();
        });
    });

    describe('given a default value', () => {
        it('should display existing tags', () => {
            renderTagsInput({ defaultValue: ['dragons', 'space'] });
            expect(screen.getByText('dragons')).toBeInTheDocument();
            expect(screen.getByText('space')).toBeInTheDocument();
        });
    });

    describe('given typing and pressing Enter', () => {
        it('should call onChange with the new tag list', async () => {
            const onChange = vi.fn();
            renderTagsInput({ onChange });
            await userEvent.type(screen.getByRole('combobox'), 'cats{Enter}');
            expect(onChange).toHaveBeenCalledWith(['cats']);
        });
    });
});
