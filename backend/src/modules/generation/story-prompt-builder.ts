import { Injectable } from '@nestjs/common';
import type {
    ArtStyle,
    Character,
    Child,
    Language,
    StoryBlueprint,
} from '../../generated/prisma/client.js';
import {
    BOOK_INTERIOR_TEMPLATE_NAMES,
    PAGE_TEMPLATES,
} from '../rendering/page-templates.config.js';
import {
    STORY_OUTPUT_RULES,
    STORY_OUTPUT_RULES_HEADER,
    STORY_STRUCTURE_RULES_HEADER,
    STORY_SYSTEM_PROMPT_SUFFIX,
    buildCharacterPromptSection,
} from './generation.prompts.js';

interface IPromptContext {
    child: Pick<Child, 'name' | 'birthdate'>;
    artStyle: Pick<ArtStyle, 'promptPrefix'>;
    blueprint: Pick<StoryBlueprint, 'systemPrompt'>;
    question: string;
    pageCount: number;
    language: Language;
    /** When present, guides the LLM's styleAnchor generation and illustration prompts. */
    character?: Pick<Character, 'name' | 'description'>;
}

@Injectable()
export class StoryPromptBuilder {
    buildSystemPrompt(blueprint: Pick<StoryBlueprint, 'systemPrompt'>): string {
        return `${blueprint.systemPrompt}\n\n${STORY_SYSTEM_PROMPT_SUFFIX}`;
    }

    buildUserPrompt(ctx: IPromptContext): string {
        const age = this.computeAge(ctx.child.birthdate);
        const interiorTemplates = BOOK_INTERIOR_TEMPLATE_NAMES;

        const templateGuide = interiorTemplates
            .map((name) => {
                const tpl = PAGE_TEMPLATES[name];
                const maxCharsStr = Object.entries(tpl.maxChars)
                    .map(([zone, max]) => `${zone}: ${max} chars`)
                    .join(', ');
                return `  • ${name}: ${tpl.narrativePurpose} [${maxCharsStr}]`;
            })
            .join('\n');

        return [
            `Write a ${ctx.pageCount}-page children's book in ${ctx.language} for ${ctx.child.name}, age ${age}.`,
            '',
            `QUESTION TO ANSWER: "${ctx.question}"`,
            '',
            ...(ctx.character
                ? [buildCharacterPromptSection(ctx.character.name, ctx.character.description), '']
                : []),
            `ART STYLE: ${ctx.artStyle.promptPrefix}`,
            `Use this style when writing illustration prompts — describe scenes vividly.`,
            '',
            STORY_STRUCTURE_RULES_HEADER,
            `  • Page 1: MUST use template "book-cover"`,
            `  • Page ${ctx.pageCount}: MUST use template "book-final"`,
            `  • Pages 2–${ctx.pageCount - 1}: choose from interior templates below`,
            '',
            'INTERIOR TEMPLATES:',
            templateGuide,
            '',
            'COVER TEMPLATE (page 1 only):',
            `  • book-cover: title max ${PAGE_TEMPLATES['book-cover'].maxChars.title} chars`,
            '',
            'FINAL TEMPLATE (last page only):',
            `  • book-final: closing text max ${PAGE_TEMPLATES['book-final'].maxChars.closing} chars`,
            '',
            STORY_OUTPUT_RULES_HEADER,
            STORY_OUTPUT_RULES,
            `  • Total pages in output: exactly ${ctx.pageCount}`,
        ].join('\n');
    }

    private computeAge(birthdate: Date): number {
        return Math.floor((Date.now() - birthdate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    }
}
