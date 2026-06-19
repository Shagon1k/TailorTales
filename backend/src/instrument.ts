import * as Sentry from '@sentry/nestjs';

if (process.env.SENTRY_ENABLED === 'true') {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.SENTRY_ENVIRONMENT,
    });
}
