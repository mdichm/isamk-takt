#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-only
# TAKT - Script de sauvegarde PostgreSQL et volumes Docker
# Usage: ./backup.sh [--type {daily|weekly|monthly}] [--env-file <path>] [--no-s3]
#
# Sauvegarde:
#   - PostgreSQL via pg_dump (format custom -Fc + SQL plain)
#   - Volumes Docker (postgres_data, grafana_data, prometheus_data, loki_data, tempo_data) en tar.gz
#   - Manifestes JSON avec checksums SHA256
#   - Rétention 30 jours
#   - Copie optionnelle vers S3/MinIO
#
# Fréquence recommandée (cron ou scheduler):
#   - Quotidienne:  0 2 * * *   --type daily
#   - Hebdomadaire: 0 3 * * 0   --type weekly
#   - Mensuelle:    0 4 1 * *   --type monthly

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

BACKUP_TYPE="${BACKUP_TYPE:-daily}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
BACKUP_DIR="${BACKUP_DIR:-./backup_data}"
COMPOSE_FILE="${COMPOSE_FILE:-../docker-compose.yml}"
ENV_FILE="${ENV_FILE:-.env}"
NO_S3="${NO_S3:-false}"

DOCKER_VOLUMES="postgres_data grafana_data prometheus_data loki_data tempo_data"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --type) BACKUP_TYPE="$2"; shift 2 ;;
    --env-file) ENV_FILE="$2"; shift 2 ;;
    --no-s3) NO_S3=true; shift ;;
    -h|--help) echo "Usage: $0 [--type {daily|weekly|monthly}] [--env-file <path>] [--no-s3]"; exit 0 ;;
    *) echo "ERREUR: Argument inconnu: $1" >&2; exit 1 ;;
  esac
done

log_info()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO]  $*"; }
log_warn()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN]  $*" >&2; }
log_error() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $*" >&2; }

check_required_tools() {
  local missing=0
  for tool in pg_dump pg_restore psql docker sha256sum date tar gzip; do
    if ! command -v "$tool" &>/dev/null; then
      log_error "Outil requis manquant: $tool"
      missing=1
    fi
  done
  if [[ "$missing" -ne 0 ]]; then
    log_error "Installez les outils manquants avant de continuer."
    exit 1
  fi
}

load_env() {
  if [[ -f "$ENV_FILE" ]]; then
    log_info "Chargement du fichier d'environnement: $ENV_FILE"
    set -a
    . "$ENV_FILE"
    set +a
  else
    log_warn "Fichier d'environnement introuvable: $ENV_FILE (utilisation des valeurs par défaut)"
  fi
}

resolve_compose_file() {
  if [[ -f "$COMPOSE_FILE" ]]; then echo "$COMPOSE_FILE"
  elif [[ -f "$PROJECT_ROOT/$COMPOSE_FILE" ]]; then echo "$PROJECT_ROOT/$COMPOSE_FILE"
  else
    log_error "Fichier compose introuvable: $COMPOSE_FILE"
    exit 1
  fi
}

get_postgres_container() {
  local compose_file
  compose_file="$(resolve_compose_file)"
  docker compose -f "$compose_file" ps -q postgres 2>/dev/null | head -1
}

check_required_tools
load_env

case "$BACKUP_TYPE" in daily|weekly|monthly) ;;
  *)
    log_error "Type de sauvegarde invalide: $BACKUP_TYPE (attendu: daily|weekly|monthly)"
    exit 1 ;;
esac

TIMESTAMP="$(date '+%Y%m%d_%H%M%S')"
BACKUP_ROOT_DIR="$(cd "$BACKUP_DIR" 2>/dev/null && pwd || (mkdir -p "$BACKUP_DIR" && cd "$BACKUP_DIR" && pwd))"
BACKUP_PATH="$BACKUP_ROOT_DIR/$TIMESTAMP"
mkdir -p "$BACKUP_PATH"

log_info "=== Début de la sauvegarde ($BACKUP_TYPE) ==="
log_info "Horodatage: $TIMESTAMP"
log_info "Répertoire: $BACKUP_PATH"

POSTGRES_CONTAINER="$(get_postgres_container || true)"

if [[ -n "$POSTGRES_CONTAINER" ]]; then
  log_info "Conteneur PostgreSQL détecté: $POSTGRES_CONTAINER"
  PG_USER="${POSTGRES_USER:-takt}"
  PG_DB="${POSTGRES_DB:-takt_dev}"
  PG_PASSWORD_FILE="${POSTGRES_PASSWORD_FILE:-}"
  if [[ -n "$PG_PASSWORD_FILE" && -f "$PG_PASSWORD_FILE" ]]; then
    export PGPASSWORD="$(cat "$PG_PASSWORD_FILE")"
  elif [[ -n "${POSTGRES_PASSWORD:-}" ]]; then
    export PGPASSWORD="$POSTGRES_PASSWORD"
  fi
  log_info "Sauvegarde PostgreSQL (format custom)..."
  docker exec "$POSTGRES_CONTAINER" pg_dump -U "$PG_USER" -d "$PG_DB" -Fc > "$BACKUP_PATH/postgres_${TIMESTAMP}.custom.dump" 2>/dev/null || { log_error "Échec du pg_dump format custom"; exit 1; }
  log_info "Sauvegarde PostgreSQL (format SQL plain)..."
  docker exec "$POSTGRES_CONTAINER" pg_dump -U "$PG_USER" -d "$PG_DB" --plain > "$BACKUP_PATH/postgres_${TIMESTAMP}.plain.sql" 2>/dev/null || { log_error "Échec du pg_dump format SQL plain"; exit 1; }
  unset PGPASSWORD
else
  log_warn "Aucun conteneur PostgreSQL en cours d'exécution. Sauvegarde DB ignorée."
fi

log_info "Sauvegarde des volumes Docker..."
for volume in $DOCKER_VOLUMES; do
  if docker volume inspect "$volume" &>/dev/null; then
    log_info "Archivage du volume: $volume"
    docker run --rm -v "$volume:/source:ro" -v "$BACKUP_PATH:/destination" alpine tar czf "/destination/${volume}_${TIMESTAMP}.tar.gz" -C /source . 2>/dev/null || log_warn "Échec de l'archivage du volume: $volume (continuation)"
  else
    log_warn "Volume introuvable: $volume (ignorée)"
  fi
done

log_info "Génération des checksums SHA256..."
cd "$BACKUP_PATH"
sha256sum * > "checksums_${TIMESTAMP}.sha256" 2>/dev/null || true
cd - >/dev/null


# =============================================================================
# 4. Manifeste JSON
# =============================================================================
log_info "Génération du manifeste JSON..."

MANIFEST_PATH="$BACKUP_PATH/manifest_${TIMESTAMP}.json"

ARTIFACTS_JSON=""
first=true
for file in "$BACKUP_PATH"/*; do
  fname="$(basename "$file")"
  if [[ "$fname" == "manifest_${TIMESTAMP}.json" ]] || [[ "$fname" == "checksums_${TIMESTAMP}.sha256" ]]; then continue; fi
  fsize=$(stat -c%s "$file" 2>/dev/null || echo 0)
  fsha=$(sha256sum "$file" | awk '{print $1}')
  ftype="unknown"
  case "$fname" in
    *.custom.dump) ftype="postgres_custom" ;;
    *.plain.sql)   ftype="postgres_sql" ;;
    *.tar.gz)      ftype="docker_volume" ;;
    *.sha256)      ftype="checksums" ;;
  esac
  if [[ "$first" == true ]]; then first=false; else ARTIFACTS_JSON+=","; fi
  ARTIFACTS_JSON+="{"name":"$fname","size":$fsize,"sha256":"$fsha","type":"$ftype"}"
done

EXPIRY_DATE=$(date -d "+$RETENTION_DAYS days" '+%Y-%m-%d' 2>/dev/null || date -v +"$RETENTION_DAYS"d '+%Y-%m-%d')

cat > "$MANIFEST_PATH" << MANIFEST_EOF
{
  "backup_id": "$TIMESTAMP",
  "type": "$BACKUP_TYPE",
  "timestamp": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "postgres_version": "$(docker exec "$POSTGRES_CONTAINER" postgres --version 2>/dev/null | awk '{print $NF}' || echo 'unknown')",
  "retention_days": $RETENTION_DAYS,
  "expiry_date": "$EXPIRY_DATE",
  "artifacts": [$ARTIFACTS_JSON],
  "checksums_file": "checksums_${TIMESTAMP}.sha256"
}
MANIFEST_EOF

log_info "Manifeste généré: $MANIFEST_PATH"

# =============================================================================
# 5. Copie optionnelle vers S3/MinIO
# =============================================================================
if [[ "$NO_S3" == false && -n "${S3_ENDPOINT:-}" && -n "${S3_BUCKET:-}" ]]; then
  log_info "Copie vers S3/MinIO: $S3_ENDPOINT/$S3_BUCKET"
  if command -v aws &>/dev/null || command -v mc &>/dev/null; then
    if command -v aws &>/dev/null; then
      AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY:-}" AWS_SECRET_ACCESS_KEY="${S3_SECRET_KEY:-}"         aws --endpoint-url "$S3_ENDPOINT" s3 cp "$BACKUP_PATH/" "s3://$S3_BUCKET/backups/$TIMESTAMP/" --recursive 2>/dev/null || log_warn "Échec de la copie S3 via aws cli"
    elif command -v mc &>/dev/null; then
      mc cp --recursive "$BACKUP_PATH/" "s3takt/backups/$TIMESTAMP/" 2>/dev/null || log_warn "Échec de la copie S3 via mc"
    fi
  else
    log_warn "Ni aws cli ni mc ne sont installés. Copie S3 ignorée."
  fi
elif [[ "$NO_S3" == false ]]; then
  log_warn "S3_ENDPOINT ou S3_BUCKET non défini. Copie off-site ignorée."
fi

# =============================================================================
# 6. Rétention (suppression des sauvegardes > 30 jours)
# =============================================================================
log_info "Application de la rétention ($RETENTION_DAYS jours)..."

RETENTION_CUTOFF=$(date -d "-$RETENTION_DAYS days" '+%Y%m%d' 2>/dev/null || date -v -"$RETENTION_DAYS"d '+%Y%m%d')

for dir in "$BACKUP_ROOT_DIR"/*/; do
  dir_name=$(basename "$dir")
  dir_date="${dir_name%%_*}"
  if [[ "$dir_date" =~ ^[0-9]{8}$ ]] && [[ "$dir_date" -lt "$RETENTION_CUTOFF" ]]; then
    log_info "Suppression de la sauvegarde expirée: $dir_name"
    rm -rf "$dir"
  fi
done

# =============================================================================
# Fin
# =============================================================================
log_info "=== Sauvegarde terminée avec succès ==="
log_info "Répertoire: $BACKUP_PATH"
log_info "Manifeste: manifest_${TIMESTAMP}.json"
