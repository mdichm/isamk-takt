#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-only
# TAKT - Simulation du droit d'accès aux données personnelles (L7-12, EX-NFR-06)
# Appelle l'endpoint GET /utilisateurs/mes-donnees et vérifie la réponse.
#
# Prérequis : curl, backend API démarré, un JWT valide dans le fichier .token

set -euo pipefail

API_URL="${API_URL:-http://localhost:3000}"
TOKEN_FILE="${TOKEN_FILE:-.token}"

echo "=== Simulation droit d'accès (L7-12) ==="

if [ ! -f "$TOKEN_FILE" ]; then
  echo "⚠️  Fichier de token '$TOKEN_FILE' introuvable."
  echo "   Générez un JWT de test et placez-le dans $TOKEN_FILE."
  echo "   Exemple de test manuel :"
  echo "     curl -H 'Authorization: Bearer <JETON>' $API_URL/utilisateurs/mes-donnees"
  exit 0
fi

TOKEN=$(cat "$TOKEN_FILE")

echo "Appel de GET $API_URL/utilisateurs/mes-donnees ..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/utilisateurs/mes-donnees")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Code HTTP : $HTTP_CODE"
echo "Corps de la réponse :"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ SUCCÈS : le droit d'accès fonctionne."
  exit 0
else
  echo "❌ ÉCHEC : code HTTP $HTTP_CODE."
  exit 1
fi