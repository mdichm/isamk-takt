# SPDX-License-Identifier: AGPL-3.0-only
# TAKT API - NestJS Backend
# Multi-stage Dockerfile for production

# =============================================================================
# Stage 1: Base / Dependencies
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
COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/charge-engine/package.json ./packages/charge-engine/package.json
COPY packages/conflict-engine/package.json ./packages/conflict-engine/package.json
# Disable supply-chain policy (minimumReleaseAge) for CI builds
RUN pnpm config set minimumReleaseAge 0
RUN pnpm install --filter=@takt/api... --prod --ignore-scripts

# =============================================================================
# Stage 3: Install all dependencies & Build
# =============================================================================
FROM base AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/charge-engine/package.json ./packages/charge-engine/package.json
COPY packages/conflict-engine/package.json ./packages/conflict-engine/package.json
# Disable supply-chain policy (minimumReleaseAge) for CI builds
RUN pnpm config set minimumReleaseAge 0
RUN pnpm install
COPY . .
# Generate Prisma Client (required for build)
RUN pnpm --filter=@takt/db run db:generate
# Build shared contracts package (required by API)
RUN pnpm --filter=@takt/contracts run build
# Build with NestJS CLI (handles TypeScript config correctly)
RUN cd /app/apps/api && npx nest build

# =============================================================================
# Stage 4: Production runner
# =============================================================================
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Copy built application and production deps
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./package.json

USER nestjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if(r.statusCode!==200) process.exit(1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
