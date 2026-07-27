'use server';

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';

export type TContactFormState =
    | { status: 'idle' }
    | { status: 'success' }
    | { status: 'error'; message: string };

export async function submitContact(
    _prev: TContactFormState,
    data: FormData,
): Promise<TContactFormState> {
    const name = (data.get('name') as string | null)?.trim();
    const email = (data.get('email') as string | null)?.trim();
    const message = (data.get('message') as string | null)?.trim();

    if (!name || !email || !message) {
        return { status: 'error', message: 'Please fill in all fields.' };
    }

    try {
        const res = await fetch(`${BACKEND_INTERNAL_URL}/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message }),
        });

        if (!res.ok) {
            // 400 = validation, 5xx = server — both surface as a generic failure.
            return {
                status: 'error',
                message:
                    res.status === 400
                        ? 'Please check your details and try again.'
                        : "We couldn't deliver your message. Please try again in a moment.",
            };
        }

        return { status: 'success' };
    } catch {
        return {
            status: 'error',
            message: "We couldn't reach the server. Please try again in a moment.",
        };
    }
}
