# Interfaçage avec fet-cl 7.11.1 — Document technique

| | |
|---|---|
| Version ciblée | FET 7.11.1 (`fet-cl`, version ligne de commande) |
| Objet | Format d'entrée `.fet`, options CLI, codes de retour, sorties, automatisation batch en Python |
| Méthode | Analyse des sources officielles `fet-7.11.1.tar.xz` (`src/cl/fetcl.cpp`, `src/engine/*.cpp`) et essais réels d'un binaire `fet-cl` compilé depuis ces sources (Qt 6.10, Linux x86-64) |
| Annexes livrées | `fet_batch.py`, `exemple-minimal.fet`, `annexe-fet-cl-help.txt` (sortie intégrale de `fet-cl --help`), `annexe-balises-contraintes.md` (271 balises de contraintes de temps, 81 d'espace) |
| Skill agent | Spécification `.github/skills/fet-cl.yaml` (v1.0) ; skill chargeable versionné `docs/tools/skills/fet-cl/SKILL.md`, installé dans les répertoires agents (`.agents`, `.claude`, `.cursor`, `.devin`) via `docs/tools/skills/fet-cl/install.sh` |

Sources : [archive des sources FET 7.11.1](https://lalescu.ro/liviu/fet/download/fet-7.11.1.tar.xz), [fichiers de diffusion sur SourceForge](https://sourceforge.net/projects/fet-timetabling/files/fet-timetabling/), [page de manuel fet-cl (Ubuntu)](https://manpages.ubuntu.com/manpages/jammy/man1/fet-cl.1.html), [miroir GitHub du README](https://github.com/fet-project/fet).

> Avertissement : la documentation en ligne (README GitHub, forums) décrit souvent des versions anciennes. Plusieurs options ont changé : `--randomseedx/--randomseedy` sont désormais **refusées** (code 1), les options d'écriture sont au nombre de 17 (ajout de `--writetimetablesbuildings`) et la liste des langues s'est allongée. Ce document reflète le code de la 7.11.1.

---

## 1. Vue d'ensemble

`fet-cl` est le moteur de génération de FET sans interface graphique. Il lit un fichier XML `.fet`, exécute l'algorithme heuristique de placement (une seule génération, mono-thread), puis écrit les emplois du temps (XML, HTML, CSV optionnel) et des journaux dans un répertoire de sortie.

```
             ┌──────────────┐   --inputfile=x.fet    ┌─────────────────────────────┐
 Orchestrat. │ fet_batch.py │ ─────────────────────► │ fet-cl 7.11.1               │
 (cron/CI)   │ (superviseur)│ ◄───────────────────── │  lecture XML → précalcul →  │
             └──────┬───────┘  code retour + fichiers│  génération → export        │
                    │ SIGTERM / sigwrite             └──────────────┬──────────────┘
                    ▼                                               ▼
           rapport JSON/CSV                 <outputdir>/logs/…  <outputdir>/timetables/…
```

Points clés pour un intégrateur :

1. **Le code de retour ne suffit pas** : `fet-cl` renvoie `0` même si la génération est impossible, dépasse le temps imparti ou est interrompue. Le statut réel se lit dans `logs/result.txt` (section 5).
2. **Les options inconnues ne sont pas bloquantes** : une faute de frappe (`--timelimit=60`) est seulement signalée par `Unrecognized option:` ; la limite de temps reste alors à 2 000 000 000 s. Un superviseur doit donc imposer son propre délai de garde.
3. **Un répertoire de sortie par exécution** : `logs/` n'est pas suffixé par nom de fichier ; deux exécutions parallèles dans le même `--outputdir` se marchent dessus.
4. **Arrêt propre** : `SIGTERM` fait écrire le meilleur résultat partiel ; `SIGINT` et les autres signaux (SIGHUP, SIGQUIT, SIGUSR1…) arrêtent immédiatement **sans rien écrire**.
5. **Un code négatif prime sur `result.txt`** : `Generation successful` est écrit avant les fichiers de sortie ; si fet-cl est ensuite tué (disque plein → SIGXFSZ, mémoire → SIGABRT), `result.txt` peut annoncer un succès sans emploi du temps complet. Vérifier le code **et** la présence de `<nom>_activities.xml`.

---

## 2. Structure du fichier d'entrée `.fet`

### 2.1 Règles générales

| Élément | Règle |
|---|---|
| Encodage | UTF-8 (FET écrit un BOM ; il est accepté mais pas obligatoire en lecture) |
| Racine | `<fet version="7.11.1">` — l'attribut `version` indique la version qui a écrit le fichier ; les fichiers d'anciennes versions (5.x, 6.x) sont lus et convertis |
| Références | Par **nom** (enseignants, matières, ensembles d'étudiants, salles, jours, heures) et par **Id** entier (activités). Les noms doivent être uniques dans leur catégorie |
| Booléens | `true` / `false` en minuscules |
| Poids | `<Weight_Percentage>` de 0 à 100 (réel). 100 = contrainte dure ; < 100 = contrainte souple |
| Ordre | Respecter l'ordre des sections ci-dessous (c'est celui qu'écrit FET ; le lecteur est un flux `QXmlStreamReader`) |
| Sections vides | Autorisées (`<Activity_Tags_List></Activity_Tags_List>`) |

### 2.2 Arborescence de premier niveau

```xml
<?xml version="1.0" encoding="UTF-8"?>
<fet version="7.11.1">
  <Mode>Official</Mode>                       <!-- Official | Mornings_Afternoons | Block_Planning | Terms -->
  <Institution_Name>…</Institution_Name>
  <Comments>…</Comments>
  <!-- Mode Terms uniquement : -->
  <Number_of_Terms>…</Number_of_Terms>
  <Number_of_Days_Per_Term>…</Number_of_Days_Per_Term>
  <Days_List>…</Days_List>
  <Real_Days_List>…</Real_Days_List>          <!-- Mode Mornings_Afternoons uniquement -->
  <Hours_List>…</Hours_List>
  <Real_Hours_List>…</Real_Hours_List>        <!-- Mode Mornings_Afternoons uniquement -->
  <Subjects_List>…</Subjects_List>
  <Activity_Tags_List>…</Activity_Tags_List>
  <Teachers_List>…</Teachers_List>
  <Students_List>…</Students_List>
  <Activities_List>…</Activities_List>
  <Buildings_List>…</Buildings_List>
  <Rooms_List>…</Rooms_List>
  <Time_Constraints_List>…</Time_Constraints_List>
  <Space_Constraints_List>…</Space_Constraints_List>
  <Timetable_Generation_Options_List>…</Timetable_Generation_Options_List>  <!-- optionnel -->
</fet>
```

Toute autre valeur de `<Mode>` provoque l'erreur de lecture `Incorrect mode - it has to be Official, Mornings_Afternoons, Block_Planning, or Terms`.

### 2.3 Grille horaire

```xml
<Days_List>
  <Number_of_Days>5</Number_of_Days>
  <Day><Name>Lundi</Name><Long_Name>Lundi</Long_Name></Day>
  …
</Days_List>
<Hours_List>
  <Number_of_Hours>8</Number_of_Hours>
  <Hour><Name>08:00</Name><Long_Name>08h00-08h55</Long_Name></Hour>
  …
</Hours_List>
```

`Number_of_Days` / `Number_of_Hours` doivent correspondre au nombre d'éléments. Les `<Name>` de jours et d'heures servent de clés dans les contraintes (`<Day>Lundi</Day><Hour>08:00</Hour>`) et dans les fichiers de sortie.

### 2.4 Ressources

| Section | Élément | Sous-éléments (ordre d'écriture FET) |
|---|---|---|
| `Subjects_List` | `Subject` | `Name`, `Long_Name`, `Code`, `Comments` |
| `Activity_Tags_List` | `Activity_Tag` | `Name`, `Long_Name`, `Code`, `Printable` (bool), `Comments` |
| `Teachers_List` | `Teacher` | `Name`, `Long_Name`, `Code`, [`Mornings_Afternoons_Behavior` en mode MA], `Target_Number_of_Hours`, `Qualified_Subjects` (liste de `Qualified_Subject`), `Comments` |
| `Buildings_List` | `Building` | `Name`, `Long_Name`, `Code`, `Comments` |
| `Rooms_List` | `Room` | `Name`, `Long_Name`, `Code`, `Building` (nom ou vide), `Capacity`, `Virtual` (bool), [ensembles de salles réelles si virtuelle], `Comments` |

### 2.5 Étudiants : hiérarchie Année → Groupe → Sous-groupe

```xml
<Students_List>
  <Year>
    <Name>1A</Name><Long_Name></Long_Name><Code></Code>
    <Number_of_Students>60</Number_of_Students>
    <Comments></Comments>
    <Number_of_Categories>0</Number_of_Categories>          <!-- utilisé seulement par l'assistant de division -->
    <First_Category_Is_Permanent>false</First_Category_Is_Permanent>
    <Separator> </Separator>
    <Group>
      <Name>1A-G1</Name><Long_Name></Long_Name><Code></Code>
      <Number_of_Students>30</Number_of_Students><Comments></Comments>
      <Subgroup>
        <Name>1A-G1-a</Name><Long_Name></Long_Name><Code></Code>
        <Number_of_Students>15</Number_of_Students><Comments></Comments>
      </Subgroup>
    </Group>
  </Year>
</Students_List>
```

Le moteur travaille au niveau **sous-groupe** : une activité affectée à `1A` concerne tous les sous-groupes de `1A`. Les noms d'années, groupes et sous-groupes partagent le même espace de noms.

### 2.6 Activités

```xml
<Activity>
  <Teacher>Ben Salah</Teacher>          <!-- 0..n -->
  <Subject>Maths</Subject>              <!-- exactement 1 -->
  <Activity_Tag>TP</Activity_Tag>       <!-- 0..n -->
  <Students>1A-G1</Students>            <!-- 0..n (année, groupe ou sous-groupe) -->
  <Duration>2</Duration>                <!-- en créneaux horaires -->
  <Total_Duration>4</Total_Duration>    <!-- somme des durées des sous-activités du groupe -->
  <Id>1</Id>                            <!-- entier unique, > 0 -->
  <Activity_Group_Id>1</Activity_Group_Id>  <!-- 0 = activité isolée ; sinon Id de la 1re sous-activité -->
  <Number_of_Students>30</Number_of_Students>  <!-- optionnel : absent = calculé à partir des Students -->
  <Active>true</Active>
  <Comments></Comments>
</Activity>
```

Un cours de 4 h hebdomadaires découpé en 2 × 2 h correspond à deux `<Activity>` de même `Activity_Group_Id`. FET génère alors habituellement une contrainte `ConstraintMinDaysBetweenActivities` entre elles. Au moins **une activité active** est requise, sinon `fet-cl` s'arrête avec le code 1.

### 2.7 Contraintes

Chaque contrainte est un élément `Constraint…` dans `Time_Constraints_List` ou `Space_Constraints_List`, avec toujours `Weight_Percentage`, `Active` et `Comments`. La 7.11.1 définit **271 types de contraintes de temps et 81 types de contraintes d'espace** (liste complète dans `annexe-balises-contraintes.md`).

Deux contraintes sont **obligatoires** à 100 % : `ConstraintBasicCompulsoryTime` et `ConstraintBasicCompulsorySpace`.

Exemples représentatifs (structures extraites des méthodes `getXmlDescription()` des sources) :

```xml
<!-- Indisponibilités d'un enseignant -->
<ConstraintTeacherNotAvailableTimes>
  <Weight_Percentage>100</Weight_Percentage>
  <Teacher>Trabelsi</Teacher>
  <Number_of_Not_Available_Times>2</Number_of_Not_Available_Times>
  <Not_Available_Time><Day>Mercredi</Day><Hour>10:00</Hour></Not_Available_Time>
  <Not_Available_Time><Day>Mercredi</Day><Hour>11:00</Hour></Not_Available_Time>
  <Active>true</Active><Comments></Comments>
</ConstraintTeacherNotAvailableTimes>

<!-- Écart minimal en jours entre sous-activités -->
<ConstraintMinDaysBetweenActivities>
  <Weight_Percentage>95</Weight_Percentage>
  <Consecutive_If_Same_Day>true</Consecutive_If_Same_Day>
  <Number_of_Activities>2</Number_of_Activities>
  <Activity_Id>1</Activity_Id><Activity_Id>2</Activity_Id>
  <MinDays>1</MinDays>
  <Active>true</Active><Comments></Comments>
</ConstraintMinDaysBetweenActivities>

<!-- Trous / charge -->
<ConstraintTeacherMaxGapsPerWeek>
  <Weight_Percentage>100</Weight_Percentage><Teacher>Ben Salah</Teacher><Max_Gaps>3</Max_Gaps>
  <Active>true</Active><Comments></Comments>
</ConstraintTeacherMaxGapsPerWeek>
<ConstraintStudentsSetMaxGapsPerWeek>
  <Weight_Percentage>100</Weight_Percentage><Max_Gaps>0</Max_Gaps><Students>1A</Students>
  <Active>true</Active><Comments></Comments>
</ConstraintStudentsSetMaxGapsPerWeek>
<ConstraintTeacherMaxHoursDaily>
  <Weight_Percentage>100</Weight_Percentage><Teacher>Ben Salah</Teacher>
  <Maximum_Hours_Daily>4</Maximum_Hours_Daily>
  <Active>true</Active><Comments></Comments>
</ConstraintTeacherMaxHoursDaily>

<!-- Placement imposé (verrouillage) -->
<ConstraintActivityPreferredStartingTime>
  <Weight_Percentage>100</Weight_Percentage><Activity_Id>5</Activity_Id>
  <Day>Lundi</Day><Hour>08:00</Hour>
  <Permanently_Locked>true</Permanently_Locked>
  <Active>true</Active><Comments></Comments>
</ConstraintActivityPreferredStartingTime>

<!-- Espace -->
<ConstraintSubjectPreferredRoom>
  <Weight_Percentage>100</Weight_Percentage><Subject>Maths</Subject><Room>A101</Room>
  <Active>true</Active><Comments></Comments>
</ConstraintSubjectPreferredRoom>
<ConstraintActivityPreferredRoom>
  <Weight_Percentage>100</Weight_Percentage><Activity_Id>4</Activity_Id><Room>Labo</Room>
  <!-- si Room est virtuelle : <Number_of_Real_Rooms>n</Number_of_Real_Rooms><Real_Room>…</Real_Room>… -->
  <Permanently_Locked>true</Permanently_Locked>
  <Active>true</Active><Comments></Comments>
</ConstraintActivityPreferredRoom>
```

Une activité sans contrainte de salle n'occupe aucune salle (`<Room></Room>` en sortie).

### 2.8 Fichier minimal validé

`exemple-minimal.fet` (fourni) contient 5 jours × 4 heures, 2 matières, 2 enseignants, une année avec groupes et sous-groupes, 5 activités, 1 bâtiment, 2 salles, 5 contraintes de temps et 3 d'espace. Il a été généré avec succès par `fet-cl 7.11.1` en moins d'une seconde, sans avertissement.

### 2.9 Conseils pour la génération programmatique du XML

- Construire le fichier avec une bibliothèque XML (`xml.etree.ElementTree`, `lxml`) pour garantir l'échappement (`&`, `<`, guillemets dans les noms).
- Attribuer les `Id` d'activités de manière stable (clé métier → Id) pour pouvoir relier les sorties `activities.xml` à votre base de données.
- Les références par nom sont sensibles à la casse et aux espaces : normaliser en amont.
- Une erreur de référence est fatale et explicite, par exemple (relevé dans `logs/errors.txt`) : `XML parse error at line 100, column 15: The activity with id=1 contains incorrect data. Additional details: Line 90, column 27: Teacher tX was not found in the teachers list.`
- Le plus sûr pour valider un format est de l'ouvrir une fois dans l'interface graphique `fet`, d'enregistrer, puis de comparer (diff) avec votre générateur.

---

## 3. Arguments en ligne de commande

### 3.1 Syntaxe et règles d'analyse

```
fet-cl --inputfile=FICHIER [options]
fet-cl --help
fet-cl --version
```

Règles constatées dans le code (`fetcl.cpp`, boucle d'analyse des arguments) :

| Règle | Conséquence pratique |
|---|---|
| Forme `--option=valeur` uniquement, sans espace autour de `=` | `--outputdir /tmp/x` n'est pas reconnu |
| Préfixe exact, sensible à la casse | `--InputFile=` est inconnu |
| Booléens : seul le **suffixe** est testé (`…false` pour désactiver une option vraie par défaut, `…true` pour activer une option fausse par défaut) | `--printrooms=no` est sans effet (reste `true`) ; utiliser strictement `true`/`false` |
| Entiers via `QString::toInt()` | valeur non numérique → 0 : `--timelimitseconds=abc` donne l'erreur « Time limit is 0 seconds » (code 1), `--htmllevel=abc` donne silencieusement le niveau 0 |
| Option inconnue | non fatale : `Unrecognized option: …` sur stdout et dans `logs/result.txt` |
| `--help` / `--version` | pris en compte **uniquement si `--inputfile` est absent** ; sinon ignorés et la génération démarre |
| Chemins | séparateurs natifs acceptés (`QDir::fromNativeSeparators`) ; `--outputdir` sans barre finale |

### 3.2 Options principales

| Option | Valeurs | Défaut | Description |
|---|---|---|---|
| `--inputfile=FILE` | chemin | (obligatoire) | Fichier `.fet` à traiter. Absent → usage + code 1 ; inexistant → `Error: the specified input file … is not existing` + code 1 |
| `--outputdir=DIR` | chemin sans `/` final | répertoire courant | Racine des résultats ; créée si nécessaire (`mkpath`). Doit être accessible en écriture, sinon code 1 |
| `--timelimitseconds=TLS` | entier > 0 | `2000000000` (pratiquement infini) | Durée maximale de recherche. À expiration : `Time exceeded`, écriture des solutions `-current` et `-highest`, code 0. `0` → code 1 |
| `--htmllevel=LEVEL` | 0 à 7 | `2` | Niveau de détail HTML (plus élevé = plus de fonctions, fichiers plus gros). Hors bornes → code 1. Alias accepté : `--timetablehtmllevel=` |
| `--language=LANG` | `ar, bg, bs, ca, cs, da, de, el, en_GB, en_US, es, eu, fa, fr, gl, he, hu, id, it, ja, lt, mk, ms, nl, pl, pt_BR, ro, ru, si, sk, sq, sr, tr, uk, uz, vi, zh_CN, zh_TW` | `en_US` | Langue des sorties traduites (HTML, conflits, avertissements). Code inconnu → avertissement et repli sur `en_US`. Le fichier `fet_<LANG>.qm` est cherché dans le dossier de l'exécutable, puis `./translations`, puis `../share/fet/translations` ; s'il est absent → avertissement dans `logs/warnings.txt` et repli sur `en_US` (vérifié) |
| `--verbose=VBS` | true/false | false | Messages supplémentaires sur stdout |
| `--help` | — | — | Affiche l'aide complète, code 0 |
| `--version` | — | — | Affiche `FET version 7.11.1` et la version de Qt, code 0. N'écrit aucun fichier |

### 3.3 Choix des fichiers écrits (17 options, défaut `true`)

`--writetimetableconflicts`, `--writetimetablesstatistics`, `--writetimetablesxml`, `--writetimetablesdayshorizontal`, `--writetimetablesdaysvertical`, `--writetimetablestimehorizontal`, `--writetimetablestimevertical`, `--writetimetablessubgroups`, `--writetimetablesgroups`, `--writetimetablesyears`, `--writetimetablesteachers`, `--writetimetablesteachersfreeperiods`, `--writetimetablesbuildings`, `--writetimetablesrooms`, `--writetimetablessubjects`, `--writetimetablesactivitytags`, `--writetimetablesactivities`.

> Piège vérifié : les fichiers `<nom>_subgroups.xml`, `<nom>_teachers.xml` et `<nom>_activities.xml` ne sont écrits que si `--writetimetablesxml=true` **et** la catégorie correspondante (`subgroups`, `teachers`, `activities`) vaut `true`. Pour une sortie « XML seulement », désactivez les quatre dispositions (`dayshorizontal`, `daysvertical`, `timehorizontal`, `timevertical`), les statistiques et les catégories purement HTML, mais conservez `subgroups`, `teachers` et `activities`.

### 3.4 Présentation HTML et CSV

| Option | Défaut | Rôle |
|---|---|---|
| `--embedcssinhtmlhead` | false | CSS intégrée dans chaque HTML au lieu d'un fichier unique |
| `--htmlusespan` | true | `rowspan/colspan` pour les activités de durée > 1 |
| `--printsubjects`, `--printactivitytags`, `--printteachers`, `--printstudents`, `--printrooms` | true | Éléments affichés dans les cellules |
| `--printnotavailable` | true | `-x-` (true) ou `---` (false) pour les créneaux indisponibles |
| `--printbreak` | true | `-X-` (true) ou `---` (false) pour les pauses |
| `--sortsubgroups` | false | Tri alphabétique des sous-groupes |
| `--sortactivitiesbytags` | false | Tri par étiquettes dans les cellules multi-activités |
| `--dividetimeaxisbydays` | false | Axe du temps découpé par jours |
| `--duplicateverticalheaders` | false | Répète les en-têtes verticaux à droite |
| `--printsimultaneousactivities` | false | Affiche les activités liées par « même heure de début » |
| `--printdetailedtimetables` | true | Emplois du temps détaillés des années et groupes |
| `--printdetailedteachersfreeperiodstimetables` | true | Détail des périodes libres des enseignants |
| `--showvirtualrooms` | false | Affiche les salles virtuelles |
| `--exportcsv` | false | Export CSV dans `<outputdir>/csv/<nom>/` |
| `--overwritecsv` | false | Écrase les CSV existants |
| `--firstlineisheadingcsv` | true | Première ligne = en-têtes |
| `--quotescsv` | `doublequotes` | `doublequotes`, `singlequotes` ou `none` |
| `--fieldseparatorcsv` | `comma` | `comma`, `semicolon` ou `verticalbar` |
| `--separate{days,hours}namelongnamebybreak`, `--separate{subjects,activitytags,teachers,students,buildings,rooms}namelongnamecodebybreak` | false | Saut de ligne entre nom, nom long et code |
| `--print{subjects,activitytags,teachers,subgroups,groups,years,buildings,rooms}comments` | false | Affiche les commentaires |

Personnalisation fine par catégorie et disposition : pour chaque préfixe `subgroups`, `groups`, `years`, `teachers`, `rooms`, `buildings`, `subjects`, `activitytags`, `activities`, combiné avec `dayshv` ou `timehv`, il existe 25 options `--<préfixe>print…` (`daysnames`, `dayslongnames`, `hoursnames`, `hourslongnames`, `{subjects,activitytags,teachers,students,rooms}{names,longnames,codes}`, cinq `…legend`, `legendcodesfirst`). Par défaut, seuls les noms sont affichés : jours, heures, matières, étiquettes, enseignants, étudiants et salles. S'y ajoutent `--teachersfreeperiodsprint…` (7 options) et `--statisticsprint{teachers,students}{names,longnames,codes}`. La liste exhaustive figure dans `annexe-fet-cl-help.txt`.

### 3.5 Reproductibilité : graines aléatoires

```
--randomseeds10=S10 --randomseeds11=S11 --randomseeds12=S12 \
--randomseeds20=S20 --randomseeds21=S21 --randomseeds22=S22
```

- Générateur MRG32k3a. Les **6 composantes sont requises** ; une liste partielle donne le code 1 (`If you want to specify the random seed, you need to specify all the 6 components…`).
- `s10..s12` ∈ [0 ; 4 294 967 086] et `s20..s22` ∈ [0 ; 4 294 944 442], sans que les trois composantes d'un même bloc soient toutes nulles.
- Même fichier d'entrée + même version (ou même algorithme) + mêmes graines = même emploi du temps.
- Les graines utilisées sont toujours tracées dans `<nom>_random_seed_before.txt`, et dans `<nom>_random_seed_after.txt` en cas de succès.
- `--randomseedx` / `--randomseedy` (FET < 5.44) sont **rejetées** avec le code 1.

### 3.6 Avertissements non bloquants

En ligne de commande, les boîtes de dialogue sont remplacées par des écritures dans `logs/warnings.txt` / `logs/errors.txt`, et le bouton par défaut est choisi automatiquement. Options : `--warnifusinggroupactivitiesininitialorder`, `--warnsubgroupswiththesameactivities`, `--warnifusingactivitiesnotfixedtimefixedspacevirtualroomsrealrooms` et `--warnifusingmaxhoursdailywithlessthan100percentweight` (toutes `true` par défaut).

### 3.7 Commandes de référence

```bash
# Génération standard, 10 minutes max, HTML niveau 2, sorties en français
fet-cl --inputfile=/data/lycee.fet --outputdir=/var/fet/out/lycee \
       --timelimitseconds=600 --htmllevel=2 --language=fr

# Génération rapide « XML seulement » pour intégration applicative
fet-cl --inputfile=lycee.fet --outputdir=out --timelimitseconds=300 \
       --writetimetablesstatistics=false --writetimetablesdayshorizontal=false \
       --writetimetablesdaysvertical=false --writetimetablestimehorizontal=false \
       --writetimetablestimevertical=false --writetimetablesgroups=false \
       --writetimetablesyears=false --writetimetablesteachersfreeperiods=false \
       --writetimetablesbuildings=false --writetimetablesrooms=false \
       --writetimetablessubjects=false --writetimetablesactivitytags=false
```

Sous Linux, exporter `LC_ALL=C.UTF-8` (ou une locale UTF-8) pour éviter l'avertissement Qt `Detected locale "C"…` sur stderr.

---

## 4. Codes de retour

Inventaire exhaustif des `return` / `exit()` de `main()` dans `src/cl/fetcl.cpp` 7.11.1, vérifié par essais :

| Code | Situation | Message (stdout et/ou `logs/result.txt`) |
|---|---|---|
| **0** | `--help` (sans `--inputfile`) | aide complète |
| **0** | `--version` (sans `--inputfile`) | `FET version 7.11.1` … |
| **0** | Génération réussie | `Generation successful` |
| **0** | Génération impossible (activité sans placement possible détectée en cours de recherche) | `Impossible` |
| **0** | Limite `--timelimitseconds` atteinte | `Time exceeded` |
| **0** | Arrêt par `SIGTERM` | `Generation interrupted` |
| 1 | Aucun argument | `Incorrect command-line parameters (No arguments given).` |
| 1 | Arguments présents mais pas de `--inputfile` | `… (Input file not specified).` |
| 1 | Fichier d'entrée inexistant | `Error: the specified input file … is not existing` |
| 1 | `logs/result.txt` impossible à créer | `FET critical - you don't have write permissions in the output directory…` |
| 1 | Fichier `sigwrite` préexistant impossible à supprimer | `Cannot remove the file named …sigwrite…` (`exit(1)`) |
| 1 | `max_placed_activities.txt` ou `initial_order.txt` impossible à créer | `fet: critical error - cannot open the log file…` |
| 1 | Répertoire `timetables/…` non inscriptible | `fet: critical error - you don't have write permissions…` |
| 1 | `--timelimitseconds` vaut 0 ou n'est pas numérique | `… (Time limit is 0 seconds).` |
| 1 | `--htmllevel` hors de 0..7 | `… (The HTML level must be 0, 1, 2, 3, 4, 5, 6, or 7).` |
| 1 | `--randomseedx/y` (obsolètes) | `Starting with FET version 5.44.0 the random number generator was changed…` |
| 1 | Graines incomplètes, hors bornes ou nulles | `If you want to specify the random seed, you need to specify all the 6 components…` |
| 1 | XML illisible ou incohérent (référence inconnue, mode invalide…) | `fet-cl: cannot read input file (not existing, in use, or incorrect file) - aborting` ; détail dans `logs/errors.txt` |
| 1 | Aucune activité active | `Please input at least one active activity before generating` |
| 1 | Échec de la structure interne | `Cannot compute internal structure - aborting` |
| 1 | Données contradictoires détectées au précalcul (ex. : enseignant sans créneau libre) | `Cannot precompute - data is wrong - aborting` ; détail dans `logs/errors.txt` |
| 1 | `difficult_activities.txt` impossible à écrire (après un échec de génération) | `FET critical - you don't have write permissions…` |
| signal | `SIGINT` (Ctrl+C) : arrêt immédiat **sans écriture** | — (Python : `returncode = -2` ; shell : 130) |
| signal | `SIGKILL`, plantage (`SIGSEGV`, `assert` → `SIGABRT`) | — (shell : 137, 139, 134) |
| signal | Limites de ressources : `RLIMIT_CPU` → `SIGXCPU` (-24 / 152), `RLIMIT_FSIZE` ou disque plein → `SIGXFSZ` (-25 / 153), mémoire épuisée → `std::bad_alloc` puis `SIGABRT` (-6 / 134) | `result.txt` peut déjà contenir `Generation successful` (cas `SIGXFSZ`) |
| 127 | Bibliothèques Qt introuvables (shell) | `error while loading shared libraries: libQt6Core.so.6…` |

**Règle d'interprétation recommandée** :

```
rc == 1                      → erreur d'appel ou de données (pas d'emploi du temps)
rc < 0 (Python) / rc > 128   → processus tué ou planté (prioritaire sur result.txt)
rc == 127 (shell)            → bibliothèque partagée introuvable
rc == 0  → lire logs/result.txt :
             "Generation successful"   → SUCCÈS si <nom>_activities.xml existe, sinon INCOMPLET
             "Impossible"              → ÉCHEC (voir logs/difficult_activities.txt, <nom>-highest/)
             "Time exceeded"           → ÉCHEC partiel (<nom>-highest/ = meilleure solution partielle)
             "Generation interrupted"  → ÉCHEC partiel (arrêt demandé)
```

Les quatre libellés ci-dessus sont écrits **en anglais quelle que soit `--language`** (chaînes non traduites dans `fetcl.cpp`), ce qui permet une analyse fiable.

---

## 5. Sorties produites

### 5.1 Arborescence

```
<outputdir>/
├── sigwrite                         (fichier de commande, créé par vous ; voir 6.2)
├── logs/                            (écrasé à chaque exécution dans ce même outputdir)
│   ├── result.txt                   statut final (cf. section 4)
│   ├── max_placed_activities.txt    progression horodatée (écrite au fil de l'eau)
│   ├── initial_order.txt            ordre initial des activités
│   ├── file_open.log                trace de lecture du .fet
│   ├── warnings.txt                 avertissements (si présents)
│   ├── errors.txt                   erreurs détaillées (si présentes)
│   └── difficult_activities.txt     activités bloquantes (si échec)
├── timetables/
│   ├── <nom>/                       résultat final (suffixé -2, -3… si le dossier existe déjà)
│   ├── <nom>-highest[-N]/           meilleure solution partielle (échec, arrêt ou sigwrite)
│   └── <nom>-current[-N]/           solution courante au moment de l'arrêt
└── csv/<nom>/                       si --exportcsv=true
```

`<nom>` est le nom du fichier d'entrée sans l'extension `.fet`. Tous les fichiers de `timetables/<nom>/` sont préfixés par `<nom>_`.

### 5.2 Contenu de `timetables/<nom>/`

| Fichier | Contenu |
|---|---|
| `<nom>_activities.xml` | **Sortie la plus utile pour une application** : placement de chaque activité |
| `<nom>_teachers.xml`, `<nom>_subgroups.xml` | Grilles par enseignant / sous-groupe |
| `<nom>_data_and_timetable.fet` | Fichier d'entrée enrichi des contraintes de verrouillage (écrit seulement si **toutes** les activités sont placées) |
| `<nom>_soft_conflicts.txt` | Contraintes souples violées ; en cas d'échec, contient `Total conflicts` |
| `<nom>_random_seed_before.txt` / `_after.txt` | Graines au début / à la fin |
| `<nom>_index.html`, `<nom>_stylesheet.css`, `<nom>_{subgroups,groups,years,teachers,rooms,buildings,subjects,activity_tags,activities}_{days,time}_{horizontal,vertical}.html`, `<nom>_teachers_free_periods_days_*.html`, `<nom>_{teachers,students}_statistics.html` | Emplois du temps HTML |

Format de `<nom>_activities.xml` (sortie réelle de l'exemple fourni) :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Activities_Timetable>
  <Activity>
    <Id>1</Id>
    <Day>Vendredi</Day>
    <Hour>09:00</Hour>
    <Room>A101</Room>
    <!-- <Real_Room>…</Real_Room> si salle virtuelle -->
  </Activity>
  …
</Activities_Timetable>
```

Format de `<nom>_teachers.xml` (idem `<Students_Timetable>`/`<Subgroup name=…>` pour les sous-groupes) :

```xml
<Teachers_Timetable>
  <Teacher name="Ben Salah">
    <Day name="Lundi">
      <Hour name="08:00">
        <Activity id="1"></Activity>
        <Subject name="Maths"></Subject>
        <Students name="1A-G1"></Students>
      </Hour>
      <Hour name="09:00"></Hour>
      …
```

En-tête de `<nom>_soft_conflicts.txt` (les libellés sont traduits selon `--language`) :

```
Soft conflicts of lycee.fet
Generated with FET 7.11.1 on 10/5/26 5:49 PM

Number of broken soft constraints: 0
Total soft conflicts: 0
```

Ligne type de `logs/max_placed_activities.txt`, utile pour suivre la progression : `At time 0 h 1 m 12 s, FET reached 245 activities placed`.

---

## 6. Contrôle d'une génération en cours

### 6.1 Signaux

| Signal | Effet |
|---|---|
| `SIGTERM` | Arrêt propre en moins de 0,1 s : écriture de `<nom>-current` et `<nom>-highest`, `Generation interrupted`, code 0 |
| `SIGINT`, `SIGHUP`, `SIGQUIT`, `SIGUSR1`, `SIGUSR2`, `SIGPIPE`, `SIGALRM` | Action par défaut : arrêt immédiat (code `-N` en Python, `128+N` en shell), rien n'est écrit |
| `SIGSTOP` / `SIGCONT` | Suspension possible, mais la limite `--timelimitseconds` est en temps réel : le temps suspendu est décompté |

### 6.2 Instantané sans arrêt : fichier `sigwrite`

Créez un fichier nommé exactement `sigwrite` à la racine de `--outputdir`. `fet-cl` vérifie sa présence chaque seconde, le supprime puis écrit `<nom>-current[-N]` et `<nom>-highest[-N]` sans interrompre la recherche. Si un `sigwrite` existe déjà au démarrage et ne peut être supprimé, l'exécution échoue (code 1).

---

## 7. Automatisation batch en Python : `fet_batch.py`

### 7.1 Fonctions

| Fonction | Mise en œuvre |
|---|---|
| Pré-validation | Analyse XML (racine `<fet>`, version, mode, nombre d'activités actives, présence des deux contraintes de base) avant tout lancement |
| Parallélisme | Pool de `--jobs` processus `fet-cl` (le moteur est mono-thread ; par défaut, la moitié des cœurs) |
| Isolation | Un `--outputdir` distinct par tentative : `<racine>/<nom>/run-NN/` (évite les collisions dans `logs/`) |
| Suivi | Lecture de `logs/max_placed_activities.txt` toutes les secondes |
| Garde-fous | Délai global `time_limit + grace` (couvre une option mal orthographiée), détection de stagnation `--stall-timeout`, puis arrêt propre (`SIGTERM`) et `SIGKILL` après `--kill-after` s |
| Instantanés | `--snapshot-every N` : crée `sigwrite` périodiquement |
| Multi-essais | `--runs N` avec graines MRG32k3a aléatoires explicites, donc rejouables (tracées dans `command.txt` et le rapport) ; `--stop-on-success` |
| Diagnostic | Code retour négatif → `KILLED` (prioritaire sur `logs/result.txt`) ; succès sans `<nom>_activities.xml` → `INCOMPLETE` ; sinon statut de `logs/result.txt` ; message tiré de `logs/errors.txt` |
| Rapport | `report-<date>.json` et `.csv` (toutes les tentatives + meilleure par fichier : succès, puis activités placées, puis conflits minimaux) |
| Interruption | Ctrl+C / SIGTERM sur le superviseur : arrêt propre de tous les `fet-cl` (résultats partiels conservés), code 130 |
| Code de sortie | 0 = tous les fichiers résolus ; 1 = au moins un échec ; 2 = rien à traiter ; 130 = interrompu |

Dépendances : Python 3.9 ou plus, bibliothèque standard uniquement. Linux uniquement (signaux POSIX, `start_new_session`).

### 7.2 Utilisation

```bash
export FET_CL=/opt/fet/bin/fet-cl          # ou --fet-cl=…
export LC_ALL=C.UTF-8

# Tous les .fet d'un dossier, 4 générations en parallèle, 10 min chacune
python3 fet_batch.py ./emplois/ -o ./resultats -t 600 -j 4

# 5 essais par fichier, garder le meilleur, arrêter si aucune progression pendant 120 s
python3 fet_batch.py lycee.fet -n 5 -j 5 -t 900 --stall-timeout 120 --stop-on-success

# Sortie XML seulement + CSV, options supplémentaires transmises telles quelles après --
python3 fet_batch.py lycee.fet --xml-only --export-csv --language fr -- --printrooms=false
```

Exemple de cron nocturne :

```cron
0 2 * * *  cd /srv/fet && FET_CL=/opt/fet/bin/fet-cl LC_ALL=C.UTF-8 \
           /usr/bin/python3 fet_batch.py inbox/ -o out/ -t 3600 -j 4 -q >> batch.log 2>&1 \
           || echo "Échec génération FET" | mail -s "FET batch" admin@exemple.tn
```

### 7.3 Résultats des essais réels (fet-cl 7.11.1 compilé depuis les sources)

| Cas testé | Statut obtenu par le script | Code `fet-cl` |
|---|---|---|
| `exemple-minimal.fet`, `small-test.fet`, `standby.fet` (exemples officiels) | `SUCCESS` | 0 |
| `MHS_July2.fet` (1 517 activités), 3 essais en parallèle | `SUCCESS` ×3 (conflits souples 12,35 / 16,15 / 13,3 ; meilleur retenu) | 0 |
| `German_subact_constr.fet`, `-t 8` | `TIME_EXCEEDED`, dossiers `-highest`/`-current` créés | 0 |
| Même fichier, `--snapshot-every 4` | 3 instantanés `-current-N`/`-highest-N` | 0 |
| Même fichier, Ctrl+C sur le superviseur | `INTERRUPTED` sur les 2 essais, résultats partiels écrits, superviseur → 130 | 0 |
| XML tronqué | `PRECHECK_FAILED` (ou `INPUT_ERROR` avec `--skip-precheck`) | 1 |
| Enseignant référencé inexistant | `INPUT_ERROR` + message `Teacher tX was not found in the teachers list.` | 1 |
| Enseignant indisponible sur tous les créneaux | `DATA_ERROR` + message `Cannot optimize for teacher t1…` | 1 |
| `--language=fr` sans fichier `.qm` installé | `SUCCESS`, avertissement de repli sur `en_US` dans `warnings.txt` | 0 |

### 7.4 Statuts produits par le script

`SUCCESS`, `IMPOSSIBLE`, `TIME_EXCEEDED`, `INTERRUPTED`, `INPUT_ERROR`, `NO_ACTIVITY`, `STRUCTURE_ERROR`, `DATA_ERROR`, `CLI_ERROR` (code 1 sans message reconnu), `KILLED` (signal, prioritaire sur result.txt), `INCOMPLETE` (succès annoncé mais sorties absentes), `PRECHECK_FAILED`, `SKIPPED`, `UNKNOWN`.

### 7.5 Exploitation des résultats dans votre application

```python
import xml.etree.ElementTree as ET
placements = {
    int(a.findtext("Id")): (a.findtext("Day"), a.findtext("Hour"), a.findtext("Room") or None)
    for a in ET.parse("out/lycee/run-01/timetables/lycee/lycee_activities.xml").getroot()
}
# placements[1] -> ('Vendredi', '09:00', 'A101')
```

---

## 8. Recommandations d'exploitation

1. Toujours fixer `--timelimitseconds` **et** un délai de garde externe.
2. Un `--outputdir` neuf par exécution ; archiver `logs/` avec les résultats.
3. Ne jamais se fier au seul code 0 : lire `logs/result.txt`.
4. Arrêter par `SIGTERM`, jamais par `SIGINT`, si l'on veut garder la meilleure solution partielle.
5. Pour les gros établissements, lancer plusieurs essais avec des graines différentes : la durée et la qualité varient fortement d'une graine à l'autre (essais ci-dessus : 340 contre 380 activités placées après 6 s sur le même fichier).
6. Conserver les 6 graines de la meilleure solution pour pouvoir la régénérer à l'identique.
7. En cas d'échec, consulter `logs/difficult_activities.txt`, puis la dernière ligne de `max_placed_activities.txt` : si FET a atteint n activités placées, la (n+1)-ième activité de `initial_order.txt` est celle qui bloque (indication donnée par FET dans l'en-tête de ce fichier).
8. Garder `--language=en_US` si vous analysez les fichiers texte traduits (conflits, avertissements).

---

## Annexe A — Script complet `fet_batch.py`

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fet_batch.py - Lancement et supervision de fet-cl 7.11.1 en mode batch.

Fonctionnalites
  * pre-validation XML des fichiers .fet (racine <fet>, version, activites actives) ;
  * execution parallele (pool de N processus fet-cl), un repertoire --outputdir
    isole par tentative (indispensable : logs/ est partage sinon) ;
  * supervision en temps reel via logs/max_placed_activities.txt (progression) ;
  * watchdog : delai global (--timelimitseconds + marge) et detection de stagnation,
    arret propre par SIGTERM (ecriture de -current / -highest) puis SIGKILL ;
  * plusieurs essais par fichier (--runs) avec graines aleatoires reproductibles
    (6 composantes MRG32k3a) et selection du meilleur resultat ;
  * classification du resultat a partir de logs/result.txt (le code de retour de
    fet-cl vaut 0 meme en cas d'echec de generation) ;
  * rapport JSON + CSV, code de sortie global exploitable par un ordonnanceur (cron, CI).

Linux uniquement (signaux POSIX, sessions de processus). Python >= 3.9, aucune dependance externe.
"""
from __future__ import annotations

import argparse
import concurrent.futures as cf
import csv
import dataclasses
import datetime as dt
import json
import logging
import os
import re
import secrets
import shutil
import signal
import subprocess
import sys
import threading
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Optional

# Bornes des graines (gen.rng.m1 - 1 et m2 - 1 dans les sources FET 7.11.1)
SEED1_MAX = 4294967086
SEED2_MAX = 4294944442

VALID_LANGUAGES = {
    "ar", "bg", "bs", "ca", "cs", "da", "de", "el", "en_GB", "en_US", "es", "eu",
    "fa", "fr", "gl", "he", "hu", "id", "it", "ja", "lt", "mk", "ms", "nl", "pl",
    "pt_BR", "ro", "ru", "si", "sk", "sq", "sr", "tr", "uk", "uz", "vi", "zh_CN", "zh_TW",
}

# Messages ecrits en anglais (non traduits) dans logs/result.txt par fetcl.cpp
RESULT_PATTERNS = [
    ("SUCCESS", "Generation successful"),
    ("IMPOSSIBLE", "Impossible"),
    ("TIME_EXCEEDED", "Time exceeded"),
    ("INTERRUPTED", "Generation interrupted"),
    ("INPUT_ERROR", "Cannot read input file"),
    ("NO_ACTIVITY", "Please input at least one active activity"),
    ("STRUCTURE_ERROR", "Cannot compute internal structure"),
    ("DATA_ERROR", "Cannot precompute"),
]

# "At time 0 h 1 m 12 s, FET reached 245 activities placed" (traduit selon --language :
# on n'exploite donc que les nombres)
PROGRESS_RE = re.compile(r"(\d+)\D+(\d+)\D+(\d+)\D+?(\d+)\D*$")

log = logging.getLogger("fet_batch")


# --------------------------------------------------------------------------- #
# Structures de donnees
# --------------------------------------------------------------------------- #
@dataclasses.dataclass
class Precheck:
    ok: bool
    file_version: str = ""
    mode: str = ""
    n_activities: int = 0
    n_active: int = 0
    n_time_constraints: int = 0
    n_space_constraints: int = 0
    error: str = ""


@dataclasses.dataclass
class RunResult:
    input_file: str
    attempt: int
    status: str = "NOT_STARTED"
    return_code: Optional[int] = None
    duration_s: float = 0.0
    max_placed: int = 0
    total_activities: int = 0
    soft_conflicts: Optional[float] = None
    seeds: Optional[list[int]] = None
    output_dir: str = ""
    timetable_dir: str = ""
    highest_dir: str = ""
    current_dir: str = ""
    stopped_by: str = ""          # "", "watchdog_timeout", "watchdog_stall", "supervisor"
    warnings: int = 0
    message: str = ""

    @property
    def is_success(self) -> bool:
        return self.status == "SUCCESS"


# --------------------------------------------------------------------------- #
# Pre-validation du fichier .fet
# --------------------------------------------------------------------------- #
def precheck_fet(path: Path) -> Precheck:
    try:
        root = ET.parse(path).getroot()
    except ET.ParseError as e:
        return Precheck(False, error=f"XML invalide : {e}")
    except OSError as e:
        return Precheck(False, error=f"Lecture impossible : {e}")

    if root.tag.lower() != "fet":
        return Precheck(False, error=f"Racine <{root.tag}> inattendue (attendu <fet>)")

    acts = root.findall("./Activities_List/Activity")
    n_active = sum(1 for a in acts if (a.findtext("Active") or "true").strip() == "true")
    tc = root.find("Time_Constraints_List")
    sc = root.find("Space_Constraints_List")
    pc = Precheck(
        ok=True,
        file_version=root.get("version", ""),
        mode=(root.findtext("Mode") or "Official").strip(),
        n_activities=len(acts),
        n_active=n_active,
        n_time_constraints=len(tc) if tc is not None else 0,
        n_space_constraints=len(sc) if sc is not None else 0,
    )
    if n_active == 0:
        pc.ok, pc.error = False, "Aucune activite active (fet-cl refuserait la generation)"
    elif tc is None or tc.find("ConstraintBasicCompulsoryTime") is None:
        pc.ok, pc.error = False, "ConstraintBasicCompulsoryTime absente"
    elif sc is None or sc.find("ConstraintBasicCompulsorySpace") is None:
        pc.ok, pc.error = False, "ConstraintBasicCompulsorySpace absente"
    return pc


# --------------------------------------------------------------------------- #
# Lecture des sorties fet-cl
# --------------------------------------------------------------------------- #
def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8-sig", errors="replace")
    except OSError:
        return ""


def classify(result_txt: str, return_code: Optional[int]) -> str:
    # Un code negatif (signal) prime sur result.txt : fet-cl ecrit "Generation successful" AVANT les
    # fichiers de sortie, et peut ensuite etre tue (SIGXFSZ disque plein, SIGKILL, SIGABRT...).
    if return_code is not None and return_code < 0:
        return "KILLED"
    for status, needle in RESULT_PATTERNS:
        if needle in result_txt:
            return status
    if return_code is None:
        return "UNKNOWN"
    return "CLI_ERROR" if return_code != 0 else "UNKNOWN"


def last_progress(max_placed_file: Path) -> int:
    """Dernier nombre d'activites placees lu dans logs/max_placed_activities.txt."""
    txt = read_text(max_placed_file)
    for line in reversed(txt.splitlines()):
        m = PROGRESS_RE.search(line.strip())
        if m:
            return int(m.group(4))
    return 0


def find_dirs(out_dir: Path, stem: str) -> tuple[str, str, str]:
    """Repertoires de resultats : <stem>[-N], <stem>-highest[-N], <stem>-current[-N]."""
    tdir = out_dir / "timetables"
    if not tdir.is_dir():
        return "", "", ""

    def newest(prefix: str, suffix: str = "") -> str:
        cands = [p for p in tdir.iterdir() if p.is_dir()
                 and re.fullmatch(re.escape(prefix + suffix) + r"(-\d+)?", p.name)]
        if not cands:
            return ""
        return str(max(cands, key=lambda p: p.stat().st_mtime))

    return newest(stem), newest(stem, "-highest"), newest(stem, "-current")


def parse_soft_conflicts(tt_dir: str, stem: str) -> Optional[float]:
    if not tt_dir:
        return None
    txt = read_text(Path(tt_dir) / f"{stem}_soft_conflicts.txt")
    # 5e ligne non vide environ : "Total soft conflicts: 12.50" (libelle traduisible)
    for line in txt.splitlines():
        if "Total" in line or "total" in line:
            m = re.search(r"(-?\d+(?:[.,]\d+)?)\s*$", line.strip())
            if m:
                return float(m.group(1).replace(",", "."))
    return None


def count_placed_in_xml(tt_dir: str, stem: str) -> int:
    """Nombre d'activites ayant un <Day> non vide dans <stem>_activities.xml."""
    if not tt_dir:
        return 0
    p = Path(tt_dir) / f"{stem}_activities.xml"
    try:
        root = ET.parse(p).getroot()
    except (ET.ParseError, OSError):
        return 0
    return sum(1 for a in root.findall("Activity") if (a.findtext("Day") or "").strip())


# --------------------------------------------------------------------------- #
# Lancement et supervision d'un processus fet-cl
# --------------------------------------------------------------------------- #
class Supervisor:
    def __init__(self, args: argparse.Namespace):
        self.args = args
        self.stop_event = threading.Event()
        self._procs: set[subprocess.Popen] = set()
        self._lock = threading.Lock()

    # ---------- signaux ----------
    @staticmethod
    def _graceful_stop(proc: subprocess.Popen) -> None:
        """Demande a fet-cl d'ecrire current/highest puis de quitter."""
        if proc.poll() is not None:
            return
        try:
            proc.send_signal(signal.SIGTERM)
        except (OSError, ValueError):
            pass

    @staticmethod
    def _hard_kill(proc: subprocess.Popen) -> None:
        if proc.poll() is None:
            try:
                proc.kill()
            except OSError:
                pass

    def stop_all(self) -> None:
        self.stop_event.set()
        with self._lock:
            procs = list(self._procs)
        for p in procs:
            self._graceful_stop(p)

    # ---------- construction de la commande ----------
    def build_cmd(self, fet_file: Path, out_dir: Path, seeds: Optional[list[int]]) -> list[str]:
        a = self.args
        cmd = [
            a.fet_cl,
            f"--inputfile={fet_file}",
            f"--outputdir={out_dir}",
            f"--timelimitseconds={a.time_limit}",
            f"--htmllevel={a.html_level}",
            f"--language={a.language}",
            f"--verbose={'true' if a.verbose_fet else 'false'}",
        ]
        if a.export_csv:
            cmd.append("--exportcsv=true")
        if a.xml_only:
            # Sorties XML (+ conflits) uniquement. Attention : dans fet-cl 7.11.1 les XML
            # <stem>_subgroups/_teachers/_activities.xml exigent --writetimetablesxml=true
            # ET la categorie correspondante (subgroups/teachers/activities) a true.
            # On coupe donc les dispositions HTML et les categories purement HTML.
            for opt in ("statistics", "dayshorizontal", "daysvertical", "timehorizontal",
                        "timevertical", "groups", "years", "teachersfreeperiods",
                        "buildings", "rooms", "subjects", "activitytags"):
                cmd.append(f"--writetimetables{opt}=false")
        if seeds:
            names = ("s10", "s11", "s12", "s20", "s21", "s22")
            cmd += [f"--randomseeds{n[1:]}={v}" for n, v in zip(names, seeds)]
        cmd += a.extra or []
        return cmd

    # ---------- execution d'une tentative ----------
    def run_one(self, fet_file: Path, attempt: int, total_acts: int) -> RunResult:
        a = self.args
        stem = fet_file.name[:-4] if fet_file.name.endswith(".fet") else fet_file.name
        out_dir = Path(a.output_root).resolve() / stem / f"run-{attempt:02d}"
        if out_dir.exists():
            shutil.rmtree(out_dir)
        out_dir.mkdir(parents=True)

        seeds = None
        if a.runs > 1 or a.fixed_seeds:
            seeds = [secrets.randbelow(SEED1_MAX) + 1 for _ in range(3)] + \
                    [secrets.randbelow(SEED2_MAX) + 1 for _ in range(3)]

        res = RunResult(str(fet_file), attempt, output_dir=str(out_dir),
                        seeds=seeds, total_activities=total_acts)
        if self.stop_event.is_set():
            res.status, res.message = "SKIPPED", "arret du superviseur demande"
            return res

        cmd = self.build_cmd(fet_file.resolve(), out_dir, seeds)
        log.info("[%s #%d] %s", stem, attempt, " ".join(cmd))
        (out_dir / "command.txt").write_text(" ".join(cmd) + "\n", encoding="utf-8")

        popen_kw: dict = {"start_new_session": True}   # Ctrl+C du terminal non propage a fet-cl

        hard_deadline = a.time_limit + a.grace
        max_placed_file = out_dir / "logs" / "max_placed_activities.txt"
        t0 = time.monotonic()
        last_change = t0
        best = 0
        stop_sent_at: Optional[float] = None
        next_snapshot = t0 + a.snapshot_every if a.snapshot_every else None

        with open(out_dir / "stdout.log", "wb") as fout:
            proc = subprocess.Popen(cmd, stdout=fout, stderr=subprocess.STDOUT,
                                    stdin=subprocess.DEVNULL, **popen_kw)
            with self._lock:
                self._procs.add(proc)
            try:
                while proc.poll() is None:
                    time.sleep(a.poll_interval)
                    now = time.monotonic()
                    elapsed = now - t0

                    placed = last_progress(max_placed_file)
                    if placed > best:
                        best, last_change = placed, now
                        log.info("[%s #%d] %4.0fs  %d/%s activites placees",
                                 stem, attempt, elapsed, best, total_acts or "?")

                    # Instantane sans arret : fet-cl detecte <outputdir>/sigwrite (poll 1 s),
                    # le supprime puis ecrit <stem>-current et <stem>-highest.
                    if next_snapshot and now >= next_snapshot and stop_sent_at is None:
                        (out_dir / "sigwrite").touch()
                        next_snapshot = now + a.snapshot_every
                        log.info("[%s #%d] instantane demande (sigwrite)", stem, attempt)

                    if stop_sent_at is None:
                        reason = ""
                        if elapsed > hard_deadline:
                            reason = "watchdog_timeout"
                        elif a.stall_timeout and now - last_change > a.stall_timeout:
                            reason = "watchdog_stall"
                        elif self.stop_event.is_set():
                            reason = "supervisor"
                        if reason:
                            log.warning("[%s #%d] arret propre (%s)", stem, attempt, reason)
                            res.stopped_by = reason
                            self._graceful_stop(proc)
                            stop_sent_at = now
                    elif now - stop_sent_at > a.kill_after:
                        log.error("[%s #%d] pas de reponse au signal : SIGKILL", stem, attempt)
                        self._hard_kill(proc)
            finally:
                proc.wait()
                with self._lock:
                    self._procs.discard(proc)

        res.return_code = proc.returncode
        res.duration_s = round(time.monotonic() - t0, 1)
        result_txt = read_text(out_dir / "logs" / "result.txt")
        res.status = classify(result_txt, proc.returncode)
        res.max_placed = max(best, last_progress(max_placed_file))
        res.timetable_dir, res.highest_dir, res.current_dir = find_dirs(out_dir, stem)
        if res.status == "SUCCESS" and not (res.timetable_dir and
                                            (Path(res.timetable_dir) / f"{stem}_activities.xml").is_file()):
            res.status = "INCOMPLETE"   # result.txt ecrit mais sorties absentes (disque plein, quota...)
        ref_dir = res.timetable_dir if res.is_success else (res.highest_dir or res.current_dir)
        res.soft_conflicts = parse_soft_conflicts(ref_dir, stem)
        if res.is_success:
            res.max_placed = count_placed_in_xml(ref_dir, stem) or total_acts or res.max_placed
            res.total_activities = total_acts or res.max_placed
        res.warnings = read_text(out_dir / "logs" / "warnings.txt").count("\n\n")
        if res.status != "SUCCESS":
            # Diagnostic : logs/errors.txt (messages de lecture/precalcul), sinon fin de stdout
            errs = []
            for block in read_text(out_dir / "logs" / "errors.txt").split("Title: ")[1:]:
                body = block.split("Message: ", 1)[-1].split("\nButton 0 text:", 1)[0]
                errs.append(" ".join(body.split()))
            tail = [l for l in read_text(out_dir / "stdout.log").splitlines() if l.strip()]
            res.message = (" | ".join(errs[:2]) if errs else " | ".join(tail[-3:]))[:500]
        log.info("[%s #%d] -> %s (rc=%s, %.0fs, placees=%d, conflits souples=%s)",
                 stem, attempt, res.status, res.return_code, res.duration_s,
                 res.max_placed, res.soft_conflicts)
        return res


# --------------------------------------------------------------------------- #
# Orchestration
# --------------------------------------------------------------------------- #
def collect_inputs(paths: list[str], recursive: bool) -> list[Path]:
    files: list[Path] = []
    for p in map(Path, paths):
        if p.is_dir():
            files += sorted(p.rglob("*.fet") if recursive else p.glob("*.fet"))
        elif p.is_file():
            files.append(p)
        else:
            log.warning("Ignore (introuvable) : %s", p)
    # suppression des doublons en conservant l'ordre
    seen, out = set(), []
    for f in files:
        k = f.resolve()
        if k not in seen:
            seen.add(k)
            out.append(f)
    return out


def best_of(results: list[RunResult]) -> RunResult:
    def key(r: RunResult):
        return (r.is_success, r.max_placed,
                -(r.soft_conflicts if r.soft_conflicts is not None else float("inf")))
    return max(results, key=key)


def check_fet_cl(exe: str) -> str:
    path = shutil.which(exe) or (exe if Path(exe).is_file() else None)
    if not path:
        raise SystemExit(f"fet-cl introuvable : {exe}")
    try:
        out = subprocess.run([path, "--version"], capture_output=True, text=True, timeout=30)
    except (OSError, subprocess.TimeoutExpired) as e:
        raise SystemExit(f"Impossible d'executer {path} : {e}")
    m = re.search(r"FET version (\S+)", out.stdout)
    version = m.group(1) if m else "?"
    if version != "7.11.1":
        log.warning("fet-cl version %s detectee (document redige pour 7.11.1)", version)
    return path


def write_reports(all_results: list[RunResult], best: dict[str, RunResult], root: Path) -> None:
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    payload = {
        "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
        "runs": [dataclasses.asdict(r) for r in all_results],
        "best": {k: dataclasses.asdict(v) for k, v in best.items()},
    }
    jpath = root / f"report-{stamp}.json"
    jpath.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    cpath = root / f"report-{stamp}.csv"
    fields = [f.name for f in dataclasses.fields(RunResult)]
    with open(cpath, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=fields + ["best"])
        w.writeheader()
        for r in all_results:
            row = dataclasses.asdict(r)
            row["seeds"] = " ".join(map(str, r.seeds)) if r.seeds else ""
            row["best"] = best.get(r.input_file) is r
            w.writerow(row)
    log.info("Rapports : %s, %s", jpath, cpath)


def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Generation d'emplois du temps FET en mode batch (fet-cl 7.11.1).")
    p.add_argument("inputs", nargs="+", help="fichiers .fet et/ou repertoires")
    p.add_argument("-r", "--recursive", action="store_true", help="parcours recursif des repertoires")
    p.add_argument("--fet-cl", default=os.environ.get("FET_CL", "fet-cl"),
                   help="chemin de l'executable (defaut : $FET_CL ou fet-cl dans le PATH)")
    p.add_argument("-o", "--output-root", default="fet-batch-out", help="racine des resultats")
    p.add_argument("-t", "--time-limit", type=int, default=600,
                   help="--timelimitseconds transmis a fet-cl (defaut 600)")
    p.add_argument("--html-level", type=int, default=2, choices=range(0, 8),
                   help="--htmllevel 0..7 (defaut 2)")
    p.add_argument("--language", default="en_US", help="--language (defaut en_US)")
    p.add_argument("-j", "--jobs", type=int, default=max(1, (os.cpu_count() or 2) // 2),
                   help="processus fet-cl en parallele (fet-cl est mono-thread)")
    p.add_argument("-n", "--runs", type=int, default=1,
                   help="essais independants par fichier (graines differentes)")
    p.add_argument("--fixed-seeds", action="store_true",
                   help="toujours passer des graines explicites (reproductibilite)")
    p.add_argument("--stop-on-success", action="store_true",
                   help="annuler les essais restants d'un fichier des qu'un essai reussit")
    p.add_argument("--stall-timeout", type=int, default=0,
                   help="arret propre si aucune progression pendant N s (0 = desactive)")
    p.add_argument("--grace", type=int, default=30,
                   help="marge au-dela de --time-limit avant arret force par le watchdog")
    p.add_argument("--kill-after", type=int, default=60,
                   help="delai entre SIGTERM et SIGKILL (ecriture des resultats)")
    p.add_argument("--poll-interval", type=float, default=1.0)
    p.add_argument("--snapshot-every", type=int, default=0,
                   help="cree le fichier sigwrite toutes les N s (instantane sans arret, 0 = non)")
    p.add_argument("--xml-only", action="store_true", help="ne pas ecrire les fichiers HTML")
    p.add_argument("--export-csv", action="store_true", help="--exportcsv=true")
    p.add_argument("--verbose-fet", action="store_true", help="--verbose=true")
    p.add_argument("--skip-precheck", action="store_true")
    p.add_argument("-q", "--quiet", action="store_true")
    p.epilog = "Tout ce qui suit '--' est transmis tel quel a fet-cl (ex. -- --printrooms=false)."
    argv = list(sys.argv[1:] if argv is None else argv)
    extra: list[str] = []
    if "--" in argv:
        k = argv.index("--")
        argv, extra = argv[:k], argv[k + 1:]
    a = p.parse_args(argv)
    a.extra = extra
    if a.time_limit <= 0:
        p.error("--time-limit doit etre > 0 (fet-cl refuse 0)")
    if a.language not in VALID_LANGUAGES:
        p.error(f"langue inconnue : {a.language}")
    if a.runs < 1 or a.jobs < 1:
        p.error("--runs et --jobs doivent etre >= 1")
    return a


def main(argv: Optional[list[str]] = None) -> int:
    a = parse_args(argv)
    logging.basicConfig(level=logging.WARNING if a.quiet else logging.INFO,
                        format="%(asctime)s %(levelname)-7s %(message)s", datefmt="%H:%M:%S")
    a.fet_cl = check_fet_cl(a.fet_cl)
    root = Path(a.output_root).resolve()
    root.mkdir(parents=True, exist_ok=True)

    inputs = collect_inputs(a.inputs, a.recursive)
    if not inputs:
        log.error("Aucun fichier .fet a traiter")
        return 2

    sup = Supervisor(a)

    def on_signal(signum, _frame):
        log.warning("Signal %s recu : arret propre de toutes les generations...", signum)
        sup.stop_all()
    signal.signal(signal.SIGINT, on_signal)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, on_signal)

    all_results: list[RunResult] = []
    tasks = []
    for f in inputs:
        pc = Precheck(ok=True) if a.skip_precheck else precheck_fet(f)
        if not pc.ok:
            log.error("[%s] pre-validation echouee : %s", f.name, pc.error)
            all_results.append(RunResult(str(f), 0, status="PRECHECK_FAILED", message=pc.error))
            continue
        log.info("[%s] version=%s mode=%s activites=%d (actives %d) contraintes T/S=%d/%d",
                 f.name, pc.file_version, pc.mode, pc.n_activities, pc.n_active,
                 pc.n_time_constraints, pc.n_space_constraints)
        tasks += [(f, i, pc.n_active) for i in range(1, a.runs + 1)]

    succeeded: set[str] = set()
    succ_lock = threading.Lock()

    def job(f: Path, i: int, n: int) -> RunResult:
        if a.stop_on_success:
            with succ_lock:
                if str(f) in succeeded:
                    return RunResult(str(f), i, status="SKIPPED", message="deja resolu")
        r = sup.run_one(f, i, n)
        if r.is_success:
            with succ_lock:
                succeeded.add(str(f))
        return r

    with cf.ThreadPoolExecutor(max_workers=a.jobs) as ex:
        futs = [ex.submit(job, *t) for t in tasks]
        try:
            for fut in cf.as_completed(futs):
                all_results.append(fut.result())
        except KeyboardInterrupt:
            sup.stop_all()

    best: dict[str, RunResult] = {}
    by_file: dict[str, list[RunResult]] = {}
    for r in all_results:
        if r.status not in ("SKIPPED",):
            by_file.setdefault(r.input_file, []).append(r)
    for k, rs in by_file.items():
        best[k] = best_of(rs)

    write_reports(sorted(all_results, key=lambda r: (r.input_file, r.attempt)), best, root)

    print("\n=== Synthese ===")
    for k, r in sorted(best.items()):
        target = r.timetable_dir if r.is_success else (r.highest_dir or r.output_dir)
        print(f"{Path(k).name:40s} {r.status:16s} placees={r.max_placed}/{r.total_activities} "
              f"conflits={r.soft_conflicts} -> {target}")

    if sup.stop_event.is_set():
        return 130
    return 0 if best and all(r.is_success for r in best.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
```
