import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import type React from 'react';
import CharacterForm from '../CharacterForm';

vi.mock('@/components/ui/Textarea/Textarea', () => ({
    default: ({
        label,
        ...props
    }: {
        label?: string;
        name?: string;
        value?: string;
        onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
    }) => (
        <label>
            {label}
            <textarea {...props} />
        </label>
    ),
}));

function renderForm(): void {
    render(
        <MantineProvider>
            <CharacterForm onSubmit={vi.fn()} onCancel={vi.fn()} />
        </MantineProvider>,
    );
}

describe('CharacterForm', () => {
    it('should render only the two remaining creation modes', () => {
        renderForm();

        expect(
            screen.getByRole('tablist', { name: /how to create the character/i }),
        ).toBeInTheDocument();
        expect(screen.getByText('Write it')).toBeInTheDocument();
        expect(screen.getByText('Guided')).toBeInTheDocument();
        expect(screen.queryByText(/prompt/i)).toBeNull();
    });

    it('should keep the disabled photo option in write mode only', async () => {
        renderForm();

        expect(screen.getByRole('button', { name: 'Use a photo' })).toBeDisabled();

        await userEvent.click(screen.getByRole('tab', { name: 'Guided' }));

        expect(screen.queryByRole('button', { name: 'Use a photo' })).not.toBeInTheDocument();
    });
});
