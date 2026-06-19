import {
    Catch,
    HttpException,
    HttpStatus,
    Logger,
    type ArgumentsHost,
    type ExceptionFilter,
} from '@nestjs/common';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import type { Request, Response } from 'express';
import {
    type IErrorParams,
    type ILocale,
    type ILocalizedErrorBody,
    resolveLocale,
    translate,
} from './error-translations.js';

/**
 * Global HTTP exception filter. Handles two cases:
 *
 * 1. HttpException (and subclasses like NotFoundException, ConflictException, etc.) —
 *    formats consistently, logs only 5xx (4xx are expected, not actionable).
 *    Known error codes are translated via the Accept-Language header.
 *
 * 2. Unexpected errors — logged with full stack trace, returned as 500 so internal
 *    details never leak to the client.
 *
 * The BullMQ generation pipeline runs outside HTTP context; its errors are handled
 * by the pipeline catch block, not here.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    @SentryExceptionCaptured()
    catch(exception: unknown, host: ArgumentsHost): void {
        if (host.getType() !== 'http') return;

        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const locale = resolveLocale(request.headers['accept-language']);

        const isHttp = exception instanceof HttpException;
        const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        if (!isHttp || status >= 500) {
            const detail = exception instanceof Error ? exception.message : String(exception);
            const stack = exception instanceof Error ? exception.stack : undefined;
            this.logger.error(`${request.method} ${request.url} [${status}]: ${detail}`, stack);
        }

        const message = isHttp
            ? this.extractMessage(exception, locale)
            : (translate('errors.unknown', locale) ?? 'An unexpected error occurred.');

        response.status(status).json({ statusCode: status, message });
    }

    private extractMessage(exception: HttpException, locale: ILocale): string | string[] {
        const body = exception.getResponse();

        // Parameterized localized error: { code, params? }
        if (typeof body === 'object' && body !== null && 'code' in body) {
            const { code, params } = body as ILocalizedErrorBody;
            return translate(code, locale, params as IErrorParams | undefined) ?? code;
        }

        // Simple error: string code or plain message
        if (typeof body === 'string') {
            return translate(body, locale) ?? body;
        }

        // NestJS default shape: { message, ... }
        if (typeof body === 'object' && body !== null && 'message' in body) {
            const msg = (body as { message: string | string[] }).message;
            if (typeof msg === 'string') {
                return translate(msg, locale) ?? msg;
            }
            return msg;
        }

        return exception.message;
    }
}
