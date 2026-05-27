import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import Input from '../Input';

function renderInput(props: React.ComponentProps<typeof Input> = {}): ReturnType<typeof render> {
    return render(
        <MantineProvider>
            <Input {...props} />
        </MantineProvider>,
    );
}

describe('Input', () => {
    describe('given no props', () => {
        it('should render a text input', () => {
            renderInput();
            expect(screen.getByRole('textbox')).toBeInTheDocument();
        });
    });

    describe('given a label', () => {
        it('should render an accessible label', () => {
            renderInput({ label: 'Child name' });
            expect(screen.getByRole('textbox', { name: 'Child name' })).toBeInTheDocument();
        });
    });

    describe('given a description', () => {
        it('should display the helper text', () => {
            renderInput({ description: 'Used on the cover page' });
            expect(screen.getByText('Used on the cover page')).toBeInTheDocument();
        });
    });

    describe('given an error', () => {
        it('should display the error message', () => {
            renderInput({ error: 'Name is required' });
            expect(screen.getByText('Name is required')).toBeInTheDocument();
        });
    });

    describe('given disabled', () => {
        it('should render a disabled input', () => {
            renderInput({ disabled: true });
            expect(screen.getByRole('textbox')).toBeDisabled();
        });
    });
});
