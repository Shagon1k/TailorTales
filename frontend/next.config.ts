import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = path.dirname(fileURLToPath(import.meta.url));

const backendUrl = new URL(process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001');
const rawProtocol = backendUrl.protocol.replace(':', '');
if (rawProtocol !== 'http' && rawProtocol !== 'https') {
    throw new Error(`NEXT_PUBLIC_BACKEND_URL uses unsupported protocol: ${rawProtocol}`);
}

const nextConfig: NextConfig = {
    sassOptions: {
        loadPaths: [path.join(configDir, 'src')],
    },
    images: {
        remotePatterns: [
            {
                protocol: rawProtocol,
                hostname: backendUrl.hostname,
                port: backendUrl.port,
            },
        ],
    },
};

export default nextConfig;
