# ---- deps ----
FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/
RUN pnpm install --frozen-lockfile --filter frontend --prod

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
RUN pnpm --filter frontend build

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
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "--port", "3000", "-H", "0.0.0.0"]
