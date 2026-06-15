import type { Language } from '../../generated/prisma/client.js';
import { LANGUAGE_NAMES } from '../../common/languages.constants.js';

export interface IPageTextPromptContext {
    storyTitle: string | null;
    childName: string;
    pageOrder: number;
    layout: string | null;
    chapterTitle: string | null;
    currentText: string | null;
    language: Language;
    /** Optional author note supplied by the user to guide the rewrite. */
    authorNote?: string;
}

export function buildPageTextSystemPrompt(language: Language): string {
    return [
        "You are a children's book author rewriting a single page of a story.",
        `Write age-appropriate, engaging narrative text in ${LANGUAGE_NAMES[language]}.`,
        'Return only the page text. Do not include a title, labels, or any explanation.',
        'End with a complete sentence.',
    ].join('\n');
}

export function buildPageTextUserPrompt(ctx: IPageTextPromptContext): string {
    const lines: string[] = [
        `Story: "${ctx.storyTitle ?? 'Untitled'}"`,
        `Child's name: ${ctx.childName}`,
        `Page ${ctx.pageOrder} — layout: ${ctx.layout ?? 'unknown'}`,
    ];

    if (ctx.chapterTitle) {
        lines.push(`Chapter: ${ctx.chapterTitle}`);
    }

    if (ctx.authorNote) {
        lines.push('', `Author's note: ${ctx.authorNote}`);
    }

    lines.push(
        '',
        'Current text:',
        ctx.currentText ?? '(none)',
        '',
        'Rewrite this page. Keep a similar length and tone.',
    );

    return lines.join('\n');
}
