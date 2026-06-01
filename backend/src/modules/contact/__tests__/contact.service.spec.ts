import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ContactService } from '../contact.service.js';
import { EMAIL_CLIENT } from '../../email/email.types.js';

const mockEmail = { send: vi.fn().mockResolvedValue({ id: 'email-1' }) };
const mockConfig = { getOrThrow: vi.fn().mockReturnValue('hello@tailortales.app') };

describe('ContactService', () => {
    let service: ContactService;

    beforeEach(async () => {
        mockEmail.send.mockClear();
        mockConfig.getOrThrow.mockClear();
        mockConfig.getOrThrow.mockReturnValue('hello@tailortales.app');

        const module = await Test.createTestingModule({
            providers: [
                ContactService,
                { provide: ConfigService, useValue: mockConfig },
                { provide: EMAIL_CLIENT, useValue: mockEmail },
            ],
        }).compile();
        service = module.get(ContactService);
    });

    describe('submit', () => {
        it('should send an email to CONTACT_INBOX_EMAIL with sender as reply-to', async () => {
            await service.submit({
                name: 'Alice',
                email: 'alice@example.com',
                message: 'Hi, I have a question about your service.',
            });

            expect(mockEmail.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'hello@tailortales.app',
                    replyTo: 'alice@example.com',
                    subject: expect.stringContaining('Alice'),
                    html: expect.stringContaining('alice@example.com'),
                }),
            );
        });

        it('should propagate email send failures', async () => {
            mockEmail.send.mockRejectedValue(new Error('Resend 500'));

            await expect(
                service.submit({
                    name: 'Bob',
                    email: 'bob@example.com',
                    message: 'A perfectly fine message.',
                }),
            ).rejects.toThrow('Resend 500');
        });
    });
});
