# SPDX-License-Identifier: AGPL-3.0-only
# TAKT Nginx Reverse Proxy
# Multi-stage Dockerfile for production

# =============================================================================
# Stage 1: Base
# =============================================================================
FROM nginx:alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init openssl

# =============================================================================
# Stage 2: Builder - Generate self-signed cert for dev if not provided
# =============================================================================
FROM base AS builder

# Create certs directory
RUN mkdir -p /etc/nginx/certs

# Generate self-signed certificate for development
# In production, these should be mounted from host (Let's Encrypt / internal CA)
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/certs/takt.key \
    -out /etc/nginx/certs/takt.crt \
    -subj "/C=TN/ST=Tunis/L=Tunis/O=ISAMK/OU=TAKT/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:takt.local,IP:127.0.0.1"

# =============================================================================
# Stage 3: Production runner
# =============================================================================
FROM base AS runner

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy generated certs (will be overridden by volume mount in production)
COPY --from=builder /etc/nginx/certs /etc/nginx/certs

# Create non-root user
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx

# Create cache directories with proper permissions
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp && \
    chown -R nginx:nginx /var/cache/nginx /var/run /var/log/nginx

# Create certbot webroot for ACME challenges
RUN mkdir -p /var/www/certbot && chown -R nginx:nginx /var/www/certbot

USER nginx

EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verify-certificate -q --spider https://localhost/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]