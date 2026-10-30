# Procédure de Rollback – Production (L7‑17)

## Objectif
Revenir à la version précédente de l'application (API, Web, Worker) et à l'état de la base de données avant le déploiement, en ≤ 15 min.

## Pré‑requis
- Accès `kubectl` au cluster **prod** (namespace `takt-prod`).
- Dernier snapshot de base de données (backup L7‑10) disponible sur le stockage S3/MinIO.
- Image Docker précédente taguée `sha-<previous-commit>` présente dans le registre privé.

## Étapes

### 1. Annuler le déploiement Kubernetes (Blue/Green)
```bash
# Revenir à l'ancien ReplicaSet (version blue)
kubectl rollout undo deployment/takt-api -n takt-prod
kubectl rollout undo deployment/takt-web -n takt-prod
kubectl rollout undo deployment/takt-worker -n takt-prod
# Vérifier que les pods reviennent à l'état Ready
kubectl rollout status deployment/takt-api -n takt-prod --timeout=5m
kubectl rollout status deployment/takt-web -n takt-prod --timeout=5m
kubectl rollout status deployment/takt-worker -n takt-prod --timeout=5m
```

### 2. Restaurer la base de données (si migration a été appliquée)
```bash
# 2.1 Télécharger le dernier dump (format custom)
aws s3 cp s3://takt-backups/prod/pg_dump_latest.dump /tmp/pg_dump_latest.dump

# 2.2 Arrêter les connexions applicatives (scale à 0)
kubectl scale deployment/takt-api --replicas=0 -n takt-prod
kubectl scale deployment/takt-worker --replicas=0 -n takt-prod

# 2.3 Restaurer
pg_restore -d postgresql://user:pass@prod-db:5432/takt \
  --clean --if-exists --no-owner --jobs=4 /tmp/pg_dump_latest.dump

# 2.4 Remonter les déploiements
kubectl scale deployment/takt-api --replicas=3 -n takt-prod
kubectl scale deployment/takt-worker --replicas=2 -n takt-prod
```

### 3. Valider le rollback
- Health‑check `/ready` sur API & Web → 200 OK.
- Vérifier quelques endpoints métiers (ex. `GET /annees`, `GET /repartitions`).
- Confirmer que les alertes Prometheus reviennent à la normale.

### 4. Communication
- Poster un message dans le canal Slack `#takt-ops` avec le tag `@here` indiquant le rollback effectué, l'heure, et la cause.
- Mettre à jour le ticket **L7‑17** (ajouter commentaire *Rollback effectué*).

## Test de la procédure (drill)
- Effectuer un *dry‑run* en environnement **pre‑prod** une fois par trimestre.
- Documenter la date, les participants, et le temps réel de rollback.

## Références
- Backup strategy : `docs/ops/backup-strategy.md`
- Monitoring & alerting : `monitoring/dashboards/hypercare.json`
- CI/CD pipeline : `.github/workflows/ci.yml` (job `deploy-dev` → `deploy-prod` manuel)