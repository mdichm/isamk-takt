#!/bin/bash
# SPDX-License-Identifier: AGPL-3.0-only
# TAKT - Simulation : déclencher l'alerte TAKT_FAILED_Queue_Not_Empty (L7-11)
# Insère un job en échec dans la file pg-boss et vérifie que l'alerte se lève.

set -euo pipefail

PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
ALERT_QUERY="takt_failed_queue_size"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-120}"
POLL_INTERVAL="${POLL_INTERVAL:-5}"

echo "=== Simulation TAKT_FAILED_Queue_Not_Empty ==="

# Prérequis : vérifier que Prometheus répond
if ! curl -sf "$PROMETHEUS_URL/api/v1/query?query=up" > /dev/null 2>&1; then
  echo "ERREUR : Prometheus non joignable sur $PROMETHEUS_URL"
  exit 1
fi

# Prérequis : vérifier que la base de données est accessible
if ! command -v psql > /dev/null 2>&1; then
  echo "ERREUR : psql non disponible"
  exit 1
fi

# Insérer un job en échec dans la table pgboss_jobs
echo "Insertion d'un job en échec dans pgboss_jobs..."
psql -U "${POSTGRES_USER:-takt}" -d "${POSTGRES_DB:-takt_dev}" -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5432}" <<'SQL' > /dev/null
INSERT INTO pgboss_jobs (queue_name, state, data, error_message, attempts, max_attempts, created_at, updated_at)
VALUES ('test_failed_queue', 'failed', '{"test": true}', 'Erreur simulée pour test d\'alerte L7-11', 3, 3, NOW(), NOW());
SQL

echo "Job en échec inséré. Attente que l'alerte se lève (timeout ${TIMEOUT_SECONDS}s)..."

# Poller Prometheus jusqu'à ce que l'alerte soit firing
elapsed=0
while [ "$elapsed" -lt "$TIMEOUT_SECONDS" ]; do
  result=$(curl -sf "$PROMETHEUS_URL/api/v1/query?query=$ALERT_QUERY" 2>/dev/null || echo '{"data":{"result":[]}}')
  value=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('result',[{}])[0].get('value',[0,'0'])[1] if d.get('data',{}).get('result') else '0')" 2>/dev/null || echo '0')
  if [ "$value" != "0" ] && [ "$value" != "NaN" ] 2>/dev/null; then
    echo "ALERTE DÉCLENCHÉE : takt_failed_queue_size = $value"
    echo "SUCCÈS : TAKT_FAILED_Queue_Not_Empty est passée en firing."
    # Nettoyage : supprimer le job de test
    psql -U "${POSTGRES_USER:-takt}" -d "${POSTGRES_DB:-takt_dev}" -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5432}" -c "DELETE FROM pgboss_jobs WHERE queue_name = 'test_failed_queue';" > /dev/null 2>&1 || true
    exit 0
  fi
  sleep "$POLL_INTERVAL"
  elapsed=$((elapsed + POLL_INTERVAL))
  echo "  Attente... (${elapsed}s / ${TIMEOUT_SECONDS}s)"
done

echo "ECHEC : l'alerte TAKT_FAILED_Queue_Not_Empty ne s'est pas levée dans le délai imparti."
# Nettoyage : supprimer le job de test
psql -U "${POSTGRES_USER:-takt}" -d "${POSTGRES_DB:-takt_dev}" -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5432}" -c "DELETE FROM pgboss_jobs WHERE queue_name = 'test_failed_queue';" > /dev/null 2>&1 || true
exit 1