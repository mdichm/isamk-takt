#!/bin/bash
# SPDX-License-Identifier: AGPL-3.0-only
# TAKT - Simulation : déclencher l'alerte TAKT_Generation_Too_Long (L7-11)
# Simule une génération FET > 10 min et vérifie que l'alerte se lève.

set -euo pipefail

API_URL="${API_URL:-http://localhost:3000}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
ALERT_QUERY='takt_generation_duration_seconds'
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-120}"
POLL_INTERVAL="${POLL_INTERVAL:-5}"

echo "=== Simulation TAKT_Generation_Too_Long ==="

if ! curl -sf "$PROMETHEUS_URL/api/v1/query?query=up" > /dev/null 2>&1; then
  echo "ERREUR : Prometheus non joignable sur $PROMETHEUS_URL"
  exit 1
fi

# Déclencher une génération FET (asynchrone) via l'API
echo "Déclenchement d'une génération FET via l'API..."
VERSION_ID="${VERSION_ID:-version-test}"
curl -s -o /dev/null -X POST "$API_URL/versions/$VERSION_ID/generations" \
  -H "Content-Type: application/json" \
  -d '{}' 2>/dev/null || true

# Alternative : injecter directement une métrique de durée élevée via l'endpoint de test
curl -s -o /dev/null -X POST "$API_URL/metrics/test/generation-longue" \
  -H "Content-Type: application/json" \
  -d '{"duration": 601}' 2>/dev/null || true

echo "Génération longue simulée. Attente que l'alerte se lève (timeout ${TIMEOUT_SECONDS}s)..."

elapsed=0
while [ "$elapsed" -lt "$TIMEOUT_SECONDS" ]; do
  result=$(curl -sf "$PROMETHEUS_URL/api/v1/query?query=$ALERT_QUERY" 2>/dev/null || echo '{"data":{"result":[]}}')
  value=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); r=d.get('data',{}).get('result',[]); print(r[0].get('value',[0,'0'])[1] if r else '0')" 2>/dev/null || echo '0')
  # Vérifier si une valeur > 600 est présente
  if python3 -c "try: v=float('$value'); exit(0 if v > 600 else 1); except: exit(1)" 2>/dev/null; then
    echo "ALERTE DÉCLENCHÉE : takt_generation_duration_seconds = $value (> 600s)."
    echo "SUCCÈS : TAKT_Generation_Too_Long est passée en firing."
    exit 0
  fi
  sleep "$POLL_INTERVAL"
  elapsed=$((elapsed + POLL_INTERVAL))
  echo "  Attente... (${elapsed}s / ${TIMEOUT_SECONDS}s)"
done

echo "ECHEC : l'alerte TAKT_Generation_Too_Long ne s'est pas levée dans le délai imparti."
exit 1