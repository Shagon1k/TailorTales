'use client';

import { useEffect } from 'react';

interface IUsePreservedScrollParams {
    storageKey: string;
    restoreKey: string;
}

interface IUsePreservedScrollResult {
    rememberScrollPosition: () => void;
}

/**
 * Preserves window scroll between sibling route transitions that feel like
 * section switches rather than full page changes.
 */
export function usePreservedScroll({
    storageKey,
    restoreKey,
}: Readonly<IUsePreservedScrollParams>): IUsePreservedScrollResult {
    useEffect(() => {
        const saved = window.sessionStorage.getItem(storageKey);
        if (saved === null) return;

        window.sessionStorage.removeItem(storageKey);
        const top = Number(saved);
        if (!Number.isFinite(top)) return;

        window.requestAnimationFrame(() => {
            window.scrollTo({ top, behavior: 'auto' });
        });
    }, [restoreKey, storageKey]);

    function rememberScrollPosition(): void {
        window.sessionStorage.setItem(storageKey, String(window.scrollY));
    }

    return { rememberScrollPosition };
}
