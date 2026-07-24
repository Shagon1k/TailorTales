# ---- deps ----
FROM node:24-alpine AS deps
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/
# Install production deps only
RUN pnpm install --frozen-lockfile --filter backend --prod --ignore-scripts
RUN pnpm --filter backend... rebuild

# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/
RUN pnpm install --frozen-lockfile --filter backend
COPY tsconfig.base.json ./
COPY backend/ ./backend/
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm --filter backend db:generate
RUN pnpm --filter backend build

# ---- run ----
FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
RUN apk add --no-cache chromium
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY backend/package.json ./backend/
COPY backend/newrelic.cjs ./backend/newrelic.cjs
WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "dist/main.js"]
