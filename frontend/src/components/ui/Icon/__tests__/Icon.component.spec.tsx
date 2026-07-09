import { render } from '@testing-library/react';
import Icon from '../Icon';

describe('Icon', () => {
    describe('given a supported icon name', () => {
        it('should render an aria-hidden svg', () => {
            const { container } = render(<Icon name="book" />);

            expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
        });
    });
});
