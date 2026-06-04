import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
import type { IStoryToRender } from '../rendering.types.js';

const placeholderBase64 = readFileSync(join(__dirname, '../assets/placeholder.png')).toString(
    'base64',
);

/** 5-page book: one of each template. */
export const FIVE_PAGE_STORY_FIXTURE: IStoryToRender = {
    title: 'Why Do Mountains Breathe Smoke?',
    childName: 'Maya',
    watermark: true,
    pages: [
        {
            order: 1,
            layout: 'book-cover',
            text: 'Why Do Mountains Breathe Smoke?',
            chapterTitle: null,
            imageBase64: placeholderBase64,
        },
        {
            order: 2,
            layout: 'book-text-image',
            chapterTitle: 'Chapter One',
            text: 'High above the village, where the clouds rest like sleepy cats, lived a very old mountain named Boruk. Every morning, Boruk took a long, slow breath — and out came a soft white puff of smoke.',
            imageBase64: placeholderBase64,
        },
        {
            order: 3,
            layout: 'book-full-image',
            text: 'The whole valley turned to look whenever Boruk sighed.',
            chapterTitle: null,
            imageBase64: placeholderBase64,
        },
        {
            order: 4,
            layout: 'book-text',
            text: '"Why does the mountain breathe smoke?" Maya asked her grandmother one evening, watching the thin grey ribbon curl up into the orange sky. Her grandmother smiled and put down her knitting.',
            chapterTitle: null,
            imageBase64: null,
        },
        {
            order: 5,
            layout: 'book-final',
            text: 'And from that day on, every time Maya saw a mountain breathing, she waved — just in case it was Boruk, dreaming of spring.',
            chapterTitle: null,
            imageBase64: placeholderBase64,
        },
    ],
};

/** 3-page minimal fixture for fast renderer unit tests. */
export const THREE_PAGE_STORY_FIXTURE: IStoryToRender = {
    title: 'The Tiny Cloud',
    childName: 'Leo',
    watermark: false,
    pages: [
        {
            order: 1,
            layout: 'book-cover',
            text: 'The Tiny Cloud',
            chapterTitle: null,
            imageBase64: placeholderBase64,
        },
        {
            order: 2,
            layout: 'book-text-image',
            chapterTitle: null,
            text: 'There was once a cloud so small it could fit inside a teacup. It drifted above the city, looking for something to rain on.',
            imageBase64: placeholderBase64,
        },
        {
            order: 3,
            layout: 'book-final',
            text: 'It found a single, thirsty flower — and that was enough.',
            chapterTitle: null,
            imageBase64: null,
        },
    ],
};
