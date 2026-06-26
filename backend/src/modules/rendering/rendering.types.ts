import type { StoryType } from '../../generated/prisma/enums.js';

export type { StoryType };
export type PageTemplateRole = 'cover' | 'interior' | 'final';
export type PageTemplateInteriorBeat = 'default' | 'bridge' | 'highlight';

export interface IImageSlot {
    name: string;
    /** Aspect ratio string, e.g. '2:3'. Documents intent; actual pixels are in `size`. */
    aspect: string;
    /** Pixel dimensions passed to the image generation API, e.g. '1024x1536'. */
    size: string;
}

export interface IPageTemplate {
    htmlFile: string;
    type: StoryType;
    role: PageTemplateRole;
    /** Optional rhythm hint for interior templates, used when guiding layout distribution. */
    interiorBeat?: PageTemplateInteriorBeat;
    /** Guidance passed to the LLM on when to pick this template. */
    narrativePurpose: string;
    /** Max character counts per named text zone. Keys are zone names used in the template. */
    maxChars: Record<string, number>;
    images: IImageSlot[];
}

// ---------------------------------------------------------------------------
// Renderer input — what PdfRendererService receives per story
// ---------------------------------------------------------------------------

export interface IPageToRender {
    order: number;
    layout: string;
    text: string | null;
    chapterTitle: string | null;
    /** Base64-encoded image data (no data-URL prefix). Null if no image zone. */
    imageBase64: string | null;
}

export interface IInteriorTextSplit {
    lead: string;
    tail: string;
}

export interface IStoryToRender {
    title: string;
    childName: string;
    pages: IPageToRender[];
    watermark: boolean;
}
