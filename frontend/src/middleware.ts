import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/config';

export default createMiddleware(routing);

export const config = {
    // Match all pathnames except Next.js internals, static files, and direct API calls.
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
