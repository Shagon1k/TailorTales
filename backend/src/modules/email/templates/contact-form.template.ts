import type { IEmailContent } from '../email.types.js';
import { escapeHtml } from './escape-html.js';

export interface IContactFormTemplateInput {
    senderName: string;
    senderEmail: string;
    message: string;
}

export function contactFormEmail(input: IContactFormTemplateInput): IEmailContent {
    return {
        subject: `New contact form: ${input.senderName}`,
        html: `
<!doctype html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #2d1a0e; padding: 24px;">
  <table style="max-width: 560px;">
    <tr><td>
      <h2>New contact form submission</h2>
      <p><strong>From:</strong> ${escapeHtml(input.senderName)} &lt;${escapeHtml(input.senderEmail)}&gt;</p>
      <hr style="border: none; border-top: 1px solid #e8d8c4; margin: 16px 0;">
      <pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${escapeHtml(input.message)}</pre>
    </td></tr>
  </table>
</body>
</html>`.trim(),
        text: [
            `New contact form submission`,
            `From: ${input.senderName} <${input.senderEmail}>`,
            ``,
            input.message,
        ].join('\n'),
    };
}
