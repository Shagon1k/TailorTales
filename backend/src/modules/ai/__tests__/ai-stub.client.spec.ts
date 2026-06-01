import { AiStubClient } from '../ai-stub.client.js';

describe('AiStubClient', () => {
    let client: AiStubClient;

    beforeEach(() => {
        client = new AiStubClient();
    });

    describe('generateStoryPlan', () => {
        it('should return a valid story plan shape', async () => {
            const plan = await client.generateStoryPlan({
                systemPrompt: 'system',
                userPrompt: 'Write a 5 pages story about a fox.',
                maxTokens: 2000,
            });

            expect(plan.title).toBeTruthy();
            expect(plan.styleAnchor).toBeTruthy();
            expect(Array.isArray(plan.pages)).toBe(true);
        });

        it('should produce the correct number of pages', async () => {
            const plan = await client.generateStoryPlan({
                systemPrompt: 'system',
                userPrompt: 'Write a 8 pages story.',
                maxTokens: 3000,
            });

            expect(plan.pages).toHaveLength(8);
        });

        it('should set cover as first page and final as last page', async () => {
            const plan = await client.generateStoryPlan({
                systemPrompt: 'system',
                userPrompt: 'Write a 5 pages story.',
                maxTokens: 2000,
            });

            expect(plan.pages[0].template).toBe('book-cover');
            expect(plan.pages[plan.pages.length - 1].template).toBe('book-final');
        });

        it('should include illustration prompts on every page', async () => {
            const plan = await client.generateStoryPlan({
                systemPrompt: 'system',
                userPrompt: 'Write a 5 pages story.',
                maxTokens: 2000,
            });

            for (const page of plan.pages) {
                expect(page.illustration.prompt).toBeTruthy();
            }
        });
    });

    describe('generateImage', () => {
        it('should return a buffer', async () => {
            const buf = await client.generateImage({
                prompt: 'A fox in the forest',
                size: '1024x1536',
            });

            expect(Buffer.isBuffer(buf)).toBe(true);
            expect(buf.length).toBeGreaterThan(0);
        });
    });
});
