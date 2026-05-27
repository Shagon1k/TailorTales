import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import Select from '../Select';

const OPTIONS = [
    { value: 'book', label: 'Book' },
    { value: 'comic', label: 'Comic' },
];

function renderSelect(props: React.ComponentProps<typeof Select> = {}): ReturnType<typeof render> {
    return render(
        <MantineProvider>
            <Select data={OPTIONS} {...props} />
        </MantineProvider>,
    );
}

describe('Select', () => {
    describe('given no props', () => {
        it('should render a combobox', () => {
            renderSelect();
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });
    });

    describe('given a label', () => {
        it('should render an accessible label', () => {
            renderSelect({ label: 'Format' });
            expect(screen.getByRole('combobox', { name: 'Format' })).toBeInTheDocument();
        });
    });

    describe('given a description', () => {
        it('should display the helper text', () => {
            renderSelect({ description: 'Choose the story format' });
            expect(screen.getByText('Choose the story format')).toBeInTheDocument();
        });
    });

    describe('given an error', () => {
        it('should display the error message', () => {
            renderSelect({ error: 'Format is required' });
            expect(screen.getByText('Format is required')).toBeInTheDocument();
        });
    });

    describe('given disabled', () => {
        it('should render a disabled combobox', () => {
            renderSelect({ disabled: true });
            expect(screen.getByRole('combobox')).toBeDisabled();
        });
    });
});
