import { render, screen } from '@testing-library/react';
import CapsLink from '../CapsLink';

describe('CapsLink', () => {
    it('should render a link with the given href and text', () => {
        render(<CapsLink href="/account/children">Manage children →</CapsLink>);

        const link = screen.getByRole('link', { name: /manage children/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/account/children');
    });
});
