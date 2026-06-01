import { Injectable } from '@nestjs/common';
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
}

@Injectable()
export class StoryPlanValidator {
    validate(
        plan: IStoryPlan,
        expectedPageCount: number,
        storyType: 'BOOK' | 'COMIC',
    ): IValidationResult {
        const structural: string[] = [];
        const lengthOverflows: IValidationResult['lengthOverflows'] = [];

        // Page count
        if (plan.pages.length !== expectedPageCount) {
            structural.push(`Expected ${expectedPageCount} pages but got ${plan.pages.length}.`);
        }

        if (plan.pages.length === 0) return { structuralErrors: structural, lengthOverflows };

        // Cover invariant
        const firstTemplate = PAGE_TEMPLATES[plan.pages[0].template];
        if (!firstTemplate) {
            structural.push(`Page 1 uses unknown template "${plan.pages[0].template}".`);
        } else if (firstTemplate.role !== 'cover') {
            structural.push(
                `Page 1 must use a cover template, got "${plan.pages[0].template}" (role: ${firstTemplate.role}).`,
            );
        }

        // Final invariant
        const lastPage = plan.pages[plan.pages.length - 1];
        const lastTemplate = PAGE_TEMPLATES[lastPage.template];
        if (!lastTemplate) {
            structural.push(`Last page uses unknown template "${lastPage.template}".`);
        } else if (lastTemplate.role !== 'final') {
            structural.push(
                `Last page must use a final template, got "${lastPage.template}" (role: ${lastTemplate.role}).`,
            );
        }

        // Per-page checks
        for (let i = 0; i < plan.pages.length; i++) {
            const page = plan.pages[i];
            const pageNum = i + 1;
            const tpl = PAGE_TEMPLATES[page.template];

            // Unknown template
            if (!tpl) {
                structural.push(`Page ${pageNum}: unknown template "${page.template}".`);
                continue;
            }

            // Wrong story type
            if (tpl.type !== storyType) {
                structural.push(
                    `Page ${pageNum}: template "${page.template}" is for ${tpl.type}, story is ${storyType}.`,
                );
            }

            // Interior pages must not use cover/final templates
            if (pageNum > 1 && pageNum < plan.pages.length && tpl.role !== 'interior') {
                structural.push(
                    `Page ${pageNum}: interior pages must not use role "${tpl.role}" template "${page.template}".`,
                );
            }

            // Illustration prompt required when template has image zones
            if (tpl.images.length > 0 && !page.illustration.prompt) {
                structural.push(
                    `Page ${pageNum}: template "${page.template}" requires an illustration prompt.`,
                );
            }

            // Length overflow check (non-blocking)
            if (page.text) {
                const zoneId = PRIMARY_TEXT_ZONE[page.template];
                const maxChars = zoneId ? tpl.maxChars[zoneId] : undefined;
                if (maxChars !== undefined && page.text.length > maxChars) {
                    lengthOverflows.push({
                        page: pageNum,
                        zone: zoneId,
                        actual: page.text.length,
                        max: maxChars,
                    });
                }
            }
        }

        return { structuralErrors: structural, lengthOverflows };
    }
}
