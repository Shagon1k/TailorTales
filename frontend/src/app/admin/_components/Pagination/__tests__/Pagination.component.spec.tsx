import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import Pagination from '../Pagination';

function renderPagination(props: Partial<React.ComponentProps<typeof Pagination>> = {}): void {
    render(
        <MantineProvider env="test">
            <Pagination page={2} total={50} pageSize={20} onPageChange={vi.fn()} {...props} />
        </MantineProvider>,
    );
}

describe('Pagination', () => {
    it('should render no controls when there is a single page', () => {
        renderPagination({ page: 1, total: 10, pageSize: 20 });

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.queryByText(/page/i)).not.toBeInTheDocument();
    });

    it('should show the current page out of the total', () => {
        renderPagination();

        expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });

    it('should disable Prev on the first page', () => {
        renderPagination({ page: 1 });

        expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled();
    });

    it('should disable Next on the last page', () => {
        renderPagination({ page: 3 });

        expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });

    it('should request the next page when Next is clicked', async () => {
        const onPageChange = vi.fn();
        renderPagination({ onPageChange });

        await userEvent.click(screen.getByRole('button', { name: /next/i }));

        expect(onPageChange).toHaveBeenCalledWith(3);
    });
});
