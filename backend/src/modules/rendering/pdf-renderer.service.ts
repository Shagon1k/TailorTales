import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import { PDFDocument } from 'pdf-lib';
import { ConfigService } from '@nestjs/config';
import { PAGE_TEMPLATES } from './page-templates.config.js';
import type { IPageToRender, IStoryToRender } from './rendering.types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, 'templates');

@Injectable()
export class PdfRendererService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PdfRendererService.name);
    private browser: Browser | null = null;
    private launchPromise: Promise<Browser> | null = null;
    private readonly fontsUrl: string;

    constructor(config: ConfigService) {
        this.fontsUrl = `${config.getOrThrow<string>('BACKEND_URL')}/static/fonts`;
    }

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
        await this.ensureBrowser();
    }

    async onModuleDestroy(): Promise<void> {
        this.launchPromise = null;
        await this.browser?.close();
        this.browser = null;
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

    /** Returns the full HTML string for a single page. Used by both PDF rendering and the
     *  browser iframe preview endpoint (`GET /stories/:id/pages/:order/html`). */
    buildPageHtml(page: IPageToRender, story: IStoryToRender): string {
        const templateFn = this.pageTemplates.get(page.layout);
        if (!templateFn) {
            throw new Error(`Unknown page template: "${page.layout}"`);
        }

        const pageContent = templateFn(this.buildPageContext(page, story));
        return this.baseTemplate({
            lang: 'en',
            fontsDir: this.fontsUrl,
            watermark: story.watermark,
            pageContent,
        });
    }

    private async renderPage(page: IPageToRender, story: IStoryToRender): Promise<Buffer> {
        const fullHtml = this.buildPageHtml(page, story);

        try {
            return await this.renderPageOnce(fullHtml);
        } catch (err: unknown) {
            if (!this.isRecoverableBrowserDisconnect(err)) throw err;

            const techMessage = err instanceof Error ? err.message : String(err);
            this.logger.warn(
                `Puppeteer connection dropped during PDF render; retrying once: ${techMessage}`,
            );
            await this.restartBrowser();
            return this.renderPageOnce(fullHtml);
        }
    }

    private async renderPageOnce(fullHtml: string): Promise<Buffer> {
        const browser = await this.ensureBrowser();
        const tab = await browser.newPage();
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
            await this.closeTabQuietly(tab);
        }
    }

    private async ensureBrowser(): Promise<Browser> {
        if (this.browser && this.browser.connected) return this.browser;
        if (this.launchPromise) return this.launchPromise;

        this.launchPromise = this.launchBrowser();

        try {
            this.browser = await this.launchPromise;
            return this.browser;
        } finally {
            this.launchPromise = null;
        }
    }

    private async launchBrowser(): Promise<Browser> {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
            ],
        });

        browser.on('disconnected', () => {
            this.logger.warn('Puppeteer browser disconnected');
            this.browser = null;
        });

        this.logger.log('Puppeteer browser started');
        return browser;
    }

    private async restartBrowser(): Promise<void> {
        const previousBrowser = this.browser;
        this.browser = null;
        this.launchPromise = null;

        try {
            await previousBrowser?.close();
        } catch (err: unknown) {
            const techMessage = err instanceof Error ? err.message : String(err);
            this.logger.warn(`Failed to close stale Puppeteer browser cleanly: ${techMessage}`);
        }

        await this.ensureBrowser();
    }

    private isRecoverableBrowserDisconnect(err: unknown): boolean {
        if (!(err instanceof Error)) return false;
        return (
            err.message.includes('Connection closed') ||
            err.message.includes('Protocol error') ||
            err.message.includes('Target closed')
        );
    }

    private async closeTabQuietly(tab: Page): Promise<void> {
        try {
            await tab.close();
        } catch (err: unknown) {
            if (!this.isRecoverableBrowserDisconnect(err)) throw err;
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
