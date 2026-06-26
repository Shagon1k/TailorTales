import { Injectable } from '@nestjs/common';
import type {
    ArtStyle,
    Character,
    Child,
    Gender,
    Language,
    StoryBlueprint,
    StoryGenre,
    WritingStyle,
} from '../../generated/prisma/client.js';
import {
    BOOK_INTERIOR_TEMPLATE_NAMES,
    PAGE_TEMPLATES,
} from '../rendering/page-templates.config.js';
import {
    STORY_LAYOUT_DYNAMICS_RULES,
    STORY_OUTPUT_RULES,
    STORY_OUTPUT_RULES_HEADER,
    STORY_STRUCTURE_RULES_HEADER,
    STORY_SYSTEM_PROMPT_SUFFIX,
    buildCharacterPromptSection,
    buildGenreSection,
    buildInterestsHintSection,
    buildWritingStyleSection,
} from './generation.prompts.js';
import { GENDER_AUDIENCE_NAMES, LANGUAGE_NAMES } from '../../common/languages.constants.js';

interface IPromptContext {
    child: Pick<Child, 'name' | 'birthdate' | 'gender' | 'interests'>;
    artStyle: Pick<ArtStyle, 'promptPrefix'>;
    blueprint: Pick<StoryBlueprint, 'systemPrompt'>;
    question: string;
    pageCount: number;
    language: Language;
    /** When present, guides the LLM's styleAnchor generation and illustration prompts. */
    character?: Pick<Character, 'name' | 'description'>;
    /** Optional flavour knobs — each injects a prompt fragment when set. */
    genre?: StoryGenre | null;
    writingStyle?: WritingStyle | null;
}

@Injectable()
export class StoryPromptBuilder {
    buildSystemPrompt(blueprint: Pick<StoryBlueprint, 'systemPrompt'>): string {
        return `${blueprint.systemPrompt}\n\n${STORY_SYSTEM_PROMPT_SUFFIX}`;
    }

    buildUserPrompt(ctx: IPromptContext): string {
        const age = this.computeAge(ctx.child.birthdate);
        const interiorTemplates = BOOK_INTERIOR_TEMPLATE_NAMES;
        const languageName = LANGUAGE_NAMES[ctx.language];
        const audienceGender = this.describeAudienceGender(ctx.child.gender);

        const templateGuide = interiorTemplates
            .map((name) => {
                const tpl = PAGE_TEMPLATES[name];
                const maxCharsStr = Object.entries(tpl.maxChars)
                    .map(([zone, max]) => `${zone}: ${max} chars`)
                    .join(', ');
                return `  • ${name}: ${tpl.narrativePurpose} [${maxCharsStr}]`;
            })
            .join('\n');

        const layoutUsageGuide = interiorTemplates
            .map((name) => `  • ${name}: ${PAGE_TEMPLATES[name].narrativePurpose}`)
            .join('\n');

        return [
            `Write a ${ctx.pageCount}-page children's book in ${languageName} for a child aged ${age}.`,
            `The intended reader is ${ctx.child.name}, a ${audienceGender} aged ${age}. Use age and gender only to tune clarity, pacing, emotional tone, and relatable details for the audience.`,
            '',
            `QUESTION TO ANSWER: "${ctx.question}"`,
            '',
            ...(ctx.genre ? [buildGenreSection(ctx.genre), ''] : []),
            ...(ctx.writingStyle ? [buildWritingStyleSection(ctx.writingStyle), ''] : []),
            ...(ctx.child.interests.length > 0
                ? [buildInterestsHintSection(ctx.child.interests), '']
                : []),
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
            STORY_LAYOUT_DYNAMICS_RULES,
            '',
            'INTERIOR TEMPLATE USAGE GUIDE:',
            layoutUsageGuide,
            '',
            STORY_OUTPUT_RULES_HEADER,
            STORY_OUTPUT_RULES,
            `  • Total pages in output: exactly ${ctx.pageCount}`,
        ].join('\n');
    }

    private computeAge(birthdate: Date): number {
        return Math.floor((Date.now() - birthdate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    }

    private describeAudienceGender(gender: Gender): string {
        return GENDER_AUDIENCE_NAMES[gender];
    }
}
