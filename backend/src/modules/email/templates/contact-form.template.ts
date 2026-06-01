export interface IContactFormTemplateInput {
    senderName: string;
    senderEmail: string;
    message: string;
}

export function contactFormSubject(senderName: string): string {
    return `New contact form: ${senderName}`;
}

export function contactFormHtml(input: IContactFormTemplateInput): string {
    return `
<!doctype html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #2d1a0e; padding: 24px;">
  <table style="max-width: 560px;">
    <tr><td>
      <h2>New contact form submission</h2>
      <p><strong>From:</strong> ${escape(input.senderName)} &lt;${escape(input.senderEmail)}&gt;</p>
      <hr style="border: none; border-top: 1px solid #e8d8c4; margin: 16px 0;">
      <pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${escape(input.message)}</pre>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

export function contactFormText(input: IContactFormTemplateInput): string {
    return [
        `New contact form submission`,
        `From: ${input.senderName} <${input.senderEmail}>`,
        ``,
        input.message,
    ].join('\n');
}

function escape(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
