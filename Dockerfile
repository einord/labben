# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache libstdc++ docker-cli docker-cli-compose rsync

COPY --from=build /app/.output ./.output

# Create fixed data directories
RUN mkdir -p /data/compose /data/db /backups

ENV HOST=0.0.0.0
ENV PORT=3005
ENV NODE_ENV=production

EXPOSE 3005

CMD ["node", ".output/server/index.mjs"]
