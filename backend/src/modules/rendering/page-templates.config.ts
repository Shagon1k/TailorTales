import type { IPageTemplate } from './rendering.types.js';

/**
 * Single source of truth for the prompt builder, response validator, and PDF renderer.
 *
 * A5 canvas: 148 × 210 mm.
 *
 * Image sizes are chosen to match each template's display area ratio so the
 * generated image fills its zone without awkward cropping or letterboxing:
 *
 *   book-cover / book-full-image  — full-bleed portrait (148×210 ≈ 2:3) → 1024×1536
 *   book-text-image               — upper zone landscape (148×110 ≈ 4:3) → 1536×1024
 *   book-final                    — small circular inset (1:1)            → 1024×1024
 *
 * Comic templates are Post-MVP stubs — sizes reflect their panel geometry.
 */
export const PAGE_TEMPLATES: Record<string, IPageTemplate> = {
    // -----------------------------------------------------------------------
    // BOOK templates (MVP)
    // -----------------------------------------------------------------------

    'book-cover': {
        htmlFile: 'book-cover.hbs',
        type: 'BOOK',
        role: 'cover',
        narrativePurpose:
            'Use for page 1 only. Full-bleed cover illustration, book title, and child name.',
        maxChars: { title: 60, subtitle: 80 },
        images: [{ name: 'cover', aspect: '2:3', size: '1024x1536' }],
    },

    'book-text': {
        htmlFile: 'book-text.hbs',
        type: 'BOOK',
        role: 'interior',
        narrativePurpose:
            'Use for narrative bridges or emotional beats that need no illustration. Limit to 1–2 pages per story.',
        maxChars: { body: 400 },
        images: [],
    },

    'book-text-image': {
        htmlFile: 'book-text-image.hbs',
        type: 'BOOK',
        role: 'interior',
        narrativePurpose:
            'Default interior layout. Use for most story pages — combines narrative text with a landscape illustration in the upper half.',
        maxChars: { chapter: 50, body: 300 },
        images: [{ name: 'main', aspect: '4:3', size: '1536x1024' }],
    },

    'book-full-image': {
        htmlFile: 'book-full-image.hbs',
        type: 'BOOK',
        role: 'interior',
        narrativePurpose:
            'Use for high-impact visual moments — a reveal, a wide landscape, or a dramatic scene. Minimal or no text.',
        maxChars: { caption: 120 },
        images: [{ name: 'main', aspect: '2:3', size: '1024x1536' }],
    },

    'book-final': {
        htmlFile: 'book-final.hbs',
        type: 'BOOK',
        role: 'final',
        narrativePurpose:
            'Use for the last page only. Warm closing message with an optional small circular illustration.',
        maxChars: { closing: 200, tagline: 60 },
        images: [{ name: 'closing-image', aspect: '1:1', size: '1024x1024' }],
    },

    // -----------------------------------------------------------------------
    // COMIC templates — Post-MVP stubs
    // -----------------------------------------------------------------------

    'comic-cover': {
        htmlFile: 'comic-cover.hbs',
        type: 'COMIC',
        role: 'cover',
        narrativePurpose: 'Comic cover. Post-MVP.',
        maxChars: { title: 60 },
        images: [{ name: 'cover', aspect: '2:3', size: '1024x1536' }],
    },

    'comic-2-panel': {
        htmlFile: 'comic-2-panel.hbs',
        type: 'COMIC',
        role: 'interior',
        narrativePurpose: '2-panel side-by-side comic spread. Post-MVP.',
        maxChars: { 'bubble-1': 80, 'bubble-2': 80 },
        images: [
            { name: 'panel-1', aspect: '1:3', size: '512x1536' },
            { name: 'panel-2', aspect: '1:3', size: '512x1536' },
        ],
    },

    'comic-3-panel': {
        htmlFile: 'comic-3-panel.hbs',
        type: 'COMIC',
        role: 'interior',
        narrativePurpose: '3-panel stacked comic layout. Post-MVP.',
        maxChars: { 'bubble-1': 80, 'bubble-2': 80, 'bubble-3': 80 },
        images: [
            { name: 'panel-1', aspect: '3:1', size: '1024x341' },
            { name: 'panel-2', aspect: '3:1', size: '1024x341' },
            { name: 'panel-3', aspect: '3:1', size: '1024x341' },
        ],
    },

    'comic-4-panel': {
        htmlFile: 'comic-4-panel.hbs',
        type: 'COMIC',
        role: 'interior',
        narrativePurpose: '4-panel 2×2 grid comic layout. Post-MVP.',
        maxChars: { 'bubble-1': 60, 'bubble-2': 60, 'bubble-3': 60, 'bubble-4': 60 },
        images: [
            { name: 'panel-1', aspect: '1:1', size: '512x512' },
            { name: 'panel-2', aspect: '1:1', size: '512x512' },
            { name: 'panel-3', aspect: '1:1', size: '512x512' },
            { name: 'panel-4', aspect: '1:1', size: '512x512' },
        ],
    },

    'comic-splash': {
        htmlFile: 'comic-splash.hbs',
        type: 'COMIC',
        role: 'interior',
        narrativePurpose: 'Full-page splash panel. Post-MVP.',
        maxChars: { caption: 120 },
        images: [{ name: 'splash', aspect: '2:3', size: '1024x1536' }],
    },
};

export const BOOK_INTERIOR_TEMPLATE_NAMES = Object.entries(PAGE_TEMPLATES)
    .filter(([, t]) => t.type === 'BOOK' && t.role === 'interior')
    .map(([name]) => name);
