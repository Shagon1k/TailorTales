import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isEmail } from 'class-validator';

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

@Injectable()
export class AuthEmailAllowlistService {
    private readonly allowedEmails: ReadonlySet<string> | null;

    constructor(configService: ConfigService) {
        const configuredEmails = configService.get<string>('AUTH_ALLOWED_EMAILS');

        if (!configuredEmails?.trim()) {
            this.allowedEmails = null;
            return;
        }

        const emails = configuredEmails
            .split(',')
            .map(normalizeEmail)
            .filter((email) => email.length > 0);

        if (emails.length === 0 || emails.some((email) => !isEmail(email))) {
            throw new Error(
                'AUTH_ALLOWED_EMAILS must be a comma-separated list of valid email addresses',
            );
        }

        this.allowedEmails = new Set(emails);
    }

    assertAllowed(email: string): void {
        if (this.allowedEmails === null) return;

        if (!this.allowedEmails.has(normalizeEmail(email))) {
            throw new UnauthorizedException('errors.auth.emailNotAllowed');
        }
    }
}
