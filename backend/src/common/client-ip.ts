export function resolveClientIp({
    cloudflareIp,
    forwardedFor,
    requestIp,
}: {
    cloudflareIp: string | undefined;
    forwardedFor: string | undefined;
    requestIp: string;
}): string {
    const firstCloudflareIp = cloudflareIp?.split(',')[0]?.trim();
    if (firstCloudflareIp) return firstCloudflareIp;

    const firstForwardedIp = forwardedFor?.split(',')[0]?.trim();
    return firstForwardedIp || requestIp;
}
