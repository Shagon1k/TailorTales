import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const composeFile = `${repositoryRoot}compose.deploy.yaml`;
const applicationServices = ['backend', 'frontend', 'release'];

const sharedInputs = {
    GOOGLE_CLIENT_ID: 'synthetic-client-id',
    GOOGLE_CLIENT_SECRET: 'synthetic-client-secret',
    JWT_SECRET: 'x'.repeat(32),
    AUTH_ALLOWED_EMAILS: '',
    E2E_TEST_SECRET: '',
    OPENROUTER_API_KEY: 'synthetic-openrouter-key',
    OPENROUTER_TEXT_MODEL: 'synthetic-text-model',
    OPENROUTER_IMAGE_MODEL: 'synthetic-image-model',
    RESEND_API_KEY: 'synthetic-resend-key',
    RESEND_FROM: 'TailorTales Contract <contract@example.invalid>',
    CONTACT_INBOX_EMAIL: 'contract@example.invalid',
    PADDLE_API_KEY: 'synthetic-paddle-key',
    PADDLE_WEBHOOK_SECRET: 'synthetic-paddle-webhook-secret',
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: 'synthetic-paddle-client-token',
    PADDLE_PRODUCT_ID_STORY_HOUR: 'synthetic-story-hour-product',
    PADDLE_PRICE_ID_STORY_HOUR: 'synthetic-story-hour-price',
    PADDLE_PRODUCT_ID_FAMILY_WORKSHOP: 'synthetic-family-workshop-product',
    PADDLE_PRICE_ID_FAMILY_WORKSHOP: 'synthetic-family-workshop-price',
    SENTRY_DSN: 'https://synthetic-backend@example.invalid/1',
    NEXT_PUBLIC_SENTRY_DSN: 'https://synthetic-frontend@example.invalid/2',
    SENTRY_AUTH_TOKEN: 'synthetic-sentry-token',
    NEXT_PUBLIC_GA_MEASUREMENT_ID: '',
};

const environments = {
    uat: {
        BACKEND_URL: 'https://uat.example.invalid/api',
        FRONTEND_URL: 'https://uat.example.invalid',
        BACKEND_INTERNAL_HOST: 'backend-uat',
        DATABASE_URL: 'postgresql://synthetic:synthetic@uat-db:5432/tailortales',
        REDIS_URL: 'redis://uat-redis:6379/0',
        STORAGE_ENDPOINT: 'https://storage-uat.example.invalid',
        STORAGE_FORCE_PATH_STYLE: 'true',
        STORAGE_REGION: 'us-east-1',
        STORAGE_ACCESS_KEY: 'synthetic-uat-storage-key',
        STORAGE_SECRET_KEY: 'synthetic-uat-storage-secret',
        STORAGE_BUCKET: 'tailortales-uat',
        NEXT_PUBLIC_STORAGE_URL: 'https://storage-uat.example.invalid',
        PADDLE_ENVIRONMENT: 'sandbox',
        SENTRY_ENVIRONMENT: 'uat',
        NEW_RELIC_LICENSE_KEY: 'synthetic-uat-new-relic-key',
        NEW_RELIC_APP_NAME: 'TailorTales-UAT',
    },
    production: {
        BACKEND_URL: 'https://example.invalid/api',
        FRONTEND_URL: 'https://example.invalid',
        BACKEND_INTERNAL_HOST: 'backend-prod',
        DATABASE_URL: 'postgresql://synthetic:synthetic@prod-db:5432/tailortales',
        REDIS_URL: 'redis://prod-redis:6379/0',
        STORAGE_REGION: 'eu-west-1',
        STORAGE_ACCESS_KEY: 'synthetic-prod-storage-key',
        STORAGE_SECRET_KEY: 'synthetic-prod-storage-secret',
        STORAGE_BUCKET: 'tailortales-prod',
        NEXT_PUBLIC_STORAGE_URL: 'https://assets.example.invalid',
        PADDLE_ENVIRONMENT: 'production',
        SENTRY_ENVIRONMENT: 'production',
        NEW_RELIC_LICENSE_KEY: 'synthetic-prod-new-relic-key',
        NEW_RELIC_APP_NAME: 'TailorTales-Prod',
    },
};

const composeInputs = new Set([
    ...Object.keys(sharedInputs),
    ...Object.values(environments).flatMap(Object.keys),
    'STORAGE_ENDPOINT',
    'STORAGE_FORCE_PATH_STYLE',
]);

function renderCompose(name, inputs) {
    const environment = { ...process.env };
    for (const input of composeInputs) delete environment[input];
    Object.assign(environment, sharedInputs, inputs);

    const result = spawnSync(
        'docker',
        [
            'compose',
            '--project-name',
            `tailortales-contract-${name}`,
            '--env-file',
            '/dev/null',
            '--file',
            composeFile,
            'config',
            '--format',
            'json',
        ],
        {
            cwd: repositoryRoot,
            encoding: 'utf8',
            env: environment,
            maxBuffer: 10 * 1024 * 1024,
        },
    );

    assert.equal(
        result.status,
        0,
        `docker compose could not render ${name}: ${result.stderr.trim()}`,
    );

    return JSON.parse(result.stdout);
}

function verifyEnvironment(name, inputs) {
    const configuration = renderCompose(name, inputs);
    const { backend, frontend, release } = configuration.services;

    assert.deepEqual(
        Object.keys(configuration.services).sort(),
        applicationServices,
        `${name} must keep managed data services outside the application Compose topology`,
    );

    for (const serviceName of applicationServices) {
        assert.equal(
            'ports' in configuration.services[serviceName],
            false,
            `${name} ${serviceName} must not publish host ports`,
        );
        assert.equal(
            configuration.services[serviceName].build.context,
            repositoryRoot.slice(0, -1),
            `${name} ${serviceName} must build from the repository root`,
        );
    }

    assert.equal(configuration.networks['dokploy-network'].external, true);
    assert.deepEqual(backend.networks['application-network'].aliases, [
        inputs.BACKEND_INTERNAL_HOST,
    ]);
    assert.equal(backend.environment.BACKEND_URL, inputs.BACKEND_URL);
    assert.equal(backend.environment.FRONTEND_URL, inputs.FRONTEND_URL);
    assert.equal(backend.environment.DATABASE_URL, inputs.DATABASE_URL);
    assert.equal(release.environment.DATABASE_URL, inputs.DATABASE_URL);
    assert.equal(backend.environment.REDIS_URL, inputs.REDIS_URL);
    assert.equal(backend.environment.STORAGE_ENDPOINT ?? null, inputs.STORAGE_ENDPOINT ?? null);
    assert.equal(
        backend.environment.STORAGE_FORCE_PATH_STYLE ?? null,
        inputs.STORAGE_FORCE_PATH_STYLE ?? null,
    );
    assert.equal(backend.environment.STORAGE_BUCKET, inputs.STORAGE_BUCKET);
    assert.equal(frontend.environment.NEXT_PUBLIC_SITE_URL, inputs.FRONTEND_URL);
    assert.equal(frontend.environment.NEXT_PUBLIC_STORAGE_URL, inputs.NEXT_PUBLIC_STORAGE_URL);
    assert.equal(
        frontend.environment.BACKEND_INTERNAL_URL,
        `http://${inputs.BACKEND_INTERNAL_HOST}:3001`,
    );

    assert.equal(backend.depends_on.release.condition, 'service_completed_successfully');
    assert.equal(frontend.depends_on.backend.condition, 'service_healthy');
    assert.equal(backend.stop_grace_period, '15m0s');

    return {
        publicOrigins: [backend.environment.BACKEND_URL, backend.environment.FRONTEND_URL],
        backendAlias: backend.networks['application-network'].aliases[0],
        databaseUrl: backend.environment.DATABASE_URL,
        redisUrl: backend.environment.REDIS_URL,
        storageInputs: [
            backend.environment.STORAGE_ENDPOINT ?? null,
            backend.environment.STORAGE_FORCE_PATH_STYLE ?? null,
            backend.environment.STORAGE_BUCKET,
            frontend.environment.NEXT_PUBLIC_STORAGE_URL,
        ],
    };
}

const rendered = Object.fromEntries(
    Object.entries(environments).map(([name, inputs]) => [name, verifyEnvironment(name, inputs)]),
);

assert.notDeepEqual(rendered.uat.publicOrigins, rendered.production.publicOrigins);
assert.notEqual(rendered.uat.backendAlias, rendered.production.backendAlias);
assert.notEqual(rendered.uat.databaseUrl, rendered.production.databaseUrl);
assert.notEqual(rendered.uat.redisUrl, rendered.production.redisUrl);
assert.notDeepEqual(rendered.uat.storageInputs, rendered.production.storageInputs);

console.log('Deployment Compose contract passed for synthetic UAT and production configurations.');
