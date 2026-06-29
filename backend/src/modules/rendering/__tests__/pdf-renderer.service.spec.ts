import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PdfRendererService } from '../pdf-renderer.service.js';
import {
    THREE_PAGE_STORY_FIXTURE,
    FIVE_PAGE_STORY_FIXTURE,
} from '../__fixtures__/story-plan.fixture.js';

describe.skipIf(!!process.env.CI)('PdfRendererService', () => {
    let service: PdfRendererService;

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            providers: [
                PdfRendererService,
                {
                    provide: ConfigService,
                    useValue: { getOrThrow: () => 'http://localhost:3001' },
                },
            ],
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

    describe('given the middle-image template', () => {
        it('should split prose around the illustration in the generated HTML', () => {
            const html = service.buildPageHtml(
                {
                    order: 2,
                    layout: 'book-image-middle',
                    chapterTitle: 'A quiet turn',
                    text: 'Maya watched the fireflies gather. Then the garden began to glow around her.',
                    imageBase64: null,
                },
                THREE_PAGE_STORY_FIXTURE,
            );

            expect(html).toContain('image-middle__lead');
            expect(html).toContain('Maya watched the fireflies gather.');
            expect(html).toContain('Then the garden began to glow around her.');
        });
    });

    describe('given a watermarked page', () => {
        it('should render a compact two-line watermark with the fox mark', () => {
            const html = service.buildPageHtml(
                FIVE_PAGE_STORY_FIXTURE.pages[0],
                FIVE_PAGE_STORY_FIXTURE,
            );

            expect(html).toContain("class='watermark'");
            expect(html).toContain('TailorTales');
            expect(html).toContain('Preview');
            expect(html).toContain('🦊');
        });
    });
});
