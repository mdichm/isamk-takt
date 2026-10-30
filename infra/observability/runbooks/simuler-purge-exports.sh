#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-only
# TAKT - Simulation de purge des exports expirés (L7-12, EX-NFR-06)
# Insère un ExportJob expiré, exécute purge_journaux(), vérifie la suppression.
#
# Prérequis : psql, base de données TAKT démarrée, variables d'environnement
#   DATABASE_URL (ex: postgresql://takt:takt_dev_password@localhost:5432/takt_dev?schema=public)

set -euo pipefail

DB_URL="${DATABASE_URL:-postgresql://takt:takt_dev_password@localhost:5432/takt_dev?schema=public}"

echo "=== Simulation purge exports (L7-12) ==="

# 1. Insérer un ExportJob expiré (date de fin il y a 400 jours, plus que 365 jours par défaut)
EXPIRED_JOB_ID=$(psql "$DB_URL" -t -A -c "
  INSERT INTO export_jobs (version_id, format, mode, statut, created_at, finished_at, auteur_id)
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    'csv',
    'complet',
    'termine',
    NOW() - INTERVAL '500 days',
    NOW() - INTERVAL '400 days',
    '00000000-0000-0000-0000-000000000000'
  )
  RETURNING id;
")

echo "ExportJob expiré inséré : id=$EXPIRED_JOB_ID"

# 2. Vérifier qu'il existe avant purge
COUNT_BEFORE=$(psql "$DB_URL" -t -A -c "SELECT COUNT(*) FROM export_jobs WHERE id = '$EXPIRED_JOB_ID';")
echo "ExportJobs avant purge : $COUNT_BEFORE"

# 3. Configurer conservationExportJours = 365 (si pas déjà configuré)
psql "$DB_URL" -c "
  UPDATE parametres_securite SET conservation_export_jours = 365 WHERE id = 1;
" > /dev/null

# 4. Exécuter purge_journaux()
psql "$DB_URL" -c "SELECT purge_journaux();" > /dev/null
echo "Fonction purge_journaux() exécutée."

# 5. Vérifier que l'ExportJob expiré a été supprimé
COUNT_AFTER=$(psql "$DB_URL" -t -A -c "SELECT COUNT(*) FROM export_jobs WHERE id = '$EXPIRED_JOB_ID';")
echo "ExportJobs après purge : $COUNT_AFTER"

if [ "$COUNT_AFTER" = "0" ]; then
  echo "✅ SUCCÈS : l'ExportJob expiré a été purgé."
  exit 0
else
  echo "❌ ÉCHEC : l'ExportJob expiré n'a pas été purgé."
  exit 1
fi