import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMAIL_CLIENT, type IEmailClient } from '../email/email.types.js';
import { contactFormEmail } from '../email/templates/contact-form.template.js';
import { ContactDto } from './dto/contact.dto.js';

@Injectable()
export class ContactService {
    private readonly logger = new Logger(ContactService.name);

    constructor(
        private readonly config: ConfigService,
        @Inject(EMAIL_CLIENT) private readonly email: IEmailClient,
    ) {}

    async submit(dto: ContactDto): Promise<void> {
        const inbox = this.config.getOrThrow<string>('CONTACT_INBOX_EMAIL');
        this.logger.log(`Contact submission from ${dto.email}`);

        await this.email.send({
            to: inbox,
            ...contactFormEmail({
                senderName: dto.name,
                senderEmail: dto.email,
                message: dto.message,
            }),
            replyTo: dto.email,
        });
    }
}
