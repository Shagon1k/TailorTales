import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BillingWebhookService } from '../billing-webhook.service.js';
import { PADDLE_CLIENT } from '../billing.types.js';
import { WebhookController } from '../webhook.controller.js';

describe('WebhookController', () => {
    let controller: WebhookController;
    let verifyAndParseWebhook: ReturnType<typeof vi.fn>;
    let handleEvent: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        verifyAndParseWebhook = vi.fn();
        handleEvent = vi.fn().mockResolvedValue(undefined);

        const module = await Test.createTestingModule({
            controllers: [WebhookController],
            providers: [
                { provide: PADDLE_CLIENT, useValue: { verifyAndParseWebhook } },
                { provide: BillingWebhookService, useValue: { handleEvent } },
            ],
        }).compile();

        controller = module.get(WebhookController);
    });

    function buildRequest(rawBody?: Buffer) {
        return { rawBody } as never;
    }

    it('should verify the signature, dispatch the event, and acknowledge', async () => {
        const event = { eventType: 'subscription.activated', data: { id: 'sub_1' } };
        verifyAndParseWebhook.mockResolvedValue(event);
        const rawBody = Buffer.from('{}');

        const result = await controller.handlePaddleWebhook(buildRequest(rawBody), 'sig');

        expect(verifyAndParseWebhook).toHaveBeenCalledWith(rawBody, 'sig');
        expect(handleEvent).toHaveBeenCalledWith(event);
        expect(result).toEqual({ received: true });
    });

    it('should return 400 when the signature is invalid', async () => {
        verifyAndParseWebhook.mockRejectedValue(new Error('bad signature'));

        await expect(
            controller.handlePaddleWebhook(buildRequest(Buffer.from('{}')), 'bad'),
        ).rejects.toThrow(BadRequestException);

        expect(handleEvent).not.toHaveBeenCalled();
    });

    it('should return 400 when the raw body is missing', async () => {
        await expect(
            controller.handlePaddleWebhook(buildRequest(undefined), 'sig'),
        ).rejects.toThrow(BadRequestException);
    });
});
