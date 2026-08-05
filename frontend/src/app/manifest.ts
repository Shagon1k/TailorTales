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
        icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            {
                src: '/icons/icon-maskable-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/icons/icon-maskable-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    };
}
