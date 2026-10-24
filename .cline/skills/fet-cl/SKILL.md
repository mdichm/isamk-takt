---
name: fet-cl
description: >-
  Skill générique complet pour fet-cl (FET en ligne de commande) version 7.12.0 : localisation du binaire,
  préparation des fichiers d'entrée .fet, lancement d'une ou plusieurs générations (parallélisme, graines,
  limites de temps), supervision de la progression, interprétation des résultats, production de rapports
  JSON/CSV, gestion des interruptions propres et respect de la licence AGPL-3.0. Use when running or
  automating FET timetable generation from the command line, when preparing or validating a .fet input file,
  when interpreting fet-cl outputs (result.txt, activities_timetable.xml, errors.txt,
  max_placed_activities.txt), when batch-running multiple FET generations with seeds and parallel jobs, or
  when the user mentions fet-cl, FET, emploi du temps, timetable, génération d'horaires or .fet files.
  Do not use for the FET graphical interface (fet) or for FET versions other than 7.11.1.
metadata:
  skill_version: "1.1"
  fet_cl_version: "7.12.0"
  license: "AGPL-3.0-only"
---

# fet-cl — Génération d'emplois du temps FET 7.12.0 (ligne de commande)

> **Source de vérité.** Ce skill est indépendant de tout projet particulier : il ne contient que des
> paramètres génériques que l'appelant (script, CI, orchestrateur) doit fournir. La spécification
> d'origine est `.github/skills/fet-cl.yaml` ; le document technique complet est
> `docs/Docs fet-cl/fet-cl-7.12.0-interfacage.md`.

## 1. Pré-requis & environnement

| Élément | Valeur / règle |
|---|---|
| Binaire | `fet-cl` (chemin absolu ou dans le `PATH`, surchargeable par la variable d'env `FET_CL`) |
| Version ciblée | **7.12.0** |
| Licence | **AGPL-3.0-only** — si vous distribuez un service qui embarque fet-cl, fournissez le code source correspondant |
| Locale | `LC_ALL=C.UTF-8` **obligatoire** avant chaque appel |
| Graines obligatoires | **Six** graines MRG32k3a : `--randomseeds10`, `--randomseeds11`, `--randomseeds12`, `--randomseeds20`, `--randomseeds21`, `--randomseeds22` |

Notes critiques (vérifiées sur les sources 7.11.1) :

* Les options `--randomseedx` / `--randomseedy` (ancien format, deux graines) sont **refusées** en 7.11.1 (code de retour 1).
* Chaque exécution crée un **nouveau sous-dossier horodaté** dans `--outputdir` (comportement depuis FET 6.26.1).
* Le code de retour `0` ne garantit **pas** le succès : le statut réel se lit dans `logs/result.txt`.
* Les options inconnues ne sont **pas bloquantes** (`Unrecognized option:` est seulement affiché) — imposer son propre délai de garde.
* Deux exécutions parallèles dans le même `--outputdir` se marchent dessus : un répertoire de sortie **unique par tentative** est indispensable.
* `SIGTERM` (ou `SIGBREAK` sous Windows) fait écrire le meilleur résultat partiel ; `SIGINT` et les autres signaux arrêtent immédiatement **sans rien écrire**.

## 2. Entrées du skill (toutes optionnelles sauf `input_file` et `output_dir`)

| Nom | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `fet_cl_path` | string | non | `"fet-cl"` | Chemin absolu ou binaire dans le `PATH`. Peut être surchargé par la variable d'env `FET_CL`. |
| `input_file` | string | **oui** | — | Fichier source FET (`.fet`) à résoudre. Doit contenir une racine `<fet>`, une version, au moins une activité active et une `ConstraintBasicCompulsoryTime`. |
| `output_dir` | string | **oui** | — | Répertoire **parent** où fet-cl créera son dossier de sortie horodaté (ex: `/var/fet/runs`). |
| `time_limit_seconds` | integer | non | `3600` | Durée maximale d'une génération (option `--timelimitseconds`). `0` = illimité. |
| `parallel_jobs` | integer | non | `1` | Nombre de processus fet-cl lancés en parallèle (qualité souple : chaque job reçoit une graine différente). |
| `seed_values` | array\<integer\> | non* | — | Tableau de **six entiers 64 bits** (un par graine obligatoire). Si non fourni, l'appelant **DOIT** générer six valeurs aléatoires cryptographiquement sûres et les passer ici. Le skill ne les génère pas. |
| `language` | string | non | `"en"` | Langue de l'interface (option `--language`). Ex: `fr`, `en`, `de`, etc. |
| `verbose` | boolean | non | `false` | Active `--verbose` pour obtenir des logs détaillés sur stdout/stderr. |
| `write_timetables` | array\<string\> | non | `["xml"]` | Formats d'export du timetable final (options `--writetimetable*`). Valeurs typiques : `xml`, `csv`, `html`, `txt`. |
| `export_csv` | boolean | non | `false` | Active `--exportcsv` pour obtenir un CSV des activités placées. |
| `extra_args` | string | non | `""` | Arguments supplémentaires transmis tels quels à fet-cl (ex: `--noverbose`, `--itlimit=1000000`). |

\* `seed_values` est requis de facto : six graines sont **obligatoires** pour chaque exécution.

## 3. Modèle de commande

Le runner du skill rend le gabarit suivant (pseudo-Jinja2) :

```text
{{fet_cl_path}} \
  --inputfile="{{input_file}}" \
  --outputdir="{{output_dir}}" \
  --timelimitseconds={{time_limit_seconds}} \
  --language={{language}} \
  {% if verbose %}--verbose {% endif %} \
  {% for fmt in write_timetables %}--writetimetable{{fmt}} {% endfor %} \
  {% if export_csv %}--exportcsv {% endif %} \
  {% for i, seed_opt in enumerate(mandatory_seeds) %}{{seed_opt}}={{seed_values[i]}} {% endfor %} \
  {{extra_args}}
```

Exemple concret :

```bash
fet-cl --inputfile="data/emploi_du_temps.fet" --outputdir="/var/fet/runs" \
  --timelimitseconds=3600 --language=fr --writetimetablexml --writetimetablecsv \
  --exportcsv --randomseeds10=123456789012345678 --randomseeds11=234567890123456789 \
  --randomseeds12=345678901234567890 --randomseeds20=456789012345678901 \
  --randomseeds21=567890123456789012 --randomseeds22=678901234567890123
```

## 4. Fichiers de sortie standards produits par fet-cl

Tous les chemins sont relatifs au **sous-dossier horodaté** créé dans `output_dir` :

| Nom | Chemin | Condition | Description |
|---|---|---|---|
| `result_txt` | `{{output_dir}}/*/logs/result.txt` | toujours | Verdict final : « Generation successful », « Impossible », « Time exceeded », « Generation interrupted », etc. |
| `activities_xml` | `{{output_dir}}/*/activities_timetable.xml` | — | Timetable complet au format XML (recommandé pour usage interne). |
| `max_placed_txt` | `{{output_dir}}/*/logs/max_placed_activities.txt` | toujours | Progression en temps réel (nombre max d'activités placées à chaque étape). |
| `errors_txt` | `{{output_dir}}/*/logs/errors.txt` | toujours | Messages d'erreur / avertissements détaillés. |
| `csv_export` | `{{output_dir}}/*/activities_timetable.csv` | si `export_csv` | Export CSV des activités (si `--exportcsv` activé). |

## 5. Logique de classification du résultat

Règles évaluées **dans l'ordre** (reproduites de `fet_batch.py`) :

| # | Nom | Condition | Statut |
|---|---|---|---|
| 1 | SIGNAL | `return_code` est non nul et **négatif** (processus tué par un signal) | `ERROR` |
| 2 | SUCCESS | `return_code == 0` **et** `Generation successful` dans `result.txt` **et** `activities_xml` existe et est bien formé | `SUCCESS` |
| 3 | PARTIAL | `return_code == 0` **et** (`Partially placed` ou `Partially solved` dans `result.txt`) **et** `activities_xml` existe | `PARTIAL` |
| 4 | IMPOSSIBLE | `return_code == 0` **et** `Impossible` dans `result.txt` | `IMPOSSIBLE` |
| 5 | TIME_EXCEEDED | `return_code == 0` **et** `Time exceeded` dans `result.txt` | `TIME_EXCEEDED` |
| 6 | INTERRUPTED | `return_code == 0` **et** `Generation interrupted` dans `result.txt` | `INTERRUPTED` |
| 7 | UNKNOWN | toujours (aucune règle précédente n'a matché) | `ERROR` — statut non reconnu, voir `result.txt` et `errors.txt` |

> **Un code négatif prime sur `result.txt`** : `Generation successful` est écrit *avant* les fichiers de sortie ; si fet-cl est ensuite tué (disque plein → SIGXFSZ, mémoire → SIGABRT, SIGKILL), `result.txt` peut annoncer un succès sans timetable complet. Toujours vérifier le code de retour **et** la présence + validité de `<nom>_activities.xml`.

## 6. Sorties structurées retournées par le skill

| Nom | Type | Description |
|---|---|---|
| `status` | string (enum) | `SUCCESS`, `PARTIAL`, `IMPOSSIBLE`, `TIME_EXCEEDED`, `INTERRUPTED`, `ERROR` — statut global de la (ou des) tentative(s). |
| `return_code` | integer | Code de retour brut du dernier fet-cl exécuté (0 = normal, <0 = signal). |
| `best_run_dir` | string | Chemin du sous-dossier horodaté ayant produit le meilleur résultat (moins de soft conflicts). |
| `best_seed` | string | Valeur de la graine (ex: `randomseeds10=12345…`) qui a donné le meilleur run. |
| `soft_conflicts` | integer | Nombre de conflits souples du meilleur run (extrait de `result.txt`). |
| `placed_activities` | integer | Activités effectivement placées dans le meilleur run. |
| `report_json` | string | Chemin vers le rapport JSON consolidé (généré par le wrapper `fet_batch.py`). |
| `report_csv` | string | Chemin vers le rapport CSV consolidé. |

## 7. Gestion d'interruption (Ctrl+C / SIGTERM / SIGBREAK)

1. Le runner du skill installe un handler pour `SIGINT` / `SIGTERM` (`SIGBREAK` sous Windows).
2. À la réception, il envoie `SIGTERM` (ou `SIGBREAK`) à **tous** les processus fet-cl fils.
3. Chaque fet-cl écrit alors son timetable partiel et s'arrête proprement.
4. Les dossiers de sortie déjà créés sont **conservés** (résultats partiels exploitables).
5. Le skill retourne `status = INTERRUPTED` et `return_code = 130` (convention Unix).

## 8. Wrapper Python de référence (`fet_batch.py`)

L'implémentation de référence pour le lancement & la supervision de N exécutions fet-cl en parallèle se trouve dans `docs/Docs fet-cl/fet-cl-7.12.0-interfacage.md` (lignes 583 à ≈900). Fonctionnalités :

* Pré-validation XML (`.fet`) : racine `<fet>`, version, activités actives, `ConstraintBasicCompulsoryTime`.
* Pool de N workers (`parallel_jobs`), chacun avec un `--outputdir` **isolé** (indispensable : `logs/` est partagé sinon).
* Supervision temps réel via `logs/max_placed_activities.txt`.
* Six graines MRG32k3a par worker (`--randomseeds10…22`).
* Classement final selon `logs/result.txt` (le code de retour 0 ne garantit pas le succès).
* Rapport JSON + CSV (toutes tentatives + meilleure par fichier).
* Code de sortie global : `0` = tous résolus, `1` = au moins un échec, `2` = rien à traiter, `130` = interrompu.

## 9. Bonnes pratiques & checklist d'intégration

- Toujours fixer `LC_ALL=C.UTF-8` avant d'appeler fet-cl.
- Utiliser un `--outputdir` **unique par tentative** (le skill le fait automatiquement via le dossier horodaté).
- Fournir **exactement six graines** ; ne pas mélanger anciennes (`--randomseedx`) et nouvelles options.
- Limiter `parallel_jobs` au nombre de cœurs physiques pour éviter la contention CPU / disque.
- Surveiller `max_placed_activities.txt` pour implémenter un timeout *progressif* (ex : arrêter si pas de progrès depuis 10 min).
- Conserver les artefacts (`activities_timetable.xml`, `result.txt`, `errors.txt`) pour audit et reproductibilité.
- Archiver le binaire `fet-cl` (sha256) avec les résultats pour garantir la reproductibilité à long terme.
- Respecter la licence AGPL-3.0 : si vous distribuez un service qui embarque fet-cl, fournissez le code source correspondant.

## 10. Références documentaires

- `docs/ADR_S1_FET.md`
- `docs/Docs fet-cl/annexe-fet-cl-help.txt`
- `docs/Docs fet-cl/fet-cl-7.12.0-interfacage.md`
- `docs/Docs fet-cl/catalogue-contraintes-fet-cl-7.11.1.md`
- `docs/Docs fet-cl/rapport-tests-fet-cl-7.11.1.md`
- https://lalescu.ro/liviu/fet/
- https://github.com/lalescu/fet

## 11. Exemple d'appel complet (bash)

```bash
#!/usr/bin/env bash
set -euo pipefail

export FET_CL=/opt/fet/bin/fet-cl      # ou laissez dans le PATH
export LC_ALL=C.UTF-8

# 6 graines aléatoires 64-bits (à générer une fois par campagne)
SEEDS=(
  123456789012345678
  234567890123456789
  345678901234567890
  456789012345678901
  567890123456789012
  678901234567890123
)

skill run fet-cl \
  --fet_cl_path="$FET_CL" \
  --input_file="data/emploi_du_temps.fet" \
  --output_dir="/var/fet/runs/$(date +%Y%m%d_%H%M%S)" \
  --time_limit_seconds=7200 \
  --parallel_jobs=4 \
  --seed_values="${SEEDS[*]}" \
  --language=fr \
  --verbose \
  --write_timetables=xml,csv \
  --export_csv \
  --extra_args="--itlimit=2000000"

# Les sorties du skill (status, report_json, report_csv, etc.) sont disponibles
# dans l'environnement du runner (ex: GitHub Actions outputs, variables d'env, fichiers).
```

---

**Spécification d'origine :** `.github/skills/fet-cl.yaml` (v1.0) — à maintenir en synchronisation avec ce skill.


