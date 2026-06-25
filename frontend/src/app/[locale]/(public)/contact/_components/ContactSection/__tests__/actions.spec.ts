import { submitContact } from '../actions';

function makeFormData(values: { name?: string; email?: string; message?: string }): FormData {
    const data = new FormData();
    if (values.name !== undefined) data.set('name', values.name);
    if (values.email !== undefined) data.set('email', values.email);
    if (values.message !== undefined) data.set('message', values.message);
    return data;
}

function jsonResponse(status: number): Response {
    return new Response(null, { status });
}

describe('submitContact', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('given a short non-empty message', () => {
        it('should submit the message to the contact endpoint', async () => {
            vi.mocked(fetch).mockResolvedValue(jsonResponse(202));
            const data = makeFormData({
                name: 'Ada',
                email: 'ada@example.com',
                message: 'Hi',
            });

            const result = await submitContact({ status: 'idle' }, data);

            expect(result).toEqual({ status: 'success' });
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/contact'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        name: 'Ada',
                        email: 'ada@example.com',
                        message: 'Hi',
                    }),
                }),
            );
        });
    });

    describe('given a missing field', () => {
        it('should return a validation error before calling the backend', async () => {
            const data = makeFormData({
                name: 'Ada',
                email: 'ada@example.com',
                message: '',
            });

            const result = await submitContact({ status: 'idle' }, data);

            expect(result).toEqual({ status: 'error', message: 'Please fill in all fields.' });
            expect(fetch).not.toHaveBeenCalled();
        });
    });
});
