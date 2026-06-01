export interface IStageStep {
    key: string;
    label: string;
    sub: string;
}

export const STAGE_STEPS: readonly IStageStep[] = [
    { key: 'planning', label: 'Outline', sub: 'sketching the chapters' },
    { key: 'words', label: 'Words', sub: 'writing for age' },
    { key: 'pictures', label: 'Pictures', sub: 'painting each page' },
    { key: 'binding', label: 'Binding', sub: 'laying out the spreads' },
    { key: 'ready', label: 'Ready', sub: 'a small parcel' },
] as const;

const STAGE_TO_STEP_INDEX: Record<string, number> = {
    planning: 0,
    moderation: 0,
    pictures: 2,
    binding: 3,
    ready: 4,
};

export function stageToStepIndex(stage: string | null): number {
    if (!stage) return -1;
    return STAGE_TO_STEP_INDEX[stage] ?? -1;
}

export function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}
