const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export function getApiBaseUrl(): string {
    return BACKEND_URL ?? '';
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

    const res = await fetch(`${BACKEND_URL}${path}`, {
        ...init,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(locale ? { 'Accept-Language': locale } : {}),
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
