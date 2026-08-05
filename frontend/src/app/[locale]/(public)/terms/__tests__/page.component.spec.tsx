import { render, screen } from '@testing-library/react';
import TermsPage from '../page';

vi.mock('@/app/[locale]/(public)/_components/LegalDocument/LegalDocument', () => ({
    default: () => <h2>Agreement and eligibility</h2>,
}));

describe('TermsPage', () => {
    it('should render the terms heading and agreement content', async () => {
        render(await TermsPage());

        expect(
            screen.getByRole('heading', { level: 1, name: /terms of service/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { level: 2, name: /agreement and eligibility/i }),
        ).toBeInTheDocument();
    });
});
