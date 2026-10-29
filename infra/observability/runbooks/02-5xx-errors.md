# Runbook — TAKT_API_5xx_Errors

## Alerte

| Champ | Valeur |
|-------|--------|
| Nom | `TAKT_API_5xx_Errors` |
| Sévérité | critical |
| Métrique | `rate(takt_http_requests_total{status_code=~"5.."}[5m]) > 0.01` |
| Durée | `for: 2m` |
| Source | `apps/api/src/common/metrics/metrics.service.ts` (Counter `takt_http_requests_total`) |

## Symptôme et impact métier

Plus de 1 % des requêtes HTTP à l'API retournent une erreur 5xx sur une fenêtre de 5 minutes. Impact : les utilisateurs ne peuvent pas accéder aux fonctionnalités (répartition, génération, validation, export), risque de blocage de l'activité pédagogique.

## Diagnostic

1. **Vérifier l'alerte dans Prometheus** :
   ```bash
   curl -s 'http://prometheus:9090/api/v1/query?query=rate(takt_http_requests_total{status_code=~"5.."}[5m])'
   ```

2. **Identifier les routes en erreur** :
   ```bash
   curl -s 'http://prometheus:9090/api/v1/query?query=rate(takt_http_requests_total{status_code=~"5.."}[5m]) by (route, method)'
   ```

3. **Consulter les logs de l'API (Loki)** :
   ```bash
   {app="api"} |= "500" | json
   # Rechercher par requestId pour corréler avec les traces
   ```

4. **Consulter les traces (Tempo)** :
   Rechercher par `requestId` présent dans les logs pour voir la chaîne d'appels API → base → worker.

5. **Dashboard Grafana concerné** :
   Panel "Taux d'erreur 5xx" du dashboard `TAKT - Overview`.

## Remédiation immédiate

1. **Redémarrer l'API** si le problème est transitoire (mémoire, connexion DB perdue) :
   ```bash
   docker compose restart api
   ```
2. **Vérifier la santé de PostgreSQL** :
   ```bash
   docker compose exec postgres pg_isready -U $POSTGRES_USER -d $POSTGRES_DB
   ```
3. **Vérifier les logs détaillés** pour identifier l'exception non gérée :
   ```bash
   docker compose logs api --tail=100 | grep -i error
   ```

## Actions de fond

- Corriger l'exception non gérée identifiée dans les logs.
- Ajouter un test de non-régression pour le scénario en cause.
- Revue du code des routes les plus impactées.

## Escalade

- **Niveau 1** : équipe d'exploitation (redémarrage, vérification DB).
- **Niveau 2** : équipe développement (correction applicative).
- **Niveau 3** : administrateur système (infrastructure, base de données).

## Références

- Ticket : [L7-11 — Alarmes et runbooks](https://github.com/mdichm/isamk-takt/issues/L7-11)
- Spécification technique : docs/ST_TAKT.md §5.4
- Dépendance : ticket obs (L0-09)