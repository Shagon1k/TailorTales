export interface ISendEmailInput {
    to: string;
    subject: string;
    html: string;
    /** Optional plain-text fallback. */
    text?: string;
    /** Reply-To header — used by contact form so admin can reply directly to the sender. */
    replyTo?: string;
}

export interface IEmailClient {
    send(input: ISendEmailInput): Promise<{ id: string }>;
}

export const EMAIL_CLIENT = Symbol('EMAIL_CLIENT');
