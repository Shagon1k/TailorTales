import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { resolveClientIp } from './client-ip.js';

@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
    protected override getTracker(request: Request): Promise<string> {
        return Promise.resolve(
            resolveClientIp({
                cloudflareIp: request.get('cf-connecting-ip'),
                forwardedFor: request.get('x-forwarded-for'),
                requestIp: request.ip ?? request.socket.remoteAddress ?? 'unknown',
            }),
        );
    }
}
