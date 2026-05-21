# ---- deps ----
FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/
# Install production deps only
RUN pnpm install --frozen-lockfile --filter backend --prod

# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/
RUN pnpm install --frozen-lockfile --filter backend
COPY tsconfig.base.json ./
COPY backend/ ./backend/
RUN pnpm --filter backend build
RUN pnpm --filter backend db:generate

# ---- run ----
FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/generated ./backend/generated
COPY backend/package.json ./backend/
EXPOSE 3001
CMD ["node", "backend/dist/main.js"]
