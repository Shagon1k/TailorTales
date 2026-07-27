const API_BASE_PATH = '/api';

export function getApiBaseUrl(): string {
    return API_BASE_PATH;
}

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
    const locale = typeof document !== 'undefined' ? document.documentElement.lang : undefined;
    const isFormData = init?.body instanceof FormData;

    const res = await fetch(`${API_BASE_PATH}${path}`, {
        ...init,
        credentials: 'include',
        headers: {
            ...(locale ? { 'Accept-Language': locale } : {}),
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...init?.headers,
        },
    });

    // Parse once — used for both the error message path and the success return path.
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const body = isJson ? ((await res.json()) as Record<string, unknown>) : undefined;

    if (!res.ok) {
        const raw = body?.['message'];
        const text = Array.isArray(raw)
            ? String(raw[0])
            : typeof raw === 'string'
              ? raw
              : undefined;
        throw new ApiError(res.status, text ?? `${res.status}: ${res.statusText}`);
    }

    return body as T;
}
