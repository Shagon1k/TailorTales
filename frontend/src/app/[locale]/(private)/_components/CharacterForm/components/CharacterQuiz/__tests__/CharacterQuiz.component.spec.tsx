import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import CharacterQuiz from '../CharacterQuiz';

interface ISelectMockProps {
    label?: string;
    data: { value: string; label: string }[];
    value?: string | null;
    onChange?: (value: string | null) => void;
}

vi.mock('@/components/ui/Select/Select', () => ({
    default: ({ label, data, value, onChange }: ISelectMockProps) => (
        <label>
            {label}
            <select value={value ?? ''} onChange={(event) => onChange?.(event.currentTarget.value)}>
                {data.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    ),
}));

function renderQuiz(): ReturnType<typeof vi.fn> {
    const onSubmit = vi.fn();
    render(
        <MantineProvider>
            <CharacterQuiz onSubmit={onSubmit} onCancel={vi.fn()} />
        </MantineProvider>,
    );
    return onSubmit;
}

describe('CharacterQuiz', () => {
    it('should allow submitting without a name', async () => {
        const onSubmit = renderQuiz();

        await userEvent.click(screen.getByRole('button', { name: /create character/i }));

        expect(onSubmit).toHaveBeenCalledWith({
            name: '',
            description:
                'Girl. Hair: medium-length brown. Eyes: brown. Skin: medium. Wearing: blue clothes.',
        });
    });

    it('should assemble a description from the default selections', async () => {
        const onSubmit = renderQuiz();

        await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Pip');
        await userEvent.click(screen.getByRole('button', { name: /create character/i }));

        expect(onSubmit).toHaveBeenCalledWith({
            name: 'Pip',
            description:
                'Girl. Hair: medium-length brown. Eyes: brown. Skin: medium. Wearing: blue clothes.',
        });
    });

    it('should fold a typed clothing item into the description', async () => {
        const onSubmit = renderQuiz();

        await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Pip');
        await userEvent.type(
            screen.getByRole('textbox', { name: /what are they wearing/i }),
            'a raincoat',
        );
        await userEvent.click(screen.getByRole('button', { name: /create character/i }));

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                description: expect.stringContaining('Wearing: blue a raincoat'),
            }),
        );
    });

    it('should assemble a creature description from the guided selections', async () => {
        const user = userEvent.setup();
        const onSubmit = renderQuiz();

        await user.selectOptions(screen.getByRole('combobox', { name: 'Kind of character' }), [
            'cat',
        ]);
        await user.type(screen.getByRole('textbox', { name: 'Accessory' }), 'a tiny bell');
        await user.click(screen.getByRole('button', { name: /create character/i }));

        expect(onSubmit).toHaveBeenCalledWith({
            name: '',
            description: 'Cat. Main color: gray. Markings: white paws. Accessory: a tiny bell.',
        });
    });
});
