'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { storiesApi, type IProgressSnapshot } from '@/api/stories';
import { ANALYTICS_EVENTS, useTrackAnalytics } from '@/lib/analytics';
import { formatTime, stageToStepIndex, STAGE_STEPS } from '../utils/stage.utils';

export interface ILogEntry {
    /** Monotonic id assigned on creation. Stable key for React lists. */
    id: number;
    time: string;
    message: string;
}

export interface IGenerationStreamState {
    snapshot: IProgressSnapshot | null;
    completedPageOrders: ReadonlySet<number>;
    activePageOrder: number | null;
    log: readonly ILogEntry[];
    isCompleted: boolean;
    isFailed: boolean;
}

const LOG_MAX_ENTRIES = 50;
const COMPLETED_REDIRECT_DELAY_MS = 1500;

/** Opens the SSE progress stream for a story and tracks its state. */
export function useGenerationStream(storyId: string, totalPages: number): IGenerationStreamState {
    const router = useRouter();
    const [snapshot, setSnapshot] = useState<IProgressSnapshot | null>(null);
    const [completedPageOrders, setCompletedPageOrders] = useState<Set<number>>(() => new Set());
    const [activePageOrder, setActivePageOrder] = useState<number | null>(null);
    const [log, setLog] = useState<ILogEntry[]>([]);
    const logIdRef = useRef(0);
    const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { trackOnce } = useTrackAnalytics();

    useEffect(() => {
        const addLog = (message: string): void => {
            const time = formatTime(new Date());
            const id = ++logIdRef.current;
            setLog((prev) => [...prev.slice(-(LOG_MAX_ENTRIES - 1)), { id, time, message }]);
        };

        const es = storiesApi.openProgressStream(storyId);

        es.onmessage = (event: MessageEvent<string>) => {
            let data: IProgressSnapshot;
            try {
                data = JSON.parse(event.data) as IProgressSnapshot;
            } catch {
                return; // ignore keep-alive pings
            }

            setSnapshot(data);

            if (data.type === 'snapshot') {
                const stepLabel =
                    STAGE_STEPS[stageToStepIndex(data.stage)]?.label ?? data.stage ?? 'starting';
                addLog(`Stage: ${stepLabel}`);
            }

            if (data.type === 'page_complete' && data.pageOrder != null) {
                const order = data.pageOrder;
                setCompletedPageOrders((prev) => new Set([...prev, order]));
                setActivePageOrder(order + 1 <= totalPages ? order + 1 : null);
                addLog(`Painted page ${order}`);
            }

            if (data.type === 'completed') {
                trackOnce(`story_generation_completed:${storyId}`, {
                    name: ANALYTICS_EVENTS.storyGenerationCompleted,
                    parameters: { page_count: totalPages },
                });
                addLog('Your tale is ready!');
                es.close();
                redirectTimerRef.current = setTimeout(
                    () => router.push(`/library/${storyId}`),
                    COMPLETED_REDIRECT_DELAY_MS,
                );
            }

            if (data.type === 'failed') {
                addLog(`Generation failed: ${data.error ?? 'unknown error'}`);
                es.close();
            }
        };

        return () => {
            es.close();
            if (redirectTimerRef.current) {
                clearTimeout(redirectTimerRef.current);
                redirectTimerRef.current = null;
            }
        };
    }, [storyId, router, totalPages, trackOnce]);

    return {
        snapshot,
        completedPageOrders,
        activePageOrder,
        log,
        isCompleted: snapshot?.status === 'COMPLETED',
        isFailed: snapshot?.status === 'FAILED',
    };
}
