import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import ArtStyleForm, { type IArtStyleFormValues } from '../ArtStyleForm';

function renderForm(props: Partial<React.ComponentProps<typeof ArtStyleForm>> = {}): void {
    render(
        <MantineProvider env="test">
            <ArtStyleForm onSubmit={vi.fn()} onCancel={vi.fn()} {...props} />
        </MantineProvider>,
    );
}

describe('ArtStyleForm', () => {
    it('should call onSubmit with form values when submitted with valid data', async () => {
        const onSubmit = vi.fn();
        renderForm({ onSubmit });

        await userEvent.type(screen.getByLabelText(/name/i), 'Watercolor');
        await userEvent.type(screen.getByLabelText(/slug/i), 'watercolor');
        await userEvent.type(screen.getByLabelText(/prompt prefix/i), 'in a watercolor style');
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        const expected: IArtStyleFormValues = {
            name: 'Watercolor',
            slug: 'watercolor',
            promptPrefix: 'in a watercolor style',
        };
        expect(onSubmit).toHaveBeenCalledWith(expected, expect.anything());
    });

    it('should show a validation error when name is empty', async () => {
        renderForm();

        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    it('should show a validation error when slug is not kebab-case', async () => {
        renderForm();

        await userEvent.type(screen.getByLabelText(/slug/i), 'My Slug!');
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(screen.getByText(/kebab-case/i)).toBeInTheDocument();
    });

    it('should pre-populate fields from initialValues', () => {
        renderForm({
            initialValues: {
                name: 'Oil Paint',
                slug: 'oil-paint',
                promptPrefix: 'in an oil style',
            },
        });

        expect(screen.getByDisplayValue('Oil Paint')).toBeInTheDocument();
        expect(screen.getByDisplayValue('oil-paint')).toBeInTheDocument();
    });
});
