#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-only
# TAKT - Dev Environment Deployment Script
# Usage: ./deploy-dev.sh [version-tag]
# Example: ./deploy-dev.sh v1.2.0

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REGISTRY="${REGISTRY:-ghcr.io}"
REPOSITORY_OWNER="${REPOSITORY_OWNER:-$(git config --get remote.origin.url | sed -E 's/.*[:/]([^/]+)\/[^/]+.git/\1/')}"
PROJECT_NAME="takt"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
ENV_FILE="$SCRIPT_DIR/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Helper Functions
# =============================================================================
log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

usage() {
    cat <<EOF
Usage: $0 [VERSION_TAG] [OPTIONS]

Deploy TAKT to dev environment using Docker Compose.

Arguments:
  VERSION_TAG    SemVer tag to deploy (e.g., v1.2.0). If omitted, uses 'latest'.

Options:
  --with-proxy   Include nginx reverse proxy (TLS, rate limiting)
  --with-tools   Include pgAdmin and other dev tools
  --no-build     Skip image build, use existing images
  --pull         Pull latest images before starting

Environment Variables:
  REGISTRY              Container registry (default: ghcr.io)
  REPOSITORY_OWNER      GitHub org/user (default: extracted from git remote)
  GHCR_TOKEN            GitHub PAT with read:packages (for private images)

Examples:
  $0 v1.2.0
  $0 latest
  $0 v1.2.0 --with-proxy
  $0 v1.2.0 --with-proxy --with-tools
  REGISTRY=my-registry.com $0 v2.0.0
EOF
}

# =============================================================================
# Argument Parsing
# =============================================================================
VERSION_TAG="${1:-latest}"
shift || true

WITH_PROXY=false
WITH_TOOLS=false
NO_BUILD=false
PULL=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --with-proxy)
            WITH_PROXY=true
            shift
            ;;
        --with-tools)
            WITH_TOOLS=true
            shift
            ;;
        --no-build)
            NO_BUILD=true
            shift
            ;;
        --pull)
            PULL=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown argument: $1"
            usage
            exit 1
            ;;
    esac
done

# =============================================================================
# Main Deployment
# =============================================================================
main() {
    log_info "Starting TAKT dev deployment..."
    log_info "Registry: $REGISTRY"
    log_info "Repository Owner: $REPOSITORY_OWNER"
    log_info "Image Tag: $VERSION_TAG"

    # Validate required secrets (warn only - dev deployment is best-effort)
    if [[ -z "${POSTGRES_USER:-}" ]] || [[ -z "${POSTGRES_PASSWORD:-}" ]] || [[ -z "${POSTGRES_DB:-}" ]]; then
        log_warn "Missing required PostgreSQL environment variables - deployment may fail"
    fi

    if [[ -z "${JWT_SECRET:-}" ]] || [[ -z "${JWT_REFRESH_SECRET:-}" ]]; then
        log_warn "Missing required JWT secrets - deployment may fail"
    fi

    # Create .env file
    log_info "Creating environment file..."
    cat > "$ENV_FILE" <<EOF
REGISTRY=$REGISTRY
REPOSITORY_OWNER=$REPOSITORY_OWNER
PROJECT_NAME=$PROJECT_NAME
IMAGE_TAG=$VERSION_TAG
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=$POSTGRES_DB
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
EOF

    # Build images if not skipping
    if [[ "$NO_BUILD" != true ]]; then
        log_info "Building Docker images..."
        docker compose -f "$COMPOSE_FILE" build
    fi

    # Pull images if requested
    if [[ "$PULL" == true ]]; then
        log_info "Pulling latest images..."
        docker compose -f "$COMPOSE_FILE" pull
    fi

    # Deploy
    log_info "Deploying services..."
    docker compose -f "$COMPOSE_FILE" up -d

    log_success "TAKT dev deployment completed successfully!"
}

main "$@"
