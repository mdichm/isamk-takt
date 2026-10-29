# Runbook — TAKT_Generation_Too_Long

## Alerte

| Champ | Valeur |
|-------|--------|
| Nom | `TAKT_Generation_Too_Long` |
| Sévérité | warning |
| Métrique | `takt_generation_duration_seconds > 600` |
| Durée | `for: 0m` |
| Source | `apps/api/src/common/metrics/metrics.service.ts` (Histogram `takt_generation_duration_seconds`) |

## Symptôme et impact métier

Une génération FET dépasse 10 minutes (600 secondes). Impact : la génération asynchrone bloque le worker, les utilisateurs attendent longtemps, risque de timeout côté client.

## Diagnostic

1. **Vérifier l'alerte dans Prometheus** :
   ```bash
   curl -s 'http://prometheus:9090/api/v1/query?query=takt_generation_duration_seconds'
   ```

2. **Identifier la génération en cours** :
   - Consulter les logs du worker pour la génération en cours.
   - Rechercher les traces OpenTelemetry avec l'ID de génération.

3. **Consulter les logs du worker (Loki)** :
   ```bash
   {app="worker"} |= "génération" | json
   {app="worker"} |= "FET" | json
   ```

4. **Consulter les traces (Tempo)** :
   Rechercher la trace de la génération FET pour identifier l'étape bloquante.

5. **Dashboard Grafana concerné** :
   Panel "Durée des générations FET" du dashboard `TAKT - Overview`.

## Remédiation immédiate

1. **Vérifier que le worker est en cours d'exécution** :
   ```bash
   docker compose ps worker
   ```
2. **Si la génération est bloquée** : annuler la génération en cours via l'API ou redémarrer le worker.
3. **Vérifier les ressources** : CPU, mémoire du conteneur worker.
4. **Relancer la génération** avec un semestre plus petit ou après résolution du blocage.

## Actions de fond

- Optimiser la configuration FET (profils, contraintes) pour réduire la durée.
- Mettre en place un timeout maximal de génération configurable.
- Ajouter une métrique de progression pour suivre les générations longues.

## Escalade

- **Niveau 1** : équipe d'exploitation (redémarrage worker, annulation génération).
- **Niveau 2** : équipe développement (optimisation FET, configuration).
- **Niveau 3** : responsable pédagogique (révision des contraintes de planification).

## Références

- Ticket : [L7-11 — Alarmes et runbooks](https://github.com/mdichm/isamk-takt/issues/L7-11)
- Spécification technique : docs/ST_TAKT.md §5.4
- Dépendance : ticket obs (L0-09)