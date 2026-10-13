# SPDX-License-Identifier: AGPL-3.0-only
# TAKT Web - Next.js Frontend
# Multi-stage Dockerfile for production (standalone output)

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
# Generate Prisma client if needed (for any shared packages)
RUN npm run build

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

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if(r.statusCode!==200) process.exit(1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]