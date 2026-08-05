import { render, screen } from '@testing-library/react';
import PrivacyPage from '../page';

// async server component — stub it for sync render
vi.mock('@/app/[locale]/(public)/_components/LegalDocument/LegalDocument', () => ({
    default: () => (
        <div>
            <h2>Data we collect and why</h2>
            <h2>Cookies and analytics</h2>
            <h2>Your rights and complaints</h2>
        </div>
    ),
}));

describe('PrivacyPage', () => {
    it('should render the page heading', async () => {
        render(await PrivacyPage());

        expect(screen.getByRole('heading', { level: 1, name: /your family/i })).toBeInTheDocument();
    });

    it('should display the privacy policy sections', async () => {
        render(await PrivacyPage());

        expect(screen.getByText(/data we collect/i)).toBeInTheDocument();
        expect(screen.getByText(/cookies and analytics/i)).toBeInTheDocument();
        expect(screen.getByText(/your rights/i)).toBeInTheDocument();
    });
});
