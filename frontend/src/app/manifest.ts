import type { MetadataRoute } from 'next';

/**
 * Minimal web app manifest — enables "Add to Home Screen" and supplies icons/name to the browser.
 */
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'TailorTales',
        short_name: 'TailorTales',
        description: 'Personalized AI-generated storybooks & comics for curious kids',
        start_url: '/',
        display: 'standalone',
        background_color: '#1a0a00',
        theme_color: '#1a0a00',
        // TODO(pre-launch): add dedicated 192x192 and 512x512 (incl. maskable) icons in public/
        // for full PWA installability — current icons are the 32px favicon and 180px apple-touch.
        icons: [
            { src: '/icon.png', sizes: '32x32', type: 'image/png' },
            { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
        ],
    };
}
