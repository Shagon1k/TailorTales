import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AuthEmailAllowlistService } from '../auth-email-allowlist.service.js';

async function createService(
    configuredEmails: string | undefined,
): Promise<AuthEmailAllowlistService> {
    const module = await Test.createTestingModule({
        providers: [
            AuthEmailAllowlistService,
            {
                provide: ConfigService,
                useValue: { get: vi.fn().mockReturnValue(configuredEmails) },
            },
        ],
    }).compile();

    return module.get(AuthEmailAllowlistService);
}

describe('AuthEmailAllowlistService', () => {
    describe('given no configured allowlist', () => {
        it.each([undefined, '', '   '])(
            'should allow every email when the configured value is %s',
            async (configuredEmails) => {
                const service = await createService(configuredEmails);

                expect(() => service.assertAllowed('anyone@example.com')).not.toThrow();
            },
        );
    });

    describe('given a configured allowlist', () => {
        it('should match exact emails without case or surrounding whitespace', async () => {
            const service = await createService(' First@Example.com, second@example.com ');

            expect(() => service.assertAllowed(' first@example.COM ')).not.toThrow();
            expect(() => service.assertAllowed('SECOND@example.com')).not.toThrow();
        });

        it('should reject an email that is not listed', async () => {
            const service = await createService('allowed@example.com');

            expect(() => service.assertAllowed('other@example.com')).toThrow(UnauthorizedException);
        });

        it('should reject malformed configuration at startup', async () => {
            await expect(createService('allowed@example.com,not-an-email')).rejects.toThrow(
                'AUTH_ALLOWED_EMAILS must be a comma-separated list of valid email addresses',
            );
        });
    });
});
