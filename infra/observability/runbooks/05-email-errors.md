# Runbook — TAKT_Email_Errors

## Alerte

| Champ | Valeur |
|-------|--------|
| Nom | `TAKT_Email_Errors` |
| Sévérité | warning |
| Métrique | `rate(takt_email_errors_total[5m]) > 0` |
| Durée | `for: 1m` |
| Source | `apps/api/src/notifications/email/` (compteur d'erreurs SMTP) |

## Symptôme et impact métier

Des erreurs SMTP ont été détectées lors de l'envoi d'e-mails. Certaines notifications peuvent être retardées ou en cours de reprise. Impact : dégradation du service de notification, pas encore de perte définitive.

## Diagnostic

1. **Vérifier l'alerte dans Prometheus** :
   ```bash
   curl -s 'http://prometheus:9090/api/v1/query?query=rate(takt_email_errors_total[5m])'
   ```

2. **Consulter les logs de l'API (Loki)** :
   ```bash
   {app="api"} |= "email" |= "erreur" | json
   {app="api"} |= "SMTP" | json
   ```

3. **Vérifier la connectivité SMTP** :
   ```bash
   echo "QUIT" | nc -w 5 cck.rnu.tn 25
   ```

4. **Dashboard Grafana concerné** :
   Métriques e-mail du dashboard `TAKT - Overview`.

## Remédiation immédiate

1. **Vérifier que le serveur SMTP est joignable** depuis le conteneur API.
2. **Vérifier les secrets SMTP** (fichiers montés en lecture seule).
3. **Surveiller** que le taux d'erreur redescend à 0 après les reprises exponentielles.
4. **Si l'erreur persiste** : passer au runbook `TAKT_Email_Final_Failures` (critical).

## Actions de fond

- Mettre en place une alerte de dégradation avant l'échec définitif.
- Revue de la configuration SMTP institutionnel.

## Escalade

- **Niveau 1** : équipe d'exploitation (vérification SMTP, logs).
- **Niveau 2** : administrateur réseau/système (problème SMTP institutionnel).

## Références

- Ticket : [L7-11 — Alarmes et runbooks](https://github.com/mdichm/isamk-takt/issues/L7-11)
- Spécification technique : docs/ST_TAKT.md §5.4
- Dépendance : ticket notif_mail (L5-22), obs (L0-09)