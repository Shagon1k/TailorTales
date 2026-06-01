import { Injectable, Logger } from '@nestjs/common';
import type { IEmailClient, ISendEmailInput } from './email.types.js';

/** Stub used in CI / local dev — logs payload, no network call. */
@Injectable()
export class EmailStubClient implements IEmailClient {
    private readonly logger = new Logger(EmailStubClient.name);

    async send(input: ISendEmailInput): Promise<{ id: string }> {
        this.logger.log(`[STUB] would send to=${input.to} subject="${input.subject}"`);
        return { id: `stub-${Date.now()}` };
    }
}
