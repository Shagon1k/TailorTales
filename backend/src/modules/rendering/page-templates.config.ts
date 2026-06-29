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
 *   book-text-image               — lower zone landscape (148×100 ≈ 3:2) → 1536×1024
 *   book-image-top                — upper zone landscape (148×92 ≈ 8:5)    → 1536×1024
 *   book-image-middle             — centered landscape (128×76 ≈ 5:3)       → 1536×864
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
        narrativePurpose: 'Use for page 1 only. Full-bleed cover illustration and book title.',
        maxChars: { title: 60, subtitle: 0 },
        images: [{ name: 'cover', aspect: '2:3', size: '1024x1536' }],
    },

    'book-text': {
        htmlFile: 'book-text.hbs',
        type: 'BOOK',
        role: 'interior',
        interiorBeat: 'bridge',
        narrativePurpose: 'Use for narrative bridges or emotional beats that need no illustration.',
        maxChars: { body: 400 },
        images: [],
    },

    'book-text-image': {
        htmlFile: 'book-text-image.hbs',
        type: 'BOOK',
        role: 'interior',
        interiorBeat: 'default',
        narrativePurpose:
            'Steady mixed layout with prose first and a landscape illustration in the lower half. Use for explanatory beats, continuous action, or scenes where the words should lead.',
        maxChars: { chapter: 50, body: 300 },
        images: [{ name: 'main', aspect: '3:2', size: '1536x1024' }],
    },

    'book-image-top': {
        htmlFile: 'book-image-top.hbs',
        type: 'BOOK',
        role: 'interior',
        interiorBeat: 'default',
        narrativePurpose:
            'Image-first mixed layout with a landscape illustration at the top and prose below. Use when the page opens with a strong visual setup, discovery, or a scene the reader should see before reading the explanation.',
        maxChars: { chapter: 50, body: 300 },
        images: [{ name: 'main', aspect: '3:2', size: '1536x1024' }],
    },

    'book-image-middle': {
        htmlFile: 'book-image-middle.hbs',
        type: 'BOOK',
        role: 'interior',
        interiorBeat: 'bridge',
        narrativePurpose:
            'Balanced middle-image layout with short prose above and below the illustration. Use for transitions, cause-and-effect beats, or moments where the scene sits between two short thoughts.',
        maxChars: { chapter: 50, body: 250 },
        images: [{ name: 'main', aspect: '16:9', size: '1536x864' }],
    },

    'book-full-image': {
        htmlFile: 'book-full-image.hbs',
        type: 'BOOK',
        role: 'interior',
        interiorBeat: 'highlight',
        narrativePurpose:
            'Use for high-impact visual moments — a reveal, a wide landscape, a dramatic turn, or a burst of wonder. Minimal or no text.',
        maxChars: { caption: 120 },
        images: [{ name: 'main', aspect: '2:3', size: '1024x1536' }],
    },

    'book-final': {
        htmlFile: 'book-final.hbs',
        type: 'BOOK',
        role: 'final',
        narrativePurpose:
            'Use for the last page only. Warm closing message with an optional small circular illustration.',
        maxChars: { closing: 220, tagline: 60 },
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
