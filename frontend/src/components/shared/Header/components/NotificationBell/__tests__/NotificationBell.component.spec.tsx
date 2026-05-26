import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBell from '../NotificationBell';

describe('NotificationBell', () => {
    describe('given no count', () => {
        it('should render a button with accessible label', () => {
            render(<NotificationBell />);
            expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
        });

        it('should not show a badge', () => {
            render(<NotificationBell />);
            expect(screen.queryByText(/\d/)).not.toBeInTheDocument();
        });
    });

    describe('given count > 0', () => {
        it('should include unread count in the accessible label', () => {
            render(<NotificationBell count={3} />);
            expect(screen.getByRole('button', { name: 'Notifications, 3 unread' })).toBeInTheDocument();
        });
    });

    describe('given count > 9', () => {
        it('should include the raw count in the accessible label', () => {
            render(<NotificationBell count={12} />);
            expect(screen.getByRole('button', { name: 'Notifications, 12 unread' })).toBeInTheDocument();
        });
    });

    describe('given active', () => {
        it('should mark the button as expanded', () => {
            render(<NotificationBell active />);
            expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
        });
    });

    describe('given an onClick handler', () => {
        it('should call onClick when clicked', async () => {
            const onClick = vi.fn();
            render(<NotificationBell onClick={onClick} />);
            await userEvent.click(screen.getByRole('button'));
            expect(onClick).toHaveBeenCalledOnce();
        });
    });
});
