const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export async function apiFetch<T = void>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BACKEND_URL}${path}`, {
        ...init,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...init?.headers,
        },
    });

    if (!res.ok) {
        throw new ApiError(res.status, `API ${res.status}: ${res.statusText}`);
    }

    // Some endpoints return no body (e.g. logout → 200 OK with text/plain)
    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
        return undefined as T;
    }

    return res.json();
}
