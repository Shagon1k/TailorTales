import { apiFetch, ApiError } from '../api';

function mockResponse(status: number, body?: unknown, contentType = 'application/json'): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 200 ? 'OK' : status === 403 ? 'Forbidden' : 'Bad Request',
        headers: { get: (h: string) => (h === 'content-type' ? contentType : null) },
        json: () => Promise.resolve(body),
    } as unknown as Response;
}

describe('apiFetch', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('success path', () => {
        it('should return the parsed JSON body on 2xx', async () => {
            vi.mocked(fetch).mockResolvedValue(mockResponse(200, { id: 'story-1' }));

            const result = await apiFetch<{ id: string }>('/stories/1');
            expect(result).toEqual({ id: 'story-1' });
        });

        it('should return undefined for non-JSON responses', async () => {
            vi.mocked(fetch).mockResolvedValue(mockResponse(200, undefined, 'text/plain'));

            const result = await apiFetch('/auth/logout');
            expect(result).toBeUndefined();
        });
    });

    describe('error path', () => {
        it('should throw ApiError with message from JSON body', async () => {
            vi.mocked(fetch).mockResolvedValue(
                mockResponse(403, {
                    message: 'This story needs 5 credits but only 4 of 12 are left this month.',
                }),
            );

            await expect(apiFetch('/stories')).rejects.toMatchObject({
                status: 403,
                message: 'This story needs 5 credits but only 4 of 12 are left this month.',
            });
        });

        it('should take the first item when message is an array (validation pipe)', async () => {
            vi.mocked(fetch).mockResolvedValue(
                mockResponse(400, { message: ['name must be a string', 'score must be a number'] }),
            );

            const err = await apiFetch('/ratings').catch((e) => e);
            expect(err).toBeInstanceOf(ApiError);
            expect(err.message).toBe('name must be a string');
        });

        it('should fall back to status text when body has no message field', async () => {
            vi.mocked(fetch).mockResolvedValue(mockResponse(403, { error: 'Forbidden' }));

            const err = await apiFetch('/stories').catch((e) => e);
            expect(err).toBeInstanceOf(ApiError);
            expect(err.message).toBe('403: Forbidden');
        });

        it('should fall back to status text for non-JSON error responses', async () => {
            vi.mocked(fetch).mockResolvedValue(mockResponse(503, undefined, 'text/html'));

            const err = await apiFetch('/stories').catch((e) => e);
            expect(err).toBeInstanceOf(ApiError);
            expect(err.status).toBe(503);
            // statusText comes from the mock helper — just verify the format
            expect(err.message).toMatch(/^503:/);
        });
    });

    describe('Accept-Language header', () => {
        it('should send Accept-Language from document.documentElement.lang', async () => {
            document.documentElement.lang = 'de';
            vi.mocked(fetch).mockResolvedValue(mockResponse(200, {}));

            await apiFetch('/test');

            const [, init] = vi.mocked(fetch).mock.calls[0];
            expect((init?.headers as Record<string, string>)['Accept-Language']).toBe('de');

            document.documentElement.lang = '';
        });

        it('should omit the header when lang is empty', async () => {
            document.documentElement.lang = '';
            vi.mocked(fetch).mockResolvedValue(mockResponse(200, {}));

            await apiFetch('/test');

            const [, init] = vi.mocked(fetch).mock.calls[0];
            expect((init?.headers as Record<string, string>)['Accept-Language']).toBeUndefined();
        });

        it('should omit Content-Type when sending FormData', async () => {
            vi.mocked(fetch).mockResolvedValue(mockResponse(200, {}));

            const formData = new FormData();
            formData.append('avatar', new Blob(['avatar'], { type: 'image/png' }), 'avatar.png');

            await apiFetch('/me/avatar', {
                method: 'POST',
                body: formData,
            });

            const [, init] = vi.mocked(fetch).mock.calls[0];
            expect((init?.headers as Record<string, string>)['Content-Type']).toBeUndefined();
        });
    });
});
