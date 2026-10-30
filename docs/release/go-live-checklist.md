# Go‑Live Checklist – L7‑17 Mise en production

## Pré‑requis (validés avant le jour J)

- [ ] Ticket **L7‑16 Recette** signé *Terminé* (recette MOA, doc livrée, anomalies bloquantes corrigées).
- [ ] Sauvegardes **L7‑10** : snapshots quotidiens/hebdo/mensuels OK, dernier `pg_dump` testé.
- [ ] Alarmess **L7‑11** : règles Prometheus/Alertmanager déployées, canaux Slack & PagerDuty fonctionnels.
- [ ] Pipeline CI `main` vert (lint, typecheck, unit, integration, security, SBOM).
- [ ] Images Docker `api`, `web`, `worker` construites et poussées vers le registre privé (`sha-<commit>` + `latest`).

## Jour J – Déploiement

| Étape | Action | Critère de validation |
|------|--------|-----------------------|
| 1 | `terraform plan` sur `prod` → revue manuelle → `terraform apply` | Plan sans drift, approval manuel. |
| 2 | Déploiement **Blue/Green** (environnement *green*) | Nouveaux pods `Ready`, health‑check `/ready` OK. |
| 3 | Migrations Prisma `prisma migrate deploy` (transaction) | Aucune erreur, schémas à jour. |
| 4 | Smoke tests automatisés (API, Web, Worker) | 100 % verts. |
| 5 | Bascule trafic (Ingress / LB) vers *green* | Métriques : latence p95 < 300 ms, taux 5xx < 0,1 % pendant 15 min. |
| 6 | Activation monitoring **hyper‑care** (dashboards, alertes) | Dashboards Grafana visibles, alertes PagerDuty/Slack actives. |
| 7 | Communication utilisateurs (mail + doc mise à jour) | Mail envoyé, doc publiée. |

## Post‑déploiement (J+1 … J+5)

- Points quotidiens 15 min (équipe DevOps, PO, Support).
- Suivi des alertes, correction hot‑fix si nécessaire.
- Décision Go/No‑Go pour prolongation hyper‑care.

## Rollback (si No‑Go)

Voir procédure détaillée : `docs/ops/rollback-prod.md`.

## Clôture (J+6)

- Désactivation mode hyper‑care.
- Rétrospective 30 min → compte‑rendu `docs/retrospectives/2026-10-L7-17.md`.
- Mise à jour ticket **L7‑17** → *Terminé* (regénération backlog).