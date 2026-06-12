import { Injectable, Logger } from '@nestjs/common';
import type { Child, Page, Story } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { StorageKeys } from '../storage/storage.keys.js';
import { QuotaService } from '../subscriptions/quota.service.js';
import { PdfRendererService } from './pdf-renderer.service.js';
import type { IPageToRender } from './rendering.types.js';

type StoryForBinding = Pick<Story, 'id' | 'userId' | 'title' | 'question'> & {
    child: Pick<Child, 'name'>;
};

@Injectable()
export class PdfBindingService {
    private readonly logger = new Logger(PdfBindingService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        private readonly renderer: PdfRendererService,
        private readonly quotaService: QuotaService,
    ) {}

    /**
     * Renders all story pages into a PDF and persists it.
     *
     * Fetches each page's illustration from S3 as base64, renders via PdfRendererService,
     * uploads the PDF buffer to S3, and updates story.pdfKey on the Story row.
     *
     * Does NOT change story.status — that is the caller's responsibility.
     */
    async buildAndStore(story: StoryForBinding, pages: Page[]): Promise<void> {
        const pagesToRender: IPageToRender[] = await Promise.all(
            pages.map(async (page) => {
                const illustrations = page.illustrations as Array<{ key: string }> | null;
                const imageKey = illustrations?.[0]?.key ?? null;

                let imageBase64: string | null = null;
                if (imageKey) {
                    const url = await this.storage.getSignedUrl(imageKey);
                    const res = await fetch(url);
                    const buf = await res.arrayBuffer();
                    imageBase64 = Buffer.from(buf).toString('base64');
                }

                return {
                    order: page.order,
                    layout: page.layout ?? 'book-text',
                    text: page.text,
                    chapterTitle: page.chapterTitle,
                    imageBase64,
                };
            }),
        );

        const pdfBuffer = await this.renderer.render({
            title: story.title ?? story.question,
            childName: story.child.name,
            pages: pagesToRender,
            watermark: await this.quotaService.getWatermarkForUser(story.userId),
        });

        const pdfKey = StorageKeys.storyPdf(story.userId, story.id);
        await this.storage.upload(pdfBuffer, pdfKey, 'application/pdf');

        await this.prisma.story.update({
            where: { id: story.id },
            data: { pdfKey },
        });

        this.logger.log(`PDF stored for story ${story.id} at ${pdfKey}`);
    }
}
