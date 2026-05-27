import { render, screen } from '@testing-library/react';
import PrivacyPage from '../page';

describe('PrivacyPage', () => {
    it('should render the page heading', () => {
        render(<PrivacyPage />);

        expect(
            screen.getByRole('heading', { level: 1, name: /your family/i }),
        ).toBeInTheDocument();
    });

    it('should display the privacy policy sections', () => {
        render(<PrivacyPage />);

        expect(screen.getByText(/what we collect/i)).toBeInTheDocument();
        expect(screen.getByText(/how we use it/i)).toBeInTheDocument();
        expect(screen.getByText(/your rights/i)).toBeInTheDocument();
    });
});
