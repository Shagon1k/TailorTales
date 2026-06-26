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
            <CharacterForm onSubmit={vi.fn()} onCancel={vi.fn()} />
        </MantineProvider>,
    );
}

describe('CharacterForm', () => {
    it('should render only the two remaining creation modes', () => {
        renderForm();

        expect(
            screen.getByRole('combobox', { name: /how to create the character/i }),
        ).toBeInTheDocument();
        expect(screen.getByText('Write it')).toBeInTheDocument();
        expect(screen.getByText('Guided')).toBeInTheDocument();
        expect(screen.queryByText(/prompt/i)).toBeNull();
    });

    it('should show remaining generation and character-slot quota in create mode', () => {
        render(
            <MantineProvider>
                <CharacterForm
                    onSubmit={vi.fn()}
                    onCancel={vi.fn()}
                    quota={{ generationsLeft: 2, charactersLeft: 1 }}
                />
            </MantineProvider>,
        );

        expect(screen.getByText('2 generations left this cycle')).toBeInTheDocument();
        expect(screen.getByText('1 character slot left on this plan')).toBeInTheDocument();
    });
});
