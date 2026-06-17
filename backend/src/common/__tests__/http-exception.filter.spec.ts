import {
    BadRequestException,
    ForbiddenException,
    HttpException,
    type ArgumentsHost,
} from '@nestjs/common';

import { AllExceptionsFilter } from '../http-exception.filter.js';

function buildHost(acceptLanguage?: string): ArgumentsHost {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    return {
        getType: () => 'http',
        switchToHttp: () => ({
            getResponse: () => ({ status }),
            getRequest: () => ({
                method: 'GET',
                url: '/test',
                headers: { 'accept-language': acceptLanguage },
            }),
        }),
    } as unknown as ArgumentsHost;
}

function captureResponse(host: ArgumentsHost): { statusCode: number; message: unknown } {
    const res = (host.switchToHttp().getResponse() as { status: ReturnType<typeof vi.fn> }).status;
    const json = res.mock.results[0]?.value?.json as ReturnType<typeof vi.fn>;
    return json.mock.calls[0]?.[0] as { statusCode: number; message: unknown };
}

describe('AllExceptionsFilter', () => {
    let filter: AllExceptionsFilter;

    beforeEach(() => {
        filter = new AllExceptionsFilter();
    });

    describe('locale resolution via Accept-Language', () => {
        it('should return English for a known string code when no Accept-Language is set', () => {
            const host = buildHost(undefined);
            filter.catch(new BadRequestException('errors.ratings.storyNotCompleted'), host);
            const { message } = captureResponse(host);
            expect(message).toBe('Only completed stories can be rated.');
        });

        it('should return German when Accept-Language is de', () => {
            const host = buildHost('de');
            filter.catch(new BadRequestException('errors.ratings.storyNotCompleted'), host);
            const { message } = captureResponse(host);
            expect(message).toBe('Nur abgeschlossene Geschichten können bewertet werden.');
        });

        it('should return Russian when Accept-Language is ru', () => {
            const host = buildHost('ru');
            filter.catch(new BadRequestException('errors.ratings.storyNotCompleted'), host);
            const { message } = captureResponse(host);
            expect(message).toBe('Оценивать можно только завершённые истории.');
        });

        it('should pick de from a q-weighted header with an unknown first tag', () => {
            const host = buildHost('fr,de;q=0.9');
            filter.catch(new BadRequestException('errors.ratings.storyNotCompleted'), host);
            const { message } = captureResponse(host);
            expect(message).toBe('Nur abgeschlossene Geschichten können bewertet werden.');
        });
    });

    describe('parameterized { code, params } error body', () => {
        it('should interpolate params into the translated message', () => {
            const host = buildHost('en');
            filter.catch(
                new ForbiddenException({
                    code: 'errors.quota.pageCreditsExceeded',
                    params: { cost: 5, remaining: 4, limit: 12 },
                }),
                host,
            );
            const { message } = captureResponse(host);
            expect(typeof message).toBe('string');
            expect(message as string).toContain('5');
            expect(message as string).toContain('4');
            expect(message as string).toContain('12');
        });

        it('should interpolate params in German', () => {
            const host = buildHost('de');
            filter.catch(
                new ForbiddenException({
                    code: 'errors.quota.regenerationsExceeded',
                    params: { limit: 3 },
                }),
                host,
            );
            const { message } = captureResponse(host);
            expect(message as string).toContain('3');
        });
    });

    describe('unknown error codes pass through as-is', () => {
        it('should return the raw message string when not a known code', () => {
            const host = buildHost('de');
            filter.catch(new BadRequestException('Some unrelated message'), host);
            const { message } = captureResponse(host);
            expect(message).toBe('Some unrelated message');
        });
    });

    describe('unexpected (non-HTTP) errors', () => {
        it('should return a localized fallback message in English', () => {
            const host = buildHost('en');
            filter.catch(new Error('internal boom'), host);
            const { message, statusCode } = captureResponse(host);
            expect(statusCode).toBe(500);
            expect(message).toBe('An unexpected error occurred.');
        });

        it('should return a localized fallback message in German', () => {
            const host = buildHost('de');
            filter.catch(new Error('internal boom'), host);
            const { message } = captureResponse(host);
            expect(message).toBe('Ein unerwarteter Fehler ist aufgetreten.');
        });
    });

    describe('non-HTTP contexts', () => {
        it('should be a no-op outside HTTP context', () => {
            const host = { getType: () => 'ws' } as unknown as ArgumentsHost;
            expect(() => filter.catch(new HttpException('oops', 400), host)).not.toThrow();
        });
    });
});
