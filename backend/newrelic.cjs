'use strict';

// CommonJS is required because the New Relic agent loads its config outside the app's ESM graph.
exports.config = {
    app_name: [process.env.NEW_RELIC_APP_NAME ?? 'TailorTales'],
    license_key: process.env.NEW_RELIC_LICENSE_KEY ?? '',
    logging: { level: 'info' },
    error_collector: {
        // Anonymous session checks and access limits are expected application responses.
        expected_status_codes: [401, 403],
    },
    allow_all_headers: true,
    attributes: {
        exclude: ['request.headers.cookie', 'request.headers.authorization'],
    },
};
