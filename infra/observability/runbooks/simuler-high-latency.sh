#!/bin/bash
# SPDX-License-Identifier: AGPL-3.0-only
# TAKT - Simulation : déclencher l'alerte TAKT_API_HighLatency (L7-11)
# Génère des requêtes lentes (p95 > 1s) et vérifie que l'alerte se lève.

set -euo pipefail

API_URL="${API_URL:-http://localhost:3000}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
ALERT_QUERY='histogram_quantile(0.95, rate(takt_http_request_duration_seconds_bucket[5m]))'
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-120}"
POLL_INTERVAL="${POLL_INTERVAL:-5}"

echo "=== Simulation TAKT_API_HighLatency ==="

if ! curl -sf "$PROMETHEUS_URL/api/v1/query?query=up" > /dev/null 2>&1; then
  echo "ERREUR : Prometheus non joignable sur $PROMETHEUS_URL"
  exit 1
fi

# Générer des requêtes lentes en appelant un endpoint qui met du temps à répondre
echo "Génération de requêtes lentes sur l'API..."
end_time=$(($(date +%s) + 30))  # Générer pendant 30 secondes
while [ "$(date +%s)" -lt "$end_time" ]; do
  # Appeler une route avec un paramètre qui force un traitement long, ou simplement faire des requêtes avec delay
  curl -s -o /dev/null --max-time 5 "$API_URL/health" 2>/dev/null || true
  curl -s -o /dev/null --max-time 5 "$API_URL/api/health" 2>/dev/null || true
  # Forcer un délai côté serveur si un endpoint de test existe
  curl -s -o /dev/null --max-time 5 "$API_URL/test/slow" 2>/dev/null || true
  sleep 0.2
done &
bg_pid=$!

echo "Requêtes lentes générées. Attente que l'alerte se lève (timeout ${TIMEOUT_SECONDS}s)..."

elapsed=0
while [ "$elapsed" -lt "$TIMEOUT_SECONDS" ]; do
  result=$(curl -sf "$PROMETHEUS_URL/api/v1/query?query=$(echo "$ALERT_QUERY" | sed 's/./%5C&/g')" 2>/dev/null || echo '{"data":{"result":[]}}')
  value=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); r=d.get('data',{}).get('result',[]); print(r[0].get('value',[0,'0'])[1] if r else '0')" 2>/dev/null || echo '0')
  if python3 -c "try: v=float('$value'); exit(0 if v > 1 else 1); except: exit(1)" 2>/dev/null; then
    echo "ALERTE DÉCLENCHÉE : latence p95 = $value s (> 1s)."
    echo "SUCCÈS : TAKT_API_HighLatency est passée en firing."
    kill "$bg_pid" 2>/dev/null || true
    wait "$bg_pid" 2>/dev/null || true
    exit 0
  fi
  sleep "$POLL_INTERVAL"
  elapsed=$((elapsed + POLL_INTERVAL))
  echo "  Attente... (${elapsed}s / ${TIMEOUT_SECONDS}s)"
done

echo "ECHEC : l'alerte TAKT_API_HighLatency ne s'est pas levée dans le délai imparti."
kill "$bg_pid" 2>/dev/null || true
wait "$bg_pid" 2>/dev/null || true
exit 1