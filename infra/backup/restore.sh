#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-only
# TAKT - Script de restauration PostgreSQL et volumes Docker
# Usage: ./restore.sh <backup_dir|timestamp> [--env-file <path>] [--no-restart]
#
# Restaure:
#   - PostgreSQL depuis pg_dump (format custom ou SQL plain)
#   - Volumes Docker depuis les archives tar.gz
#   - Vérification d'intégrité des checksums SHA256
#
# Exemples:
#   ./restore.sh 20240115_020000
#   ./restore.sh ./backup_data/20240115_020000
#   ./restore.sh 20240115_020000 --no-restart

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
ENV_FILE="${ENV_FILE:-.env}"
NO_RESTART="${NO_RESTART:-false}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file) ENV_FILE="$2"; shift 2 ;;
    --no-restart) NO_RESTART=true; shift ;;
    -h|--help) echo "Usage: $0 <backup_dir|timestamp> [--env-file <path>] [--no-restart]"; exit 0 ;;
    -*) echo "ERREUR: Option inconnue: $1" >&2; exit 1 ;;
    *) TARGET="$1"; shift ;;
  esac
done

if [[ -z "${TARGET:-}" ]]; then
  echo "ERREUR: Argument requis: backup_dir ou timestamp" >&2
  echo "Usage: $0 <backup_dir|timestamp> [--env-file <path>] [--no-restart]" >&2
  exit 1
fi

log_info()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO]  $*"; }
log_warn()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN]  $*" >&2; }
log_error() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $*" >&2; }

check_required_tools() {
  local missing=0
  for tool in docker sha256sum tar gzip psql pg_restore; do
    if ! command -v "$tool" &>/dev/null; then
      log_error "Outil requis manquant: $tool"
      missing=1
    fi
  done
  if [[ "$missing" -ne 0 ]]; then exit 1; fi
}

load_env() {
  if [[ -f "$ENV_FILE" ]]; then
    log_info "Chargement du fichier d'environnement: $ENV_FILE"
    set -a
    . "$ENV_FILE"
    set +a
  fi
}

resolve_backup_path() {
  local target="$1"
  if [[ -d "$target" ]]; then
    echo "$(cd "$target" && pwd)"
    return
  fi
  local backup_root="./backup_data"
  if [[ -d "$backup_root/$target" ]]; then
    echo "$(cd "$backup_root/$target" && pwd)"
    return
  fi
  for dir in "$backup_root"/*/; do
    if [[ "$(basename "$dir")" == "$target" ]]; then
      echo "$(cd "$dir" && pwd)"
      return
    fi
  done
  log_error "Sauvegarde introuvable: $target"
  exit 1
}

get_postgres_container() {
  local compose_file="../docker-compose.yml"
  if [[ -f "$PROJECT_ROOT/$compose_file" ]]; then compose_file="$PROJECT_ROOT/$compose_file"; fi
  docker compose -f "$compose_file" ps -q postgres 2>/dev/null | head -1
}

check_required_tools
load_env

BACKUP_PATH="$(resolve_backup_path "$TARGET")"
MANIFEST_FILE="$(ls "$BACKUP_PATH"/manifest_*.json 2>/dev/null | head -1)

if [[ -z "$MANIFEST_FILE" ]]; then
  log_error "Aucun manifeste JSON trouvé dans $BACKUP_PATH"
  exit 1
fi

log_info "=== Début de la restauration ==="
log_info "Sauvegarde: $BACKUP_PATH"
log_info "Manifeste: $(basename "$MANIFEST_FILE")"

# Vérification d'intégrité des checksums
log_info "Vérification d'intégrité des checksums SHA256..."
CHECKSUM_FILE="$(ls "$BACKUP_PATH"/checksums_*.sha256 2>/dev/null | head -1)"
if [[ -n "$CHECKSUM_FILE" ]]; then
  cd "$BACKUP_PATH"
  if ! sha256sum -c "$(basename "$CHECKSUM_FILE")" 2>/dev/null; then
    log_error "Échec de la vérification des checksums SHA256"
    exit 1
  fi
  cd - >/dev/null
  log_info "Checksums SHA256 vérifiés avec succès"
else
  log_warn "Aucun fichier de checksums trouvé, vérification d'intégrité ignorée"
fi

# Arrêter les services qui utilisent la base
POSTGRES_CONTAINER="$(get_postgres_container || true)"
if [[ -n "$POSTGRES_CONTAINER" ]]; then
  log_info "Arret des services dependants api worker..."
  docker compose -f ../docker-compose.yml stop api worker 2>/dev/null || true
fi

# Restauration PostgreSQL
PG_USER="${POSTGRES_USER:-takt}"
PG_DB="${POSTGRES_DB:-takt_dev}"
PG_PASSWORD_FILE="${POSTGRES_PASSWORD_FILE:-}"
if [[ -n "$PG_PASSWORD_FILE" && -f "$PG_PASSWORD_FILE" ]]; then
  export PGPASSWORD="$(cat "$PG_PASSWORD_FILE")"
elif [[ -n "${POSTGRES_PASSWORD:-}" ]]; then
  export PGPASSWORD="$POSTGRES_PASSWORD"
fi

CUSTOM_DUMP="$(ls "$BACKUP_PATH"/postgres_*.custom.dump 2>/dev/null | head -1)
PLAIN_SQL="$(ls "$BACKUP_PATH"/postgres_*.plain.sql 2>/dev/null | head -1)"

if [[ -n "$CUSTOM_DUMP" ]] && [[ -n "$POSTGRES_CONTAINER" ]]; then
  log_info "Restauration PostgreSQL depuis le format custom..."
  docker exec -i "$POSTGRES_CONTAINER" \\
    pg_restore -U "$PG_USER" -d "$PG_DB" --clean --if-exists --no-owner < "$CUSTOM_DUMP" || \\
    { log_error "Échec de la restauration pg_restore"; exit 1; }
elif [[ -n "$PLAIN_SQL" ]] && [[ -n "$POSTGRES_CONTAINER" ]]; then
  log_info "Restauration PostgreSQL depuis le format SQL plain..."
  docker exec -i "$POSTGRES_CONTAINER" \\
    psql -U "$PG_USER" -d "$PG_DB" -f "$PLAIN_SQL" || \\
    { log_error "Échec de la restauration psql"; exit 1; }
else
  log_warn "Aucun fichier de dump PostgreSQL trouvé ou conteneur indisponible"
fi

unset PGPASSWORD

# Restauration des volumes Docker
log_info "Restauration des volumes Docker..."
for tar_file in "$BACKUP_PATH"/*_${TARGET##*/}.tar.gz "$BACKUP_PATH"/*.tar.gz; do
  if [[ -f "$tar_file" ]]; then
    volume_name="$(basename "$tar_file" | sed 's/_.*//')"
    log_info "Restauration du volume: $volume_name"
    docker volume create "$volume_name" 2>/dev/null || true
    docker run --rm \\
      -v "$volume_name:/destination" \\
      -v "$BACKUP_PATH:/source:ro" \\
      alpine tar xzf "/source/$(basename "$tar_file")" -C /destination || \\
      log_warn "Échec de la restauration du volume: $volume_name"
  fi
done

# Redémarrage des services
if [[ "$NO_RESTART" == false && -n "$POSTGRES_CONTAINER" ]]; then
  log_info "Redemarrage des services api worker..."
  docker compose -f ../docker-compose.yml up -d api worker 2>/dev/null || true
fi

# Vérification post-restauration
if [[ -n "$POSTGRES_CONTAINER" ]]; then
  log_info "Vérification de la base de données restaurée..."
  docker exec "$POSTGRES_CONTAINER" pg_isready -U "$PG_USER" -d "$PG_DB" || \\
    { log_error "La base de donnees n'est pas prete après restauration"; exit 1; }
  log_info "Base de données restaurée et opérationnelle"
fi

log_info "=== Restauration terminée avec succès ==="
