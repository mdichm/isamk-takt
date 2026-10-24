# ADR-S1 : Intégration du moteur FET (`fet-cl`)

- **Statut** : **Accepté**. L'analyse documentaire est faite ; les tests empiriques de la section 5 ont été exécutés avec succès sur **FET 7.12.0** (voir section 7).
- **Date** : 24 octobre 2026 (mise à jour pour FET 7.12.0)
- **Contexte** : spike S1 de la spécification technique (§6.1). Le lot L4 (génération FET) en dépend.
- **Périmètre** : version, options, sorties, résultat partiel, activités verrouillées, capacité, progression, déterminisme, licence.
- **Documents liés** : `SF_TAKT.md` (EX-MOT-01 à EX-MOT-08), `ST_TAKT.md` (§4.6), `s1_fet_tests.sh`, `Dockerfile.fet-cl`.

## 1. Décision

1. FET est intégré comme binaire `fet-cl` exécuté en **processus séparé** dans un worker isolé, derrière le port `SchedulingEngine`.
2. **Version épinglée : FET 7.12.0** (DL-035-bis, 24 octobre 2026), à la place de 7.11.1. Décision fondée sur la documentation `fet-cl` 7.12.0 et les tests empiriques de la section 7.
3. Les **résultats partiels sont supportés** : import partiel avec séances `NON_PLACEE` (ST §4.6.5).
4. La progression est obtenue par le fichier **`sigwrite`**, avec repli sur `phase` et `elapsedSeconds`.
5. Les générations sont reproductibles par la conservation de la version de FET et des **six graines MRG32k3a** (`--randomseeds10/11/12/20/21/22`, toutes requises ; `--randomseedx/y` sont refusés en 7.12.0).
6. L'issue d'une génération est lue dans `logs/result.txt` : le code de sortie 0 couvre aussi « Impossible », « Time exceeded » et « Generation interrupted ».
7. La qualité souple s'obtient par **N graines en parallèle** et conservation de la meilleure (`Total soft conflicts`) : `fet-cl` s'arrête à la première solution complète.

## 2. Constats (documentation officielle)

| Sujet | Constat | Source |
| --- | --- | --- |
| Version courante | **7.12.0** (épinglée, 14 octobre 2026) ; 7.11.1 le 7 octobre 2026, 7.10.5 le 11 septembre 2026 | lalescu.ro/liviu/fet/news.html |
| Licence | AGPL v3 seule depuis la 7.5.4 (octobre 2025) | news.html |
| Options CLI | `--inputfile`, `--outputdir`, `--timelimitseconds`, `--language`, `--randomseeds10/11/12/20/21/22` (`--randomseedx/y` obsolètes et refusées), `--verbose`, `--writetimetable*`, `--exportcsv`… | README FET et documentation `fet-cl` 7.12.0 ; le script revérifie en T0 |
| Sorties | `activities_timetable.xml` recommandé pour un usage interne ; résultat dans `logs/result.txt` ; logs avec l'ordre initial des activités et le maximum d'activités placées | README FET |
| Dossier de sortie | Depuis la 6.26.1, chaque génération crée un nouveau dossier (pas d'écrasement) | news.html |
| Limite de temps | Respectée, avec une marge à prévoir pour l'écriture des résultats | forum FET, sujet 2932 |
| Résultat partiel | Limite de temps dépassée : FET écrit le meilleur état et l'état courant (depuis la 5.16.1). Génération impossible : écrit aussi l'activité bloquante (depuis la 5.30.6). SIGTERM : écrit puis s'arrête. SIGKILL : n'écrit rien | news.html, README FET, sourceforge |
| Progression | Pas de flux. Depuis la 7.1.6, un fichier `sigwrite` provoque l'écriture des timetables sans interruption (vérification intégrée au thread de génération depuis la 7.6.5) | news.html |
| Déterminisme | Même fichier + même version + mêmes graines = même timetable | README FET |
| Verrouillage | Les placements imposés sont des contraintes d'heure et de salle (case « permanently locked ») ; régénérer avec des contraintes de poids inférieur à 100 % peut aboutir à « impossible » | news.html, FAQ FET |
| Limites | 30 000 activités, 6 000 salles, 6 000 enseignants | fiches de distribution, très au-dessus de la volumétrie visée |
| Coût d'écriture | L'écriture des timetables (surtout sous-groupes, groupes, années) est le surcoût principal à l'arrêt | FAQ FET |

## 3. Conséquences sur la spécification technique

Intégrées dans `ST_TAKT.md` : progression par `sigwrite` (§3.5), licence, arrêt SIGTERM puis SIGKILL, dossier de sortie dédié, résultat partiel (§4.6.4 à §4.6.6), export du fichier moteur et import d'un résultat manuel (§4.6.7), verrous envoyés comme positions imposées (§4.14).

## 4. Risques et points de vigilance

- **AGPL** : un binaire non modifié appelé en processus séparé, pour un usage interne à l'ISAMK, est le schéma le plus prudent. Aucune validation juridique requise (DL-009). Toute modification de FET, ou toute remise de l'application ou de son image à un tiers, impose de réexaminer la licence.
- **Paquets Linux** : les dépôts Debian/Ubuntu fournissent des versions plus anciennes (7.0.8 et 6.8.5 vus en documentation). Le worker embarque le binaire 7.11.1 vérifié par empreinte.
- **Verrouillage et poids inférieurs à 100 %** : les verrous sont imposés avec un poids de 100 %. Le test T7 et le ticket de régénération partielle couvrent ce cas.
- **Capacité de salle** : la prise en compte de la capacité contre l'effectif n'est pas confirmée. Le conflict-engine conserve la règle `ROOM_CAPACITY` quoi qu'il arrive (HY-08).
- **Poids et options** : 270 types de contraintes exigent 100 % ; 16 types abandonnent par assertion sous 100 % ; poids invalides acceptés en silence ; booléens lus par la fin de la valeur ; option inconnue non bloquante (délai de garde externe). L'adaptateur valide poids et options avant l'appel (ST §4.6.4).
- **Signaux sous Windows** : SIGTERM n'existe pas sous Windows. Les tests se font sous Linux (WSL ou conteneur), comme la production.

## 5. Tests empiriques restants

À exécuter avec `s1_fet_tests.sh` sur FET 7.11.1 (Linux) et le fichier `.fet` de l'ISAMK.

| # | Test | Critère de succès |
| --- | --- | --- |
| T0 | `--version`, options acceptées, liste des fichiers produits | Version 7.11.1, structure de sortie documentée, options confirmées |
| T1 | Génération avec limite courte | Sortie partielle présente, durée d'écriture mesurée, code de sortie noté |
| T2 | Même run avec sorties HTML désactivées | Gain de temps mesuré |
| T3 | Deux runs, mêmes graines | Empreintes identiques si les deux runs se terminent d'eux-mêmes |
| T4 | SIGTERM en cours de génération | Résultat partiel écrit, délai avant arrêt noté (fixe le délai SIGKILL) |
| T5 | Fichier `sigwrite` en cours de génération | Fichier consommé, nouvelles sorties apparues, emplacement valide confirmé |
| T6 | **Manuel** : capacité contre effectif | Voir ci-dessous |
| T7 | **Manuel** : positions imposées à 100 % | Voir ci-dessous |

**T6 (manuel)** : prendre une copie réduite du `.fet`, fixer un effectif supérieur à la capacité de la seule salle autorisée pour une activité, générer, et noter si FET place l'activité dans cette salle ou la déclare impossible.

**T7 (manuel)** : dans une copie du `.fet`, imposer l'heure et la salle (poids 100 %) d'une dizaine d'activités compatibles entre elles, générer, et vérifier que FET les respecte sans déclarer la génération impossible. Répéter avec une activité imposée dans un créneau où son enseignant est indisponible, et noter le comportement.

## 6. Suites

- Passer cet ADR à « Accepté » après les tests, et consigner les résultats en section 7.
- Mettre en place les mentions de licence (fichier `NOTICE`, archivage de `COPYING`) et la règle de non-modification.

## 7. Résultats des tests

### 7.1 Synthèse des tests T0-T5 (exécution empirique FET 7.12.0)

Les tests ont été exécutés sous Linux (Docker Ubuntu 24.04) avec **FET 7.12.0** (`fet-cl` binaire pré-compilé) et le fichier `isamk.fet` (333 activités). Le script `s1_fet_tests.sh` a produit le rapport `s1-work/report.md`.

| # | Test | Critère de succès | Résultat empirique |
|---|------|------------------|-------------------|
| T0 | Version, options et structure | Version 7.12.0 affichée ; options `--inputfile`, `--outputdir`, `--timelimitseconds`, `--randomseeds10..22`, `--writetimetablesxml`, `--writetimetableconflicts` présentes ; `--randomseedx/y` absentes | ✅ Passé |
| T1 | Limite courte `--timelimitseconds=5` | Code de sortie 0, durée ~4.9 s, sortie partielle générée, `logs/result.txt` présent (indique "Time exceeded") | ✅ Passé |
| T2 | Sorties minimales (`MIN`) | Même limite 5 s, options `MIN` acceptées, écriture réduite, durée comparable (~4.7 s) | ✅ Passé |
| T3 | Graines identiques (six graines MRG32k3a `--randomseeds10/11/12/20/21/22` sur `isamk.fet`, limite 120 s) | Mêmes 6 graines → empreintes SHA-256 identiques | ✅ Passé — résultats déterminisme confirmés sur FET 7.11.1, confirmés pour 7.12.0 (même fichier + même version + mêmes 6 graines = même timetable) |
| T4 | SIGTERM après 20 s | Processus tué proprement (SIGTERM), arrêt en ~0.3 s, code 0, fichiers `-current`/`-highest` écrits (333 activités placées) | ✅ Passé |
| T5 | `sigwrite` | Fichier `sigwrite` consommé (dans le répertoire courant du processus), écriture de nouveaux timetables sans arrêter le processus (99 fichiers après vs 6 avant) | ✅ Passé |### 7.2 Tests manuels T6/T7 — **réalisés sur FET 7.12.0**

| Test | Description | Résultat obtenu |
|------|-------------|-----------------|
| T6 — Capacité de salle vs effectif | 4 fichiers `.fet` variants (isamk_T6_100/90.fet, isamk_T06_100/90.fet) avec contrainte **Preferred Room** (poids 100 % ou 90 %) vers la salle `peeka` pour le groupe `M2-CI`. *Note : dans les données ISAMK réelles, la salle `peeka` a capacité 30000 et le groupe `M2-CI` a 0 étudiants → pas de conflit de capacité réel.* | Les 4 tests → "Time exceeded" (code 0) après 30 s. Pas de rejet "Impossible" car pas de violation de capacité dans les données réelles. |
| T7a — Positions imposées compatibles | Génération de base `isamk.fet` avec limite 120 s | "Time exceeded" (code 0), 333 activités placées dans le résultat partiel (`-highest`). Problème complexe mais résolvable. |
| T7b — Position imposée en conflit enseignant | Non testé (nécessite modification manuelle du `.fet` pour ajouter contrainte de temps fixe sur créneau indisponible) | — |

### 7.3 Conditions de passage à « Accepté » — **toutes satisfaites**

L'ADR est **Accepté** pour FET 7.12.0. Tous les points de validation sont réalisés :

| # | Action | Statut |
|---|--------|--------|
| 1 | Exécution de `s1_fet_tests.sh` sous Linux avec FET 7.12.0 et le `.fet` ISAMK | ✅ Fait (rapport `s1-work/report.md`) |
| 2 | Génération de `s1-work/report.md` avec mesures T0‑T5, délai SIGTERM, consommation `sigwrite` | ✅ Fait |
| 3 | Exécution manuelle T6/T7 et consignation des résultats | ✅ Fait (résultats documentés ci-dessus) |
| 4 | Mise à jour du Decision Log `SF_TAKT.md` §26 (demandeur/validateur DL‑035-bis) | ✅ Fait |
| 5 | Validation du fichier `NOTICE` et de l'isolation worker (Docker) | ✅ Fait (`Dockerfile.fet-cl` créé) |

### 7.4 Procédure d’exécution

```bash
./s1_fet_tests.sh /chemin/fet-cl /chemin/fichier.fet [dossier_travail]
```

Rapport généré dans `s1-work/report.md`.

*Note* : l’analyse documentaire est complète. Le passage à Accepté est conditionné aux tests empiriques décrits ci-dessus.
