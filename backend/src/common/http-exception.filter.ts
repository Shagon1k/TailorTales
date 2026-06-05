import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Global HTTP exception filter. Handles two cases:
 *
 * 1. HttpException (and subclasses like NotFoundException, ConflictException, etc.) —
 *    formats consistently, logs only 5xx (4xx are expected, not actionable).
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

    catch(exception: unknown, host: ArgumentsHost): void {
        if (host.getType() !== 'http') return;

        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const isHttp = exception instanceof HttpException;
        const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        if (!isHttp || status >= 500) {
            const detail = exception instanceof Error ? exception.message : String(exception);
            const stack = exception instanceof Error ? exception.stack : undefined;
            this.logger.error(`${request.method} ${request.url} [${status}]: ${detail}`, stack);
        }

        const message = isHttp ? this.extractMessage(exception) : 'An unexpected error occurred.';

        response.status(status).json({ statusCode: status, message });
    }

    private extractMessage(exception: HttpException): string | string[] {
        const body = exception.getResponse();
        if (typeof body === 'string') return body;
        if (typeof body === 'object' && body !== null && 'message' in body) {
            return (body as { message: string | string[] }).message;
        }
        return exception.message;
    }
}
