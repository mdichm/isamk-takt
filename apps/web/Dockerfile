# SPDX-License-Identifier: AGPL-3.0-only
# TAKT Web - Next.js Frontend
# Multi-stage Dockerfile for production (standalone output)

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
COPY package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/design-tokens/package.json ./packages/design-tokens/package.json
COPY packages/db/package.json ./packages/db/package.json
# Disable supply-chain policy (minimumReleaseAge) for CI builds
RUN pnpm config set minimumReleaseAge 0
RUN pnpm install --filter=@takt/web... --prod --ignore-scripts

# =============================================================================
# Stage 3: Install all dependencies & Build
# =============================================================================
FROM base AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/design-tokens/package.json ./packages/design-tokens/package.json
COPY packages/db/package.json ./packages/db/package.json
# Disable supply-chain policy (minimumReleaseAge) for CI builds
RUN pnpm config set minimumReleaseAge 0
RUN pnpm install
COPY . .
# Build design-tokens first (generates CSS)
RUN pnpm --filter=@takt/design-tokens run build
RUN pnpm --filter=@takt/web run build

# =============================================================================
# Stage 4: Production runner (standalone)
# =============================================================================
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Copy standalone output and production deps
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if(r.statusCode!==200) process.exit(1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
