import { StoryPlanValidator } from '../story-plan.validator.js';
import type { IStoryPlan } from '../../ai/ai.types.js';

const makePlan = (overrides: Partial<IStoryPlan> = {}): IStoryPlan => ({
    title: 'Test Book',
    styleAnchor: 'A friendly fox.',
    pages: [
        {
            template: 'book-cover',
            text: 'Cover',
            chapterTitle: null,
            illustration: { prompt: 'Cover art' },
        },
        {
            template: 'book-text-image',
            text: 'Page 2 text',
            chapterTitle: 'Chapter 1',
            illustration: { prompt: 'An illustration' },
        },
        {
            template: 'book-final',
            text: 'The end.',
            chapterTitle: null,
            illustration: { prompt: 'Final art' },
        },
    ],
    ...overrides,
});

describe('StoryPlanValidator', () => {
    let validator: StoryPlanValidator;

    beforeEach(() => {
        validator = new StoryPlanValidator();
    });

    describe('given a valid 3-page plan', () => {
        it('should return no errors', () => {
            const result = validator.validate(makePlan(), 3, 'BOOK');
            expect(result.structuralErrors).toHaveLength(0);
            expect(result.lengthOverflows).toHaveLength(0);
        });
    });

    describe('given wrong page count', () => {
        it('should report a structural error', () => {
            const result = validator.validate(makePlan(), 5, 'BOOK');
            expect(result.structuralErrors).toHaveLength(1);
            expect(result.structuralErrors[0]).toMatch(/expected 5/i);
        });
    });

    describe('given first page is not a cover template', () => {
        it('should report a structural error', () => {
            const plan = makePlan();
            plan.pages[0] = { ...plan.pages[0], template: 'book-text' };
            const result = validator.validate(plan, 3, 'BOOK');
            expect(result.structuralErrors.some((e) => e.includes('cover'))).toBe(true);
        });
    });

    describe('given last page is not a final template', () => {
        it('should report a structural error', () => {
            const plan = makePlan();
            plan.pages[2] = { ...plan.pages[2], template: 'book-text-image' };
            const result = validator.validate(plan, 3, 'BOOK');
            expect(result.structuralErrors.some((e) => e.includes('final'))).toBe(true);
        });
    });

    describe('given an unknown template name', () => {
        it('should report a structural error', () => {
            const plan = makePlan();
            plan.pages[1] = { ...plan.pages[1], template: 'book-unknown' };
            const result = validator.validate(plan, 3, 'BOOK');
            expect(result.structuralErrors.some((e) => e.includes('book-unknown'))).toBe(true);
        });
    });

    describe('given a COMIC template used in a BOOK story', () => {
        it('should report a structural error', () => {
            const plan = makePlan();
            plan.pages[1] = { ...plan.pages[1], template: 'comic-2-panel' };
            const result = validator.validate(plan, 3, 'BOOK');
            expect(result.structuralErrors.some((e) => e.includes('COMIC'))).toBe(true);
        });
    });

    describe('given text exceeding the zone maxChars', () => {
        it('should report a length overflow (non-structural)', () => {
            const plan = makePlan();
            plan.pages[1] = { ...plan.pages[1], text: 'x'.repeat(400) }; // book-text-image body max is 300
            const result = validator.validate(plan, 3, 'BOOK');
            expect(result.structuralErrors).toHaveLength(0);
            expect(result.lengthOverflows).toHaveLength(1);
            expect(result.lengthOverflows[0].page).toBe(2);
        });
    });
});
