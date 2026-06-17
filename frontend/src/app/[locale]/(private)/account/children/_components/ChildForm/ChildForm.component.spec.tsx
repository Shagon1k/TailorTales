import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import ChildForm, { type IChildFormValues } from './ChildForm';

function renderForm(
    onSubmit = vi.fn(),
    onCancel = vi.fn(),
    initialValues?: Partial<IChildFormValues>,
): ReturnType<typeof render> {
    return render(
        <MantineProvider>
            <ChildForm onSubmit={onSubmit} onCancel={onCancel} initialValues={initialValues} />
        </MantineProvider>,
    );
}

describe('ChildForm', () => {
    it('should render all form fields', () => {
        renderForm();
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/birthdate/i)).toBeInTheDocument();
        // Mantine Select renders both a combobox input and a listbox sharing the label —
        // use getByRole to uniquely target the input
        expect(screen.getByRole('combobox', { name: /gender/i })).toBeInTheDocument();
        // Mantine TagsInput renders both a combobox input and a listbox sharing the label —
        // use getByRole to uniquely target the input
        expect(screen.getByRole('combobox', { name: /interests/i })).toBeInTheDocument();
    });

    it('should populate fields from initialValues', () => {
        renderForm(vi.fn(), vi.fn(), {
            name: 'Max',
            birthdate: '2020-06-15',
            gender: 'MALE',
            interests: [],
        });

        expect(screen.getByLabelText(/name/i)).toHaveValue('Max');
        expect(screen.getByLabelText(/birthdate/i)).toHaveValue('2020-06-15');
    });

    it('should show validation error when name is empty and form is submitted', async () => {
        renderForm();

        await userEvent.clear(screen.getByLabelText(/name/i));
        await userEvent.click(screen.getByRole('button', { name: /save/i }));

        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    it('should call onSubmit with correct values when form is valid', async () => {
        const onSubmit = vi.fn();
        renderForm(onSubmit, vi.fn(), {
            name: 'Max',
            birthdate: '2020-06-15',
            gender: 'MALE',
            interests: [],
        });

        await userEvent.click(screen.getByRole('button', { name: /save/i }));

        // Mantine form.onSubmit calls the handler as (values, event)
        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Max', birthdate: '2020-06-15', gender: 'MALE' }),
            expect.anything(),
        );
    });

    it('should call onCancel when Cancel is clicked', async () => {
        const onCancel = vi.fn();
        renderForm(vi.fn(), onCancel);

        await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

        expect(onCancel).toHaveBeenCalled();
    });
});
