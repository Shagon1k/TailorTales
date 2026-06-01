import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { IEmailClient, ISendEmailInput } from './email.types.js';

@Injectable()
export class ResendClient implements IEmailClient {
    private readonly logger = new Logger(ResendClient.name);
    private readonly resend: Resend;
    private readonly from: string;

    constructor(private readonly config: ConfigService) {
        this.resend = new Resend(this.config.getOrThrow<string>('RESEND_API_KEY'));
        this.from = this.config.getOrThrow<string>('RESEND_FROM');
    }

    async send(input: ISendEmailInput): Promise<{ id: string }> {
        this.logger.log(`Sending email to ${input.to} (subject: "${input.subject}")`);

        const { data, error } = await this.resend.emails.send({
            from: this.from,
            to: input.to,
            subject: input.subject,
            html: input.html,
            text: input.text,
            replyTo: input.replyTo,
        });

        if (error) {
            this.logger.error(`Resend send failed: ${error.message}`);
            throw new Error(`Email send failed: ${error.message}`);
        }
        if (!data) {
            throw new Error('Email send returned no id');
        }

        return { id: data.id };
    }
}
