# SPDX-License-Identifier: AGPL-3.0-only
# TAKT API - NestJS Backend
# Multi-stage Dockerfile for production

# =============================================================================
# Stage 1: Base / Dependencies
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
ENV PORT=3000

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

USER nestjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if(r.statusCode!==200) process.exit(1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]