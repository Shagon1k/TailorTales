import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// next-intl and next-intl/server share the same translation helper.
// Both are mocked globally so components can call useTranslations / getTranslations
// in jsdom without a real Next.js runtime context.
async function makeNextIntlModule(): Promise<object> {
    const { default: messages } = await import('./src/i18n/locales/en.json');

    function resolve(obj: unknown, keys: string[]): unknown {
        return keys.reduce((curr: unknown, key) => {
            if (curr !== null && typeof curr === 'object') {
                return (curr as Record<string, unknown>)[key];
            }
            return undefined;
        }, obj);
    }

    function format(template: string, values?: Record<string, unknown>): string {
        if (typeof template !== 'string') return String(template);
        if (!values) return template;
        // ICU plural: {count, plural, one {# item} other {# items}}
        let result = template.replace(
            /\{(\w+),\s*plural,\s*one\s*\{([^}]*)\}\s*other\s*\{([^}]*)\}\}/g,
            (_, key, one, other) => {
                const count = Number(values[key] ?? 0);
                const tpl = count === 1 ? one : other;
                return tpl.replace('#', String(count));
            },
        );
        // simple {key} interpolation
        result = result.replace(/\{(\w+)\}/g, (_, key) => {
            const val = values[key];
            return val !== undefined ? String(val) : `{${key}}`;
        });
        return result;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function makeT(namespace: string | undefined): any {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const t = (key: string, values?: Record<string, unknown>): any => {
            const fullPath = namespace ? `${namespace}.${key}` : key;
            const value = resolve(messages, fullPath.split('.'));
            if (typeof value === 'string') return format(value, values);
            return key;
        };
        // t.rich strips XML-like tags (<highlight>text</highlight> → text) so tests
        // can query by accessible name without wrestling with raw next-intl tag syntax.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        t.rich = (key: string, values?: Record<string, unknown>): any =>
            String(t(key, values)).replace(/<\/?[\w]+>/g, '');
        return t;
    }

    return {
        useTranslations: (namespace?: string) => makeT(namespace),
        getTranslations: async (namespace?: string) => makeT(namespace),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        NextIntlClientProvider: ({ children }: { children: any }) => children,
    };
}

vi.mock('next-intl', () => makeNextIntlModule());
vi.mock('next-intl/server', () => makeNextIntlModule());

vi.mock('@/i18n/navigation', async () => {
    const { default: React } = await import('react');
    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Link: ({ href, children, ...rest }: any) =>
            React.createElement('a', { href, ...rest }, children),
        useRouter: vi.fn().mockReturnValue({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
        usePathname: vi.fn().mockReturnValue('/'),
        redirect: vi.fn(),
        getPathname: vi.fn(),
    };
});

// jsdom doesn't implement ResizeObserver — required by Mantine's ScrollArea (used in Combobox dropdown)
globalThis.ResizeObserver = class ResizeObserver {
    observe(): void {
        // noop
    }
    unobserve(): void {
        // noop
    }
    disconnect(): void {
        // noop
    }
};

// jsdom doesn't implement window.matchMedia — required by Mantine's color scheme detection
Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
