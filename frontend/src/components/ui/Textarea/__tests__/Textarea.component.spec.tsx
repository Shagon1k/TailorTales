import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import Textarea from '../Textarea';

function renderTextarea(props: React.ComponentProps<typeof Textarea> = {}): ReturnType<typeof render> {
    return render(
        <MantineProvider>
            <Textarea {...props} />
        </MantineProvider>,
    );
}

describe('Textarea', () => {
    describe('given no props', () => {
        it('should render a textbox', () => {
            renderTextarea();
            expect(screen.getByRole('textbox')).toBeInTheDocument();
        });
    });

    describe('given a label', () => {
        it('should render an accessible label', () => {
            renderTextarea({ label: 'Your story idea' });
            expect(screen.getByRole('textbox', { name: 'Your story idea' })).toBeInTheDocument();
        });
    });

    describe('given a description', () => {
        it('should display the helper text', () => {
            renderTextarea({ description: 'Keep it short and sweet' });
            expect(screen.getByText('Keep it short and sweet')).toBeInTheDocument();
        });
    });

    describe('given an error', () => {
        it('should display the error message', () => {
            renderTextarea({ error: 'Story idea is required' });
            expect(screen.getByText('Story idea is required')).toBeInTheDocument();
        });
    });

    describe('given disabled', () => {
        it('should render a disabled textbox', () => {
            renderTextarea({ disabled: true });
            expect(screen.getByRole('textbox')).toBeDisabled();
        });
    });
});
