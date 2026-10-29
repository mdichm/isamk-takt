# Runbook — TAKT_Email_Final_Failures

## Alerte

| Champ | Valeur |
|-------|--------|
| Nom | `TAKT_Email_Final_Failures` |
| Sévérité | critical |
| Métrique | `increase(takt_email_final_failures_total[10m]) > 0` |
| Durée | `for: 0m` |
| Source | `apps/api/src/notifications/email/` (compteur d'échecs définitifs après reprises) |

## Symptôme et impact métier

Au moins un e-mail de notification a échoué définitivement après toutes les reprises exponentielles. Les destinataires (enseignants, gestionnaires, responsables) ne reçoivent pas les notifications de soumission, validation, rejet, publication, etc. Impact : rupture de la communication workflow.

## Diagnostic

1. **Vérifier l'alerte dans Prometheus** :
   ```bash
   curl -s 'http://prometheus:9090/api/v1/query?query=increase(takt_email_final_failures_total[10m])'
   ```

2. **Consulter les logs de l'API (Loki)** :
   ```bash
   {app="api"} |= "email" |= "échec" | json
   {app="api"} |= "SMTP" | json
   ```

3. **Vérifier la configuration SMTP** :
   - L'adresse expéditrice et les paramètres SMTP sont lus depuis les secrets (fichiers montés en lecture seule).
   - Serveur SMTP institutionnel : `cck.rnu.tn`.

4. **Tester l'envoi SMTP manuellement** :
   ```bash
   # Test de connexion SMTP
   echo "QUIT" | nc -w 5 cck.rnu.tn 25
   # ou avec TLS si configuré
   echo "QUIT" | openssl s_client -connect cck.rnu.tn:465 -quiet
   ```

5. **Dashboard Grafana concerné** :
   Panel "File d'échecs" / métriques e-mail du dashboard `TAKT - Overview`.

## Remédiation immédiate

1. **Vérifier que le service SMTP est joignable** depuis le conteneur API.
2. **Vérifier les secrets SMTP** (fichiers montés) : adresse expéditrice, identifiants si requis.
3. **Relancer la file email** si le processeur est bloqué :
   ```bash
   docker compose restart api
   ```
4. **Notifier les destinataires concernés** par un canal alternatif si les notifications critiques sont en attente.

## Actions de fond

- Mettre en place une alerte proactive sur `takt_email_errors_total` (warning) avant d'atteindre l'échec définitif.
- Revue trimestrielle de la configuration SMTP institutionnel.
- Documenter les codes d'erreur SMTP fréquents.

## Escalade

- **Niveau 1** : équipe d'exploitation (vérification SMTP, redémarrage API).
- **Niveau 2** : administrateur réseau/système (problème SMTP institutionnel `cck.rnu.tn`).
- **Niveau 3** : DSI / responsable infrastructure.

## Références

- Ticket : [L7-11 — Alarmes et runbooks](https://github.com/mdichm/isamk-takt/issues/L7-11)
- Spécification technique : docs/ST_TAKT.md §5.4
- Dépendance : ticket notif_mail (L5-22), obs (L0-09)