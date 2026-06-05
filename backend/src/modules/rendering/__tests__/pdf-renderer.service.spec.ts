import { Test } from '@nestjs/testing';
import { PdfRendererService } from '../pdf-renderer.service.js';
import {
    THREE_PAGE_STORY_FIXTURE,
    FIVE_PAGE_STORY_FIXTURE,
} from '../__fixtures__/story-plan.fixture.js';

describe.skipIf(!!process.env.CI)('PdfRendererService', () => {
    let service: PdfRendererService;

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            providers: [PdfRendererService],
        }).compile();

        service = module.get(PdfRendererService);
        await service.onModuleInit();
    }, 30_000);

    afterAll(async () => {
        await service.onModuleDestroy();
    });

    describe('given a 3-page story fixture', () => {
        it('should produce a valid PDF buffer', async () => {
            const pdf = await service.render(THREE_PAGE_STORY_FIXTURE);

            expect(Buffer.isBuffer(pdf)).toBe(true);
            // PDF magic bytes
            expect(pdf.slice(0, 4).toString()).toBe('%PDF');
        }, 60_000);
    });

    describe('given a 5-page story fixture with watermark', () => {
        it('should produce a PDF buffer for all 5 templates', async () => {
            const pdf = await service.render(FIVE_PAGE_STORY_FIXTURE);

            expect(Buffer.isBuffer(pdf)).toBe(true);
            expect(pdf.slice(0, 4).toString()).toBe('%PDF');
            // pdf-lib merges pages; result should be larger than a single page
            expect(pdf.length).toBeGreaterThan(10_000);
        }, 60_000);
    });

    describe('given a page with an unknown template', () => {
        it('should throw with the template name', async () => {
            await expect(
                service.render({
                    ...THREE_PAGE_STORY_FIXTURE,
                    pages: [{ ...THREE_PAGE_STORY_FIXTURE.pages[0], layout: 'book-unknown' }],
                }),
            ).rejects.toThrow('book-unknown');
        }, 30_000);
    });
});
