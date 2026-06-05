import 'server-only';

import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function apiFetchServer<T = void>(path: string, init?: RequestInit): Promise<T> {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token');

    const res = await fetch(`${BACKEND_URL}${path}`, {
        cache: 'no-store',
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Cookie: `access_token=${token.value}` } : {}),
            ...init?.headers,
        },
    });

    if (!res.ok) {
        throw new Error(`API ${res.status}: ${res.statusText}`);
    }

    // Some endpoints return no body — skip JSON parsing for non-JSON responses
    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
        return undefined as T;
    }

    // res.json() returns `any` — caller's generic T provides the expected shape
    return res.json();
}
