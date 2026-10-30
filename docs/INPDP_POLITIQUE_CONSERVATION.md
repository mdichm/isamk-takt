# Politique de conservation des données — Conformité INPDP

**Projet :** TAKT — Gestion de services d'enseignement
**Référence :** Ticket L7-12 — Conformité INPDP et conservation
**DPO :** Délégué à la protection des données (à nommer par la maîtrise d'ouvrage)
**Cadre :** Données hébergées en Tunisie ; conformité INPDP et RGPD

---

## 1. Objet

Cette politique définit les durées de conservation des données à caractère personnel
traitées par l'application TAKT, les procédures de purge automatisée, ainsi que les
droits des personnes concernées (accès, rectification, suppression).

Elle s'applique aux traitements suivants :
- Journaux d'audit (`audit_logs`)
- Journal de sécurité (`security_events`)
- Jobs d'export (`export_jobs`)
- Données des comptes utilisateurs (`users`)

---

## 2. Durées de conservation

| Traitement | Table / Modèle | Durée de conservation | Champ de configuration |
|------------|---------------|----------------------|------------------------|
| Journaux d'audit | `audit_logs` (append-only) | **1 825 jours** (5 ans) | `conservationAuditJours` |
| Journal de sécurité | `security_events` | **1 095 jours** (3 ans) | `conservationSecuriteJours` |
| Jobs d'export | `export_jobs` | **365 jours** (1 an) | `conservationExportJours` |
| Comptes utilisateurs | `users` | Durée de vie du compte + anonymisation sur demande | — |

Les durées sont configurables via l'interface d'administration
(`/admin/security`, endpoint `PATCH /parametres-securite`).
Une valeur nulle (`NULL`) désactive la purge pour le traitement concerné.

Les valeurs par défaut préconisées par la DL-040 et validées avec le DPO sont :
- Audit : 1 825 jours (5 ans)
- Sécurité : 1 095 jours (3 ans)
- Exports : 365 jours (1 an)

---

## 3. Procédure de purge automatisée

### 3.1 Fonction SQL `purge_journaux()`

La purge est exécutée par la fonction PostgreSQL `purge_journaux()`, déclarée en
défineur (`SECURITY DEFINER`) et exécutée avec le rôle `audit_purge`.

Elle :
1. Lit les durées de conservation depuis `parametres_securite` (ligne `id = 1`).
2. Désactive temporairement les triggers append-only (`session_replication_role = 'replica'`).
3. Supprime les entrées d'audit plus anciennes que `conservation_audit_jours`.
4. Supprime les événements de sécurité plus anciens que `conservation_securite_jours`.
5. Supprime les jobs d'export plus anciens que `conservation_export_jours`.
6. Rétablit les triggers (`session_replication_role = 'origin'`).
7. Inscrit une entrée d'audit traçant la purge (nombre de lignes supprimées par table).

### 3.2 Fréquence d'exécution

La fonction `purge_journaux()` doit être appelée quotidiennement par un job cron
ou un ordonnanceur externe (ex: Kubernetes CronJob, systemd timer).

Exemple d'appel SQL :
```sql
SELECT purge_journaux();
```

### 3.3 Suppression des fichiers d'export

Les fichiers physiques générés par les jobs d'export (stockés sur le volume
d'exports configuré) sont supprimés par le service `AuditPurgeService` côté backend
lors de l'appel à l'endpoint `POST /audit/purge`, en complément de la purge SQL.

---

## 4. Droits des personnes concernées

Conformément à la loi n° 2004-41 du 3 mai 2004 relative à la protection des
personnes à l'égard du traitement des données à caractère personnel (INPDP)
et au RGPD :

### 4.1 Droit d'accès (art. 15 RGPD)

Toute personne peut obtenir une copie de ses données personnelles traitées par TAKT.

**Endpoint :** `GET /utilisateurs/mes-donnees` (authentifié)

Retourne :
- Profil utilisateur (identifiant, e-mail, nom, prénom, état actif, dates)
- Événements de sécurité liés à l'utilisateur (derniers 100)
- Jobs d'export créés par l'utilisateur (derniers 100)

### 4.2 Droit de rectification (art. 16 RGPD)

Toute personne peut demander la correction de ses données inexactes ou incomplètes.

**Endpoint :** `PATCH /utilisateurs/mes-donnees` (authentifié)

Champs modifiables : nom, prénom, e-mail.
Une modification d'e-mail est rejetée si l'adresse est déjà utilisée par un autre compte.
Toute rectification est tracée dans l'audit métier (`action = 'RECTIFICATION_DONNEES'`).

### 4.3 Droit à l'oubli / suppression (art. 17 RGPD)

Toute personne peut demander la suppression de ses données personnelles.

**Endpoint :** `POST /utilisateurs/mes-donnees/suppression` (authentifié)

Comme l'utilisateur est référencé par de nombreuses tables (clés étrangères),
une suppression immédiate violerait l'intégrité référentielle.
La demande entraîne une anonymisation (pseudonymisation) immédiate des données
personnelles (e-mail, nom, prénom remplacés par des valeurs génériques),
et une entrée d'audit traçant l'opération (`action = 'SUPPRESSION_DONNEES'`).
Un traitement complet est planifié par le DPO.

### 4.4 Contact DPO

Toute question relative à cette politique ou à l'exercice des droits doit être
adressée au Délégué à la protection des données (DPO) de l'établissement.

---

## 5. Sécurité des journaux

- Les tables `audit_logs` et `security_events` sont append-only : les entrées ne
  peuvent être insérées, jamais modifiées ni supprimées directement par les
  applications. Seule la fonction `purge_journaux()` peut supprimer des entrées
  expirées.
- Le rôle `audit_purge` dispose uniquement des droits `DELETE` sur les tables
  concernées, exercés via `purge_journaux()`.
- Toute purge est elle-même consignée dans `audit_logs` pour assurer la traçabilité.

---

## 6. Références

- DL-040 : Durées de conservation préconisées (audit 5 ans, sécurité 3 ans, exports 1 an)
- ST §5.3 : Droit d'accès, rectification, durée de conservation (validées avec le DPO)
- EX-NFR-06 : Exigence de conformité INPDP
- Loi n° 2004-41 du 3 mai 2004 (INPDP, Tunisie)
- Règlement (UE) 2016/679 (RGPD)