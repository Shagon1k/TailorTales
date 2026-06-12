import type { IEmailContent } from '../email.types.js';
import { escapeHtml } from './escape-html.js';

export interface IPaymentFailedTemplateInput {
    parentName: string;
    billingUrl: string;
}

export function paymentFailedEmail(input: IPaymentFailedTemplateInput): IEmailContent {
    return {
        subject: `We couldn't process your payment`,
        html: `
<!doctype html>
<html lang="en">
<body style="font-family: Georgia, serif; color: #2d1a0e; background: #fdf6ec; padding: 24px;">
  <table align="center" style="max-width: 560px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 8px;">
    <tr><td>
      <p style="font-size: 14px; color: #b23641; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 16px;">Payment issue</p>
      <h1 style="font-size: 24px; margin: 0 0 16px;">Hi ${escapeHtml(input.parentName)},</h1>
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
        We couldn't process the payment for your TailorTales subscription.
        Please check your payment method — we'll retry automatically, and your plan
        stays active in the meantime.
      </p>
      <p style="margin: 24px 0;">
        <a href="${input.billingUrl}" style="display: inline-block; padding: 12px 24px; background: #f86e42; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Review billing →
        </a>
      </p>
      <p style="font-size: 14px; color: #734847; margin: 24px 0 0;">
        — TailorTales
      </p>
    </td></tr>
  </table>
</body>
</html>`.trim(),
        text: [
            `Hi ${input.parentName},`,
            '',
            `We couldn't process the payment for your TailorTales subscription.`,
            `Please check your payment method — we'll retry automatically, and your plan stays active in the meantime.`,
            '',
            `Review billing: ${input.billingUrl}`,
            '',
            '— TailorTales',
        ].join('\n'),
    };
}
