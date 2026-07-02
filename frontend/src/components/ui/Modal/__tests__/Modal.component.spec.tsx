import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import Modal from '../Modal';

function renderModal(props: React.ComponentProps<typeof Modal>): ReturnType<typeof render> {
    return render(
        <MantineProvider>
            <Modal {...props} />
        </MantineProvider>,
    );
}

describe('Modal', () => {
    describe('given opened is false', () => {
        it('should not render the dialog', () => {
            renderModal({ opened: false, onClose: vi.fn() });
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });

    describe('given opened is true', () => {
        it('should render the dialog', () => {
            renderModal({ opened: true, onClose: vi.fn() });
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('should display the title when provided', () => {
            renderModal({ opened: true, onClose: vi.fn(), title: 'DELETE' });
            expect(screen.getByText('DELETE')).toBeInTheDocument();
        });

        it('should display body content', () => {
            renderModal({ opened: true, onClose: vi.fn(), children: 'Are you sure?' });
            expect(screen.getByText('Are you sure?')).toBeInTheDocument();
        });

        it('should render footer content when Modal.Footer is used', () => {
            renderModal({
                opened: true,
                onClose: vi.fn(),
                children: (
                    <>
                        <div>Body content</div>
                        <Modal.Footer>
                            <button type="button">Footer action</button>
                        </Modal.Footer>
                    </>
                ),
            });

            expect(screen.getByText('Body content')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Footer action' })).toBeInTheDocument();
        });

        it('should call onClose when the close button is clicked', async () => {
            const onClose = vi.fn();
            renderModal({ opened: true, onClose, title: 'Confirm' });
            await userEvent.click(screen.getByRole('button', { name: /close/i }));
            expect(onClose).toHaveBeenCalledOnce();
        });
    });
});
