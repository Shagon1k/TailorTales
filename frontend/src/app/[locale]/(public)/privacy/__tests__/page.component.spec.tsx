import { render, screen } from '@testing-library/react';
import PrivacyPage from '../page';

// async server component — stub it for sync render
vi.mock('@/app/[locale]/(public)/privacy/_components/PrivacyContent/PrivacyContent', () => ({
    default: () => (
        <div>
            <h2>What we collect</h2>
            <h2>How we use it</h2>
            <h2>Your rights</h2>
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

        expect(screen.getByText(/what we collect/i)).toBeInTheDocument();
        expect(screen.getByText(/how we use it/i)).toBeInTheDocument();
        expect(screen.getByText(/your rights/i)).toBeInTheDocument();
    });
});
