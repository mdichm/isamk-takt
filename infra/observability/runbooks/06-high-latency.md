# Runbook — TAKT_API_HighLatency

## Alerte

| Champ | Valeur |
|-------|--------|
| Nom | `TAKT_API_HighLatency` |
| Sévérité | warning |
| Métrique | `histogram_quantile(0.95, rate(takt_http_request_duration_seconds_bucket[5m])) > 1` |
| Durée | `for: 3m` |
| Source | `apps/api/src/common/metrics/metrics.service.ts` (Histogram `takt_http_request_duration_seconds`) |

## Symptôme et impact métier

Le 95e centile de latence des requêtes API dépasse 1 seconde sur 5 minutes. Impact : temps de réponse lent pour les utilisateurs (grille, saisie, validation), dégradation de l'expérience utilisateur.

## Diagnostic

1. **Vérifier l'alerte dans Prometheus** :
   ```bash
   curl -s 'http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95, rate(takt_http_request_duration_seconds_bucket[5m]))'
   ```

2. **Identifier les routes lentes** :
   ```bash
   curl -s 'http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95, rate(takt_http_request_duration_seconds_bucket[5m])) by (route)'
   ```

3. **Consulter les logs de l'API (Loki)** :
   ```bash
   {app="api"} | json | duration > 1
   ```

4. **Consulter les traces (Tempo)** :
   Rechercher les requêtes lentes par `requestId` pour identifier l'étape bloquante (DB, worker, calcul métier).

5. **Dashboard Grafana concerné** :
   Panel "Latence p95 par route" du dashboard `TAKT - Overview`.

## Remédiation immédiate

1. **Vérifier la charge** sur l'API et la base de données.
2. **Vérifier les index de base de données** pour les routes lentes.
3. **Vérifier le cache de calcul** (OccupancyIndex en mémoire de l'instance API).
4. **Redémarrer l'API** si nécessaire pour purger les caches ou les connexions DB.

## Actions de fond

- Optimiser les requêtes SQL des routes lentes (ajout d'index, réécriture).
- Revue du cache de calcul et des stratégies d'invalidation.
- Mise à l'échelle de l'API si la charge le justifie.

## Escalade

- **Niveau 1** : équipe d'exploitation (vérification charge, redémarrage).
- **Niveau 2** : équipe développement (optimisation requêtes, index).
- **Niveau 3** : administrateur système (infrastructure, base de données).

## Références

- Ticket : [L7-11 — Alarmes et runbooks](https://github.com/mdichm/isamk-takt/issues/L7-11)
- Spécification technique : docs/ST_TAKT.md §5.4
- Dépendance : ticket obs (L0-09)