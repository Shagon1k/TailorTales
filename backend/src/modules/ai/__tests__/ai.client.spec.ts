import { ConfigService } from '@nestjs/config';
import { AiClient } from '../ai.client.js';

const mockConfig = (overrides: Record<string, unknown> = {}): ConfigService => {
    const values: Record<string, unknown> = {
        OPENROUTER_API_KEY: 'test-key',
        OPENROUTER_TEXT_MODEL: 'test-text-model',
        OPENROUTER_IMAGE_MODEL: 'test-image-model',
        ...overrides,
    };
    return { getOrThrow: (key: string) => values[key] } as unknown as ConfigService;
};

describe('AiClient', () => {
    let client: AiClient;

    beforeEach(() => {
        client = new AiClient(mockConfig());
    });

    describe('generateStoryPlan', () => {
        it('should parse a valid JSON response into a story plan', async () => {
            const plan = {
                title: 'Test Story',
                styleAnchor: 'A friendly fox.',
                pages: [
                    {
                        template: 'book-cover',
                        text: 'Title',
                        chapterTitle: null,
                        illustration: { prompt: 'Cover art' },
                    },
                ],
            };

            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: () =>
                        Promise.resolve({
                            choices: [{ message: { content: JSON.stringify(plan) } }],
                        }),
                }),
            );

            const result = await client.generateStoryPlan({
                systemPrompt: 'system',
                userPrompt: 'user',
                maxTokens: 1000,
            });

            expect(result.title).toBe('Test Story');
            expect(result.pages).toHaveLength(1);
        });

        it('should throw when the response content is not valid JSON', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: () =>
                        Promise.resolve({
                            choices: [{ message: { content: 'not json' } }],
                        }),
                }),
            );

            await expect(
                client.generateStoryPlan({
                    systemPrompt: 'sys',
                    userPrompt: 'usr',
                    maxTokens: 100,
                }),
            ).rejects.toThrow('not valid JSON');
        });

        it('should fail immediately on 4xx without retrying', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: false,
                status: 422,
                text: () => Promise.resolve('Unprocessable'),
            });
            vi.stubGlobal('fetch', fetchMock);

            await expect(
                client.generateStoryPlan({
                    systemPrompt: 'sys',
                    userPrompt: 'usr',
                    maxTokens: 100,
                }),
            ).rejects.toThrow('AI service request failed. Please try again.');

            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('should retry on 5xx up to MAX_RETRIES times', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: false,
                status: 503,
                text: () => Promise.resolve('Service unavailable'),
            });
            vi.stubGlobal('fetch', fetchMock);
            // Make retry delays instant so the test doesn't wait 7 seconds
            vi.spyOn(global, 'setTimeout').mockImplementation((fn) => {
                (fn as () => void)();
                return 0 as unknown as ReturnType<typeof setTimeout>;
            });

            await expect(
                client.generateStoryPlan({
                    systemPrompt: 'sys',
                    userPrompt: 'usr',
                    maxTokens: 100,
                }),
            ).rejects.toThrow('AI service temporarily unavailable. Please try again.');

            vi.restoreAllMocks();
            // 1 initial + 3 retries = 4
            expect(fetchMock).toHaveBeenCalledTimes(4);
        });
    });

    describe('generateImage', () => {
        it('should extract base64 from the OpenRouter message.images array', async () => {
            const fakeBase64 = Buffer.from('images array image').toString('base64');

            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: () =>
                        Promise.resolve({
                            choices: [
                                {
                                    message: {
                                        content: null,
                                        images: [
                                            {
                                                type: 'image_url',
                                                image_url: {
                                                    url: `data:image/png;base64,${fakeBase64}`,
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        }),
                }),
            );

            const buf = await client.generateImage({ prompt: 'a fox', size: '1024x1536' });

            expect(Buffer.isBuffer(buf)).toBe(true);
            expect(buf.toString()).toBe('images array image');
        });

        it('should extract base64 from image_url content part', async () => {
            const fakeBase64 = Buffer.from('fake image').toString('base64');

            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: () =>
                        Promise.resolve({
                            choices: [
                                {
                                    message: {
                                        content: [
                                            { type: 'text', text: '' },
                                            {
                                                type: 'image_url',
                                                image_url: {
                                                    url: `data:image/png;base64,${fakeBase64}`,
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        }),
                }),
            );

            const buf = await client.generateImage({ prompt: 'a fox', size: '1024x1536' });

            expect(Buffer.isBuffer(buf)).toBe(true);
            expect(buf.toString()).toBe('fake image');
        });

        it('should extract base64 from plain data URL string content', async () => {
            const fakeBase64 = Buffer.from('fox image').toString('base64');

            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: () =>
                        Promise.resolve({
                            choices: [
                                {
                                    message: { content: `data:image/png;base64,${fakeBase64}` },
                                },
                            ],
                        }),
                }),
            );

            const buf = await client.generateImage({ prompt: 'a fox', size: '1024x1536' });
            expect(buf.toString()).toBe('fox image');
        });

        it('should send reference images alongside the prompt when provided', async () => {
            const fakeBase64 = Buffer.from('reference image').toString('base64');
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: () =>
                    Promise.resolve({
                        choices: [
                            {
                                message: { content: `data:image/png;base64,${fakeBase64}` },
                            },
                        ],
                    }),
            });
            vi.stubGlobal('fetch', fetchMock);

            await client.generateImage({
                prompt: 'a fox hero',
                size: '1024x1536',
                referenceImageUrls: ['https://signed.test/char-1.png'],
            });

            expect(fetchMock).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: JSON.stringify({
                        model: 'test-image-model',
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    { type: 'text', text: 'a fox hero' },
                                    {
                                        type: 'image_url',
                                        image_url: { url: 'https://signed.test/char-1.png' },
                                    },
                                ],
                            },
                        ],
                        modalities: ['image'],
                        image_size: { width: 1024, height: 1536 },
                    }),
                }),
            );
        });

        it('should throw on unexpected content format', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: () =>
                        Promise.resolve({
                            choices: [{ message: { content: 'unexpected plain text' } }],
                        }),
                }),
            );

            await expect(
                client.generateImage({ prompt: 'a fox', size: '1024x1536' }),
            ).rejects.toThrow('Unexpected image response format');
        });
    });
});
