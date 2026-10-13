# SPDX-License-Identifier: AGPL-3.0-only
# TAKT Worker - pg-boss Job Processor
# Multi-stage Dockerfile for production

# =============================================================================
# Stage 1: Base
# =============================================================================
FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

# =============================================================================
# Stage 2: Install dependencies
# =============================================================================
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# =============================================================================
# Stage 3: Build
# =============================================================================
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# =============================================================================
# Stage 4: Production runner
# =============================================================================
FROM base AS runner
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S worker -u 1001 -G nodejs

# Copy built application
COPY --from=builder --chown=worker:nodejs /app/dist ./dist
COPY --from=builder --chown=worker:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=worker:nodejs /app/package.json ./package.json

USER worker

# No port exposure - worker connects to PostgreSQL via pg-boss

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]