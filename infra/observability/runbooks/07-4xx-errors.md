# Runbook — TAKT_API_4xx_Errors

## Alerte

| Champ | Valeur |
|-------|--------|
| Nom | `TAKT_API_4xx_Errors` |
| Sévérité | warning |
| Métrique | `rate(takt_http_requests_total{status_code=~"4.."}[5m]) > 0.05` |
| Durée | `for: 5m` |
| Source | `apps/api/src/common/metrics/metrics.service.ts` (Counter `takt_http_requests_total`) |

## Symptôme et impact métier

Plus de 5 % des requêtes HTTP retournent des erreurs 4xx (dont 422 Unprocessable Content) sur 5 minutes. Impact : les utilisateurs rencontrent des erreurs de validation, de permission ou de ressource introuvable.

## Diagnostic

1. **Vérifier l'alerte dans Prometheus** :
   ```bash
   curl -s 'http://prometheus:9090/api/v1/query?query=rate(takt_http_requests_total{status_code=~"4.."}[5m])'
   ```

2. **Identifier les routes et codes d'erreur** :
   ```bash
   curl -s 'http://prometheus:9090/api/v1/query?query=rate(takt_http_requests_total{status_code=~"4.."}[5m]) by (route, status_code)'
   ```

3. **Consulter les logs de l'API (Loki)** :
   ```bash
   {app="api"} |= "422" | json
   {app="api"} |= "403" | json
   {app="api"} |= "404" | json
   ```

4. **Dashboard Grafana concerné** :
   Panel "Taux d'erreur 5xx" (adapté pour 4xx) du dashboard `TAKT - Overview`.

## Remédiation immédiate

1. **Si 422 (validation)** : identifier les données en cause, informer les utilisateurs des formats attendus.
2. **Si 403 (permissions)** : vérifier les droits des utilisateurs, matrice RBAC (ST §5.2).
3. **Si 404 (ressource introuvable)** : vérifier les URLs appelées par le front, mises à jour du client.
4. **Corriger les appels côté front** si le problème vient d'un mauvais usage de l'API.

## Actions de fond

- Améliorer les messages d'erreur 422 pour guider les utilisateurs.
- Revue de la matrice RBAC si des 403 inattendus apparaissent.
- Tests de non-régression sur les cas de validation.

## Escalade

- **Niveau 1** : équipe d'exploitation (logs, identification des routes).
- **Niveau 2** : équipe développement (correction validation, RBAC).
- **Niveau 3** : responsable fonctionnel (si problème de conception des données).

## Références

- Ticket : [L7-11 — Alarmes et runbooks](https://github.com/mdichm/isamk-takt/issues/L7-11)
- Spécification technique : docs/ST_TAKT.md §5.4
- Dépendance : ticket obs (L0-09)