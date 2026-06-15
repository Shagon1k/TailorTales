'use client';

import { useEffect, useState } from 'react';

interface IPdfFileSizeProps {
    url: string;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfFileSize({ url }: Readonly<IPdfFileSizeProps>): React.ReactElement {
    const [size, setSize] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetch(url, { method: 'HEAD', signal: controller.signal })
            .then((res) => {
                const bytes = Number(res.headers.get('content-length'));
                if (bytes > 0) setSize(formatBytes(bytes));
            })
            .catch(() => {
                // Size is cosmetic — swallow silently; UI stays at '—'
            });
        return () => controller.abort();
    }, [url]);

    return <>{size ?? '—'}</>;
}
