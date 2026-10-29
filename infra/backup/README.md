# Sauvegardes et restauration — TAKT (L7-10)

## Vue d'ensemble

Ce répertoire contient les scripts de sauvegarde et de restauration pour l'environnement TAKT.

### Objectifs

| Critère | Valeur cible |
|---------|--------------|
| RPO (Recovery Point Objective) | 24 heures (sauvegarde quotidienne) |
| RTO (Recovery Time Objective) | 4 heures indicatives |
| Rétention | 30 jours |
| Fréquence | Quotidienne (02h), Hebdomadaire (dimanche 03h), Mensuelle (1er du mois 04h) |

### Ce qui est sauvegardé

1. **PostgreSQL 16** — deux formats :
   - `pg_dump -Fc` (format custom, binaire, compressé)
   - `pg_dump --plain` (format SQL texte, lisible)
2. **Volumes Docker** — archivés en tar.gz :
   - `postgres_data` — données PostgreSQL
   - `grafana_data` — tableaux de bord et configurations Grafana
   - `prometheus_data` — séries temporelles Prometheus
   - `loki_data` — logs Loki
   - `tempo_data` — traces Tempo

### Fichiers produits par sauvegarde

| Fichier | Description |
|---------|-------------|
| `postgres_<ts>.custom.dump` | Dump PostgreSQL format custom |
| `postgres_<ts>.plain.sql` | Dump PostgreSQL format SQL |
| `<volume>_<ts>.tar.gz` | Archive d'un volume Docker |
| `checksums_<ts>.sha256` | Checksums SHA256 de tous les artefacts |
| `manifest_<ts>.json` | Manifeste JSON avec métadonnées et liste des artefacts |

## Prérequis

- `docker` et `docker compose`
- `pg_dump`, `pg_restore`, `psql` (client PostgreSQL)
- `sha256sum`, `tar`, `gzip`
- `alpine` image Docker (pour l'archivage des volumes)
- Variables d'environnement : `POSTGRES_USER`, `POSTGRES_PASSWORD` (ou `POSTGRES_PASSWORD_FILE`), `POSTGRES_DB`

## Utilisation

### Sauvegarde

```bash
# Sauvegarde quotidienne
./infra/backup/backup.sh --type daily

# Sauvegarde hebdomadaire
./infra/backup/backup.sh --type weekly

# Sauvegarde mensuelle
./infra/backup/backup.sh --type monthly

# Avec fichier d'environnement personnalisé
./infra/backup/backup.sh --type daily --env-file .env.prod

# Sans copie S3/MinIO (même si configurée)
./infra/backup/backup.sh --type daily --no-s3
```

### Restauration

```bash
# Restaurer une sauvegarde par horodatage
./infra/backup/restore.sh 20240115_020000

# Restaurer depuis un répertoire spécifique
./infra/backup/restore.sh ./backup_data/20240115_020000

# Restauration sans redémarrage des services
./infra/backup/restore.sh 20240115_020000 --no-restart

# Avec fichier d'environnement personnalisé
./infra/backup/restore.sh 20240115_020000 --env-file .env.prod
```

## Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `POSTGRES_USER` | `takt` | Utilisateur PostgreSQL |
| `POSTGRES_PASSWORD` | — | Mot de passe PostgreSQL (ou fichier) |
| `POSTGRES_PASSWORD_FILE` | — | Chemin du fichier contenant le mot de passe |
| `POSTGRES_DB` | `takt_dev` | Nom de la base de données |
| `BACKUP_DIR` | `./backup_data` | Répertoire de stockage des sauvegardes |
| `RETENTION_DAYS` | `30` | Durée de rétention en jours |
| `COMPOSE_FILE` | `../docker-compose.yml` | Fichier Docker Compose |
| `ENV_FILE` | `.env` | Fichier d'environnement |
| `S3_ENDPOINT` | — | Endpoint S3/MinIO (optionnel, copie off-site) |
| `S3_BUCKET` | — | Bucket S3 (optionnel) |
| `S3_ACCESS_KEY` | — | Clé d'accès S3 (optionnel) |
| `S3_SECRET_KEY` | — | Clé secrète S3 (optionnel) |
| `NO_S3` | `false` | Désactive la copie S3 même si configurée |

## Planification (cron)

Ajouter les entrées suivantes au crontab du serveur :

```cron
# Sauvegarde quotidienne à 02h
0 2 * * * /chemin/vers/takt/infra/backup/backup.sh --type daily --env-file /chemin/vers/.env

# Sauvegarde hebdomadaire le dimanche à 03h
0 3 * * 0 /chemin/vers/takt/infra/backup/backup.sh --type weekly --env-file /chemin/vers/.env

# Sauvegarde mensuelle le 1er à 04h
0 4 1 * * /chemin/vers/takt/infra/backup/backup.sh --type monthly --env-file /chemin/vers/.env
```

## Copie off-site (S3/MinIO)

Définir les variables suivantes pour activer la copie automatique vers un stockage S3/MinIO :

```bash
export S3_ENDPOINT=https://s3.example.com
export S3_BUCKET=takt-backups
export S3_ACCESS_KEY=AKIA...
export S3_SECRET_KEY=...
```

La copie est optionnelle : si `S3_ENDPOINT` ou `S3_BUCKET` n'est pas défini, les sauvegardes restent uniquement sur le volume local `backup_data`.

## Procédure de test trimestriel

Conformément aux critères d'acceptation, un test de restauration doit être effectué trimestriellement :

1. Choisir une sauvegarde récente (ex: sauvegarde quotidienne de la veille)
2. Restaurer sur un environnement de recette isolé
3. Vérifier l'intégrité des données (requêtes de test, comptage de lignes)
4. Vérifier que les services (api, worker) redémarrent correctement
5. Documenter le résultat du test (date, succès/échec, anomalies)
6. Consigner le résultat dans le journal de sécurité

## Protection contre la suppression accidentelle

- **Rétention 30 jours** : les sauvegardes de plus de 30 jours sont automatiquement supprimées
- **Checksums SHA256** : chaque sauvegarde génère un fichier de checksums pour vérifier l'intégrité des artefacts
- **Manifestes JSON** : métadonnées horodatées pour audit et traçabilité (type, date, version PostgreSQL, date d'expiration)
- **Support séparé** : les sauvegardes sont stockées sur le volume `backup_data`, distinct des volumes de données actifs
- **Copie S3 optionnelle** : pour une protection supplémentaire contre la perte totale du serveur

## Dépannage

| Problème | Solution |
|----------|----------|
| `pg_dump: connection to server failed` | Vérifier que PostgreSQL est en cours d'exécution et que les credentials sont corrects |
| `docker volume inspect: volume not found` | Le volume n'existe pas encore, il sera ignoré (comportement attendu pour les volumes optionnels) |
| `sha256sum: checksum failed` | Le fichier de sauvegarde est corrompu, utiliser une sauvegarde antérieure |
| `pg_restore: error` | Vérifier que la version de pg_restore est compatible avec le dump |
| Services ne redémarrent pas après restauration | Vérifier les logs Docker : `docker compose logs api worker` |

## Références

- Ticket : [L7-10 — Sauvegardes et restauration](https://github.com/mdichm/isamk-takt/issues/L7-10)
- Spécification technique : docs/ST_TAKT.md §5.3
- Dépendance : ticket L0-07 (`donnees`)
