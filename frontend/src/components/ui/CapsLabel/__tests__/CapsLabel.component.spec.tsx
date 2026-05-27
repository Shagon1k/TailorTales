import { render, screen } from '@testing-library/react';
import CapsLabel from '../CapsLabel';

describe('CapsLabel', () => {
    describe('given text content', () => {
        it('should render the label text', () => {
            render(<CapsLabel>· Current Plan ·</CapsLabel>);
            expect(screen.getByText('· Current Plan ·')).toBeInTheDocument();
        });
    });
});
