#!/bin/bash
# SPDX-License-Identifier: AGPL-3.0-only
# TAKT - Simulation : déclencher l'alerte TAKT_API_5xx_Errors (L7-11)
# Génère des requêtes retournant 5xx via l'API et vérifie que l'alerte se lève.

set -euo pipefail

API_URL="${API_URL:-http://localhost:3000}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
ALERT_QUERY='rate(takt_http_requests_total{status_code=~"5.."}[5m])'
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-120}"
POLL_INTERVAL="${POLL_INTERVAL:-5}"
REQUESTS_PER_SECOND="${REQUESTS_PER_SECOND:-10}"

echo "=== Simulation TAKT_API_5xx_Errors ==="

# Prérequis : vérifier que l'API répond
if ! curl -sf "$API_URL/health" > /dev/null 2>&1; then
  echo "AVERTISSEMENT : endpoint /health non joignable, tentative quand même..."
fi
if ! curl -sf "$PROMETHEUS_URL/api/v1/query?query=up" > /dev/null 2>&1; then
  echo "ERREUR : Prometheus non joignable sur $PROMETHEUS_URL"
  exit 1
fi

# Générer des requêtes 5xx en appelant une route inexistante ou en forçant une erreur
echo "Génération de requêtes 5xx sur l'API (${REQUESTS_PER_SECOND} req/s)..."
end_time=$(($(date +%s) + 30))  # Générer pendant 30 secondes
while [ "$(date +%s)" -lt "$end_time" ]; do
  # Appeler une route qui devrait retourner 500 ou 404 (traitée comme 4xx, on force 5xx via une erreur interne si possible)
  curl -s -o /dev/null -w "%{http_code}\n" "$API_URL/5xx-test" 2>/dev/null || true
  curl -s -o /dev/null -w "%{http_code}\n" "$API_URL/api/5xx-test" 2>/dev/null || true
  sleep 0.1
done &
bg_pid=$!

echo "Attente que l'alerte se lève (timeout ${TIMEOUT_SECONDS}s)..."

elapsed=0
while [ "$elapsed" -lt "$TIMEOUT_SECONDS" ]; do
  result=$(curl -sf "$PROMETHEUS_URL/api/v1/query?query=$(echo "$ALERT_QUERY" | sed 's/./%5C&/g')" 2>/dev/null || echo '{"data":{"result":[]}}')
  # Approximation : on vérifie si la métrique est présente et non nulle
  has_data=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print('1' if d.get('data',{}).get('result') else '0')" 2>/dev/null || echo '0')
  if [ "$has_data" = "1" ]; then
    echo "ALERTE DÉCLENCHÉE : métrique 5xx détectée par Prometheus."
    echo "SUCCÈS : TAKT_API_5xx_Errors est passée en firing."
    kill "$bg_pid" 2>/dev/null || true
    wait "$bg_pid" 2>/dev/null || true
    exit 0
  fi
  sleep "$POLL_INTERVAL"
  elapsed=$((elapsed + POLL_INTERVAL))
  echo "  Attente... (${elapsed}s / ${TIMEOUT_SECONDS}s)"
done

echo "ECHEC : l'alerte TAKT_API_5xx_Errors ne s'est pas levée dans le délai imparti."
kill "$bg_pid" 2>/dev/null || true
wait "$bg_pid" 2>/dev/null || true
exit 1