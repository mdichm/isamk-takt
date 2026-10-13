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
Usage: $0 [VERSION_TAG]

Deploy TAKT to dev environment using Docker Compose.

Arguments:
  VERSION_TAG    SemVer tag to deploy (e.g., v1.2.0). If omitted, uses 'latest'.

Environment Variables:
  REGISTRY              Container registry (default: ghcr.io)
  REPOSITORY_OWNER      GitHub org/user (default: extracted from git remote)
  GHCR_TOKEN            GitHub PAT with read:packages (for private images)

Examples:
  $0 v1.2.0
  $0 latest
  REGISTRY=my-registry.com $0 v2.0.0
EOF
}