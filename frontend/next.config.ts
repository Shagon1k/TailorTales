import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createNextIntlPlugin from 'next-intl/plugin';

const configDir = path.dirname(fileURLToPath(import.meta.url));

function parseUrl(envVar: string, fallback: string): URL {
    const url = new URL(process.env[envVar] ?? fallback);
    const protocol = url.protocol.replace(':', '');
    if (protocol !== 'http' && protocol !== 'https') {
        throw new Error(`${envVar} uses unsupported protocol: ${protocol}`);
    }
    return url;
}

const backendUrl = parseUrl('NEXT_PUBLIC_BACKEND_URL', 'http://localhost:3001');
const storageUrl = parseUrl('NEXT_PUBLIC_STORAGE_URL', 'http://localhost:9000');

function toRemotePattern(url: URL): { protocol: 'http' | 'https'; hostname: string; port: string } {
    return {
        protocol: url.protocol.replace(':', '') as 'http' | 'https',
        hostname: url.hostname,
        port: url.port,
    };
}

const nextConfig: NextConfig = {
    sassOptions: {
        loadPaths: [path.join(configDir, 'src')],
    },
    images: {
        remotePatterns: [toRemotePattern(backendUrl), toRemotePattern(storageUrl)],
    },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
