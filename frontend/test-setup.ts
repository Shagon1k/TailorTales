import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

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
