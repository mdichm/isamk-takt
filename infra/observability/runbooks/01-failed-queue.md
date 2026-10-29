# Runbook — TAKT_FAILED_Queue_Not_Empty

## Alerte

| Champ | Valeur |
|-------|--------|
| Nom | `TAKT_FAILED_Queue_Not_Empty` |
| Sévérité | critical |
| Métrique | `takt_failed_queue_size > 0` |
| Durée | `for: 1m` |
| Source | `apps/api/src/common/metrics/metrics.service.ts` (Gauge mis à jour par `setFailedQueueSize`) |

## Symptôme et impact métier

Des jobs sont en échec définitif dans la file d'échecs pg-boss. Cela signifie que des tâches asynchrones (génération FET, export PDF/Excel, envoi d'e-mail) n'ont pas pu aboutir malgré les reprises. Impact : les notifications n'arrivent pas aux destinataires, les exports ne sont pas produits, les générations restent bloquées.

## Diagnostic

1. **Vérifier l'alerte dans Prometheus** :
   ```bash
   curl -s 'http://prometheus:9090/api/v1/query?query=takt_failed_queue_size'
   ```

2. **Consulter les logs de l'API (Loki)** :
   ```bash
   # Logs du service email et des jobs
   {app="api", job="takt-api"} |= "erreur" | json | status >= 500
   ```

3. **Consulter les traces (Tempo)** :
   Rechercher par `requestId` dans les logs pour corréler avec les traces OpenTelemetry.

4. **Inspecter les jobs en échec dans PostgreSQL** :
   ```bash
   # Se connecter à la base et lister les jobs en échec
   psql -U $POSTGRES_USER -d $POSTGRES_DB -c "
     SELECT id, queue_name, state, data, error_message, updated_at
     FROM pgboss_jobs
     WHERE state = 'failed'
     ORDER BY updated_at DESC
     LIMIT 20;
   "
   ```

5. **Dashboard Grafana concerné** :
   Panel "File d'échecs" du dashboard `TAKT - Overview`.

## Remédiation immédiate

1. **Identifier la cause racine** dans les logs et la table `pgboss_jobs` (colonne `error_message`).
2. **Si le problème est SMTP** : vérifier la configuration SMTP (`cck.rnu.tn`), tester l'envoi manuel, relancer la file d'échecs après réparation.
3. **Si le problème est un job spécifique** : inspecter le payload du job en échec, corriger les données en cause, puis relancer manuellement le job via pg-boss ou supprimer le job bloquant.
4. **Surveiller** que `takt_failed_queue_size` retourne à 0.

## Actions de fond

- Mettre en place une surveillance proactive sur `takt_failed_queue_size` avec Alertmanager.
- Revue trimestrielle des jobs en échec récurrents.
- Documenter les codes d'erreur pg-boss fréquents et leurs remèdes.

## Escalade

- **Niveau 1** : équipe d'exploitation (vérification logs, redémarrage des files).
- **Niveau 2** : équipe développement (correction du code si bug applicatif).
- **Niveau 3** : administrateur système (si problème infrastructure/réseau/SMTP).

## Références

- Ticket : [L7-11 — Alarmes et runbooks](https://github.com/mdichm/isamk-takt/issues/L7-11)
- Spécification technique : docs/ST_TAKT.md §5.4
- Dépendance : ticket obs (L0-09), notif_mail (L5-22)