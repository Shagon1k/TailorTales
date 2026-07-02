import { buildMetadata } from '../seo.utils';

const BASE_PARAMS = {
    locale: 'en',
    description: 'A small workshop for curious children.',
    siteName: 'TailorTales',
    ogImageAlt: 'TailorTales preview',
};

describe('buildMetadata', () => {
    it('should use the site name as the absolute title when no page title is provided', () => {
        const metadata = buildMetadata({
            ...BASE_PARAMS,
            path: '',
        });

        expect(metadata.title).toEqual({ absolute: 'TailorTales' });
    });

    it('should keep page-specific titles templatable by the parent layout', () => {
        const metadata = buildMetadata({
            ...BASE_PARAMS,
            path: '/pricing',
            title: 'Pricing',
        });

        expect(metadata.title).toBe('Pricing');
    });
});
