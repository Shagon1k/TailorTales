import { render, screen } from '@testing-library/react';
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
            <CharacterForm onSubmit={vi.fn()} onCancel={vi.fn()} onGenerateFromPrompt={vi.fn()} />
        </MantineProvider>,
    );
}

describe('CharacterForm', () => {
    describe('given prompt generation is available', () => {
        it('should render a creation-mode combobox instead of clipped action buttons', () => {
            renderForm();

            expect(
                screen.getByRole('combobox', { name: /how to create the character/i }),
            ).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /generate from a prompt/i })).toBeNull();
        });
    });
});
