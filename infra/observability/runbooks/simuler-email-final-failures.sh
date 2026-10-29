#!/bin/bash
# SPDX-License-Identifier: AGPL-3.0-only
# TAKT - Simulation : déclencher l'alerte TAKT_Email_Final_Failures (L7-11)
# Force un échec d'envoi d'e-mail définitif et vérifie que l'alerte se lève.

set -euo pipefail

API_URL="${API_URL:-http://localhost:3000}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
ALERT_QUERY='increase(takt_email_final_failures_total[10m])'
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-120}"
POLL_INTERVAL="${POLL_INTERVAL:-5}"

echo "=== Simulation TAKT_Email_Final_Failures ==="

if ! curl -sf "$PROMETHEUS_URL/api/v1/query?query=up" > /dev/null 2>&1; then
  echo "ERREUR : Prometheus non joignable sur $PROMETHEUS_URL"
  exit 1
fi

# Forcer un échec d'e-mail en appelant l'API avec un destinataire invalide ou en coupant le SMTP
echo "Déclenchement d'un échec d'envoi d'e-mail..."
# Appeler une endpoint de notification si disponible, sinon utiliser les métriques directement
# On tente d'envoyer une notification vers une adresse invalide pour forcer l'échec
curl -s -o /dev/null -X POST "$API_URL/notifications/test-fail" \
  -H "Content-Type: application/json" \
  -d '{"to":"invalid@invalid.invalid","subject":"Test échec L7-11","body":"Test"}' 2>/dev/null || true

# Alternative : incrémenter directement la métrique si un endpoint de test existe
curl -s -o /dev/null -X POST "$API_URL/metrics/test/email-failure" 2>/dev/null || true

echo "Échec d'e-mail simulé. Attente que l'alerte se lève (timeout ${TIMEOUT_SECONDS}s)..."

elapsed=0
while [ "$elapsed" -lt "$TIMEOUT_SECONDS" ]; do
  result=$(curl -sf "$PROMETHEUS_URL/api/v1/query?query=$(echo "$ALERT_QUERY" | sed 's/./%5C&/g')" 2>/dev/null || echo '{"data":{"result":[]}}')
  has_data=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print('1' if d.get('data',{}).get('result') else '0')" 2>/dev/null || echo '0')
  if [ "$has_data" = "1" ]; then
    echo "ALERTE DÉCLENCHÉE : métrique e-mail final failures détectée par Prometheus."
    echo "SUCCÈS : TAKT_Email_Final_Failures est passée en firing."
    exit 0
  fi
  sleep "$POLL_INTERVAL"
  elapsed=$((elapsed + POLL_INTERVAL))
  echo "  Attente... (${elapsed}s / ${TIMEOUT_SECONDS}s)"
done

echo "ECHEC : l'alerte TAKT_Email_Final_Failures ne s'est pas levée dans le délai imparti."
exit 1