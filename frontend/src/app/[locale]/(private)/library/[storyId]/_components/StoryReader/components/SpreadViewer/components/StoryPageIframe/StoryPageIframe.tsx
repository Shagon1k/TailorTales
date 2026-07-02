'use client';

import { useState, useEffect, useRef } from 'react';
import { storiesApi } from '@/api/stories';
import styles from './StoryPageIframe.module.scss';

// A5 at 96 dpi: 148mm × 210mm → 559 × 794 px
const IFRAME_NATURAL_WIDTH = 559;
const IFRAME_NATURAL_HEIGHT = 794;

export interface IStoryPageIframeProps {
    storyId: string;
    pageOrder: number;
    refreshToken?: number;
}

export default function StoryPageIframe({
    storyId,
    pageOrder,
    refreshToken = 0,
}: Readonly<IStoryPageIframeProps>): React.ReactElement {
    const containerRef = useRef<HTMLDivElement>(null);
    // Per-story cache: avoids re-fetching pages already viewed (e.g. navigating back).
    const htmlCacheRef = useRef(new Map<string, string>());
    const [html, setHtml] = useState<string | null>(null);
    const [displayedPageOrder, setDisplayedPageOrder] = useState(pageOrder);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scale, setScale] = useState(1);
    const [isFrameReady, setIsFrameReady] = useState(false);

    useEffect(() => {
        const cacheKey = `${storyId}:${pageOrder}:${refreshToken}`;
        const cached = htmlCacheRef.current.get(cacheKey);
        if (cached) {
            setDisplayedPageOrder(pageOrder);
            setHtml(cached);
            setIsFrameReady(false);
            setIsLoading(false);
            setError(null);
            return;
        }

        let cancelled = false;

        async function fetchPageHtml(): Promise<void> {
            setIsLoading(true);
            setError(null);
            try {
                const result = await storiesApi.getPageHtml(storyId, pageOrder);
                if (!cancelled) {
                    htmlCacheRef.current.set(cacheKey, result);
                    setDisplayedPageOrder(pageOrder);
                    setHtml(result);
                    setIsFrameReady(false);
                    setIsLoading(false);
                }
            } catch (err: unknown) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Failed to load page');
                    setIsLoading(false);
                }
            }
        }

        fetchPageHtml();

        return () => {
            cancelled = true;
        };
    }, [storyId, pageOrder, refreshToken]);

    // Track container width to scale the fixed-size A5 stage proportionally.
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver(([entry]) => {
            if (entry) setScale(entry.contentRect.width / IFRAME_NATURAL_WIDTH);
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={containerRef}
            className={styles['page-iframe']}
            // Height collapses to the visual height of the scaled stage.
            style={{ height: IFRAME_NATURAL_HEIGHT * scale }}
        >
            <div
                className={styles['page-iframe__stage']}
                style={{
                    width: IFRAME_NATURAL_WIDTH,
                    height: IFRAME_NATURAL_HEIGHT,
                    transform: `scale(${scale})`,
                }}
            >
                {isLoading && (
                    <div
                        className={styles['page-iframe__skeleton']}
                        aria-busy="true"
                        aria-label="Loading page"
                    />
                )}
                {error && (
                    <div className={styles['page-iframe__error']} role="alert">
                        {error}
                    </div>
                )}
                {html && (
                    <iframe
                        key={displayedPageOrder}
                        srcDoc={html}
                        title={`Page ${displayedPageOrder}`}
                        className={styles['page-iframe__frame']}
                        sandbox="allow-same-origin"
                        onLoad={() => setIsFrameReady(true)}
                        data-ready={isFrameReady}
                    />
                )}
            </div>
        </div>
    );
}
