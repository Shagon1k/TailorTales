export interface IStoryFailedTemplateInput {
    parentName: string;
    childName: string;
    question: string;
    workshopUrl: string;
}

export function storyFailedSubject(): string {
    return `We hit a snag on your tale`;
}

export function storyFailedHtml(input: IStoryFailedTemplateInput): string {
    return `
<!doctype html>
<html lang="en">
<body style="font-family: Georgia, serif; color: #2d1a0e; background: #fdf6ec; padding: 24px;">
  <table align="center" style="max-width: 560px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 8px;">
    <tr><td>
      <p style="font-size: 14px; color: #b23641; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 16px;">A small hiccup</p>
      <h1 style="font-size: 24px; margin: 0 0 16px;">Hi ${escape(input.parentName)},</h1>
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
        We couldn't finish ${escape(input.childName)}'s tale about <em>${escape(input.question)}</em>.
        No credits were spent — try again whenever you're ready.
      </p>
      <p style="margin: 24px 0;">
        <a href="${input.workshopUrl}" style="display: inline-block; padding: 12px 24px; background: #f86e42; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Try again →
        </a>
      </p>
      <p style="font-size: 14px; color: #734847; margin: 24px 0 0;">
        — TailorTales
      </p>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

export function storyFailedText(input: IStoryFailedTemplateInput): string {
    return [
        `Hi ${input.parentName},`,
        '',
        `We couldn't finish ${input.childName}'s tale about "${input.question}".`,
        `No credits were spent — try again whenever you're ready: ${input.workshopUrl}`,
        '',
        '— TailorTales',
    ].join('\n');
}

function escape(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
