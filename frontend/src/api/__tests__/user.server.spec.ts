const { mockApiFetchServer, MockApiServerError } = vi.hoisted(() => {
    class MockApiServerError extends Error {
        constructor(
            public readonly status: number,
            public readonly statusText: string,
        ) {
            super(`API ${status}: ${statusText}`);
            this.name = 'ApiServerError';
        }
    }

    return {
        mockApiFetchServer: vi.fn<() => Promise<unknown>>(),
        MockApiServerError,
    };
});

vi.mock('server-only', () => ({}));

vi.mock('@/lib/api.server', () => {
    return {
        ApiServerError: MockApiServerError,
        apiFetchServer: mockApiFetchServer,
    };
});

describe('getServerUser', () => {
    beforeEach(() => {
        mockApiFetchServer.mockReset();
    });

    describe('given the visitor is anonymous', () => {
        it('should return null without logging an error for 401', async () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
            const { getServerUser } = await import('../user.server');
            mockApiFetchServer.mockRejectedValue(new MockApiServerError(401, 'Unauthorized'));

            const result = await getServerUser();

            expect(result).toBeNull();
            expect(consoleError).not.toHaveBeenCalled();
            consoleError.mockRestore();
        });
    });

    describe('given the user endpoint fails unexpectedly', () => {
        it('should log the error and return null', async () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
            const { getServerUser } = await import('../user.server');
            const error = new MockApiServerError(500, 'Internal Server Error');
            mockApiFetchServer.mockRejectedValue(error);

            const result = await getServerUser();

            expect(result).toBeNull();
            expect(consoleError).toHaveBeenCalledWith('Server-side user fetch failed', error);
            consoleError.mockRestore();
        });
    });
});
