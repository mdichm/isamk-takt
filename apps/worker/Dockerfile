# SPDX-License-Identifier: AGPL-3.0-only
# TAKT Worker - pg-boss Job Processor
# Multi-stage Dockerfile for production

# =============================================================================
# Stage 1: Base
# =============================================================================
FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init openssl libc6-compat
RUN corepack enable pnpm

# =============================================================================
# Stage 2: Install production dependencies (for runner)
# =============================================================================
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json ./apps/worker/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/engine-fet/package.json ./packages/engine-fet/package.json
COPY packages/conflict-engine/package.json ./packages/conflict-engine/package.json
# Disable supply-chain policy (minimumReleaseAge) for CI builds
RUN pnpm config set minimumReleaseAge 0
RUN pnpm install --filter=@takt/worker... --prod --ignore-scripts

# =============================================================================
# Stage 3: Install all dependencies & Build
# =============================================================================
FROM base AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json ./apps/worker/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/engine-fet/package.json ./packages/engine-fet/package.json
COPY packages/conflict-engine/package.json ./packages/conflict-engine/package.json
# Disable supply-chain policy (minimumReleaseAge) for CI builds
RUN pnpm config set minimumReleaseAge 0
RUN pnpm install
COPY . .
# Generate Prisma Client (required for build)
RUN pnpm --filter=@takt/db run db:generate
# Build shared contracts package (required by Worker)
RUN pnpm --filter=@takt/contracts run build
RUN pnpm --filter=@takt/worker run build

# =============================================================================
# Stage 4: Production runner
# =============================================================================
FROM base AS runner
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S worker -u 1001 -G nodejs

# Copy built application and production deps
COPY --from=builder --chown=worker:nodejs /app/apps/worker/dist ./dist
COPY --from=deps --chown=worker:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=worker:nodejs /app/apps/worker/package.json ./package.json

USER worker

# No port exposure - worker connects to PostgreSQL via pg-boss

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
