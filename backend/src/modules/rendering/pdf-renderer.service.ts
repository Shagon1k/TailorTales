import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import puppeteer, { type Browser } from 'puppeteer';
import { PDFDocument } from 'pdf-lib';
import { PAGE_TEMPLATES } from './page-templates.config.js';
import type { IPageToRender, IStoryToRender } from './rendering.types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, 'templates');
const FONTS_DIR = join(__dirname, 'assets', 'fonts');

@Injectable()
export class PdfRendererService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PdfRendererService.name);
    private browser!: Browser;

    private readonly baseTemplate = Handlebars.compile(
        readFileSync(join(TEMPLATES_DIR, '_base.hbs'), 'utf8'),
    );

    private readonly pageTemplates = new Map<string, HandlebarsTemplateDelegate>(
        Object.entries(PAGE_TEMPLATES).map(([name, tpl]) => {
            const source = readFileSync(join(TEMPLATES_DIR, tpl.htmlFile), 'utf8');
            return [name, Handlebars.compile(source)];
        }),
    );

    async onModuleInit(): Promise<void> {
        this.browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
            ],
        });
        this.logger.log('Puppeteer browser started');
    }

    async onModuleDestroy(): Promise<void> {
        await this.browser?.close();
        this.logger.log('Puppeteer browser closed');
    }

    async render(story: IStoryToRender): Promise<Buffer> {
        this.logger.log(`Rendering PDF: "${story.title}" (${story.pages.length} pages)`);

        const pageBuffers: Buffer[] = [];
        for (const page of story.pages) {
            pageBuffers.push(await this.renderPage(page, story));
        }

        return this.stitchPages(pageBuffers);
    }

    private async renderPage(page: IPageToRender, story: IStoryToRender): Promise<Buffer> {
        const templateFn = this.pageTemplates.get(page.layout);
        if (!templateFn) {
            throw new Error(`Unknown page template: "${page.layout}"`);
        }

        const pageContent = templateFn(this.buildPageContext(page, story));
        const fullHtml = this.baseTemplate({
            lang: 'en',
            fontsDir: `file://${FONTS_DIR}`,
            watermark: story.watermark,
            pageContent,
        });

        const tab = await this.browser.newPage();
        try {
            await tab.setContent(fullHtml, { waitUntil: 'load' });
            await tab.waitForFunction('document.fonts.status === "loaded"');

            const pdfBytes = await tab.pdf({
                width: '148mm',
                height: '210mm',
                printBackground: true,
                margin: { top: 0, right: 0, bottom: 0, left: 0 },
            });

            return Buffer.from(pdfBytes);
        } finally {
            await tab.close();
        }
    }

    private buildPageContext(page: IPageToRender, story: IStoryToRender): Record<string, unknown> {
        const base: Record<string, unknown> = {
            imageBase64: page.imageBase64 ?? null,
            chapterTitle: page.chapterTitle ?? null,
            watermark: story.watermark,
        };

        switch (page.layout) {
            case 'book-cover':
                return { ...base, title: page.text ?? story.title, subtitle: story.childName };
            case 'book-text':
                return { ...base, text: page.text };
            case 'book-text-image':
                return { ...base, text: page.text };
            case 'book-full-image':
                return { ...base, caption: page.text };
            case 'book-final':
                return { ...base, text: page.text, tagline: `A tale for ${story.childName}` };
            default:
                return { ...base, text: page.text };
        }
    }

    private async stitchPages(pageBuffers: Buffer[]): Promise<Buffer> {
        const merged = await PDFDocument.create();

        for (const buf of pageBuffers) {
            const src = await PDFDocument.load(buf);
            const [copied] = await merged.copyPages(src, [0]);
            merged.addPage(copied);
        }

        const bytes = await merged.save();
        return Buffer.from(bytes);
    }
}
