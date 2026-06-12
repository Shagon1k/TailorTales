import type { IEmailContent } from '../email.types.js';
import { escapeHtml } from './escape-html.js';

export interface IStoryCompletedTemplateInput {
    parentName: string;
    childName: string;
    storyTitle: string;
    storyUrl: string;
}

export function storyCompletedEmail(input: IStoryCompletedTemplateInput): IEmailContent {
    return {
        subject: `${input.childName}'s tale is ready to read`,
        html: `
<!doctype html>
<html lang="en">
<body style="font-family: Georgia, serif; color: #2d1a0e; background: #fdf6ec; padding: 24px;">
  <table align="center" style="max-width: 560px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 8px;">
    <tr><td>
      <p style="font-size: 14px; color: #c26a2a; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 16px;">A small parcel</p>
      <h1 style="font-size: 24px; margin: 0 0 16px;">Hi ${escapeHtml(input.parentName)},</h1>
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
        ${escapeHtml(input.childName)}'s new tale, <strong>"${escapeHtml(input.storyTitle)}"</strong>, is ready to read.
      </p>
      <p style="margin: 24px 0;">
        <a href="${input.storyUrl}" style="display: inline-block; padding: 12px 24px; background: #f86e42; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Open the tale →
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
            `${input.childName}'s new tale, "${input.storyTitle}", is ready to read.`,
            '',
            `Open it here: ${input.storyUrl}`,
            '',
            '— TailorTales',
        ].join('\n'),
    };
}
