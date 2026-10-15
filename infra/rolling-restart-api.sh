#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-only
# TAKT - Script de redémarrage progressif de l'API avec contrôles de santé
# Usage: ./rolling-restart-api.sh [env] [replicas]
# Exemple: ./rolling-restart-api.sh recette 2
# Exemple: ./rolling-restart-api.sh prod 3

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

ENV="${1:-dev}"
REPLICAS="${2:-1}"

case "$ENV" in
  dev)
    COMPOSE_FILES=("$SCRIPT_DIR/docker-compose.yml" "$SCRIPT_DIR/docker-compose.override.yml")
    ENV_FILE="$SCRIPT_DIR/.env"
    ;;
  recette)
    COMPOSE_FILES=("$SCRIPT_DIR/docker-compose.yml" "$SCRIPT_DIR/docker-compose.recette.yml")
    ENV_FILE="$SCRIPT_DIR/.env.recette"
    ;;
  prod)
    COMPOSE_FILES=("$SCRIPT_DIR/docker-compose.yml" "$SCRIPT_DIR/docker-compose.prod.yml")
    ENV_FILE="$SCRIPT_DIR/.env.prod"
    ;;
  *)
    echo "ERREUR: Environnement inconnu '$ENV'. Utilisez: dev, recette ou prod"
    exit 1
    ;;
esac

INTERVAL=30
MAX_FAILURES=3

# Construire les arguments -f pour docker compose
COMPOSE_ARGS=""
for f in "${COMPOSE_FILES[@]}"; do
  COMPOSE_ARGS="$COMPOSE_ARGS -f $f"
done

echo "=== Redémarrage progressif de l'API sur l'environnement : $ENV ==="
echo "Fichiers Compose : ${COMPOSE_FILES[*]}"
echo "Fichier d'environnement : $ENV_FILE"
echo "Réplicas API : $REPLICAS"
echo ""

# =============================================================================
# Fonctions
# =============================================================================
check_api_healthy() {
  local healthy_count
  healthy_count=$(docker compose $COMPOSE_ARGS --env-file "$ENV_FILE" ps api --filter "health=healthy" 2>/dev/null | grep -c "healthy" || echo "0")
  echo "$healthy_count"
}

wait_for_healthy() {
  local instance=$1
  local max_attempts=$MAX_FAILURES
  local attempt=0
  while [ $attempt -lt $max_attempts ]; do
    attempt=$((attempt + 1))
    local healthy=$(check_api_healthy)
    if [ "$healthy" -ge "$instance" ]; then
      echo "  ✓ Instance $instance : $healthy instance(s) API saine(s)"
      return 0
    fi
    echo "  Attente healthcheck instance $instance... (tentative $attempt/$max_attempts)"
    sleep "$INTERVAL"
  done
  echo "  ✗ ERREUR : L'instance $instance n'est pas devenue saine après $max_attempts tentatives"
  return 1
}

# =============================================================================
# Redémarrage progressif
# =============================================================================
echo "Démarrage du redémarrage progressif de l'API..."

for i in $(seq 1 "$REPLICAS"); do
  echo "--- Redémarrage de l'instance API #$i/$REPLICAS ---"
  docker compose $COMPOSE_ARGS --env-file "$ENV_FILE" \
    up -d --no-deps --scale api="$REPLICAS" api

  if ! wait_for_healthy "$i"; then
    echo ""
    echo "ERREUR : Échec du redémarrage progressif à l'instance #$i"
    echo "Tentative de restauration..."
    docker compose $COMPOSE_ARGS --env-file "$ENV_FILE" \
      up -d --no-deps --scale api="$REPLICAS" api || true
    exit 1
  fi
done

echo ""
echo "=== Redémarrage progressif terminé avec succès ==="
echo "Toutes les $REPLICAS instance(s) API sont saines sur l'environnement $ENV."