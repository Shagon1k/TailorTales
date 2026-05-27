'use server';

export type TContactFormState =
    | { status: 'idle' }
    | { status: 'success' }
    | { status: 'error'; message: string };

// TODO: Wire to POST /contact when the backend contact endpoint is ready.
//       Validate on the server, return { status: 'error', message } on failure.
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

    return { status: 'success' };
}
