# syntax=docker/dockerfile:1

# ---- deps ----
FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/
RUN pnpm install --frozen-lockfile --filter frontend --prod --ignore-scripts
RUN pnpm --filter frontend... rebuild

# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/
RUN pnpm install --frozen-lockfile --filter frontend
COPY tsconfig.base.json ./
COPY frontend/ ./frontend/
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG BACKEND_INTERNAL_URL=http://localhost:3001
ARG NEXT_PUBLIC_STORAGE_URL=http://localhost:9000
ARG NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
ARG NEXT_PUBLIC_PADDLE_ENV=sandbox
ARG NEXT_PUBLIC_SENTRY_ENABLED=false
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ARG NEXT_PUBLIC_BUILD_SHA=unknown
ARG SENTRY_SOURCE_MAP_UPLOAD_REQUIRED=false
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL
ENV NEXT_PUBLIC_STORAGE_URL=$NEXT_PUBLIC_STORAGE_URL
ENV NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=$NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
ENV NEXT_PUBLIC_PADDLE_ENV=$NEXT_PUBLIC_PADDLE_ENV
ENV NEXT_PUBLIC_SENTRY_ENABLED=$NEXT_PUBLIC_SENTRY_ENABLED
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_SENTRY_ENVIRONMENT=$NEXT_PUBLIC_SENTRY_ENVIRONMENT
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV NEXT_PUBLIC_BUILD_SHA=$NEXT_PUBLIC_BUILD_SHA
RUN --mount=type=secret,id=sentry_auth_token \
    if [ -f /run/secrets/sentry_auth_token ]; then \
        SENTRY_AUTH_TOKEN_VALUE="$(cat /run/secrets/sentry_auth_token)"; \
    else \
        SENTRY_AUTH_TOKEN_VALUE=""; \
    fi; \
    if [ "$SENTRY_SOURCE_MAP_UPLOAD_REQUIRED" = "true" ] && [ -z "$SENTRY_AUTH_TOKEN_VALUE" ]; then \
        echo "SENTRY_AUTH_TOKEN is required for this build" >&2; \
        exit 1; \
    fi; \
    if [ -n "$SENTRY_AUTH_TOKEN_VALUE" ]; then \
        export SENTRY_AUTH_TOKEN="$SENTRY_AUTH_TOKEN_VALUE"; \
    fi; \
    pnpm --filter frontend build

# ---- run ----
FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY --from=build /app/frontend/.next ./frontend/.next
COPY --from=build /app/frontend/public ./frontend/public
COPY frontend/package.json ./frontend/
WORKDIR /app/frontend
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "--port", "3000", "-H", "0.0.0.0"]
