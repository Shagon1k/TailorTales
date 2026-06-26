import { Injectable } from '@nestjs/common';
import { endsWithCompleteSentence } from '../../common/text.utils.js';
import { PAGE_TEMPLATES } from '../rendering/page-templates.config.js';
import type { IStoryPlan } from '../ai/ai.types.js';

/** The primary text zone name for each book template — maps page.text to its maxChars limit. */
const PRIMARY_TEXT_ZONE: Record<string, string> = {
    'book-cover': 'title',
    'book-text': 'body',
    'book-text-image': 'body',
    'book-full-image': 'caption',
    'book-final': 'closing',
};

export interface IValidationResult {
    /** Structural errors — must be fixed before the story can proceed. */
    structuralErrors: string[];
    /** Length overflows — logged but do not block the story (CSS handles visual clipping). */
    lengthOverflows: Array<{ page: number; zone: string; actual: number; max: number }>;
    /** Prose polish warnings — logged but do not block the story. */
    sentenceWarnings: string[];
}

@Injectable()
export class StoryPlanValidator {
    validate(
        plan: IStoryPlan,
        expectedPageCount: number,
        storyType: 'BOOK' | 'COMIC',
    ): IValidationResult {
        if (plan.pages.length === 0) {
            return {
                structuralErrors: this.checkPlanFrame(plan, expectedPageCount),
                lengthOverflows: [],
                sentenceWarnings: [],
            };
        }

        return {
            structuralErrors: [
                ...this.checkPlanFrame(plan, expectedPageCount),
                ...plan.pages.flatMap((page, i) =>
                    this.checkPageStructural(page, i + 1, plan.pages.length, storyType),
                ),
            ],
            lengthOverflows: plan.pages.flatMap((page, i) =>
                this.checkPageLengthOverflow(page, i + 1),
            ),
            sentenceWarnings: plan.pages.flatMap((page, i) =>
                this.checkPageSentenceWarning(page, i + 1),
            ),
        };
    }

    /**
     * Plan-level structural checks: page count, cover template, final template.
     */
    private checkPlanFrame(plan: IStoryPlan, expectedPageCount: number): string[] {
        const errors: string[] = [];

        if (plan.pages.length !== expectedPageCount) {
            errors.push(`Expected ${expectedPageCount} pages but got ${plan.pages.length}.`);
        }

        if (plan.pages.length === 0) return errors;

        const firstTemplate = PAGE_TEMPLATES[plan.pages[0].template];
        if (!firstTemplate) {
            errors.push(`Page 1 uses unknown template "${plan.pages[0].template}".`);
        } else if (firstTemplate.role !== 'cover') {
            errors.push(
                `Page 1 must use a cover template, got "${plan.pages[0].template}" (role: ${firstTemplate.role}).`,
            );
        }

        const lastPage = plan.pages[plan.pages.length - 1];
        const lastTemplate = PAGE_TEMPLATES[lastPage.template];
        if (!lastTemplate) {
            errors.push(`Last page uses unknown template "${lastPage.template}".`);
        } else if (lastTemplate.role !== 'final') {
            errors.push(
                `Last page must use a final template, got "${lastPage.template}" (role: ${lastTemplate.role}).`,
            );
        }

        return errors;
    }

    /**
     * Per-page structural checks: template validity, story-type match, role constraints,
     * and illustration prompt presence.
     */
    private checkPageStructural(
        page: IStoryPlan['pages'][number],
        pageNum: number,
        totalPages: number,
        storyType: 'BOOK' | 'COMIC',
    ): string[] {
        const errors: string[] = [];
        const tpl = PAGE_TEMPLATES[page.template];

        if (!tpl) {
            errors.push(`Page ${pageNum}: unknown template "${page.template}".`);
            return errors; // remaining checks require a resolved template
        }

        if (tpl.type !== storyType) {
            errors.push(
                `Page ${pageNum}: template "${page.template}" is for ${tpl.type}, story is ${storyType}.`,
            );
        }

        if (pageNum > 1 && pageNum < totalPages && tpl.role !== 'interior') {
            errors.push(
                `Page ${pageNum}: interior pages must not use role "${tpl.role}" template "${page.template}".`,
            );
        }

        if (tpl.images.length > 0 && !page.illustration.prompt) {
            errors.push(
                `Page ${pageNum}: template "${page.template}" requires an illustration prompt.`,
            );
        }

        return errors;
    }

    private checkPageSentenceWarning(page: IStoryPlan['pages'][number], pageNum: number): string[] {
        const tpl = PAGE_TEMPLATES[page.template];
        if (!tpl || tpl.role === 'cover' || !page.text?.trim()) return [];
        if (endsWithCompleteSentence(page.text)) return [];

        return [
            `Page ${pageNum}: text does not end with a complete sentence (last character should be ., !, ?, or …).`,
        ];
    }

    /**
     * Per-page length overflow check (non-blocking — CSS handles visual clipping).
     */
    private checkPageLengthOverflow(
        page: IStoryPlan['pages'][number],
        pageNum: number,
    ): IValidationResult['lengthOverflows'] {
        if (!page.text) return [];

        const tpl = PAGE_TEMPLATES[page.template];
        if (!tpl) return [];

        const zoneId = PRIMARY_TEXT_ZONE[page.template];
        const maxChars = zoneId ? tpl.maxChars[zoneId] : undefined;
        if (maxChars === undefined || page.text.length <= maxChars) return [];

        return [{ page: pageNum, zone: zoneId, actual: page.text.length, max: maxChars }];
    }
}
