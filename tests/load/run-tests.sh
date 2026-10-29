#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# TAKT - Procédure d'exécution des tests de charge k6 (ticket L7-08)
# Prérequis : API démarrée sur http://localhost:3000, base de données seedée.
# ============================================================================

echo "=== Tests de charge k6 (L7-08) ==="
echo "Prérequis :"
echo "  1. API démarrée sur http://localhost:3000"
echo "  2. Base de données seedée (pnpm tsx tests/load/seed.ts)"
echo ""
echo "Étapes :"
echo "  1. pnpm --filter @takt/api db:generate"
echo "  2. pnpm tsx tests/load/seed.ts"
echo "  3. Récupérer le token JWT :"
echo "     TOKEN=\$(curl -s -X POST http://localhost:3000/auth/login \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"email\":\"gestionnaire@takt.test\",\"password\":\"TaktTest2026!\"}' \\"
echo "     | node -e \"let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).accessToken))\")"
echo "  4. Lancer les scénarios k6 :"
echo "     k6 run tests/load/k6/scenarios/placement.js"
echo "     k6 run tests/load/k6/scenarios/grille.js"
echo "     k6 run tests/load/k6/scenarios/tableau-de-bord.js"
echo "     k6 run tests/load/k6/scenarios/suggestions.js"
echo "     k6 run tests/load/k6/scenarios/charges-departement.js"
echo "     k6 run tests/load/k6/scenarios/generation-parallele.js"
echo "     k6 run tests/load/k6/scenarios/export-pdf.js"
echo ""
echo "Les seuils p95 (ST §5.4) sont vérifiés automatiquement par k6."
echo "Consigner les résultats dans docs/tests/resultats-charge-L7-08.md."
