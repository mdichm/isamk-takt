# fet-cl 7.11.1 — Guide technique du développeur : capacités et limites

| | |
|---|---|
| Version | FET 7.11.1, moteur en ligne de commande `fet-cl` |
| Public | Développeurs qui génèrent des fichiers `.fet`, appellent `fet-cl` et exploitent ses résultats sous Linux |
| Méthode | Lecture des sources officielles (`src/cl/fetcl.cpp`, `src/engine/*.cpp`, `timetable_defs.h`, `translations/fet_fr.ts`) et campagne de 529 tests réels (plus de 5 000 exécutions de fet-cl) sur un binaire compilé depuis ces sources (Linux x86-64, Qt 6.10), rejouée le 7 octobre 2026 pour vérifier ce document (section 16) |
| Compléments | `catalogue-contraintes-fet-cl-7.11.1.md` (fiche et exemple XML de chaque contrainte), validateur `fet-cl-validator` (rejoue toutes les mesures de ce document sur votre binaire), `fet_batch.py` (superviseur batch), `rapport-tests-fet-cl-7.11.1.md` (rapport détaillé de la campagne) |

Sources : [sources FET 7.11.1](https://lalescu.ro/liviu/fet/download/fet-7.11.1.tar.xz), [site de FET](https://lalescu.ro/liviu/fet/), [fichiers de diffusion sur SourceForge](https://sourceforge.net/projects/fet-timetabling/files/fet-timetabling/), [page de manuel fet-cl (Ubuntu)](https://manpages.ubuntu.com/manpages/jammy/man1/fet-cl.1.html), [dépôt GitHub de FET](https://github.com/fet-project/fet).

Convention : « observé » signifie mesuré par la campagne de tests ; « d'après le code » signifie lu dans les sources 7.11.1. Les comportements observés peuvent changer d'une version de FET à l'autre : rejouez le validateur à chaque mise à jour.

---

## Sommaire

1. [L'essentiel en une page](#1-lessentiel-en-une-page)
2. [Ce que fait fet-cl (et ce qu'il ne fait pas)](#2-ce-que-fait-fet-cl-et-ce-quil-ne-fait-pas)
3. [Installation et environnement d'exécution](#3-installation-et-environnement-dexécution)
4. [Format d'entrée `.fet`](#4-format-dentrée-fet)
5. [Les quatre modes](#5-les-quatre-modes)
6. [Contraintes : modèle, poids, classification](#6-contraintes--modèle-poids-classification)
7. [Ligne de commande](#7-ligne-de-commande)
8. [Codes de retour et statut réel](#8-codes-de-retour-et-statut-réel)
9. [Sorties produites](#9-sorties-produites)
10. [Contrôle d'une génération en cours](#10-contrôle-dune-génération-en-cours)
11. [Performances, reproductibilité, montée en charge](#11-performances-reproductibilité-montée-en-charge)
12. [Limites et pièges : liste exhaustive](#12-limites-et-pièges--liste-exhaustive)
13. [Intégration : architecture recommandée](#13-intégration--architecture-recommandée)
14. [Diagnostic des échecs](#14-diagnostic-des-échecs)
15. [Tester votre intégration](#15-tester-votre-intégration)
16. [Vérification de ce document](#16-vérification-de-ce-document)
17. [Annexes A et B](#annexe-a--référence-des-352-types-de-contraintes)

---

## 1. L'essentiel en une page

| Sujet | Ce qu'il faut savoir |
|---|---|
| Rôle | Lit un fichier XML `.fet`, cherche **un** emploi du temps respectant toutes les contraintes à 100 %, écrit XML, HTML, CSV et journaux |
| Appel | `fet-cl --inputfile=F.fet --outputdir=DIR --timelimitseconds=N [options]`, forme `--option=valeur` uniquement |
| Code 0 ≠ succès | `0` est aussi renvoyé pour « Impossible », « Time exceeded » et « Generation interrupted ». Lire `DIR/logs/result.txt` |
| Code 1 | Erreur d'appel, de lecture ou de données (précalcul). Détail dans `logs/errors.txt` |
| Plantages | fet-cl s'arrête parfois par **assertion** (SIGABRT : code -6 en Python, 134 en shell) au lieu de refuser proprement. Les assertions restent actives dans les binaires « Release » (`#undef NDEBUG` dans `timetable_defs.h`) |
| Contraintes | 352 types (271 de temps, 81 d'espace). 270 exigent un poids de 100 % ; 82 acceptent 0 à 100 % |
| Poids < 100 % | Préférence, pas règle : la solution peut la violer, la violation est comptée dans `soft_conflicts.txt`. fet-cl n'optimise pas les préférences, il s'arrête à la première solution complète |
| Modes | `Official`, `Mornings_Afternoons`, `Block_Planning`, `Terms`. 201 contraintes valent pour les 4 modes, les autres sont propres à un mode |
| Options | 534 options documentées par `--help` (521 booléennes). Option inconnue : avertissement seulement. Booléens lus par la fin de la valeur |
| Parallélisme | Moteur mono-thread. Paralléliser en lançant plusieurs processus, chacun avec son `--outputdir` |
| Arrêt | `SIGTERM` écrit le meilleur résultat partiel en moins de 0,1 s ; `SIGINT` et les autres signaux arrêtent sans rien écrire ; fichier `sigwrite` = instantané sans arrêt |
| Code négatif | Un code négatif (signal) prime sur `result.txt` : `Generation successful` est écrit **avant** les fichiers de sortie (observé avec un disque plein simulé) |
| Données | fet-cl ne valide pas tout : noms de jours ou d'heures vides ou en double, Id 0, bâtiment inexistant, poids hors [0, 100] passent la lecture (section 12). Valider en amont |
| Charge | Testé jusqu'à 29 719 activités (44 à 50 s, 214 Mio). Durée ≈ quadratique en nombre d'activités ; mémoire proportionnelle à jours × heures × activités |
| Reproductibilité | Même fichier + même version + mêmes 6 graines = même résultat (vérifié, hors dates des fichiers) |

---

## 2. Ce que fait fet-cl (et ce qu'il ne fait pas)

### 2.1 Chaîne de traitement

```
 .fet ──► lecture XML ──► structure interne ──► précalcul ──► génération ──► export
           (code 1 si     (code 1 si           (code 1 si     (heuristique,   (XML, HTML,
            illisible)     incohérente)         contradiction  mono-thread,    CSV, logs)
                                                détectée)      limite de temps)
```

| Étape | Rôle | Échec typique | Où lire le message |
|---|---|---|---|
| Lecture | Analyse le XML (`QXmlStreamReader`), convertit les anciennes versions | XML mal formé, nombre incorrect, référence inconnue, mode invalide, valeur hors limite | `logs/errors.txt` (`Could not read file - XML parse error at line L, column C: …`) |
| Structure interne | Indexe enseignants, sous-groupes, salles, activités | aucune activité active | stdout et `logs/result.txt` |
| Précalcul | Vérifie la cohérence de chaque contrainte avec les données et prépare les tables | poids < 100 % refusé, contrainte incompatible avec le mode, activité sans créneau possible, prérequis manquant | `logs/errors.txt` (`Cannot optimize, because …`, `Please make weight 100%`, `… incompatible with the current mode`) |
| Génération | Place les activités une par une, avec retours arrière, jusqu'à placement complet ou limite de temps | Impossible, Time exceeded | `logs/result.txt`, `logs/difficult_activities.txt`, `logs/max_placed_activities.txt` |
| Export | Écrit les résultats demandés | dossier non inscriptible | stdout, code 1 |

### 2.2 Capacités vérifiées

| Capacité | Résultat observé |
|---|---|
| 4 modes de fonctionnement | Génération réussie et emploi du temps cohérent dans chacun |
| Hiérarchie Année → Groupe → Sous-groupe | Gérée ; le moteur travaille au niveau du sous-groupe |
| Activités fractionnées (`Activity_Group_Id`) | 3 sous-activités placées sur 3 jours différents avec `ConstraintMinDaysBetweenActivities` |
| Co-animation : plusieurs enseignants et plusieurs groupes par activité | Placée sans chevauchement pour aucun des participants |
| Activité sans enseignant ou sans élèves | Acceptée et placée |
| Activité inactive (`<Active>false</Active>`) | Acceptée, non placée |
| Verrouillage (`Permanently_Locked`) | Activité placée exactement au créneau imposé |
| Salles virtuelles (ensembles de salles réelles) | Activité placée dans la salle virtuelle, salles réelles choisies et écrites (`<Real_Room>`) |
| Bâtiments, capacités de salles | Gérés par les contraintes d'espace |
| Contraintes souples | 82 types acceptent un poids < 100 % ; violation comptée (0,95 pour une contrainte à 95 %) |
| Reprise de fichiers anciens | Fichier FET 5 ouvert et converti, avec avertissement |
| Fichier d'une version plus récente | Ouvert avec avertissement |
| Balise inconnue | Ignorée avec avertissement (`There is an unrecognized XML tag …`) |
| Grandes grilles | 1000 jours et 1440 heures par jour acceptés |
| Charge | 1872 activités (80 classes) générées en 0,3 s sur une instance sans contrainte de trous ; 1517 activités sur un fichier réel de démonstration |
| Traductions | 38 langues (37 traductions + en_US) pour les sorties HTML et les messages |
| Instantanés et arrêt propre | `sigwrite`, `SIGTERM`, dossiers `-current` et `-highest` |

### 2.3 Ce que fet-cl ne fait pas

- **Pas d'optimisation des préférences.** La recherche s'arrête dès que toutes les activités sont placées en respectant les contraintes à 100 %. Sur une préférence satisfiable, le taux de respect mesuré sur 10 graines est de 0/10 jusqu'à 75 %, 1/10 à 90 %, 4/10 à 95 %, 8/10 à 99 % et 10/10 à 100 %. Pour obtenir de meilleures solutions : plusieurs exécutions avec des graines différentes, puis choix sur `Total soft conflicts`.
- **Pas de parallélisme interne.** Un processus = un cœur.
- **Pas de reprise incrémentale.** Pour repartir d'une solution, il faut réinjecter ses placements comme contraintes (`*_data_and_timetable.fet` le fait pour vous).
- **Pas de validation exhaustive des données.** Certaines incohérences provoquent un abandon par assertion au lieu d'un message (section 12).
- **Pas d'API, pas de sortie JSON, pas de flux de progression structuré.** L'intégration passe par fichiers et code de retour.
- **Pas de garantie d'impossibilité.** « Impossible » et « Time exceeded » signifient « non trouvé », pas « prouvé infaisable », sauf quand le précalcul refuse les données (code 1).

---

## 3. Installation et environnement d'exécution

| Élément | Recommandation | Observé |
|---|---|---|
| Obtention | Paquet `fet` de la distribution (souvent une version plus ancienne) ou compilation des sources (CMake ou qmake, Qt 6) | Binaire compilé avec CMake et Qt 6.10.0 |
| Bibliothèques | Qt accessible par le chargeur (`LD_LIBRARY_PATH`, RPATH ou installation système) ; vérifier avec `ldd fet-cl` | Bibliothèque absente : code 127 (shell), `error while loading shared libraries` |
| Locale | Exporter une locale UTF-8 (`LC_ALL=C.UTF-8`) | `LC_ALL=C` : avertissement Qt sur stderr, noms accentués intacts ; `fr_FR.UTF-8` : résultat identique |
| Fichiers écrits | Uniquement sous `--outputdir` (ou le dossier courant) | Rien dans `HOME` ; permissions selon l'`umask` de l'appelant (022 → 644, 077 → 600) |
| Entrée | Fichier ordinaire, lien symbolique, chemin relatif, fichier en lecture seule, `/dev/stdin`, tube nommé | Tous acceptés, fichier d'entrée jamais modifié |

Fichiers de traduction : `fet_<langue>.qm`, cherchés dans le dossier de l'exécutable, puis dans son sous-dossier `translations/`, puis dans `<dossier de l'exécutable>/../share/fet/translations` (installation de type `/usr/bin` + `/usr/share/fet/translations`). S'ils manquent, `--language=fr` revient à `en_US` avec un avertissement dans `logs/warnings.txt` (observé).

Vérification minimale d'une installation :

```bash
fet-cl --version        # "FET version 7.11.1" + version de Qt, code 0, n'écrit aucun fichier
fet-cl --help | wc -l   # environ 670 lignes
```

Compilation : FET force les assertions (`#undef NDEBUG` dans `src/engine/timetable_defs.h`), y compris avec `CMAKE_BUILD_TYPE=Release`. Ne retirez pas cette ligne : le moteur s'appuie sur ces contrôles, et les désactiver transformerait des abandons en comportements indéfinis.

---

## 4. Format d'entrée `.fet`

### 4.1 Règles générales

| Élément | Règle |
|---|---|
| Encodage | UTF-8 ; BOM accepté ; UTF-16 avec BOM accepté. Accents et écritures non latines (arabe testé) acceptés dans les noms. Octets Latin-1 dans un fichier déclaré UTF-8 : refus (`File is incorrect…`) |
| DTD | Entités internes acceptées dans la limite d'expansion de Qt (refus au-delà) ; entités externes (`SYSTEM`) **non résolues** (remplacées par du vide) : pas de fuite de fichier |
| Racine | `<fet version="7.11.1">`. Une autre racine est refusée (`File is incorrect…it cannot be opened`) |
| Attribut `version` | Version qui a écrit le fichier. Plus ancienne : conversion avec avertissement. Plus récente : avertissement, lecture tentée |
| Ordre des sections | Respecter l'ordre écrit par FET (section 4.2). Un ordre différent (salles avant enseignants) a été accepté, mais n'est pas garanti |
| Sections absentes | `Days_List` absente : 5 jours par défaut `D1`..`D5` (observé) ; balise `Mode` ou attribut `version` absents : acceptés (mode `Official`) |
| Références | Par **nom** pour les jours, heures, matières, étiquettes, enseignants, élèves, bâtiments, salles ; par **Id** entier pour les activités. Sensibles à la casse et aux espaces |
| Unicité | Noms uniques dans leur catégorie ; années, groupes et sous-groupes partagent un même espace de noms. Doublons refusés pour enseignants, matières, groupes ; **acceptés sans message pour les jours et les heures**, ce qui rend les sorties ambiguës (elles ne désignent les créneaux que par leur nom) |
| Id d'activité | Doublon, négatif, non numérique : refus. **0 accepté** sans message (à éviter : 0 signifie « aucun » pour `Activity_Group_Id`) |
| Compteurs | Les éléments `Number_of_…` doivent correspondre au nombre d'éléments listés |
| Booléens XML | `true` / `false` en minuscules |
| Nombres réels | Point décimal (`99.5`). Une virgule (`99,5`) est lue comme 0 sans message (observé) |
| Sections vides | Autorisées |
| Balises inconnues | Ignorées avec avertissement : une faute de frappe dans une balise de contrainte supprime silencieusement la contrainte |

### 4.2 Squelette complet

```xml
<?xml version="1.0" encoding="UTF-8"?>
<fet version="7.11.1">
  <Mode>Official</Mode>                         <!-- Official | Mornings_Afternoons | Block_Planning | Terms -->
  <Institution_Name>Lycée exemple</Institution_Name>
  <Comments></Comments>
  <!-- Terms seulement -->
  <Number_of_Terms>2</Number_of_Terms>
  <Number_of_Days_Per_Term>3</Number_of_Days_Per_Term>
  <Days_List>…</Days_List>
  <Real_Days_List>…</Real_Days_List>            <!-- Mornings_Afternoons seulement -->
  <Hours_List>…</Hours_List>
  <Real_Hours_List>…</Real_Hours_List>          <!-- Mornings_Afternoons seulement -->
  <Subjects_List>…</Subjects_List>
  <Activity_Tags_List>…</Activity_Tags_List>
  <Teachers_List>…</Teachers_List>
  <Students_List>…</Students_List>
  <Activities_List>…</Activities_List>
  <Buildings_List>…</Buildings_List>
  <Rooms_List>…</Rooms_List>
  <Time_Constraints_List>…</Time_Constraints_List>
  <Space_Constraints_List>…</Space_Constraints_List>
  <Timetable_Generation_Options_List>…</Timetable_Generation_Options_List>   <!-- optionnel -->
</fet>
```

### 4.3 Grille horaire

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

Les `<Name>` servent de clés dans les contraintes (`<Day>Lundi</Day><Hour>08:00</Hour>`) et dans les sorties. Les heures sont des créneaux de durée égale ; une activité de durée 2 occupe deux créneaux consécutifs du même jour.

### 4.4 Ressources

| Section | Élément | Sous-éléments, dans l'ordre d'écriture de FET |
|---|---|---|
| `Subjects_List` | `Subject` | `Name`, `Long_Name`, `Code`, `Comments` |
| `Activity_Tags_List` | `Activity_Tag` | `Name`, `Long_Name`, `Code`, `Printable`, `Comments` |
| `Teachers_List` | `Teacher` | `Name`, `Long_Name`, `Code`, `Target_Number_of_Hours`, `Qualified_Subjects`, [`Mornings_Afternoons_Behavior`], `Comments` |
| `Buildings_List` | `Building` | `Name`, `Long_Name`, `Code`, `Comments` |
| `Rooms_List` | `Room` | `Name`, `Long_Name`, `Code`, `Building`, `Capacity`, `Virtual`, [`Number_of_Sets_of_Real_Rooms`, `Set_of_Real_Rooms`…], `Comments` |

Salle virtuelle (testée) :

```xml
<Room>
  <Name>V1</Name><Long_Name></Long_Name><Code></Code><Building></Building>
  <Capacity>80</Capacity><Virtual>true</Virtual>
  <Number_of_Sets_of_Real_Rooms>2</Number_of_Sets_of_Real_Rooms>
  <Set_of_Real_Rooms><Number_of_Real_Rooms>2</Number_of_Real_Rooms>
    <Real_Room>R1</Real_Room><Real_Room>R3</Real_Room></Set_of_Real_Rooms>
  <Set_of_Real_Rooms><Number_of_Real_Rooms>1</Number_of_Real_Rooms>
    <Real_Room>R2</Real_Room></Set_of_Real_Rooms>
  <Comments></Comments>
</Room>
```

FET choisit une salle réelle dans chaque ensemble ; la sortie contient `<Room>V1</Room><Real_Room>R3</Real_Room><Real_Room>R2</Real_Room>`.

### 4.5 Élèves

```xml
<Students_List>
  <Year>
    <Name>1A</Name><Long_Name></Long_Name><Code></Code>
    <Number_of_Students>60</Number_of_Students><Comments></Comments>
    <Number_of_Categories>0</Number_of_Categories>
    <First_Category_Is_Permanent>false</First_Category_Is_Permanent>
    <Separator> </Separator>
    <Group>
      <Name>1A G1</Name><Long_Name></Long_Name><Code></Code>
      <Number_of_Students>30</Number_of_Students><Comments></Comments>
      <Subgroup>
        <Name>1A G1 a</Name><Long_Name></Long_Name><Code></Code>
        <Number_of_Students>15</Number_of_Students><Comments></Comments>
      </Subgroup>
    </Group>
  </Year>
</Students_List>
```

Une activité affectée à `1A` concerne tous les sous-groupes de `1A`. Deux activités qui partagent un sous-groupe ne peuvent pas se chevaucher.

### 4.6 Activités

```xml
<Activity>
  <Teacher>Prof A</Teacher>                 <!-- 0..n -->
  <Subject>Maths</Subject>                  <!-- exactement 1 -->
  <Activity_Tag>TP</Activity_Tag>           <!-- 0..n -->
  <Students>1A G1</Students>                <!-- 0..n : année, groupe ou sous-groupe -->
  <Duration>2</Duration>                    <!-- en créneaux, ≤ nombre d'heures par jour -->
  <Total_Duration>4</Total_Duration>        <!-- somme des durées du groupe de sous-activités -->
  <Id>1</Id>                                <!-- entier unique > 0 -->
  <Activity_Group_Id>1</Activity_Group_Id>  <!-- 0 = isolée ; sinon Id de la 1re sous-activité -->
  <Active>true</Active>
  <Comments></Comments>
</Activity>
```

| Règle | Conséquence |
|---|---|
| Au moins une activité active | Sinon code 1 (`Please input at least one active activity before generating`) |
| `Duration` > nombre d'heures par jour | Refus au précalcul : `Activity with id=… has no allowed slot` (observé) |
| Activité sans contrainte de salle | N'occupe aucune salle (`<Room></Room>` en sortie) |
| Id stables | Indispensables pour relier `*_activities.xml` à votre base |

### 4.7 Contraintes

Chaque contrainte est un élément `Constraint…` placé dans `Time_Constraints_List` ou `Space_Constraints_List`, avec toujours `Weight_Percentage`, `Active` et `Comments`. Les autres champs dépendent du type ; leur structure exacte et un exemple valide pour chacun des 352 types figurent dans le catalogue livré.

Deux contraintes sont **obligatoires**, à 100 % : `ConstraintBasicCompulsoryTime` et `ConstraintBasicCompulsorySpace`.

```xml
<ConstraintTeacherNotAvailableTimes>
  <Weight_Percentage>100</Weight_Percentage>
  <Teacher>Prof A</Teacher>
  <Number_of_Not_Available_Times>2</Number_of_Not_Available_Times>
  <Not_Available_Time><Day>Mercredi</Day><Hour>10:00</Hour></Not_Available_Time>
  <Not_Available_Time><Day>Mercredi</Day><Hour>11:00</Hour></Not_Available_Time>
  <Active>true</Active><Comments></Comments>
</ConstraintTeacherNotAvailableTimes>
```

### 4.8 Limites du format (d'après `timetable_defs.h`, vérifiées pour jours et heures)

| Grandeur | Maximum | Au-delà |
|---|---:|---|
| Jours par semaine (`Number_of_Days`) | 1000 | `Number_of_Days is too large. Maximum allowed is 1000.` (code 1) |
| Heures par jour (`Number_of_Hours`) | 1440 | `Number is too large. Maximum allowed is 1440.` (code 1) |
| Jours ou heures = 0 | refusé | `Number_of_Days is incorrect` / `Number_of_Hours is incorrect` |
| Activités | 500 000 | d'après le code |
| Sous-groupes au total | 30 000 | d'après le code |
| Salles | 30 000 | d'après le code |
| Bâtiments | 30 000 | d'après le code |
| Capacité d'une salle | 30 000 | d'après le code |
| Sous-activités d'une activité fractionnée | 1000 | limite de l'interface graphique |

### 4.9 Générer le XML par programme

- Utiliser une bibliothèque XML pour l'échappement (`&`, `<`, guillemets).
- Écrire les champs dans l'ordre de FET ; partir des exemples du catalogue.
- Contrôler avant l'appel : unicité des noms et des Id, références existantes, compteurs, créneaux uniques dans chaque ensemble, poids dans [0, 100] avec point décimal, poids 100 pour les contraintes qui l'exigent, `Mornings_Afternoons_Behavior` en mode matins/après-midis.
- Relire `*_data_and_timetable.fet` après une génération réussie : si une contrainte n'y apparaît pas, elle n'a pas été lue (balise ou champ mal orthographié).

---

## 5. Les quatre modes

| Mode | Grille | Spécificités | Contraintes propres |
|---|---|---|---|
| `Official` | jours × heures | mode standard | 201 contraintes communes, plus 6 non disponibles en matins/après-midis |
| `Mornings_Afternoons` | `Days_List` = demi-journées (matins et après-midis alternés) ; `Real_Days_List` = jours réels ; `Real_Hours_List` = heures réelles (2 × heures) | chaque enseignant doit avoir `<Mornings_Afternoons_Behavior>` | 136 contraintes propres (jours réels, matins, après-midis, demi-journées) |
| `Block_Planning` | jours × heures | planification par blocs et sections | 3 propres : `MaxGapsBetweenActivities`, `MaxTotalActivitiesFromSetInSelectedTimeSlots`, `TwoSetsOfActivitiesSameSections` |
| `Terms` | `Days_List` = tous les jours de toutes les périodes ; `Number_of_Terms` × `Number_of_Days_Per_Term` jours | périodes (trimestres, semestres) | 6 propres : `ActivitiesMaxInATerm`, `ActivitiesMinInATerm`, `ActivitiesOccupyMaxTerms`, `MaxTermsBetweenActivities`, `TeacherMaxHoursPerTerm`, `TeachersMaxHoursPerTerm` |

Les contraintes `StudentsSetMaxSpanPerDay`, `StudentsMaxSpanPerDay` et les quatre `…MinRestingHours` fonctionnent en `Official`, `Block_Planning` et `Terms`, mais pas en `Mornings_Afternoons`, qui a ses propres variantes « jours réels ».

Valeurs de `Mornings_Afternoons_Behavior` (d'après le code) : `Unrestricted`, `Exclusive`, `One day exception`, `Two days exception`, `Three days exception`, `Four days exception`, `Five days exception`. **Sans cette balise, ou avec une valeur hors de cette liste (casse comprise), fet-cl s'arrête par assertion** (observé dans les deux cas : `Assertion '0' failed`, SIGABRT).

Une contrainte utilisée dans un mode qui ne la prend pas en charge est refusée au précalcul, code 1 : `You have constraints which are incompatible with the current mode. Please remove them …`. La colonne « Modes » de l'annexe A donne les modes acceptés pour chaque type.

---

## 6. Contraintes : modèle, poids, classification

### 6.1 Champs communs

| Champ | Rôle |
|---|---|
| `Weight_Percentage` | 100 = contrainte dure (bloquante) ; < 100 = préférence (si le type l'autorise) |
| `Active` | `false` : contrainte lue, conservée dans les sorties, sans aucun effet. Accepté par les 352 types (observé) |
| `Comments` | Libre |

### 6.2 Bloquante ou facultative : classification observée

Chaque type a été injecté dans un établissement de référence puis soumis à fet-cl à 100 %, 50 %, 0 % et 101 %, et avec `Active=false`, dans les 4 modes.

| Classification | Temps | Espace | Total | À faire dans votre interface |
|---|---:|---:|---:|---|
| Toujours bloquante : poids < 100 % refusé proprement (code 1, `Please make weight 100%` ou équivalent) | 194 | 60 | 254 | Ne proposer que 100 % |
| Toujours bloquante : poids < 100 % provoque un **abandon** (assertion `weightPercentage==100`) | 10 | 6 | 16 | Imposer 100 % **avant** l'appel |
| Facultative possible : 0 à 100 % accepté | 67 | 15 | 82 | Proposer un poids réglable |
| **Total** | **271** | **81** | **352** | |

Répartition des 82 facultatives : activités 41, élèves 16, enseignants 15, matières 4, étiquettes 3, base 2, salles 1. En pratique, les contraintes de **placement** (créneaux et salles préférés, écarts entre activités, ordre, simultanéité) acceptent les préférences ; la plupart des contraintes de **charge et de forme** (maximum d'heures, trous, jours de travail, intervalles) exigent 100 %.

Les 16 types qui abandonnent sous 100 % :
- `Teacher(s)`, `StudentsSet`, `Students`, `Room(s)` × `MaxActivityTagsPerDayFromSet`, `MaxActivityTagsPerRealDayFromSet`, `MaxActivityTagsPerWeekFromSet` (variantes existantes) ;
- `TeacherMaxZeroGapsPerAfternoon`, `TeachersMaxZeroGapsPerAfternoon`.

Pour ces types, l'abandon survient même à 0 % et à 101 %.

### 6.3 Ce que signifie un poids < 100 %

| Expérience | Résultat observé |
|---|---|
| Activité imposée Lundi H1 à 100 % alors que son enseignant est indisponible Lundi H1 | Aucun emploi du temps (refus au précalcul) |
| Même préférence à 95 % | Solution produite ; préférence violée ; `Total soft conflicts: 0.95` ; contrainte citée dans `soft_conflicts.txt` |
| Deux préférences violées, 95 % et 80 % | `Total soft conflicts: 1.75` : le total est la somme des poids violés, divisés par 100 |
| Même conflit à 0 % ou avec `Active=false` | Solution, aucune pénalité |
| Préférence satisfiable, 6 graines | Respectée 0/6 à 50 %, 0/6 à 90 %, 6/6 à 100 % |
| Même préférence, 10 graines par poids | 0/10 à 0, 25, 50 et 75 % ; 1/10 à 90 % ; 4/10 à 95 % ; 8/10 à 99 % ; 10/10 à 100 % |
| Trois préférences violées (95, 80, 60 %) | `Total soft conflicts: 2.35`, égal à la somme des lignes de détail |

Conclusion pratique : un poids < 100 % n'oriente pas la recherche de façon fiable. Utilisez 100 % pour tout ce qui doit être garanti, et des poids < 100 % seulement pour des préférences dont la violation est acceptable. Pour améliorer la qualité, lancez plusieurs graines et gardez la solution au plus petit `Total soft conflicts`.

### 6.4 Validation des poids (observé)

| Valeur | Résultat |
|---|---|
| `99.5` | accepté, relu 99.5 |
| `100.0` | accepté, relu 100 |
| `99,5` | accepté, **relu 0** |
| `abc`, vide | accepté, **relu 0** |
| `101` | accepté sans message par 73 types ; **abandon** pour 25 types (les 16 ci-dessus et 9 contraintes entre activités : `ActivityTagsNotOverlapping`, `Min/MaxDaysBetweenActivities`, `Min/MaxHalfDaysBetweenActivities`, `ActivitiesMaxHourlySpan`, `Min/MaxGapsBetweenActivities`, `MaxTermsBetweenActivities`) ; refus pour les 254 types à 100 % obligatoire |
| `-5` | accepté sans message, relu -5 |

Votre code doit donc valider lui-même les poids : nombre réel, point décimal, borné à [0, 100].

### 6.5 Prérequis découverts

| Contrainte | Prérequis |
|---|---|
| `…MinHoursPerMorning`, `…MinHoursPerAfternoon` (enseignant(s), élèves) | Une contrainte « min heures par jour » correspondante doit exister |
| `…MinHoursDaily` avec jours vides autorisés | Minimum ≥ 2 |
| `…ActivityTagMinHoursDaily` | Les activités concernées doivent totaliser au moins le minimum demandé |
| `…EarlyMaxBeginningsAtSecondHour` (variantes matin/après-midi) | Valeur ≤ nombre de matins ou d'après-midis de la semaine |
| `ActivitiesPairOfMutuallyExclusiveTimeSlots` | Deux créneaux différents |
| `…OccupyMaxSetsOfTimeSlotsFromSelection` | Au moins deux ensembles, différents, sans créneau en double (un doublon provoque un abandon) |
| `ActivitiesOverlapCompletelyOrDoNotOverlap` | Au moins 2 activités, de durée > 1 |
| `TwoSetsOfActivitiesSameSections` | Mode `Block_Planning` ; mêmes élèves et même durée dans les deux ensembles |
| `Building(s)MinOneActivityInEachAvailableTimeSlot` | Une contrainte de salles préférées à 100 % pour chaque activité ; durée totale des activités possibles ≥ créneaux disponibles du bâtiment |
| `…MaxHoursPerTerm` | Mode `Terms` ; valeur ≤ jours par période × heures par jour |
| Toute contrainte | Références existantes : un enseignant inexistant provoque un **abandon** (`Assertion 'this->teacherIndex>=0' failed`) ; une activité inexistante est refusée proprement |

### 6.6 Respect effectif vérifié

23 contraintes courantes, posées à 100 %, ont été vérifiées sur le résultat (`*_activities.xml`) par un contrôle indépendant de FET, seules, puis par paires (les 253 paires) et par triplets (200 tirés au hasard). Aucune violation dans les 409 succès obtenus ; les autres combinaisons ont été refusées (16) ou jugées infaisables (28), jamais d'abandon. Seul cas particulier : avec une pause, `TwoActivitiesConsecutive` accepte deux activités séparées **uniquement par des créneaux de pause** (comportement voulu, `timeconstraint.cpp`). Les 23 contraintes :

`ActivityPreferredStartingTime`, `ActivityPreferredStartingTimes`, `ActivityPreferredTimeSlots`, `TeacherNotAvailableTimes`, `StudentsSetNotAvailableTimes`, `BreakTimes`, `ActivitiesSameStartingTime`, `ActivitiesNotOverlapping`, `MinDaysBetweenActivities`, `MaxDaysBetweenActivities`, `TwoActivitiesConsecutive`, `TwoActivitiesOrdered`, `TeacherMaxHoursDaily`, `TeacherMaxDaysPerWeek`, `TeacherMaxGapsPerDay`, `StudentsSetMaxHoursDaily`, `TeacherMinHoursDaily`, `TeachersMaxHoursContinuously`, `TeacherActivityTagMaxHoursDaily`, `ActivityEndsStudentsDay`, `ActivityPreferredRoom`, `SubjectPreferredRoom`, `RoomNotAvailableTimes`.

---

## 7. Ligne de commande

### 7.1 Syntaxe et règles d'analyse

```
fet-cl --inputfile=FICHIER [--option=valeur …]
fet-cl --help
fet-cl --version
```

| Règle (d'après le code, vérifiée) | Conséquence |
|---|---|
| Forme `--option=valeur` uniquement | `--outputdir /tmp/x` et `--exportcsv` sans valeur sont « non reconnus » |
| Préfixe exact, sensible à la casse | `--HTMLLEVEL=3` est non reconnu |
| Option inconnue | **Non bloquante** : `Unrecognized option: …` sur stdout et dans `logs/result.txt` ; la génération continue avec la valeur par défaut |
| Option répétée | La dernière occurrence l'emporte |
| Booléens | Seule la fin de la valeur compte (section 7.4) |
| Entiers | `QString::toInt()` : texte non numérique ou dépassement de capacité → 0 |
| `--help` / `--version` | Pris en compte seulement sans `--inputfile` ; sinon ignorés |
| Chemins | Séparateurs natifs acceptés ; `--outputdir` sans barre finale ; créé avec ses parents s'il n'existe pas. `--outputdir /tmp/x` (espace au lieu de `=`) est non reconnu : les sorties partent dans le dossier courant |

### 7.2 Options principales

| Option | Valeurs | Défaut | Comportement |
|---|---|---|---|
| `--inputfile=` | chemin | obligatoire | Absent : usage, code 1. Inexistant : code 1 |
| `--outputdir=` | chemin | dossier courant | Doit être inscriptible, sinon code 1 |
| `--timelimitseconds=` | entier > 0 | 2 000 000 000 | `0`, `abc`, `99999999999` → code 1 (`Time limit is 0 seconds`). **`-5` → arrêt immédiat, « Time exceeded », code 0** |
| `--htmllevel=` | 0 à 7 | 2 | `-1`, `8` → code 1. `abc` → niveau 0 sans message. Alias non documenté : `--timetablehtmllevel=` |
| `--language=` | ar, bg, bs, ca, cs, da, de, el, en_GB, en_US, es, eu, fa, fr, gl, he, hu, id, it, ja, lt, mk, ms, nl, pl, pt_BR, ro, ru, si, sk, sq, sr, tr, uk, uz, vi, zh_CN, zh_TW | en_US | Code inconnu (`xx`, `FR`, vide) : génération normale, repli en_US |
| `--verbose=` | true / false | false | `true` : 65 lignes sur stdout au lieu de 3 sur l'instance de test |
| `--randomseeds10=` … `--randomseeds22=` | 6 entiers | aléatoires | Les 6 sont requis ; bornes et défaut de contrôle de s20..s22 en section 11.2 |
| `--quotescsv=` | doublequotes, singlequotes, none | doublequotes | Valeur hors liste ignorée sans message |
| `--fieldseparatorcsv=` | comma, semicolon, verticalbar | comma | Valeur hors liste ignorée sans message |
| `--randomseedx=`, `--randomseedy=` | — | — | Obsolètes, refusées (code 1) ; non documentées |

### 7.3 Familles d'options booléennes

| Famille | Nombre | Rôle |
|---|---:|---|
| `--writetimetable…` | 17 | Choix des fichiers écrits : conflits, statistiques, XML, 4 dispositions, et catégories (sous-groupes, groupes, années, enseignants, périodes libres, bâtiments, salles, matières, étiquettes, activités) |
| `--print…`, `--sort…`, `--divide…`, `--duplicate…`, `--htmlusespan`, `--embedcssinhtmlhead`, `--showvirtualrooms` | ~40 | Présentation HTML générale |
| `--separate…namelongname…bybreak` | 8 | Retour à la ligne entre nom, nom long et code |
| `--<catégorie>{dayshv,timehv}print…` | ~450 | Affichage fin par catégorie et disposition (noms, noms longs, codes, légendes) |
| `--teachersfreeperiodsprint…`, `--statisticsprint…` | 13 | Pages de périodes libres et de statistiques |
| `--exportcsv`, `--overwritecsv`, `--firstlineisheadingcsv` | 3 | Export CSV |
| `--warn…` | 4 | Avertissements non bloquants |

La liste complète, avec la valeur par défaut de chaque option et son effet mesuré, est en annexe B. Sur l'instance de test, les 521 valeurs par défaut annoncées sont confirmées et 155 options ont un effet visible ; les autres agissent sur des niveaux HTML, des données ou des catégories absents de l'instance.

Piège : `*_subgroups.xml`, `*_teachers.xml` et `*_activities.xml` ne sont écrits que si `--writetimetablesxml=true` **et** la catégorie correspondante (`subgroups`, `teachers`, `activities`) vaut `true`.

### 7.4 Lecture des booléens (observé)

| Valeur passée | Option dont le défaut est `true` (`--writetimetablesxml`) | Option dont le défaut est `false` (`--exportcsv`) |
|---|---|---|
| `true` | activée | activée |
| `false` | désactivée | désactivée |
| `TRUE`, `FALSE`, `1`, `0`, `yes`, `no`, `maybe`, vide | activée (inchangée) | désactivée (inchangée) |
| `xtrue` | activée | **activée** |
| `notfalse` | **désactivée** | désactivée |

Règle : écrire exactement `true` ou `false`, en minuscules.

### 7.5 Commandes de référence

```bash
# Génération standard : 10 minutes, HTML niveau 2, sorties en français
fet-cl --inputfile=/data/lycee.fet --outputdir=/var/fet/out/run-001 \
       --timelimitseconds=600 --htmllevel=2 --language=fr

# Intégration applicative : XML seulement, graines fixées
fet-cl --inputfile=lycee.fet --outputdir=out/run-002 --timelimitseconds=300 \
       --writetimetablesstatistics=false --writetimetablesdayshorizontal=false \
       --writetimetablesdaysvertical=false --writetimetablestimehorizontal=false \
       --writetimetablestimevertical=false --writetimetablesgroups=false \
       --writetimetablesyears=false --writetimetablesteachersfreeperiods=false \
       --writetimetablesbuildings=false --writetimetablesrooms=false \
       --writetimetablessubjects=false --writetimetablesactivitytags=false \
       --randomseeds10=1 --randomseeds11=2 --randomseeds12=3 \
       --randomseeds20=4 --randomseeds21=5 --randomseeds22=6
```

---

## 8. Codes de retour et statut réel

### 8.1 Table complète

| Code | Situation | Message |
|---|---|---|
| 0 | `--help`, `--version` (sans `--inputfile`) | aide / `FET version 7.11.1` |
| 0 | Génération réussie | `Generation successful` |
| 0 | Recherche échouée (activité impossible à placer) | `Impossible` |
| 0 | Limite de temps atteinte (ou limite négative) | `Time exceeded` |
| 0 | Arrêt par `SIGTERM` | `Generation interrupted` |
| 1 | Aucun argument / pas de `--inputfile` / fichier inexistant | `Incorrect command-line parameters (…)`, `Error: the specified input file … is not existing` |
| 1 | `--timelimitseconds` nul, non numérique ou trop grand ; `--htmllevel` hors 0..7 ; graines incomplètes, s10..s12 hors bornes, une composante > 4 294 967 086, trois composantes nulles ; `--randomseedx/y` | `Incorrect command-line parameters (…)` |
| 1 | Dossier de sortie ou fichiers de log non inscriptibles ; `sigwrite` résiduel impossible à supprimer | `FET critical - you don't have write permissions …`, `Cannot remove the file named …sigwrite…` |
| 1 | XML illisible ou incohérent | `fet-cl: cannot read input file … - aborting` ; détail dans `logs/errors.txt` |
| 1 | Aucune activité active | `Please input at least one active activity before generating` |
| 1 | Structure interne impossible | `Cannot compute internal structure - aborting` |
| 1 | Données refusées au précalcul : poids, mode, prérequis, activité sans créneau | `Cannot precompute - data is wrong - aborting` ; détail dans `logs/errors.txt` |
| -6 (Python) / 134 (shell) | **Abandon par assertion**, ou mémoire épuisée (`std::bad_alloc`) | `fet-cl: … Assertion '…' failed.` sur stdout/stderr ; fichiers de sortie partiels ou absents |
| -2 / 130 | `SIGINT` | aucun emploi du temps : seul `timetables/<nom>/<nom>_random_seed_before.txt` existe |
| -9 / 137 | `SIGKILL` | idem |
| -11 / 139 | Erreur de segmentation (jamais observée, y compris sur 1 000 fichiers mutés) | — |
| -1, -3, -10, -12, -13, -14 / 129… | `SIGHUP`, `SIGQUIT`, `SIGUSR1`, `SIGUSR2`, `SIGPIPE`, `SIGALRM` : action par défaut | aucun emploi du temps |
| -24 / 152 | `SIGXCPU` (`RLIMIT_CPU` dépassé) | aucun emploi du temps |
| -25 / 153 | `SIGXFSZ` (`RLIMIT_FSIZE` ou quota) | **`result.txt` peut indiquer `Generation successful`** alors que les sorties sont incomplètes |
| 127 (shell) | Bibliothèque partagée introuvable | `error while loading shared libraries` |

### 8.2 Abandons par assertion observés

| Déclencheur | Assertion |
|---|---|
| Poids < 100 % sur les 16 types de la section 6.2 | `weightPercentage==100`, `tg->weightPercentage==100` |
| Poids 101 sur 9 contraintes entre activités | `…weightPercentage>=0 && …weightPercentage<=100` |
| Mode matins/après-midis sans `Mornings_Afternoons_Behavior` | `0` (dans `computeNHoursPerTeacher`) |
| Créneau en double dans un ensemble de créneaux | `ts.count()==tl.count()` |
| Enseignant inexistant cité dans une contrainte | `this->teacherIndex>=0` |
| Valeur inconnue de `Mornings_Afternoons_Behavior` | `0` |
| Graine s20, s21 ou s22 entre 4 294 944 443 et 4 294 967 086 | `_s20 < m2` (et équivalents) |
| Salle rattachée à un bâtiment dont le nom a disparu (fuzzing) | `buildingIndex>=0 && buildingIndex<r.nInternalBuildings` |
| Poids 2 147 483 648 sur une contrainte exigeant 100 % (fuzzing) | `this->weightPercentage==100.0` |
| Mémoire insuffisante (`RLIMIT_AS` 512 Mio, grille 200 × 50, 4 000 activités) | `std::bad_alloc` puis `SIGABRT` |

### 8.3 Interprétation recommandée

```
rc == 1                                → erreur d'appel ou de données ; lire logs/errors.txt
rc < 0 (Python), rc > 128 (shell)      → abandon ou arrêt forcé, PRIORITAIRE sur result.txt ;
                                         garder stdout (contient l'assertion)
rc == 127 (shell)                      → bibliothèque Qt introuvable
rc == 0 → lire logs/result.txt :
   "Generation successful"             → succès si timetables/<nom>/<nom>_activities.xml existe
   "Impossible"                        → échec : logs/difficult_activities.txt, timetables/<nom>-highest/
   "Time exceeded"                     → échec partiel : timetables/<nom>-highest/
   "Generation interrupted"            → arrêt demandé : -current/ et -highest/
```

Ces quatre libellés sont écrits en anglais quelle que soit `--language`.

---

## 9. Sorties produites

### 9.1 Arborescence

```
<outputdir>/
├── sigwrite                        fichier de commande (créé par vous)
├── logs/                           écrasé à chaque exécution dans ce dossier
│   ├── result.txt                  statut final
│   ├── max_placed_activities.txt   progression horodatée
│   ├── initial_order.txt           ordre initial des activités
│   ├── file_open.log               trace de lecture du .fet
│   ├── warnings.txt                avertissements (si présents)
│   ├── errors.txt                  erreurs (si présentes)
│   └── difficult_activities.txt    activités bloquantes (si échec)
├── timetables/
│   ├── <nom>/                      résultat (suffixé -2, -3… si le dossier existe déjà)
│   ├── <nom>-highest[-N]/          meilleure solution partielle
│   └── <nom>-current[-N]/          solution courante à l'arrêt
└── csv/<nom>/                      si --exportcsv=true
```

`<nom>` = nom du fichier d'entrée sans `.fet`. Tous les fichiers de `timetables/<nom>/` sont préfixés par `<nom>_`. Sur l'instance de test, une exécution complète écrit 44 fichiers dans `timetables/<nom>/` avec les options par défaut, 58 fichiers produits au total avec `--exportcsv=true`.

En cas de « Time exceeded », « Impossible » ou d'arrêt, `timetables/<nom>/` ne contient que `<nom>_random_seed_before.txt` : la meilleure solution partielle est dans `-highest`, et `<nom>_data_and_timetable.fet` n'est pas écrit (observé).

### 9.2 Fichiers utiles à une application

| Fichier | Contenu |
|---|---|
| `<nom>_activities.xml` | Placement de chaque activité : `Id`, `Day`, `Hour`, `Room`, `Real_Room` |
| `<nom>_teachers.xml`, `<nom>_subgroups.xml` | Grilles par enseignant et par sous-groupe |
| `<nom>_data_and_timetable.fet` | Entrée réécrite avec des contraintes de verrouillage pour chaque placement (seulement si toutes les activités sont placées) |
| `<nom>_soft_conflicts.txt` | `Total soft conflicts` et liste des préférences violées |
| `<nom>_random_seed_before.txt` / `_after.txt` | Graines utilisées |
| HTML (`*_index.html` et pages par catégorie) | Pour l'affichage humain |

```xml
<Activities_Timetable>
  <Activity><Id>1</Id><Day>Mercredi</Day><Hour>H3</Hour><Room>R2</Room></Activity>
  <Activity><Id>12</Id><Day>Lundi</Day><Hour>H1</Hour><Room>V1</Room>
            <Real_Room>R3</Real_Room><Real_Room>R2</Real_Room></Activity>
</Activities_Timetable>
```

Seules les lignes contenant une date (`Generated with FET 7.11.1 on 10/6/26 1:03 PM` et équivalents) varient entre deux exécutions identiques ; neutralisez-les pour comparer des résultats.

---

## 10. Contrôle d'une génération en cours

| Moyen | Effet |
|---|---|
| `SIGTERM` | Arrêt propre en 0,05 s (mesuré après 0,5 à 4 s de recherche) : `-current` et `-highest` écrits, `Generation interrupted`, code 0 |
| Fichier `sigwrite` à la racine de `--outputdir` | Vérifié chaque seconde, supprimé, puis `-current-N` et `-highest-N` écrits sans arrêter la recherche |
| `SIGINT` | Arrêt immédiat (code -2), aucun emploi du temps, ni `-current` ni `-highest` |
| `SIGHUP`, `SIGQUIT`, `SIGUSR1`, `SIGUSR2`, `SIGPIPE`, `SIGALRM` | Non interceptés : arrêt immédiat, rien n'est écrit. Lancer fet-cl dans sa propre session (`setsid`, `start_new_session=True`) pour qu'une fermeture de terminal ne le tue pas |
| `SIGSTOP` / `SIGCONT` | Suspension et reprise possibles. La limite `--timelimitseconds` est en temps réel : le temps suspendu est décompté (limite 6 s, 5 s de suspension → fin 0,1 s après la reprise) |
| `sigwrite` répété | Trois instantanés successifs → `-current`, `-current-2`, `-current-3`… sans arrêter la recherche |
| Lecture de `logs/max_placed_activities.txt` | Progression : `At time 0 h 1 m 12 s, FET reached 245 activities placed` (libellé traduit : n'exploiter que les nombres) |

Un `sigwrite` laissé d'une exécution précédente et impossible à supprimer fait échouer le lancement (code 1).

---

## 11. Performances, reproductibilité, montée en charge

### 11.1 Mesures

| Instance | Activités | Résultat |
|---|---:|---|
| Établissement de test (3 enseignants, 10 activités) | 10 | ~0,05 s par exécution |
| Synthétique 5 / 10 / 20 / 40 / 80 classes, sans contrainte de trous | 119 / 232 / 471 / 941 / 1872 | 0,1 s à 0,3 s |
| Fichier de démonstration réel `MHS_July2.fet`, 3 graines en parallèle | 1517 | succès pour les 3 graines, conflits souples 12,35 / 16,15 / 13,3 |
| Instance synthétique de 223 activités avec 0 trou par enseignant | 223 | non résolue en 4 s pour 9 graines aléatoires sur 10 (résolue une fois) ; non résolue après 40 s avec une graine fixe |
| Synthétique 160 / 320 / 640 / 1280 classes | 3 730 / 7 416 / 14 952 / 29 719 | 0,8 / 2,7 / 11,0 / 43,9 s ; 47 / 67 / 116 / 214 Mio |
| Grille 1000 jours × 2 heures | 1 500 | 0,5 s, 105 Mio |
| Grille 1 jour × 1440 heures | 1 000 | 0,2 s, 62 Mio |
| Grille 200 jours × 50 heures | 4 000 | 3,9 s, **965 Mio** |
| Instance difficile, 20 graines, 5 s chacune | 223 | 4 succès sur 20 ; 219 à 223 activités placées (médiane 222) |
| Instance moyenne, 20 graines | 223 | 20 succès sur 20, 0,05 s chacune |
| Recherche de 30 s (instance difficile) | 223 | mémoire stable : 16,9 → 17,5 Mio |
| Campagne complète du validateur (plus de 5 000 exécutions de fet-cl) | — | 9 min sur 2 cœurs |

Précision de `--timelimitseconds` (mesurée) : arrêt à ± 0,03 s pour 2, 5 et 10 s ; pour 1 s, l'arrêt peut survenir dès 0,1 s (granularité d'une seconde). La limite compte le temps réel, pas le temps CPU.

Montée en charge : la durée croît environ comme le carré du nombre d'activités (exposant mesuré entre 1,93 et 2,06 selon les campagnes, entre 3 730 et 29 719 activités) ; la mémoire croît d'environ 6,6 Kio par activité, mais aussi avec la taille de la grille (près de 1 Gio pour 200 × 50 créneaux et 4 000 activités).

Parallélisme (2 cœurs) : 1, 2, 4 et 8 processus simultanés donnent 1,4 / 2,9 / 2,9 / 2,9 générations par seconde ; le débit plafonne au nombre de cœurs, et les résultats restent identiques à graines égales.

Le temps de résolution dépend surtout de la **difficulté** des contraintes (trous, charges maximales, indisponibilités), beaucoup moins du volume. Il varie fortement selon la graine : sur un même fichier difficile, 340 contre 380 activités placées après 6 s selon la graine.

### 11.2 Graines et reproductibilité

- Générateur MRG32k3a ; les 6 composantes `--randomseeds10..12` et `--randomseeds20..22` sont requises ensemble, sinon code 1.
- Bornes valides : `s10..s12` dans [0 ; 4 294 967 086], `s20..s22` dans [0 ; 4 294 944 442], et pas trois composantes nulles dans un même bloc.
- **Défaut de contrôle** (vérifié dans `fetcl.cpp` et par test) : fet-cl compare `s20..s22` à la borne du premier bloc (`m1 - 1` = 4 294 967 086) au lieu de `m2 - 1`. Une valeur entre 4 294 944 443 et 4 294 967 086 passe l'analyse puis provoque un abandon (`Assertion '_s20 < m2' failed`, code -6 / 134). Bornez vous-même ces trois valeurs.
- Même fichier + même version + mêmes graines = même emploi du temps (vérifié).
- Les graines sont toujours tracées dans `<nom>_random_seed_before.txt`.

### 11.3 Stratégie recommandée

1. Fixer `--timelimitseconds` et un délai de garde externe un peu plus long.
2. Lancer N graines en parallèle (N ≤ nombre de cœurs), chacune dans son `--outputdir`.
3. Garder la première solution réussie, ou la meilleure selon `Total soft conflicts`.
4. Conserver les 6 graines retenues pour pouvoir régénérer la solution.

---

## 12. Limites et pièges : liste exhaustive

| # | Limite ou piège | Effet | Parade |
|---:|---|---|---|
| 1 | Code 0 pour Impossible / Time exceeded / interrompu | Faux succès | Lire `logs/result.txt` |
| 2 | Abandons par assertion (section 8.2) | Code -6 / 134, sorties partielles | Valider les données avant l'appel ; traiter ces codes comme un plantage |
| 3 | Poids < 100 % refusé par 270 types | Code 1 | N'autoriser que 100 % pour ces types (annexe A) |
| 4 | Poids hors bornes ou mal écrits acceptés en silence (101, -5, `99,5`, `abc`) | Contrainte faussée ou abandon | Valider : réel, point décimal, [0, 100] |
| 5 | Préférences non optimisées | Préférences souvent violées | 100 % pour l'essentiel ; plusieurs graines |
| 6 | Option inconnue non bloquante | Limite de temps infinie si faute de frappe | Délai de garde externe ; vérifier l'absence de `Unrecognized option` |
| 7 | Booléens lus par leur fin | `TRUE`, `1` sans effet ; `xtrue` actif | Écrire `true` / `false` |
| 8 | Entiers non numériques → 0 | `--htmllevel=abc` = 0 en silence | Générer les valeurs par programme |
| 9 | `--timelimitseconds` négatif | Arrêt immédiat « Time exceeded » | Valider > 0 |
| 10 | Valeurs CSV et langue invalides ignorées | Format inattendu | Utiliser les listes fermées |
| 11 | Balise XML inconnue ignorée | Contrainte silencieusement absente | Relire `*_data_and_timetable.fet` ou `warnings.txt` |
| 12 | Virgule décimale lue comme 0 | Poids nul | Point décimal |
| 13 | Contrainte hors de son mode | Code 1 | Filtrer par mode (annexe A) |
| 14 | `Mornings_Afternoons_Behavior` absent ou inconnu | Abandon | Toujours l'écrire en mode MA, avec une des 7 valeurs exactes |
| 15 | Références inexistantes | Abandon (enseignant) ou code 1 (activité) | Vérifier toutes les références |
| 16 | Créneau en double dans un ensemble | Abandon | Dédupliquer |
| 17 | Prérequis entre contraintes (section 6.5) | Code 1 | Ajouter les contraintes compagnes |
| 18 | Durée d'activité > heures par jour | Code 1 | Valider |
| 19 | `logs/` partagé dans un même `--outputdir` | Exécutions parallèles qui s'écrasent | Un `--outputdir` neuf par exécution |
| 20 | Dossier `timetables/<nom>` existant | Suffixe `-2`, `-3`… ; en exécutions simultanées, la détection n'est pas atomique (deux processus peuvent écrire dans le même `<nom>`) | Partir d'un `--outputdir` vide, propre à chaque exécution |
| 21 | `SIGINT` et les autres signaux n'écrivent aucun emploi du temps | Perte du partiel | Arrêter par `SIGTERM` ; isoler fet-cl dans sa propre session |
| 22 | Mono-thread | Un cœur par exécution | Paralléliser par processus |
| 23 | Textes traduits selon `--language` | Analyse fragile | Analyser `result.txt` (anglais) et les XML ; garder `en_US` pour les textes |
| 24 | Traduction absente | Repli en_US | Livrer `translations/` |
| 25 | Dates dans les sorties | Comparaisons faussées | Neutraliser les dates |
| 26 | « Impossible » n'est pas une preuve d'infaisabilité | Mauvais diagnostic | Plus de temps, d'autres graines, `difficult_activities.txt` |
| 27 | Limites du format (section 4.8) | Code 1 | Valider en amont |
| 28 | Options non documentées (`--timetablehtmllevel`, `--randomseedx/y`) | Confusion | Ne pas les utiliser |
| 29 | Graines s20..s22 mal bornées par fet-cl | Abandon pour une valeur entre 4 294 944 443 et 4 294 967 086 | Borner à 4 294 944 442 |
| 30 | Instance difficile parfois résolue selon la graine | Durées et résultats très variables | Graines fixes pour les tests ; plusieurs graines en production |
| 31 | Noms de jours ou d'heures vides ou en double acceptés | Sorties ambiguës (`Day=""` confondu avec « non placé », deux `H1` indiscernables) | Vérifier unicité et non-vacuité |
| 32 | Id d'activité 0 accepté | Confusion avec « aucun groupe » | Id ≥ 1 |
| 33 | Bâtiment inexistant derrière une salle, poids hors [0, 100] sur une contrainte à 100 % | Abandon | Valider les références et les poids |
| 34 | `Generation successful` écrit avant les sorties | Faux succès si fet-cl est tué ensuite (disque plein, quota) | Code de sortie **et** présence de `<nom>_activities.xml` |
| 35 | Mémoire proportionnelle à jours × heures × activités | `std::bad_alloc` puis abandon sous `RLIMIT_AS` ou cgroup | Prévoir ~1 Gio pour 10 000 créneaux et 4 000 activités ; mesurer sur vos instances |
| 36 | Durée ≈ quadratique en nombre d'activités | 44 à 50 s pour 30 000 activités faciles | Découper par niveau ou établissement si possible |
| 37 | Limite de temps en temps réel | Une suspension (`SIGSTOP`, machine surchargée) consomme la limite | Dimensionner la limite avec marge |
| 38 | `--timelimitseconds=1` | Arrêt possible dès 0,1 s | Limite ≥ 2 s |
| 39 | Composant de chemin > 255 octets | Code 1 | Noms de dossiers courts |
| 40 | `TwoActivitiesConsecutive` traverse les pauses | Deux activités séparées par une pause sont « consécutives » | Ajouter une contrainte explicite si la pause doit les séparer |

---

## 13. Intégration : architecture recommandée

```
 Application ──► Générateur .fet ──► Pré-validation ──► Superviseur ──► fet-cl (N processus)
     ▲              (XML lib)        (règles §12)       (délai, graines,     │
     │                                                   signaux, sigwrite)  ▼
     └──────────── Import des placements ◄── Lecture result.txt + *_activities.xml
```

### 13.1 Pré-validation minimale

1. Racine `<fet version="7.11.1">`, mode valide, compteurs exacts.
2. Noms uniques ; Id d'activités uniques et > 0 ; au moins une activité active.
3. Toutes les références existent (enseignants, élèves, matières, étiquettes, salles, activités, jours, heures).
4. `Duration` ≤ nombre d'heures par jour ; grille dans les limites.
5. Poids : nombre, point décimal, [0, 100] ; 100 pour les types « 100 % seulement » de l'annexe A.
6. Contraintes compatibles avec le mode ; contraintes compagnes présentes (section 6.5).
7. Créneaux uniques dans chaque ensemble de créneaux.
8. Mode matins/après-midis : `Mornings_Afternoons_Behavior` sur chaque enseignant.
9. `ConstraintBasicCompulsoryTime` et `ConstraintBasicCompulsorySpace` à 100 %.
10. Graines éventuelles : `s10..s12` ≤ 4 294 967 086, `s20..s22` ≤ 4 294 944 442, pas trois zéros dans un bloc.

### 13.2 Exemple d'appel supervisé (Python)

```python
import subprocess, signal, re, xml.etree.ElementTree as ET
from pathlib import Path

def run_fet(fet_cl: str, fet_file: Path, out: Path, limit: int, seeds=None) -> dict:
    out.mkdir(parents=True, exist_ok=False)            # un dossier neuf par exécution
    args = [fet_cl, f"--inputfile={fet_file}", f"--outputdir={out}", f"--timelimitseconds={limit}"]
    if seeds:                                          # 6 entiers
        names = ["10", "11", "12", "20", "21", "22"]
        args += [f"--randomseeds{n}={s}" for n, s in zip(names, seeds)]
    p = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
                         start_new_session=True)       # isolé des signaux du terminal
    try:
        stdout, _ = p.communicate(timeout=limit + 60)  # délai de garde externe
    except subprocess.TimeoutExpired:
        p.send_signal(signal.SIGTERM)                  # arrêt propre : -current / -highest
        stdout, _ = p.communicate(timeout=30)
    rc = p.returncode
    if rc < 0 or rc not in (0, 1):                     # un signal prime sur result.txt
        m = re.search(r"Assertion .*? failed", stdout or "")
        return {"status": "CRASH", "rc": rc, "detail": m.group(0) if m else stdout[-500:]}
    result = (out / "logs" / "result.txt").read_text(encoding="utf-8", errors="replace") \
        if (out / "logs" / "result.txt").exists() else ""
    if rc == 1:
        err = out / "logs" / "errors.txt"
        return {"status": "DATA_OR_CLI_ERROR", "rc": 1,
                "detail": err.read_text(encoding="utf-8", errors="replace") if err.exists() else stdout}
    for s in ("Generation successful", "Impossible", "Time exceeded", "Generation interrupted"):
        if s in result:
            status = s
            break
    else:
        status = "UNKNOWN"
    res = {"status": status, "rc": 0, "unrecognized": re.findall(r"Unrecognized option: (\S+)", stdout)}
    if status == "Generation successful":
        stem = fet_file.stem
        tt = out / "timetables" / stem
        if not (tt / f"{stem}_activities.xml").is_file():   # tué après l'écriture de result.txt
            return {"status": "INCOMPLETE", "rc": 0, "detail": "sorties absentes"}
        root = ET.parse(tt / f"{stem}_activities.xml").getroot()
        res["placements"] = {int(a.findtext("Id")): (a.findtext("Day"), a.findtext("Hour"),
                             a.findtext("Room") or None) for a in root}
        sc = (tt / f"{stem}_soft_conflicts.txt")
        m = re.search(r"Total soft conflicts:\s*([\d.]+)", sc.read_text(encoding="utf-8")) if sc.exists() else None
        res["soft_conflicts"] = float(m.group(1)) if m else None
    return res
```

Le script `fet_batch.py` livré avec la documentation d'interfaçage implémente la version complète : parallélisme, stagnation, instantanés, multi-graines, rapports JSON/CSV, détection des sorties incomplètes.

### 13.3 Exécution sous Linux : isolation et ressources

- Lancer chaque fet-cl dans sa propre session (`start_new_session=True`, `setsid`) : `SIGHUP` ou `SIGINT` du terminal ne doivent pas tuer la génération sans résultat.
- Arrêter par `SIGTERM`, attendre quelques secondes, puis `SIGKILL` en dernier recours.
- Limiter les ressources par `RLIMIT_AS` / `RLIMIT_CPU` (ou un cgroup systemd) : les dépassements donnent des codes identifiables (`-6` avec `std::bad_alloc`, `-24` SIGXCPU, `-25` SIGXFSZ).
- Un `--outputdir` neuf par exécution : deux exécutions simultanées dans le même dossier partagent `logs/` (une trace est écrasée) et, selon le moment, obtiennent `<nom>` et `<nom>-2` ou écrivent **toutes deux dans `<nom>`** (les deux cas observés : la détection du dossier existant n'est pas atomique).
- Ne paralléliser qu'au nombre de cœurs : au-delà, le débit n'augmente plus.
- Mesurer temps CPU et mémoire maximale avec `os.wait4()` (ou `/usr/bin/time -v`) pour dimensionner les limites.

---

## 14. Diagnostic des échecs

| Symptôme | Où regarder | Piste |
|---|---|---|
| Code 1, `cannot read input file` | `logs/errors.txt` (ligne et colonne) | XML, compteur, référence, mode, limite |
| Code 1, `Cannot precompute` | `logs/errors.txt` | Poids < 100 % interdit, mode, prérequis, activité sans créneau, enseignant sans créneau libre |
| Code -6 / 134 | stdout (ligne `Assertion` ou `std::bad_alloc`) | Section 8.2 ; mémoire si `bad_alloc` |
| Code négatif mais `Generation successful` | `timetables/<nom>/` incomplet | Disque plein (`SIGXFSZ`), quota, arrêt externe |
| Code 127 | stderr | Bibliothèques Qt introuvables (`ldd fet-cl`) |
| `Impossible` | `logs/difficult_activities.txt`, `timetables/<nom>-highest/` | Contraintes trop serrées autour des activités citées |
| `Time exceeded` | dernière ligne de `logs/max_placed_activities.txt` | Si n activités placées, la (n+1)-ième de `initial_order.txt` est celle qui bloque |
| Solution, mais préférences violées | `<nom>_soft_conflicts.txt` | Plusieurs graines ; passer à 100 % ce qui doit l'être |
| Contrainte sans effet | `logs/warnings.txt`, `<nom>_data_and_timetable.fet` | Balise mal orthographiée, `Active=false`, poids 0 |
| Option sans effet | stdout (`Unrecognized option`) | Faute de frappe, casse, valeur booléenne |

---

## 15. Tester votre intégration

Le validateur `fet-cl-validator` (Linux, Python 3.9+, interface Tk facultative) rejoue sur votre binaire toutes les mesures de ce document : 529 tests en 16 catégories, environ 9 minutes sur 2 cœurs.

```bash
./valider_cli.sh /usr/bin/fet-cl --workers 4                 # campagne complète
./valider_cli.sh /usr/bin/fet-cl --tests ROB,SYS --no-slow   # sous-ensemble, sans les tests longs
```

| Catégories | Tests | Ce qui est vérifié |
|---|---:|---|
| 1 à 5 (ENV, ARG, DAT, GEN, CTL) | 44 | Installation, arguments, codes de retour, lecture, sorties, signaux de base |
| 6 à 11 (CAP, PDS, RSP, OPT, TC, SC) | 402 | Modes, poids, respect effectif, 534 options, 352 contraintes |
| 12. ROB — robustesse des données | 45 | 44 mutations ciblées (valeurs absurdes, doublons, références cassées, encodages, DTD) et fuzzing de 1 000 fichiers mutés |
| 13. STR — charge et performances | 9 | Jusqu'à 29 719 activités, grilles extrêmes, précision de la limite, parallélisme, graines, mémoire, latence de SIGTERM, `sigwrite` répété |
| 14. SYS — intégration Linux | 15 | Bibliothèques, locale, chemins, `RLIMIT_FSIZE/AS/CPU`, `/dev/full`, signaux POSIX, `SIGSTOP`, `/dev/stdin`, FIFO, `HOME`, `umask`, concurrence |
| 15. OUT — validation des sorties | 9 | XML bien formés, HTML niveaux 0 à 7, échappement, 9 variantes CSV, cohérence croisée, réinjection, conflits souples, solution partielle |
| 16. CMB — combinaisons | 5 | 253 paires, 200 triplets, courbe poids / respect, doublons, contradictions |

Il produit un rapport HTML, JSON et JUnit, un **rapport détaillé Markdown** (`rapport-detaille-<date>.md`, avec comparaison automatique à la campagne précédente du même dossier) et un catalogue des contraintes à jour. Relancez-le à chaque changement de version de FET.

---

## 16. Vérification de ce document

### 16.1 Campagne du 7 octobre 2026

| Élément | Valeur |
|---|---|
| Système | Linux 6.1 x86-64, 2 cœurs, glibc 2.43, Python 3.14, Qt 6.10.0 |
| Binaire | fet-cl 7.11.1 compilé depuis les sources officielles, `LC_ALL=C.UTF-8` |
| Validateur | `fet-cl-validator` 3.0.0, 2 exécutions en parallèle, fichier réel `MHS_July2.fet` fourni pour GEN-12 |
| Durée | 8 min 44 s |
| Résultat | **529 tests : 515 réussis, 14 avertissements, 0 échec, 0 erreur, 0 ignoré** |

| Catégorie | Tests | Réussis | Avertissements |
|---|---:|---:|---:|
| ENV — environnement | 5 | 5 | 0 |
| ARG — arguments et codes de retour | 14 | 13 | 1 (ARG-14 : graines s20..s22) |
| DAT — lecture des données | 6 | 6 | 0 |
| GEN — génération et sorties | 12 | 11 | 1 (GEN-08 : traduction absente du binaire de test) |
| CTL — contrôle du processus | 7 | 7 | 0 |
| CAP — capacités et modes | 15 | 12 | 3 (CAP-02, CAP-11, CAP-13 : abandons par assertion) |
| PDS — poids | 6 | 5 | 1 (PDS-04 : poids hors bornes acceptés) |
| RSP — respect effectif | 23 | 23 | 0 |
| OPT — options | 6 | 5 | 1 (OPT-03 : lecture des booléens) |
| TC — contraintes de temps | 271 | 271 | 0 |
| SC — contraintes d'espace | 81 | 81 | 0 |
| ROB — robustesse des données | 45 | 40 | 5 (ROB-05 Id 0, ROB-11 jour en double, ROB-43 jour vide, ROB-44 heure en double, ROB-50 fuzzing) |
| STR — charge et performances | 9 | 9 | 0 |
| SYS — intégration Linux | 15 | 13 | 2 (SYS-05 `result.txt` avant les sorties, SYS-13 `logs/` et dossier de résultat partagés) |
| OUT — validation des sorties | 9 | 9 | 0 |
| CMB — combinaisons | 5 | 5 | 0 |

Les 14 avertissements correspondent aux limites décrites dans ce document (sections 4.1, 6.4, 7.4, 8.2, 11.2 et 12) ; aucun ne le contredit. Le détail de chaque test figure dans `rapport-tests-fet-cl-7.11.1.md`.

### 16.2 Comparaison avec la campagne du 6 octobre 2026

| Donnée de référence | Résultat |
|---|---|
| 446 tests des catégories 1 à 11 | statuts identiques (439 PASS, 7 WARN), 0 changement |
| 352 fiches de contraintes, 521 options booléennes | identiques |
| Répartition 254 / 82 / 16 ; poids 101 : 254 / 73 / 25 | confirmée |
| 83 tests nouveaux (ROB, STR, SYS, OUT, CMB) | 76 réussis, 7 avertissements, 0 échec |

### 16.3 Découvertes de la campagne approfondie (intégrées au document)

| Constat | Sections mises à jour |
|---|---|
| Jours et heures en double ou vides acceptés ; Id 0 accepté ; `Days_List` absente → 5 jours par défaut ; ordre des sections libre ; UTF-16 accepté ; entités externes non résolues | 4.1, 12 |
| 1 000 fichiers mutés : 570 acceptés, 427 refusés proprement, 3 abandons (2 signatures nouvelles), 0 erreur de segmentation, 0 blocage, 0 succès incohérent | 8.1, 8.2, 12 |
| `Generation successful` écrit avant les sorties : code -25 (SIGXFSZ) avec `result.txt` « succès » | 1, 8.1, 8.3, 12, 14 |
| Mémoire ~1 Gio pour 200 × 50 créneaux et 4 000 activités ; `bad_alloc` → abandon sous `RLIMIT_AS` 512 Mio | 8.2, 11.1, 12 |
| Durée quadratique ; 29 719 activités en 44 à 50 s ; débit plafonné au nombre de cœurs | 1, 11.1, 12 |
| Limite de temps en temps réel ; `--timelimitseconds=1` peut s'arrêter à 0,1 s | 10, 11.1, 12 |
| Signaux POSIX autres que SIGTERM : arrêt sans résultat | 8.1, 10, 13.3 |
| Courbe poids / respect sur 10 graines | 2.3, 6.3 |
| 453 combinaisons de contraintes : 0 violation ; `TwoActivitiesConsecutive` traverse les pauses | 6.6, 12 |
| Rien n'est écrit dans `HOME` ; `umask` respecté ; `/dev/stdin` et FIFO acceptés | 3 |

### 16.4 Corrections apportées au validateur (version 3.0.0)

- Suppression de toute la partie Windows : le validateur, `fet_batch.py` et cette documentation ciblent uniquement Linux.
- Mesure du temps CPU et de la mémoire maximale de chaque exécution (`os.wait4`), affichés dans les rapports.
- Cohérence des succès vérifiée contre `*_data_and_timetable.fet` (données telles que fet-cl les a comprises), ce qui évite de faux échecs quand fet-cl applique une valeur par défaut.
- `fet_batch.py` : un code négatif prime sur `result.txt` ; nouveau statut `INCOMPLETE` quand `result.txt` annonce un succès sans `<nom>_activities.xml`.

### 16.5 Non vérifié par mesure

- Limites de 500 000 activités, 30 000 sous-groupes, salles, bâtiments et capacité : lues dans `timetable_defs.h`, non atteintes (maximum testé : 29 719 activités).
- Erreur de segmentation (`-11`) : jamais provoquée.
- Comportement sous cgroup v2 (`memory.max`) : non testé ; attendu identique à `RLIMIT_AS` (`bad_alloc`), sauf intervention du tueur OOM (`SIGKILL`, code -9).
- Autres distributions et versions de Qt : seul Qt 6.10.0 a été testé.

---

## Annexe A — Référence des 352 types de contraintes

Colonnes : balise XML sans le préfixe `Constraint` ; nom affiché par l'interface française de FET ; catégorie ; poids autorisés observés ; modes acceptés (Off = Official, MA = Mornings_Afternoons, Bloc = Block_Planning, Trim = Terms) ; marque « 101 ! » si un poids de 101 % provoque un abandon.

### A.1 Contraintes de temps (271)

| Balise | Nom (FR) | Catégorie | Poids | Modes | Remarque |
|---|---|---|---|---|---|
| `ActivitiesBeginOrEndStudentsDay` | Activités débutent ou terminent la journée des apprenants | Activités | 0–100 % | tous |  |
| `ActivitiesBeginOrEndTeachersDay` | Activités débutent ou terminent la journée des enseignants | Activités | 0–100 % | tous |  |
| `ActivitiesBeginStudentsDay` | Activités débutent la journée des apprenants | Activités | 0–100 % | tous |  |
| `ActivitiesBeginTeachersDay` | Activités débutent la journée des enseignants | Activités | 0–100 % | tous |  |
| `ActivitiesEndStudentsDay` | Activités terminent la journée des apprenants | Activités | 0–100 % | tous |  |
| `ActivitiesEndTeachersDay` | Activités terminent la journée des enseignants | Activités | 0–100 % | tous |  |
| `ActivitiesMaxActivityTagsFromSetInSelectedTimeSlots` | Activités limite codes activité depuis un jeu dans les créneaux horaires sélectionnés | Activités | 100 % seulement | tous |  |
| `ActivitiesMaxHourlySpan` | Activités amplitude horaire max | Activités | 0–100 % | tous | 101 ! abandon |
| `ActivitiesMaxInATerm` | Activités max par période | Activités | 100 % seulement | Trim |  |
| `ActivitiesMaxSimultaneousInSelectedTimeSlots` | Activités limite simultanées dans les créneaux horaires sélectionnés | Activités | 100 % seulement | tous |  |
| `ActivitiesMaxTotalNumberOfStudentsInSelectedTimeSlots` | Activités nombre total maximal d'apprenants dans les créneaux horaires sélectionnés | Activités | 100 % seulement | tous |  |
| `ActivitiesMinInATerm` | Activités min par période | Activités | 100 % seulement | Trim |  |
| `ActivitiesMinSimultaneousInSelectedTimeSlots` | Activités minimum simultanées dans les créneaux horaires sélectionnés | Activités | 100 % seulement | tous |  |
| `ActivitiesNotOverlapping` | Activités sans chevauchement | Activités | 0–100 % | tous |  |
| `ActivitiesOccupyMaxSetsOfTimeSlotsFromSelection` | Activités occupent limite jeux de créneaux horaires dans la sélection | Activités | 100 % seulement | tous |  |
| `ActivitiesOccupyMaxTerms` | Activités limite occupation périodes | Activités | 100 % seulement | Trim |  |
| `ActivitiesOccupyMaxTimeSlotsFromSelection` | Activités occupent limite créneaux horaires dans la sélection | Activités | 100 % seulement | tous |  |
| `ActivitiesOccupyMinTimeSlotsFromSelection` | Activités occupent minimum créneaux horaires dans la sélection | Activités | 100 % seulement | tous |  |
| `ActivitiesOverlapCompletelyOrDoNotOverlap` | Activités se chevauchent totalement ou ne se chevauchent pas | Activités | 100 % seulement | tous | activités de durée > 1 |
| `ActivitiesPairOfMutuallyExclusiveSetsOfTimeSlots` | Activités paire de jeux de créneaux horaires mutuellement exclusifs | Activités | 100 % seulement | tous |  |
| `ActivitiesPairOfMutuallyExclusiveTimeSlots` | Activités paire de créneaux horaires mutuellement exclusifs | Activités | 100 % seulement | tous |  |
| `ActivitiesPreferredStartingTimes` | Activités temps de démarrage préférés | Activités | 0–100 % | tous |  |
| `ActivitiesPreferredTimeSlots` | Activités créneaux horaires préférés | Activités | 0–100 % | tous |  |
| `ActivitiesSameStartingDay` | Activités même jour de démarrage | Activités | 0–100 % | tous |  |
| `ActivitiesSameStartingHour` | Activités même heure de démarrage | Activités | 0–100 % | tous |  |
| `ActivitiesSameStartingTime` | Activités démarrent en même temps | Activités | 0–100 % | tous |  |
| `ActivityBeginsOrEndsStudentsDay` | Activité débute ou termine la journée des apprenants | Activités | 0–100 % | tous |  |
| `ActivityBeginsOrEndsTeachersDay` | Activité débute ou termine la journée des enseignants | Activités | 0–100 % | tous |  |
| `ActivityBeginsStudentsDay` | Activité débute la journée des apprenants | Activités | 0–100 % | tous |  |
| `ActivityBeginsTeachersDay` | Activité débute la journée des enseignants | Activités | 0–100 % | tous |  |
| `ActivityEndsStudentsDay` | Activité termine la journée des apprenants | Activités | 0–100 % | tous |  |
| `ActivityEndsTeachersDay` | Activité termine la journée des enseignants | Activités | 0–100 % | tous |  |
| `ActivityPreferredDay` | ConstraintActivityPreferredDay | Activités | 0–100 % | tous |  |
| `ActivityPreferredStartingTime` | Activité temps de démarrage préféré | Activités | 0–100 % | tous |  |
| `ActivityPreferredStartingTimes` | Activité temps de démarrage préférés | Activités | 0–100 % | tous |  |
| `ActivityPreferredTimeSlots` | Activité créneaux horaires préférés | Activités | 0–100 % | tous |  |
| `MaxDaysBetweenActivities` | Jours max entre activités | Activités | 0–100 % | tous | 101 ! abandon |
| `MaxDaysBetweenEachPairOfConsecutiveActivities` | Limite jours entre chaque paire d'activités consécutives | Activités | 0–100 % | tous |  |
| `MaxGapsBetweenActivities` | Vides max entre activités | Activités | 0–100 % | Bloc | 101 ! abandon |
| `MaxHalfDaysBetweenActivities` | Demi-journées max entre activités | Activités | 0–100 % | MA | 101 ! abandon |
| `MaxTermsBetweenActivities` | Périodes max entre activités | Activités | 0–100 % | Trim | 101 ! abandon |
| `MaxTotalActivitiesFromSetInSelectedTimeSlots` | Limite activités totales du jeu dans les créneaux horaires sélectionnés | Activités | 100 % seulement | Bloc |  |
| `MinDaysBetweenActivities` | Jours min entre activités | Activités | 0–100 % | tous | 101 ! abandon |
| `MinGapsBetweenActivities` | Vides min entre activités | Activités | 0–100 % | tous | 101 ! abandon |
| `MinHalfDaysBetweenActivities` | Demi-journées min entre activités | Activités | 0–100 % | MA | 101 ! abandon |
| `SubactivitiesPreferredStartingTimes` | Sous-activités temps préférés de démarrage | Activités | 0–100 % | tous |  |
| `SubactivitiesPreferredTimeSlots` | Sous-activités créneaux horaires préférés | Activités | 0–100 % | tous |  |
| `ThreeActivitiesGrouped` | Trois activités groupées | Activités | 0–100 % | tous |  |
| `TwoActivitiesConsecutive` | Deux activités consécutives | Activités | 0–100 % | tous |  |
| `TwoActivitiesGrouped` | Deux activités groupées | Activités | 0–100 % | tous |  |
| `TwoActivitiesOrdered` | Deux activités ordonnées | Activités | 0–100 % | tous |  |
| `TwoActivitiesOrderedIfSameDay` | Deux activités ordonnées si même jour | Activités | 0–100 % | tous |  |
| `TwoSetsOfActivitiesOrdered` | Deux jeux d'activités ordonnés | Activités | 0–100 % | tous |  |
| `TwoSetsOfActivitiesSameSections` | Deux jeux d'activités ont les mêmes sections | Activités | 100 % seulement | Bloc | les activités des deux ensembles doivent avoir respectivement les mêmes élèves et la même durée |
| `BasicCompulsoryTime` | Temporelles obligatoires de base | Base | 0–100 % | tous |  |
| `StudentsActivityTagMaxHoursContinuously` | Apprenants code activité limite heures continues | Élèves | 0–100 % | tous |  |
| `StudentsActivityTagMaxHoursDaily` | Apprenants code activité limite heures quotidiennes | Élèves | 0–100 % | tous |  |
| `StudentsActivityTagMaxHoursDailyRealDays` | Apprenants code activité limite heures quotidiennes par jours réels | Élèves | 0–100 % | MA |  |
| `StudentsActivityTagMinHoursDaily` | Apprenants code activité minimum heures quotidiennes | Élèves | 100 % seulement | tous |  |
| `StudentsAfternoonIntervalMaxDaysPerWeek` | Après-midi apprenants intervalle limite jours par semaine | Élèves | 100 % seulement | MA |  |
| `StudentsAfternoonsEarlyMaxBeginningsAtSecondHour` | Après-midis apprenants au plus tôt limite débuts en seconde heure | Élèves | 100 % seulement | MA |  |
| `StudentsEarlyMaxBeginningsAtSecondHour` | Apprenants tôt limite débuts en seconde heure | Élèves | 100 % seulement | tous |  |
| `StudentsIntervalMaxDaysPerWeek` | Apprenants intervalle limite jours par semaine | Élèves | 100 % seulement | tous |  |
| `StudentsMaxActivityTagChangesPerDay` | Apprenants changements balise activité quotidiens max | Élèves | 100 % seulement | tous |  |
| `StudentsMaxActivityTagChangesPerWeek` | Apprenants changements balise activité hebdomadaires max | Élèves | 100 % seulement | tous |  |
| `StudentsMaxActivityTagsPerDayFromSet` | Apprenants limite codes activité par jour depuis le jeu | Élèves | 100 % seulement (abandon sinon) | tous |  |
| `StudentsMaxActivityTagsPerRealDayFromSet` | Apprenants limite codes activité par jour réel depuis le jeu | Élèves | 100 % seulement (abandon sinon) | MA |  |
| `StudentsMaxAfternoonsPerWeek` | Apprenants limite après-midis par semaine | Élèves | 100 % seulement | MA |  |
| `StudentsMaxDaysPerWeek` | Apprenants jours max par semaine | Élèves | 100 % seulement | tous |  |
| `StudentsMaxGapsPerDay` | Apprenants vides max par jour | Élèves | 100 % seulement | tous |  |
| `StudentsMaxGapsPerRealDay` | Apprenants vides max par jour réel | Élèves | 100 % seulement | MA |  |
| `StudentsMaxGapsPerWeek` | Apprenants vides max par semaine | Élèves | 100 % seulement | tous |  |
| `StudentsMaxGapsPerWeekForRealDays` | Apprenants limite vides par semaine pour jours réels | Élèves | 100 % seulement | MA |  |
| `StudentsMaxHoursContinuously` | Apprenants heures continues max | Élèves | 0–100 % | tous |  |
| `StudentsMaxHoursContinuouslyRealDays` | Apprenants heures continues max pour jours réels | Élèves | 0–100 % | MA |  |
| `StudentsMaxHoursDaily` | Apprenants heures quotidiennes max | Élèves | 0–100 % | tous |  |
| `StudentsMaxHoursDailyInInterval` | Apprenants limite heures quotidiennes dans intervalle | Élèves | 100 % seulement | tous |  |
| `StudentsMaxHoursDailyRealDays` | Apprenants limite heures quotidiennes pour jours réels | Élèves | 0–100 % | MA |  |
| `StudentsMaxHoursPerAllAfternoons` | Apprenants limite heures pour tous les après-midis | Élèves | 100 % seulement | MA |  |
| `StudentsMaxMorningsPerWeek` | Apprenants limite matinées par semaine | Élèves | 100 % seulement | MA |  |
| `StudentsMaxRealDaysPerWeek` | Apprenants limite jours réels par semaine | Élèves | 100 % seulement | MA |  |
| `StudentsMaxSingleEarlyAfternoonGaps` | Apprenants interruptions simples max en début d'après-midi | Élèves | 100 % seulement | MA |  |
| `StudentsMaxSingleEarlyMorningGaps` | Apprenants interruptions simples max en début de matinée | Élèves | 100 % seulement | MA |  |
| `StudentsMaxSingleGapsBetweenMorningAndAfternoon` | Apprenants interruptions simples max entre matin et après-midi | Élèves | 100 % seulement | MA |  |
| `StudentsMaxSingleGapsInSelectedTimeSlots` | Apprenants limide vide unique dans les créneaux horaires sélectionnés | Élèves | 100 % seulement | tous |  |
| `StudentsMaxSpanPerDay` | Apprenants limite amplitude quotidienne | Élèves | 100 % seulement | Off, Bloc, Trim |  |
| `StudentsMaxSpanPerRealDay` | Apprenants limite amplitude par jour réel | Élèves | 100 % seulement | MA |  |
| `StudentsMaxThreeConsecutiveDays` | Apprenants limite trois jours consécutifs | Élèves | 100 % seulement | MA |  |
| `StudentsMinAfternoonsPerWeek` | Apprenants minimum après-midis par semaine | Élèves | 100 % seulement | MA |  |
| `StudentsMinGapsBetweenActivityTag` | Apprenants vides minimum entre code activité | Élèves | 100 % seulement | tous |  |
| `StudentsMinGapsBetweenActivityTagBetweenMorningAndAfternoon` | Vides minimum entre code activité entre matinée et après-midi pour apprenants | Élèves | 100 % seulement | MA |  |
| `StudentsMinGapsBetweenActivityTagPerRealDay` | Vides minimum entre code activité par jour réel pour apprenants | Élèves | 100 % seulement | MA |  |
| `StudentsMinGapsBetweenOrderedPairOfActivityTags` | Vides minimum entre couple ordonné de codes activité pour apprenants | Élèves | 100 % seulement | tous |  |
| `StudentsMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon` | Apprenants vides minimum entre paire ordonnée de codes activité entre matinée et après-midi | Élèves | 100 % seulement | MA |  |
| `StudentsMinGapsBetweenOrderedPairOfActivityTagsPerRealDay` | Vides minimum entre couple ordonné de codes activité par jour réel pour apprenants | Élèves | 100 % seulement | MA |  |
| `StudentsMinHoursDaily` | Apprenants heures quotidiennes min | Élèves | 100 % seulement | tous |  |
| `StudentsMinHoursPerAfternoon` | Apprenants heures minimum par après-midi | Élèves | 100 % seulement | MA | exige aussi une contrainte « min heures par jour » sur le même enseignant ou les mêmes élèves |
| `StudentsMinHoursPerMorning` | Apprenants heures minimum par matinée | Élèves | 100 % seulement | MA | exige aussi une contrainte « min heures par jour » sur le même enseignant ou les mêmes élèves |
| `StudentsMinMorningsPerWeek` | Apprenants matinées minimum par semaine | Élèves | 100 % seulement | MA |  |
| `StudentsMinRestingHours` | Apprenants heures de repos min | Élèves | 100 % seulement | Off, Bloc, Trim |  |
| `StudentsMinRestingHoursBetweenMorningAndAfternoon` | Apprenants heures minimum de repos entre matinée et après-midi | Élèves | 100 % seulement | MA |  |
| `StudentsMorningIntervalMaxDaysPerWeek` | Matinée apprenants intervalle limite jours par semaine | Élèves | 100 % seulement | MA |  |
| `StudentsMorningsEarlyMaxBeginningsAtSecondHour` | Apprenants matins au plus tôt limite débuts en seconde heure | Élèves | 100 % seulement | MA |  |
| `StudentsOccupyMaxSetsOfTimeSlotsFromSelection` | Apprenants occupent limite jeux de créneaux horaires depuis la sélection | Élèves | 100 % seulement | tous |  |
| `StudentsPairOfMutuallyExclusiveSetsOfTimeSlots` | Apprenants paire de jeux de créneaux horaires mutuellement exclusifs | Élèves | 100 % seulement | tous |  |
| `StudentsPairOfMutuallyExclusiveTimeSlots` | Apprenants paire de créneaux horaires mutuellement exclusifs | Élèves | 100 % seulement | tous |  |
| `StudentsSetActivityTagMaxHoursContinuously` | Groupe code activité limite heures continues | Élèves | 0–100 % | tous |  |
| `StudentsSetActivityTagMaxHoursDaily` | Groupe code activité limite heures quotidiennes | Élèves | 0–100 % | tous |  |
| `StudentsSetActivityTagMaxHoursDailyRealDays` | Groupe code activité limite heures quotidiennes par jours réels | Élèves | 0–100 % | MA |  |
| `StudentsSetActivityTagMinHoursDaily` | Groupe code activité minimum heures quotidiennes | Élèves | 100 % seulement | tous |  |
| `StudentsSetAfternoonIntervalMaxDaysPerWeek` | Après-midi groupe intervalle limite jours par semaine | Élèves | 100 % seulement | MA |  |
| `StudentsSetAfternoonsEarlyMaxBeginningsAtSecondHour` | Après-midis groupe au plus tôt limite débuts en seconde heure | Élèves | 100 % seulement | MA |  |
| `StudentsSetEarlyMaxBeginningsAtSecondHour` | Groupe tôt limite débuts en seconde heure | Élèves | 100 % seulement | tous |  |
| `StudentsSetIntervalMaxDaysPerWeek` | Groupe intervalle limite jours par semaine | Élèves | 100 % seulement | tous |  |
| `StudentsSetMaxActivityTagChangesPerDay` | Jeu d'apprenants changements balise activité quotidiens max | Élèves | 100 % seulement | tous |  |
| `StudentsSetMaxActivityTagChangesPerWeek` | Jeu d'apprenants changements balise activité hebdomadaires max | Élèves | 100 % seulement | tous |  |
| `StudentsSetMaxActivityTagsPerDayFromSet` | Groupe limite codes activité par jour depuis le jeu | Élèves | 100 % seulement (abandon sinon) | tous |  |
| `StudentsSetMaxActivityTagsPerRealDayFromSet` | Groupe limite codes activité par jour réel depuis le jeu | Élèves | 100 % seulement (abandon sinon) | MA |  |
| `StudentsSetMaxAfternoonsPerWeek` | Groupe limite après-midis par semaine | Élèves | 100 % seulement | MA |  |
| `StudentsSetMaxDaysPerWeek` | Groupe limite jours par semaine | Élèves | 100 % seulement | tous |  |
| `StudentsSetMaxGapsPerDay` | Groupe limite vides quotidiens | Élèves | 100 % seulement | tous |  |
| `StudentsSetMaxGapsPerRealDay` | Groupe limite vides par jour réel | Élèves | 100 % seulement | MA |  |
| `StudentsSetMaxGapsPerWeek` | Groupe limite vides par semaine | Élèves | 100 % seulement | tous |  |
| `StudentsSetMaxGapsPerWeekForRealDays` | Groupe limite vides par semaine pour jours réels | Élèves | 100 % seulement | MA |  |
| `StudentsSetMaxHoursContinuously` | Groupe limite heures continues | Élèves | 0–100 % | tous |  |
| `StudentsSetMaxHoursContinuouslyRealDays` | Groupe heures continues max pour jours réels | Élèves | 0–100 % | MA |  |
| `StudentsSetMaxHoursDaily` | Groupe limite heures quotidiennes | Élèves | 0–100 % | tous |  |
| `StudentsSetMaxHoursDailyInInterval` | Groupe limite heures quotidiennes dans intervalle | Élèves | 100 % seulement | tous |  |
| `StudentsSetMaxHoursDailyRealDays` | Groupe limite heures quotidiennes pour jours réels | Élèves | 0–100 % | MA |  |
| `StudentsSetMaxHoursPerAllAfternoons` | Groupe limite heures pour tous les après-midis | Élèves | 100 % seulement | MA |  |
| `StudentsSetMaxMorningsPerWeek` | Groupe limite matinées par semaine | Élèves | 100 % seulement | MA |  |
| `StudentsSetMaxRealDaysPerWeek` | Groupe limite jours réels par semaine | Élèves | 100 % seulement | MA |  |
| `StudentsSetMaxSingleEarlyAfternoonGaps` | Groupe interruptions simples max en début d'après-midi | Élèves | 100 % seulement | MA |  |
| `StudentsSetMaxSingleEarlyMorningGaps` | Groupe interruptions simples max en début de matinée | Élèves | 100 % seulement | MA |  |
| `StudentsSetMaxSingleGapsBetweenMorningAndAfternoon` | Groupe interruptions simples max entre matin et après-midi | Élèves | 100 % seulement | MA |  |
| `StudentsSetMaxSingleGapsInSelectedTimeSlots` | Groupe limide vide unique dans les créneaux horaires sélectionnés | Élèves | 100 % seulement | tous |  |
| `StudentsSetMaxSpanPerDay` | Groupe limite amplitude quotidienne | Élèves | 100 % seulement | Off, Bloc, Trim |  |
| `StudentsSetMaxSpanPerRealDay` | Groupe limite amplitude par jour réel | Élèves | 100 % seulement | MA |  |
| `StudentsSetMaxThreeConsecutiveDays` | Groupe limite trois jours consécutifs | Élèves | 100 % seulement | MA |  |
| `StudentsSetMinAfternoonsPerWeek` | Groupe minimum après-midis par semaine | Élèves | 100 % seulement | MA |  |
| `StudentsSetMinGapsBetweenActivityTag` | Groupe vides minimum entre code activité | Élèves | 100 % seulement | tous |  |
| `StudentsSetMinGapsBetweenActivityTagBetweenMorningAndAfternoon` | Vides minimum entre code activité entre matinée et après-midi pour groupe | Élèves | 100 % seulement | MA |  |
| `StudentsSetMinGapsBetweenActivityTagPerRealDay` | Vides minimum entre code activité par jour réel pour groupe | Élèves | 100 % seulement | MA |  |
| `StudentsSetMinGapsBetweenOrderedPairOfActivityTags` | Vides minimum entre couple ordonné de codes activité pour un groupe | Élèves | 100 % seulement | tous |  |
| `StudentsSetMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon` | Groupe vides minimum entre paire ordonnée de codes activité entre matinée et après-midi | Élèves | 100 % seulement | MA |  |
| `StudentsSetMinGapsBetweenOrderedPairOfActivityTagsPerRealDay` | Vides minimum entre couple ordonné de codes activité par jour réel pour groupe | Élèves | 100 % seulement | MA |  |
| `StudentsSetMinHoursDaily` | Groupe heures minimum quotidiennes | Élèves | 100 % seulement | tous |  |
| `StudentsSetMinHoursPerAfternoon` | Groupe heures minimum par après-midi | Élèves | 100 % seulement | MA | exige aussi une contrainte « min heures par jour » sur le même enseignant ou les mêmes élèves |
| `StudentsSetMinHoursPerMorning` | Groupe heures minimum par matinée | Élèves | 100 % seulement | MA | exige aussi une contrainte « min heures par jour » sur le même enseignant ou les mêmes élèves |
| `StudentsSetMinMorningsPerWeek` | Groupe matinées minimum par semaine | Élèves | 100 % seulement | MA |  |
| `StudentsSetMinRestingHours` | Groupe heures de repos minimum | Élèves | 100 % seulement | Off, Bloc, Trim |  |
| `StudentsSetMinRestingHoursBetweenMorningAndAfternoon` | Groupe heures minimum de repos entre matinée et après-midi | Élèves | 100 % seulement | MA |  |
| `StudentsSetMorningIntervalMaxDaysPerWeek` | Matinée groupe intervalle limite jours par semaine | Élèves | 100 % seulement | MA |  |
| `StudentsSetMorningsEarlyMaxBeginningsAtSecondHour` | Groupe matins au plus tôt limite débuts en seconde heure | Élèves | 100 % seulement | MA |  |
| `StudentsSetNotAvailableTimes` | Contrainte groupe temps non disponibles | Élèves | 100 % seulement | tous |  |
| `StudentsSetOccupiesMaxSetsOfTimeSlotsFromSelection` | Groupe occupe limite jeux de créneaux horaires depuis la sélection | Élèves | 100 % seulement | tous |  |
| `StudentsSetPairOfMutuallyExclusiveSetsOfTimeSlots` | Groupe paire de jeux de créneaux horaires mutuellement exclusifs | Élèves | 100 % seulement | tous |  |
| `StudentsSetPairOfMutuallyExclusiveTimeSlots` | Groupe paire de créneaux horaires mutuellement exclusifs | Élèves | 100 % seulement | tous |  |
| `TeacherActivityTagMaxHoursContinuously` | Enseignant code activité limite heures continues | Enseignants | 0–100 % | tous |  |
| `TeacherActivityTagMaxHoursDaily` | Enseignant code activité limite heures quotidiennes | Enseignants | 0–100 % | tous |  |
| `TeacherActivityTagMaxHoursDailyRealDays` | Enseignant code activité limite heures quotidiennes pour jours réels | Enseignants | 0–100 % | MA |  |
| `TeacherActivityTagMinHoursDaily` | Enseignant code activité minimum heures quotidiennes | Enseignants | 100 % seulement | tous |  |
| `TeacherAfternoonIntervalMaxDaysPerWeek` | Après-midi enseignant intervalle limite jours par semaine | Enseignants | 100 % seulement | MA |  |
| `TeacherAfternoonsEarlyMaxBeginningsAtSecondHour` | Après-midis enseignant au plus tôt limite débuts en seconde heure | Enseignants | 100 % seulement | MA |  |
| `TeacherIntervalMaxDaysPerWeek` | Enseignant intervalle limite jours par semaine | Enseignants | 100 % seulement | tous |  |
| `TeacherMaxActivityTagChangesPerDay` | Enseignant changements balise activité quotidiens max | Enseignants | 100 % seulement | tous |  |
| `TeacherMaxActivityTagChangesPerWeek` | Enseignant changements balise activité hebdomadaires max | Enseignants | 100 % seulement | tous |  |
| `TeacherMaxActivityTagsPerDayFromSet` | Enseignant limite codes activité par jour depuis le jeu | Enseignants | 100 % seulement (abandon sinon) | tous |  |
| `TeacherMaxActivityTagsPerRealDayFromSet` | Enseignant limite codes activité par jour réel depuis le jeu | Enseignants | 100 % seulement (abandon sinon) | MA |  |
| `TeacherMaxAfternoonsPerWeek` | Enseignant après-midi max par semaine | Enseignants | 100 % seulement | MA |  |
| `TeacherMaxDaysPerWeek` | Enseignant jours max par semaine | Enseignants | 100 % seulement | tous |  |
| `TeacherMaxGapsPerDay` | Enseignant vides max par jour | Enseignants | 100 % seulement | tous |  |
| `TeacherMaxGapsPerMorningAndAfternoon` | Enseignant limite vides par matin et après-midi | Enseignants | 100 % seulement | MA |  |
| `TeacherMaxGapsPerRealDay` | Enseignant limite vides par jour réel | Enseignants | 100 % seulement | MA |  |
| `TeacherMaxGapsPerWeek` | Enseignant vides max par semaine | Enseignants | 100 % seulement | tous |  |
| `TeacherMaxGapsPerWeekForRealDays` | Enseignant limite vides par semaine pour jours réels | Enseignants | 100 % seulement | MA |  |
| `TeacherMaxHoursContinuously` | Enseignant heures continues max | Enseignants | 0–100 % | tous |  |
| `TeacherMaxHoursDaily` | Enseignant heures quotidiennes max | Enseignants | 0–100 % | tous |  |
| `TeacherMaxHoursDailyInInterval` | Enseignant limite heures quotidiennes dans intervalle | Enseignants | 100 % seulement | tous |  |
| `TeacherMaxHoursDailyRealDays` | Enseignant limite heures quotidiennes pour jours réels | Enseignants | 0–100 % | MA |  |
| `TeacherMaxHoursPerAllAfternoons` | Enseignant limite heures pour tous les après-midis | Enseignants | 100 % seulement | MA |  |
| `TeacherMaxHoursPerTerm` | Enseignant limite heures par période | Enseignants | 100 % seulement | Trim |  |
| `TeacherMaxMorningsPerWeek` | Enseignant matinées max par semaine | Enseignants | 100 % seulement | MA |  |
| `TeacherMaxRealDaysPerWeek` | Enseignant limite jours réels par semaine | Enseignants | 100 % seulement | MA |  |
| `TeacherMaxSingleGapsInSelectedTimeSlots` | Enseignant limide vide unique dans les créneaux horaires sélectionnés | Enseignants | 100 % seulement | tous |  |
| `TeacherMaxSpanPerDay` | Enseignant amplitude max par jour | Enseignants | 100 % seulement | tous |  |
| `TeacherMaxSpanPerRealDay` | Enseignant limite amplitude par jour réel | Enseignants | 100 % seulement | MA |  |
| `TeacherMaxThreeConsecutiveDays` | Enseignant limite trois jours consécutifs | Enseignants | 100 % seulement | MA |  |
| `TeacherMaxTwoConsecutiveAfternoons` | Enseignant deux après-midi consécutifs max | Enseignants | 100 % seulement | MA |  |
| `TeacherMaxTwoConsecutiveMornings` | Enseignant deux matinées consécutives max | Enseignants | 100 % seulement | MA |  |
| `TeacherMaxZeroGapsPerAfternoon` | Enseignant limite zéro vide par après-midi | Enseignants | 100 % seulement (abandon sinon) | MA |  |
| `TeacherMinAfternoonsPerWeek` | Enseignant après-midi min par semaine | Enseignants | 100 % seulement | MA |  |
| `TeacherMinDaysPerWeek` | Enseignant jours min par semaine | Enseignants | 100 % seulement | tous |  |
| `TeacherMinGapsBetweenActivityTag` | Enseignant vides minimum entre code activité | Enseignants | 100 % seulement | tous |  |
| `TeacherMinGapsBetweenActivityTagBetweenMorningAndAfternoon` | Vides minimum entre code activité entre matinée et après-midi pour enseignant | Enseignants | 100 % seulement | MA |  |
| `TeacherMinGapsBetweenActivityTagPerRealDay` | Vides minimum entre code activité par jour réel pour enseignant | Enseignants | 100 % seulement | MA |  |
| `TeacherMinGapsBetweenOrderedPairOfActivityTags` | Vides minimum entre couple ordonné de codes activité pour enseignant | Enseignants | 100 % seulement | tous |  |
| `TeacherMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon` | Enseignant vides minimum entre paire ordonnée de codes activité entre matinée et après-midi | Enseignants | 100 % seulement | MA |  |
| `TeacherMinGapsBetweenOrderedPairOfActivityTagsPerRealDay` | Vides minimum entre couple ordonné de codes activité par jour réel pour enseignant | Enseignants | 100 % seulement | MA |  |
| `TeacherMinHoursDaily` | Enseignant heures quotidiennes min | Enseignants | 100 % seulement | tous |  |
| `TeacherMinHoursDailyRealDays` | Enseignant minimum heures quotidiennes pour jours réels | Enseignants | 100 % seulement | MA |  |
| `TeacherMinHoursPerAfternoon` | Enseignant heures min par après-midi | Enseignants | 100 % seulement | MA | exige aussi une contrainte « min heures par jour » sur le même enseignant ou les mêmes élèves |
| `TeacherMinHoursPerMorning` | Enseignant heures min par matinée | Enseignants | 100 % seulement | MA | exige aussi une contrainte « min heures par jour » sur le même enseignant ou les mêmes élèves |
| `TeacherMinMorningsPerWeek` | Enseignant matinées min par semaine | Enseignants | 100 % seulement | MA |  |
| `TeacherMinRealDaysPerWeek` | Enseignant jours réels minimum par semaine | Enseignants | 100 % seulement | MA |  |
| `TeacherMinRestingHours` | Enseignant heures de repos min | Enseignants | 100 % seulement | Off, Bloc, Trim |  |
| `TeacherMinRestingHoursBetweenMorningAndAfternoon` | Enseignant heures minimum de repos entre matinée et après-midi | Enseignants | 100 % seulement | MA |  |
| `TeacherMorningIntervalMaxDaysPerWeek` | Matinée enseignant intervalle limite jours par semaine | Enseignants | 100 % seulement | MA |  |
| `TeacherMorningsEarlyMaxBeginningsAtSecondHour` | Enseignant matins au plus tôt limite débuts en seconde heure | Enseignants | 100 % seulement | MA |  |
| `TeacherNoTwoConsecutiveDays` | Enseignant sans deux jours consécutifs | Enseignants | 100 % seulement | tous |  |
| `TeacherNotAvailableTimes` | Enseignant temps non disponibles | Enseignants | 100 % seulement | tous |  |
| `TeacherOccupiesMaxSetsOfTimeSlotsFromSelection` | Enseignant occupe limite jeux de créneaux horaires depuis la sélection | Enseignants | 100 % seulement | tous |  |
| `TeacherPairOfMutuallyExclusiveSetsOfTimeSlots` | Enseignant paire de jeux de créneaux horaires mutuellement exclusifs | Enseignants | 100 % seulement | tous |  |
| `TeacherPairOfMutuallyExclusiveTimeSlots` | Enseignant paire de créneaux horaires mutuellement exclusifs | Enseignants | 100 % seulement | tous |  |
| `TeachersActivityTagMaxHoursContinuously` | Enseignants code activité limite heures continues | Enseignants | 0–100 % | tous |  |
| `TeachersActivityTagMaxHoursDaily` | Enseignants code activité limite heures quotidiennes | Enseignants | 0–100 % | tous |  |
| `TeachersActivityTagMaxHoursDailyRealDays` | Enseignants code activité limite heures quotidiennes pour jours réels | Enseignants | 0–100 % | MA |  |
| `TeachersActivityTagMinHoursDaily` | Enseignants code activité minimum heures quotidiennes | Enseignants | 100 % seulement | tous |  |
| `TeachersAfternoonIntervalMaxDaysPerWeek` | Après-midi enseignants intervalle limite jours par semaine | Enseignants | 100 % seulement | MA |  |
| `TeachersAfternoonsEarlyMaxBeginningsAtSecondHour` | Après-midis enseignants au plus tôt limite débuts en seconde heure | Enseignants | 100 % seulement | MA |  |
| `TeachersIntervalMaxDaysPerWeek` | Enseignants intervalle limite jours par semaine | Enseignants | 100 % seulement | tous |  |
| `TeachersMaxActivityTagChangesPerDay` | Enseignants changements balise activité quotidiens max | Enseignants | 100 % seulement | tous |  |
| `TeachersMaxActivityTagChangesPerWeek` | Enseignants changements balise activité hebdomadaires max | Enseignants | 100 % seulement | tous |  |
| `TeachersMaxActivityTagsPerDayFromSet` | Enseignants limite codes activité par jour depuis le jeu | Enseignants | 100 % seulement (abandon sinon) | tous |  |
| `TeachersMaxActivityTagsPerRealDayFromSet` | Enseignants limite codes activité par jour réel depuis le jeu | Enseignants | 100 % seulement (abandon sinon) | MA |  |
| `TeachersMaxAfternoonsPerWeek` | Enseignants après-midi max par semaine | Enseignants | 100 % seulement | MA |  |
| `TeachersMaxDaysPerWeek` | Enseignants jours max par semaine | Enseignants | 100 % seulement | tous |  |
| `TeachersMaxGapsPerDay` | Enseignants vides max par jour | Enseignants | 100 % seulement | tous |  |
| `TeachersMaxGapsPerMorningAndAfternoon` | Enseignants limite vides par matin et après-midi | Enseignants | 100 % seulement | MA |  |
| `TeachersMaxGapsPerRealDay` | Enseignants limite vides par jour réel | Enseignants | 100 % seulement | MA |  |
| `TeachersMaxGapsPerWeek` | Enseignants vides max par semaine | Enseignants | 100 % seulement | tous |  |
| `TeachersMaxGapsPerWeekForRealDays` | Enseignants limite vides par semaine pour jours réels | Enseignants | 100 % seulement | MA |  |
| `TeachersMaxHoursContinuously` | Enseignants heures continues max | Enseignants | 0–100 % | tous |  |
| `TeachersMaxHoursDaily` | Enseignants heures quotidiennes max | Enseignants | 0–100 % | tous |  |
| `TeachersMaxHoursDailyInInterval` | Enseignants limite heures quotidiennes dans intervalle | Enseignants | 100 % seulement | tous |  |
| `TeachersMaxHoursDailyRealDays` | Enseignants limite heures quotidiennes pour jours réels | Enseignants | 0–100 % | MA |  |
| `TeachersMaxHoursPerAllAfternoons` | Enseignants limite heures pour tous les après-midis | Enseignants | 100 % seulement | MA |  |
| `TeachersMaxHoursPerTerm` | Enseignants limite heures par période | Enseignants | 100 % seulement | Trim |  |
| `TeachersMaxMorningsPerWeek` | Enseignants matinées max par semaine | Enseignants | 100 % seulement | MA |  |
| `TeachersMaxRealDaysPerWeek` | Enseignants limite jours réels par semaine | Enseignants | 100 % seulement | MA |  |
| `TeachersMaxSingleGapsInSelectedTimeSlots` | Enseignants limide vide unique dans les créneaux horaires sélectionnés | Enseignants | 100 % seulement | tous |  |
| `TeachersMaxSpanPerDay` | Enseignants amplitude max par jour | Enseignants | 100 % seulement | tous |  |
| `TeachersMaxSpanPerRealDay` | Enseignants limite amplitude par jour réel | Enseignants | 100 % seulement | MA |  |
| `TeachersMaxThreeConsecutiveDays` | Enseignants trois jours consécutifs max | Enseignants | 100 % seulement | MA |  |
| `TeachersMaxTwoConsecutiveAfternoons` | Enseignants deux après-midi consécutifs max | Enseignants | 100 % seulement | MA |  |
| `TeachersMaxTwoConsecutiveMornings` | Enseignants deux matinées consécutives max | Enseignants | 100 % seulement | MA |  |
| `TeachersMaxZeroGapsPerAfternoon` | Enseignants limite zéro vide par après-midi | Enseignants | 100 % seulement (abandon sinon) | MA |  |
| `TeachersMinAfternoonsPerWeek` | Enseignants après-midi min par semaine | Enseignants | 100 % seulement | MA |  |
| `TeachersMinDaysPerWeek` | Enseignants jours min par semaine | Enseignants | 100 % seulement | tous |  |
| `TeachersMinGapsBetweenActivityTag` | Enseignants vides minimum entre code activité | Enseignants | 100 % seulement | tous |  |
| `TeachersMinGapsBetweenActivityTagBetweenMorningAndAfternoon` | Vides minimum entre code activité entre matinée et après-midi pour enseignants | Enseignants | 100 % seulement | MA |  |
| `TeachersMinGapsBetweenActivityTagPerRealDay` | Vides minimum entre code activité par jour réel pour enseignants | Enseignants | 100 % seulement | MA |  |
| `TeachersMinGapsBetweenOrderedPairOfActivityTags` | Vides minimum entre couple ordonné de codes activité pour enseignants | Enseignants | 100 % seulement | tous |  |
| `TeachersMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon` | Enseignants vides minimum entre paire ordonnée de codes activité entre matinée et après-midi | Enseignants | 100 % seulement | MA |  |
| `TeachersMinGapsBetweenOrderedPairOfActivityTagsPerRealDay` | Vides minimum entre couple ordonné de codes activité par jour réel pour enseignants | Enseignants | 100 % seulement | MA |  |
| `TeachersMinHoursDaily` | Enseignants heures quotidiennes min | Enseignants | 100 % seulement | tous |  |
| `TeachersMinHoursDailyRealDays` | Enseignants minimum heures quotidiennes pour jours réels | Enseignants | 100 % seulement | MA |  |
| `TeachersMinHoursPerAfternoon` | Enseignants heures min par après-midi | Enseignants | 100 % seulement | MA | exige aussi une contrainte « min heures par jour » sur le même enseignant ou les mêmes élèves |
| `TeachersMinHoursPerMorning` | Enseignants heures min par matinée | Enseignants | 100 % seulement | MA | exige aussi une contrainte « min heures par jour » sur le même enseignant ou les mêmes élèves |
| `TeachersMinMorningsPerWeek` | Enseignants matinées min par semaine | Enseignants | 100 % seulement | MA |  |
| `TeachersMinRealDaysPerWeek` | Enseignants jours réels minimum par semaine | Enseignants | 100 % seulement | MA |  |
| `TeachersMinRestingHours` | Enseignants heures de repos min | Enseignants | 100 % seulement | Off, Bloc, Trim |  |
| `TeachersMinRestingHoursBetweenMorningAndAfternoon` | Enseignants heures minimum de repos entre matinée et après-midi | Enseignants | 100 % seulement | MA |  |
| `TeachersMorningIntervalMaxDaysPerWeek` | Matinée enseignants intervalle limite jours par semaine | Enseignants | 100 % seulement | MA |  |
| `TeachersMorningsEarlyMaxBeginningsAtSecondHour` | Enseignants matins au plus tôt limite débuts en seconde heure | Enseignants | 100 % seulement | MA |  |
| `TeachersNoTwoConsecutiveDays` | Enseignants sans deux jours consécutifs | Enseignants | 100 % seulement | tous |  |
| `TeachersOccupyMaxSetsOfTimeSlotsFromSelection` | Enseignants occupent limite jeux de créneaux horaires depuis la sélection | Enseignants | 100 % seulement | tous |  |
| `TeachersPairOfMutuallyExclusiveSetsOfTimeSlots` | Enseignants paire de jeux de créneaux horaires mutuellement exclusifs | Enseignants | 100 % seulement | tous |  |
| `TeachersPairOfMutuallyExclusiveTimeSlots` | Enseignants paire de créneaux horaires mutuellement exclusifs | Enseignants | 100 % seulement | tous |  |
| `ActivityTagsNotOverlapping` | Balises sans chevauchement | Étiquettes | 0–100 % | tous | 101 ! abandon |
| `BreakTimes` | Temps de pause | Pauses | 100 % seulement | tous |  |

### A.2 Contraintes d'espace (81)

| Balise | Nom (FR) | Catégorie | Poids | Modes | Remarque |
|---|---|---|---|---|---|
| `ActivitiesOccupyMaxDifferentRooms` | Activités occupent salles différentes max | Activités | 100 % seulement | tous |  |
| `ActivitiesSameRoomIfConsecutive` | Activités même salle si consécutives | Activités | 100 % seulement | tous |  |
| `ActivityPreferredRoom` | Activité salle préférée | Activités | 0–100 % | tous |  |
| `ActivityPreferredRooms` | Activité salles préférées | Activités | 0–100 % | tous |  |
| `BuildingMinOneActivityInEachAvailableTimeSlot` | Bâtiment une activité minimum dans chaque créneau disponible | Activités | 100 % seulement | tous | chaque activité doit avoir une contrainte de salles préférées à 100 % ; durée totale ≥ nombre de créneaux disponibles du bâtiment |
| `BuildingsMinOneActivityInEachAvailableTimeSlot` | Bâtiments une activité minimum dans chaque créneau disponible | Activités | 100 % seulement | tous | chaque activité doit avoir une contrainte de salles préférées à 100 % ; durée totale ≥ nombre de créneaux disponibles du bâtiment |
| `BasicCompulsorySpace` | Spatiales obligatoires de base | Base | 0–100 % | tous |  |
| `StudentsMaxBuildingChangesPerDay` | Apprenants limite changements bâtiments quotidiens | Élèves | 100 % seulement | tous |  |
| `StudentsMaxBuildingChangesPerDayInInterval` | Apprenants limite changements bâtiments quotidiens dans l'intervalle | Élèves | 100 % seulement | tous |  |
| `StudentsMaxBuildingChangesPerRealDay` | Apprenants limite changements bâtiments par jour réel | Élèves | 100 % seulement | MA |  |
| `StudentsMaxBuildingChangesPerRealDayInInterval` | Apprenants limite changements bâtiments par jour réel dans l'intervalle | Élèves | 100 % seulement | MA |  |
| `StudentsMaxBuildingChangesPerWeek` | Apprenants limite changements bâtiments par semaine | Élèves | 100 % seulement | tous |  |
| `StudentsMaxRoomChangesPerDay` | Apprenants limite changements salles quotidiens | Élèves | 100 % seulement | tous |  |
| `StudentsMaxRoomChangesPerDayInInterval` | Apprenants limite changements salles quotidiens dans l'intervalle | Élèves | 100 % seulement | tous |  |
| `StudentsMaxRoomChangesPerRealDay` | Apprenants limite changements de salle par jour réel | Élèves | 100 % seulement | MA |  |
| `StudentsMaxRoomChangesPerRealDayInInterval` | Apprenants limite changements salles par jour réel dans l'intervalle | Élèves | 100 % seulement | MA |  |
| `StudentsMaxRoomChangesPerWeek` | Apprenants limite changements salles hebdomadaires | Élèves | 100 % seulement | tous |  |
| `StudentsMinGapsBetweenBuildingChanges` | Apprenants vides minimum entre changements bâtiments | Élèves | 100 % seulement | tous |  |
| `StudentsMinGapsBetweenRoomChanges` | Apprenants vides minimum entre changements salles | Élèves | 100 % seulement | tous |  |
| `StudentsSetHomeRoom` | Groupe salle de référence | Élèves | 0–100 % | tous |  |
| `StudentsSetHomeRooms` | Groupe salles de référence | Élèves | 0–100 % | tous |  |
| `StudentsSetMaxBuildingChangesPerDay` | Groupe limite changements bâtiments quotidiens | Élèves | 100 % seulement | tous |  |
| `StudentsSetMaxBuildingChangesPerDayInInterval` | Groupes limite changements bâtiments quotidiens dans l'intervalle | Élèves | 100 % seulement | tous |  |
| `StudentsSetMaxBuildingChangesPerRealDay` | Groupe limite changements bâtiments par jour réel | Élèves | 100 % seulement | MA |  |
| `StudentsSetMaxBuildingChangesPerRealDayInInterval` | Groupes limite changements bâtiments par jour réel dans l'intervalle | Élèves | 100 % seulement | MA |  |
| `StudentsSetMaxBuildingChangesPerWeek` | Groupe limite changements bâtiments par semaine | Élèves | 100 % seulement | tous |  |
| `StudentsSetMaxRoomChangesPerDay` | Groupe limite changements salles quotidiens | Élèves | 100 % seulement | tous |  |
| `StudentsSetMaxRoomChangesPerDayInInterval` | Groupe limite changements salles quotidiens dans l'intervalle | Élèves | 100 % seulement | tous |  |
| `StudentsSetMaxRoomChangesPerRealDay` | Groupe limite changements de salle par jour réel | Élèves | 100 % seulement | MA |  |
| `StudentsSetMaxRoomChangesPerRealDayInInterval` | Groupe limite changements salles par jour réel dans l'intervalle | Élèves | 100 % seulement | MA |  |
| `StudentsSetMaxRoomChangesPerWeek` | Groupe limite changements salles hebdomadaires | Élèves | 100 % seulement | tous |  |
| `StudentsSetMinGapsBetweenBuildingChanges` | Groupe vides minimum entre changements bâtiments | Élèves | 100 % seulement | tous |  |
| `StudentsSetMinGapsBetweenRoomChanges` | Groupe vides minimum entre changements salles | Élèves | 100 % seulement | tous |  |
| `TeacherHomeRoom` | Enseignant salle de référence | Enseignants | 0–100 % | tous |  |
| `TeacherHomeRooms` | Enseignant salles de référence | Enseignants | 0–100 % | tous |  |
| `TeacherMaxBuildingChangesPerDay` | Enseignant limite changements bâtiments quotidiens | Enseignants | 100 % seulement | tous |  |
| `TeacherMaxBuildingChangesPerDayInInterval` | Enseignant limite changements bâtiments quotidiens dans l'intervalle | Enseignants | 100 % seulement | tous |  |
| `TeacherMaxBuildingChangesPerRealDay` | Enseignant limite changements bâtiments par jour réel | Enseignants | 100 % seulement | MA |  |
| `TeacherMaxBuildingChangesPerRealDayInInterval` | Enseignant limite changements bâtiments par jour réel dans l'intervalle | Enseignants | 100 % seulement | MA |  |
| `TeacherMaxBuildingChangesPerWeek` | Enseignant limite changements bâtiments par semaine | Enseignants | 100 % seulement | tous |  |
| `TeacherMaxRoomChangesPerDay` | Enseignant limite changements salles quotidiens | Enseignants | 100 % seulement | tous |  |
| `TeacherMaxRoomChangesPerDayInInterval` | Enseignant limite changements salles quotidiens dans l'intervalle | Enseignants | 100 % seulement | tous |  |
| `TeacherMaxRoomChangesPerRealDay` | Enseignant limite changements de salle par jour réel | Enseignants | 100 % seulement | MA |  |
| `TeacherMaxRoomChangesPerRealDayInInterval` | Enseignant limite changements salles par jour réel dans l'intervalle | Enseignants | 100 % seulement | MA |  |
| `TeacherMaxRoomChangesPerWeek` | Enseignant limite changements salles hebdomadaires | Enseignants | 100 % seulement | tous |  |
| `TeacherMinGapsBetweenBuildingChanges` | Enseignant vides minimum entre changements bâtiments | Enseignants | 100 % seulement | tous |  |
| `TeacherMinGapsBetweenRoomChanges` | Enseignant vides minimum entre changements salles | Enseignants | 100 % seulement | tous |  |
| `TeacherRoomNotAvailableTimes` | Enseignant salle temps non disponibles | Enseignants | 0–100 % | tous |  |
| `TeachersMaxBuildingChangesPerDay` | Enseignants limite changements bâtiments quotidiens | Enseignants | 100 % seulement | tous |  |
| `TeachersMaxBuildingChangesPerDayInInterval` | Enseignants limite changements bâtiments quotidiens dans l'intervalle | Enseignants | 100 % seulement | tous |  |
| `TeachersMaxBuildingChangesPerRealDay` | Enseignants limite changements bâtiments par jour réel | Enseignants | 100 % seulement | MA |  |
| `TeachersMaxBuildingChangesPerRealDayInInterval` | Enseignants limite changements bâtiments par jour réel dans l'intervalle | Enseignants | 100 % seulement | MA |  |
| `TeachersMaxBuildingChangesPerWeek` | Enseignants limite changements bâtiments par semaine | Enseignants | 100 % seulement | tous |  |
| `TeachersMaxRoomChangesPerDay` | Enseignants limite changements salles quotidiens | Enseignants | 100 % seulement | tous |  |
| `TeachersMaxRoomChangesPerDayInInterval` | Enseignants limite changements salles quotidiens dans l'intervalle | Enseignants | 100 % seulement | tous |  |
| `TeachersMaxRoomChangesPerRealDay` | Enseignants limite changements de salle par jour réel | Enseignants | 100 % seulement | MA |  |
| `TeachersMaxRoomChangesPerRealDayInInterval` | Enseignants limite changements salles par jour réel dans l'intervalle | Enseignants | 100 % seulement | MA |  |
| `TeachersMaxRoomChangesPerWeek` | Enseignants limite changements salles hebdomadaires | Enseignants | 100 % seulement | tous |  |
| `TeachersMinGapsBetweenBuildingChanges` | Enseignants vides minimum entre changements bâtiments | Enseignants | 100 % seulement | tous |  |
| `TeachersMinGapsBetweenRoomChanges` | Enseignants vides minimum entre changements salles | Enseignants | 100 % seulement | tous |  |
| `ActivityTagPreferredRoom` | Balise salle préférée | Étiquettes | 0–100 % | tous |  |
| `ActivityTagPreferredRooms` | Balise salles préférées | Étiquettes | 0–100 % | tous |  |
| `SubjectActivityTagPreferredRoom` | Matière code activité salle préférée | Matières | 0–100 % | tous |  |
| `SubjectActivityTagPreferredRooms` | Matière code activité salles préférées | Matières | 0–100 % | tous |  |
| `SubjectPreferredRoom` | Matière salle préférée | Matières | 0–100 % | tous |  |
| `SubjectPreferredRooms` | Matière salles préférées | Matières | 0–100 % | tous |  |
| `RoomMaxActivitiesPerTeacher` | Salle limite activités par enseignant | Salles | 100 % seulement | tous |  |
| `RoomMaxActivityTagsPerDayFromSet` | Salle limite codes activité par jour depuis le jeu | Salles | 100 % seulement (abandon sinon) | tous |  |
| `RoomMaxActivityTagsPerRealDayFromSet` | Salle limite codes activité par jour réel depuis le jeu | Salles | 100 % seulement (abandon sinon) | MA |  |
| `RoomMaxActivityTagsPerWeekFromSet` | Salle limite codes activité par semaine depuis le jeu | Salles | 100 % seulement (abandon sinon) | tous |  |
| `RoomNotAvailableTimes` | Salle temps non disponibles | Salles | 0–100 % | tous |  |
| `RoomOccupiesMaxSetsOfTimeSlotsFromSelection` | Salle occupe limite jeux de créneaux horaires depuis la sélection | Salles | 100 % seulement | tous |  |
| `RoomPairOfMutuallyExclusiveSetsOfTimeSlots` | Salle paire de jeux de créneaux horaires mutuellement exclusifs | Salles | 100 % seulement | tous |  |
| `RoomPairOfMutuallyExclusiveTimeSlots` | Salle paire de créneaux horaires mutuellement exclusifs | Salles | 100 % seulement | tous |  |
| `RoomsMaxActivitiesPerTeacher` | Salles limite activités par enseignant | Salles | 100 % seulement | tous |  |
| `RoomsMaxActivityTagsPerDayFromSet` | Salles limite codes activité par jour depuis le jeu | Salles | 100 % seulement (abandon sinon) | tous |  |
| `RoomsMaxActivityTagsPerRealDayFromSet` | Salles limite codes activité par jour réel depuis le jeu | Salles | 100 % seulement (abandon sinon) | MA |  |
| `RoomsMaxActivityTagsPerWeekFromSet` | Salles limite codes activité par semaine depuis le jeu | Salles | 100 % seulement (abandon sinon) | tous |  |
| `RoomsOccupyMaxSetsOfTimeSlotsFromSelection` | Salles occupent limite jeux de créneaux horaires depuis la sélection | Salles | 100 % seulement | tous |  |
| `RoomsPairOfMutuallyExclusiveSetsOfTimeSlots` | Salles paire de jeux de créneaux horaires mutuellement exclusifs | Salles | 100 % seulement | tous |  |
| `RoomsPairOfMutuallyExclusiveTimeSlots` | Salles paire de créneaux horaires mutuellement exclusifs | Salles | 100 % seulement | tous |  |

## Annexe B — Référence des options de ligne de commande

Liste extraite de la boucle d'analyse de `src/cl/fetcl.cpp` (537 préfixes reconnus), croisée avec `--help` (534 options documentées). Pour les booléens : « défaut » d'après le code ; « effet » = nombre de fichiers produits modifiés, ajoutés ou supprimés quand on passe la valeur inverse (instance de référence, `--exportcsv=true`, `--htmllevel=2`) ; 0 signifie sans effet visible sur cette instance, pas forcément sans effet.

### B.1 Options à valeur

| Option | Documentée | Valeurs |
|---|---|---|
| `--inputfile=` | oui | chemin du .fet (obligatoire) |
| `--timelimitseconds=` | oui | entier > 0 (défaut 2000000000) |
| `--timetablehtmllevel=` | non | alias non documenté de --htmllevel |
| `--htmllevel=` | oui | 0 à 7 (défaut 2) |
| `--language=` | oui | code de langue (défaut en_US) |
| `--outputdir=` | oui | chemin sans barre finale |
| `--randomseedx=` | non | obsolète : refusée (code 1) |
| `--randomseedy=` | non | obsolète : refusée (code 1) |
| `--randomseeds10=` | oui | entier (graine MRG32k3a) |
| `--randomseeds11=` | oui | entier (graine MRG32k3a) |
| `--randomseeds12=` | oui | entier (graine MRG32k3a) |
| `--randomseeds20=` | oui | entier (graine MRG32k3a) |
| `--randomseeds21=` | oui | entier (graine MRG32k3a) |
| `--randomseeds22=` | oui | entier (graine MRG32k3a) |
| `--quotescsv=` | oui | doublequotes, singlequotes, none |
| `--fieldseparatorcsv=` | oui | comma, semicolon, verticalbar |

### B.2 Options booléennes (521)

Valeur lue par sa fin : une option dont le défaut est `true` n'est désactivée que si la valeur se termine par `false` ; une option dont le défaut est `false` n'est activée que si la valeur se termine par `true`.

| Option | Défaut | Effet de l'inverse (fichiers) |
|---|---|---:|
| `--embedcssinhtmlhead` | false | 42 |
| `--htmlusespan` | true | 20 |
| `--printactivitytags` | true | 28 |
| `--printsubjects` | true | 28 |
| `--printteachers` | true | 24 |
| `--printstudents` | true | 28 |
| `--printrooms` | true | 0 |
| `--printdetailedtimetables` | true | 4 |
| `--printdetailedteachersfreeperiodstimetables` | true | 3 |
| `--printnotavailable` | true | 0 |
| `--printbreak` | true | 0 |
| `--sortsubgroups` | false | 0 |
| `--sortactivitiesbytags` | false | 4 |
| `--dividetimeaxisbydays` | false | 18 |
| `--duplicateverticalheaders` | false | 40 |
| `--printsimultaneousactivities` | false | 0 |
| `--warnsubgroupswiththesameactivities` | true | 0 |
| `--warnifusingactivitiesnotfixedtimefixedspacevirtualroomsrealrooms` | true | 0 |
| `--warnifusingmaxhoursdailywithlessthan100percentweight` | true | 0 |
| `--warnifusinggroupactivitiesininitialorder` | true | 0 |
| `--showvirtualrooms` | false | 0 |
| `--verbose` | false | 0 |
| `--writetimetableconflicts` | true | 2 |
| `--writetimetablesstatistics` | true | 3 |
| `--writetimetablesxml` | true | 4 |
| `--writetimetablesdayshorizontal` | true | 11 |
| `--writetimetablesdaysvertical` | true | 11 |
| `--writetimetablestimehorizontal` | true | 10 |
| `--writetimetablestimevertical` | true | 10 |
| `--writetimetablessubgroups` | true | 6 |
| `--writetimetablesgroups` | true | 5 |
| `--writetimetablesyears` | true | 5 |
| `--writetimetablesteachers` | true | 7 |
| `--writetimetablesteachersfreeperiods` | true | 3 |
| `--writetimetablesbuildings` | true | 5 |
| `--writetimetablesrooms` | true | 5 |
| `--writetimetablessubjects` | true | 5 |
| `--writetimetablesactivitytags` | true | 5 |
| `--writetimetablesactivities` | true | 6 |
| `--exportcsv` | false | 0 |
| `--overwritecsv` | false | 0 |
| `--firstlineisheadingcsv` | true | 9 |
| `--separatedaysnamelongnamebybreak` | false | 0 |
| `--separatehoursnamelongnamebybreak` | false | 0 |
| `--separatesubjectsnamelongnamecodebybreak` | false | 0 |
| `--separateactivitytagsnamelongnamecodebybreak` | false | 0 |
| `--separateteachersnamelongnamecodebybreak` | false | 0 |
| `--separatestudentsnamelongnamecodebybreak` | false | 0 |
| `--separatebuildingsnamelongnamecodebybreak` | false | 0 |
| `--separateroomsnamelongnamecodebybreak` | false | 0 |
| `--printsubjectscomments` | false | 0 |
| `--printactivitytagscomments` | false | 0 |
| `--printteacherscomments` | false | 0 |
| `--printsubgroupscomments` | false | 0 |
| `--printgroupscomments` | false | 0 |
| `--printyearscomments` | false | 0 |
| `--printbuildingscomments` | false | 0 |
| `--printroomscomments` | false | 0 |
| `--subgroupsdayshvprintdaysnames` | true | 0 |
| `--subgroupsdayshvprintdayslongnames` | false | 0 |
| `--subgroupsdayshvprinthoursnames` | true | 0 |
| `--subgroupsdayshvprinthourslongnames` | false | 0 |
| `--subgroupsdayshvprintsubjectsnames` | true | 2 |
| `--subgroupsdayshvprintsubjectslongnames` | false | 0 |
| `--subgroupsdayshvprintsubjectscodes` | false | 0 |
| `--subgroupsdayshvprintactivitytagsnames` | true | 2 |
| `--subgroupsdayshvprintactivitytagslongnames` | false | 0 |
| `--subgroupsdayshvprintactivitytagscodes` | false | 0 |
| `--subgroupsdayshvprintteachersnames` | true | 2 |
| `--subgroupsdayshvprintteacherslongnames` | false | 0 |
| `--subgroupsdayshvprintteacherscodes` | false | 0 |
| `--subgroupsdayshvprintstudentsnames` | true | 2 |
| `--subgroupsdayshvprintstudentslongnames` | false | 2 |
| `--subgroupsdayshvprintstudentscodes` | false | 2 |
| `--subgroupsdayshvprintroomsnames` | true | 0 |
| `--subgroupsdayshvprintroomslongnames` | false | 0 |
| `--subgroupsdayshvprintroomscodes` | false | 0 |
| `--subgroupsdayshvprintsubjectslegend` | false | 2 |
| `--subgroupsdayshvprintactivitytagslegend` | false | 2 |
| `--subgroupsdayshvprintteacherslegend` | false | 2 |
| `--subgroupsdayshvprintstudentslegend` | false | 2 |
| `--subgroupsdayshvprintroomslegend` | false | 0 |
| `--subgroupsdayshvprintlegendcodesfirst` | false | 0 |
| `--subgroupstimehvprintdaysnames` | true | 0 |
| `--subgroupstimehvprintdayslongnames` | false | 0 |
| `--subgroupstimehvprinthoursnames` | true | 0 |
| `--subgroupstimehvprinthourslongnames` | false | 0 |
| `--subgroupstimehvprintsubjectsnames` | true | 2 |
| `--subgroupstimehvprintsubjectslongnames` | false | 0 |
| `--subgroupstimehvprintsubjectscodes` | false | 0 |
| `--subgroupstimehvprintactivitytagsnames` | true | 2 |
| `--subgroupstimehvprintactivitytagslongnames` | false | 0 |
| `--subgroupstimehvprintactivitytagscodes` | false | 0 |
| `--subgroupstimehvprintteachersnames` | true | 2 |
| `--subgroupstimehvprintteacherslongnames` | false | 0 |
| `--subgroupstimehvprintteacherscodes` | false | 0 |
| `--subgroupstimehvprintstudentsnames` | true | 2 |
| `--subgroupstimehvprintstudentslongnames` | false | 2 |
| `--subgroupstimehvprintstudentscodes` | false | 2 |
| `--subgroupstimehvprintroomsnames` | true | 0 |
| `--subgroupstimehvprintroomslongnames` | false | 0 |
| `--subgroupstimehvprintroomscodes` | false | 0 |
| `--subgroupstimehvprintsubjectslegend` | false | 2 |
| `--subgroupstimehvprintactivitytagslegend` | false | 2 |
| `--subgroupstimehvprintteacherslegend` | false | 2 |
| `--subgroupstimehvprintstudentslegend` | false | 2 |
| `--subgroupstimehvprintroomslegend` | false | 0 |
| `--subgroupstimehvprintlegendcodesfirst` | false | 0 |
| `--groupsdayshvprintdaysnames` | true | 0 |
| `--groupsdayshvprintdayslongnames` | false | 0 |
| `--groupsdayshvprinthoursnames` | true | 0 |
| `--groupsdayshvprinthourslongnames` | false | 0 |
| `--groupsdayshvprintsubjectsnames` | true | 2 |
| `--groupsdayshvprintsubjectslongnames` | false | 0 |
| `--groupsdayshvprintsubjectscodes` | false | 0 |
| `--groupsdayshvprintactivitytagsnames` | true | 2 |
| `--groupsdayshvprintactivitytagslongnames` | false | 0 |
| `--groupsdayshvprintactivitytagscodes` | false | 0 |
| `--groupsdayshvprintteachersnames` | true | 2 |
| `--groupsdayshvprintteacherslongnames` | false | 0 |
| `--groupsdayshvprintteacherscodes` | false | 0 |
| `--groupsdayshvprintstudentsnames` | true | 2 |
| `--groupsdayshvprintstudentslongnames` | false | 2 |
| `--groupsdayshvprintstudentscodes` | false | 2 |
| `--groupsdayshvprintroomsnames` | true | 0 |
| `--groupsdayshvprintroomslongnames` | false | 0 |
| `--groupsdayshvprintroomscodes` | false | 0 |
| `--groupsdayshvprintsubjectslegend` | false | 2 |
| `--groupsdayshvprintactivitytagslegend` | false | 2 |
| `--groupsdayshvprintteacherslegend` | false | 2 |
| `--groupsdayshvprintstudentslegend` | false | 2 |
| `--groupsdayshvprintroomslegend` | false | 0 |
| `--groupsdayshvprintlegendcodesfirst` | false | 0 |
| `--groupstimehvprintdaysnames` | true | 0 |
| `--groupstimehvprintdayslongnames` | false | 0 |
| `--groupstimehvprinthoursnames` | true | 0 |
| `--groupstimehvprinthourslongnames` | false | 0 |
| `--groupstimehvprintsubjectsnames` | true | 2 |
| `--groupstimehvprintsubjectslongnames` | false | 0 |
| `--groupstimehvprintsubjectscodes` | false | 0 |
| `--groupstimehvprintactivitytagsnames` | true | 2 |
| `--groupstimehvprintactivitytagslongnames` | false | 0 |
| `--groupstimehvprintactivitytagscodes` | false | 0 |
| `--groupstimehvprintteachersnames` | true | 2 |
| `--groupstimehvprintteacherslongnames` | false | 0 |
| `--groupstimehvprintteacherscodes` | false | 0 |
| `--groupstimehvprintstudentsnames` | true | 2 |
| `--groupstimehvprintstudentslongnames` | false | 2 |
| `--groupstimehvprintstudentscodes` | false | 2 |
| `--groupstimehvprintroomsnames` | true | 0 |
| `--groupstimehvprintroomslongnames` | false | 0 |
| `--groupstimehvprintroomscodes` | false | 0 |
| `--groupstimehvprintsubjectslegend` | false | 2 |
| `--groupstimehvprintactivitytagslegend` | false | 2 |
| `--groupstimehvprintteacherslegend` | false | 2 |
| `--groupstimehvprintstudentslegend` | false | 2 |
| `--groupstimehvprintroomslegend` | false | 0 |
| `--groupstimehvprintlegendcodesfirst` | false | 0 |
| `--yearsdayshvprintdaysnames` | true | 0 |
| `--yearsdayshvprintdayslongnames` | false | 0 |
| `--yearsdayshvprinthoursnames` | true | 0 |
| `--yearsdayshvprinthourslongnames` | false | 0 |
| `--yearsdayshvprintsubjectsnames` | true | 2 |
| `--yearsdayshvprintsubjectslongnames` | false | 0 |
| `--yearsdayshvprintsubjectscodes` | false | 0 |
| `--yearsdayshvprintactivitytagsnames` | true | 2 |
| `--yearsdayshvprintactivitytagslongnames` | false | 0 |
| `--yearsdayshvprintactivitytagscodes` | false | 0 |
| `--yearsdayshvprintteachersnames` | true | 2 |
| `--yearsdayshvprintteacherslongnames` | false | 0 |
| `--yearsdayshvprintteacherscodes` | false | 0 |
| `--yearsdayshvprintstudentsnames` | true | 2 |
| `--yearsdayshvprintstudentslongnames` | false | 0 |
| `--yearsdayshvprintstudentscodes` | false | 0 |
| `--yearsdayshvprintroomsnames` | true | 0 |
| `--yearsdayshvprintroomslongnames` | false | 0 |
| `--yearsdayshvprintroomscodes` | false | 0 |
| `--yearsdayshvprintsubjectslegend` | false | 2 |
| `--yearsdayshvprintactivitytagslegend` | false | 2 |
| `--yearsdayshvprintteacherslegend` | false | 2 |
| `--yearsdayshvprintstudentslegend` | false | 2 |
| `--yearsdayshvprintroomslegend` | false | 0 |
| `--yearsdayshvprintlegendcodesfirst` | false | 0 |
| `--yearstimehvprintdaysnames` | true | 0 |
| `--yearstimehvprintdayslongnames` | false | 0 |
| `--yearstimehvprinthoursnames` | true | 0 |
| `--yearstimehvprinthourslongnames` | false | 0 |
| `--yearstimehvprintsubjectsnames` | true | 2 |
| `--yearstimehvprintsubjectslongnames` | false | 0 |
| `--yearstimehvprintsubjectscodes` | false | 0 |
| `--yearstimehvprintactivitytagsnames` | true | 2 |
| `--yearstimehvprintactivitytagslongnames` | false | 0 |
| `--yearstimehvprintactivitytagscodes` | false | 0 |
| `--yearstimehvprintteachersnames` | true | 2 |
| `--yearstimehvprintteacherslongnames` | false | 0 |
| `--yearstimehvprintteacherscodes` | false | 0 |
| `--yearstimehvprintstudentsnames` | true | 2 |
| `--yearstimehvprintstudentslongnames` | false | 0 |
| `--yearstimehvprintstudentscodes` | false | 0 |
| `--yearstimehvprintroomsnames` | true | 0 |
| `--yearstimehvprintroomslongnames` | false | 0 |
| `--yearstimehvprintroomscodes` | false | 0 |
| `--yearstimehvprintsubjectslegend` | false | 2 |
| `--yearstimehvprintactivitytagslegend` | false | 2 |
| `--yearstimehvprintteacherslegend` | false | 2 |
| `--yearstimehvprintstudentslegend` | false | 2 |
| `--yearstimehvprintroomslegend` | false | 0 |
| `--yearstimehvprintlegendcodesfirst` | false | 0 |
| `--teachersdayshvprintdaysnames` | true | 0 |
| `--teachersdayshvprintdayslongnames` | false | 0 |
| `--teachersdayshvprinthoursnames` | true | 0 |
| `--teachersdayshvprinthourslongnames` | false | 0 |
| `--teachersdayshvprintsubjectsnames` | true | 2 |
| `--teachersdayshvprintsubjectslongnames` | false | 0 |
| `--teachersdayshvprintsubjectscodes` | false | 0 |
| `--teachersdayshvprintactivitytagsnames` | true | 2 |
| `--teachersdayshvprintactivitytagslongnames` | false | 0 |
| `--teachersdayshvprintactivitytagscodes` | false | 0 |
| `--teachersdayshvprintteachersnames` | true | 0 |
| `--teachersdayshvprintteacherslongnames` | false | 0 |
| `--teachersdayshvprintteacherscodes` | false | 0 |
| `--teachersdayshvprintstudentsnames` | true | 2 |
| `--teachersdayshvprintstudentslongnames` | false | 0 |
| `--teachersdayshvprintstudentscodes` | false | 0 |
| `--teachersdayshvprintroomsnames` | true | 0 |
| `--teachersdayshvprintroomslongnames` | false | 0 |
| `--teachersdayshvprintroomscodes` | false | 0 |
| `--teachersdayshvprintsubjectslegend` | false | 2 |
| `--teachersdayshvprintactivitytagslegend` | false | 2 |
| `--teachersdayshvprintteacherslegend` | false | 2 |
| `--teachersdayshvprintstudentslegend` | false | 2 |
| `--teachersdayshvprintroomslegend` | false | 0 |
| `--teachersdayshvprintlegendcodesfirst` | false | 0 |
| `--teacherstimehvprintdaysnames` | true | 0 |
| `--teacherstimehvprintdayslongnames` | false | 0 |
| `--teacherstimehvprinthoursnames` | true | 0 |
| `--teacherstimehvprinthourslongnames` | false | 0 |
| `--teacherstimehvprintsubjectsnames` | true | 2 |
| `--teacherstimehvprintsubjectslongnames` | false | 0 |
| `--teacherstimehvprintsubjectscodes` | false | 0 |
| `--teacherstimehvprintactivitytagsnames` | true | 2 |
| `--teacherstimehvprintactivitytagslongnames` | false | 0 |
| `--teacherstimehvprintactivitytagscodes` | false | 0 |
| `--teacherstimehvprintteachersnames` | true | 0 |
| `--teacherstimehvprintteacherslongnames` | false | 0 |
| `--teacherstimehvprintteacherscodes` | false | 0 |
| `--teacherstimehvprintstudentsnames` | true | 2 |
| `--teacherstimehvprintstudentslongnames` | false | 0 |
| `--teacherstimehvprintstudentscodes` | false | 0 |
| `--teacherstimehvprintroomsnames` | true | 0 |
| `--teacherstimehvprintroomslongnames` | false | 0 |
| `--teacherstimehvprintroomscodes` | false | 0 |
| `--teacherstimehvprintsubjectslegend` | false | 2 |
| `--teacherstimehvprintactivitytagslegend` | false | 2 |
| `--teacherstimehvprintteacherslegend` | false | 2 |
| `--teacherstimehvprintstudentslegend` | false | 2 |
| `--teacherstimehvprintroomslegend` | false | 0 |
| `--teacherstimehvprintlegendcodesfirst` | false | 0 |
| `--roomsdayshvprintdaysnames` | true | 0 |
| `--roomsdayshvprintdayslongnames` | false | 0 |
| `--roomsdayshvprinthoursnames` | true | 0 |
| `--roomsdayshvprinthourslongnames` | false | 0 |
| `--roomsdayshvprintsubjectsnames` | true | 0 |
| `--roomsdayshvprintsubjectslongnames` | false | 0 |
| `--roomsdayshvprintsubjectscodes` | false | 0 |
| `--roomsdayshvprintactivitytagsnames` | true | 0 |
| `--roomsdayshvprintactivitytagslongnames` | false | 0 |
| `--roomsdayshvprintactivitytagscodes` | false | 0 |
| `--roomsdayshvprintteachersnames` | true | 0 |
| `--roomsdayshvprintteacherslongnames` | false | 0 |
| `--roomsdayshvprintteacherscodes` | false | 0 |
| `--roomsdayshvprintstudentsnames` | true | 0 |
| `--roomsdayshvprintstudentslongnames` | false | 0 |
| `--roomsdayshvprintstudentscodes` | false | 0 |
| `--roomsdayshvprintroomsnames` | true | 0 |
| `--roomsdayshvprintroomslongnames` | false | 0 |
| `--roomsdayshvprintroomscodes` | false | 0 |
| `--roomsdayshvprintsubjectslegend` | false | 0 |
| `--roomsdayshvprintactivitytagslegend` | false | 0 |
| `--roomsdayshvprintteacherslegend` | false | 0 |
| `--roomsdayshvprintstudentslegend` | false | 0 |
| `--roomsdayshvprintroomslegend` | false | 0 |
| `--roomsdayshvprintlegendcodesfirst` | false | 0 |
| `--roomstimehvprintdaysnames` | true | 0 |
| `--roomstimehvprintdayslongnames` | false | 0 |
| `--roomstimehvprinthoursnames` | true | 0 |
| `--roomstimehvprinthourslongnames` | false | 0 |
| `--roomstimehvprintsubjectsnames` | true | 0 |
| `--roomstimehvprintsubjectslongnames` | false | 0 |
| `--roomstimehvprintsubjectscodes` | false | 0 |
| `--roomstimehvprintactivitytagsnames` | true | 0 |
| `--roomstimehvprintactivitytagslongnames` | false | 0 |
| `--roomstimehvprintactivitytagscodes` | false | 0 |
| `--roomstimehvprintteachersnames` | true | 0 |
| `--roomstimehvprintteacherslongnames` | false | 0 |
| `--roomstimehvprintteacherscodes` | false | 0 |
| `--roomstimehvprintstudentsnames` | true | 0 |
| `--roomstimehvprintstudentslongnames` | false | 0 |
| `--roomstimehvprintstudentscodes` | false | 0 |
| `--roomstimehvprintroomsnames` | true | 0 |
| `--roomstimehvprintroomslongnames` | false | 0 |
| `--roomstimehvprintroomscodes` | false | 0 |
| `--roomstimehvprintsubjectslegend` | false | 2 |
| `--roomstimehvprintactivitytagslegend` | false | 2 |
| `--roomstimehvprintteacherslegend` | false | 2 |
| `--roomstimehvprintstudentslegend` | false | 2 |
| `--roomstimehvprintroomslegend` | false | 0 |
| `--roomstimehvprintlegendcodesfirst` | false | 0 |
| `--buildingsdayshvprintdaysnames` | true | 0 |
| `--buildingsdayshvprintdayslongnames` | false | 0 |
| `--buildingsdayshvprinthoursnames` | true | 0 |
| `--buildingsdayshvprinthourslongnames` | false | 0 |
| `--buildingsdayshvprintsubjectsnames` | true | 0 |
| `--buildingsdayshvprintsubjectslongnames` | false | 0 |
| `--buildingsdayshvprintsubjectscodes` | false | 0 |
| `--buildingsdayshvprintactivitytagsnames` | true | 0 |
| `--buildingsdayshvprintactivitytagslongnames` | false | 0 |
| `--buildingsdayshvprintactivitytagscodes` | false | 0 |
| `--buildingsdayshvprintteachersnames` | true | 0 |
| `--buildingsdayshvprintteacherslongnames` | false | 0 |
| `--buildingsdayshvprintteacherscodes` | false | 0 |
| `--buildingsdayshvprintstudentsnames` | true | 0 |
| `--buildingsdayshvprintstudentslongnames` | false | 0 |
| `--buildingsdayshvprintstudentscodes` | false | 0 |
| `--buildingsdayshvprintroomsnames` | true | 0 |
| `--buildingsdayshvprintroomslongnames` | false | 0 |
| `--buildingsdayshvprintroomscodes` | false | 0 |
| `--buildingsdayshvprintsubjectslegend` | false | 0 |
| `--buildingsdayshvprintactivitytagslegend` | false | 0 |
| `--buildingsdayshvprintteacherslegend` | false | 0 |
| `--buildingsdayshvprintstudentslegend` | false | 0 |
| `--buildingsdayshvprintroomslegend` | false | 0 |
| `--buildingsdayshvprintlegendcodesfirst` | false | 0 |
| `--buildingstimehvprintdaysnames` | true | 0 |
| `--buildingstimehvprintdayslongnames` | false | 0 |
| `--buildingstimehvprinthoursnames` | true | 0 |
| `--buildingstimehvprinthourslongnames` | false | 0 |
| `--buildingstimehvprintsubjectsnames` | true | 0 |
| `--buildingstimehvprintsubjectslongnames` | false | 0 |
| `--buildingstimehvprintsubjectscodes` | false | 0 |
| `--buildingstimehvprintactivitytagsnames` | true | 0 |
| `--buildingstimehvprintactivitytagslongnames` | false | 0 |
| `--buildingstimehvprintactivitytagscodes` | false | 0 |
| `--buildingstimehvprintteachersnames` | true | 0 |
| `--buildingstimehvprintteacherslongnames` | false | 0 |
| `--buildingstimehvprintteacherscodes` | false | 0 |
| `--buildingstimehvprintstudentsnames` | true | 0 |
| `--buildingstimehvprintstudentslongnames` | false | 0 |
| `--buildingstimehvprintstudentscodes` | false | 0 |
| `--buildingstimehvprintroomsnames` | true | 0 |
| `--buildingstimehvprintroomslongnames` | false | 0 |
| `--buildingstimehvprintroomscodes` | false | 0 |
| `--buildingstimehvprintsubjectslegend` | false | 2 |
| `--buildingstimehvprintactivitytagslegend` | false | 2 |
| `--buildingstimehvprintteacherslegend` | false | 2 |
| `--buildingstimehvprintstudentslegend` | false | 2 |
| `--buildingstimehvprintroomslegend` | false | 0 |
| `--buildingstimehvprintlegendcodesfirst` | false | 0 |
| `--subjectsdayshvprintdaysnames` | true | 0 |
| `--subjectsdayshvprintdayslongnames` | false | 0 |
| `--subjectsdayshvprinthoursnames` | true | 0 |
| `--subjectsdayshvprinthourslongnames` | false | 0 |
| `--subjectsdayshvprintsubjectsnames` | true | 0 |
| `--subjectsdayshvprintsubjectslongnames` | false | 0 |
| `--subjectsdayshvprintsubjectscodes` | false | 0 |
| `--subjectsdayshvprintactivitytagsnames` | true | 2 |
| `--subjectsdayshvprintactivitytagslongnames` | false | 0 |
| `--subjectsdayshvprintactivitytagscodes` | false | 0 |
| `--subjectsdayshvprintteachersnames` | true | 2 |
| `--subjectsdayshvprintteacherslongnames` | false | 0 |
| `--subjectsdayshvprintteacherscodes` | false | 0 |
| `--subjectsdayshvprintstudentsnames` | true | 2 |
| `--subjectsdayshvprintstudentslongnames` | false | 0 |
| `--subjectsdayshvprintstudentscodes` | false | 0 |
| `--subjectsdayshvprintroomsnames` | true | 0 |
| `--subjectsdayshvprintroomslongnames` | false | 0 |
| `--subjectsdayshvprintroomscodes` | false | 0 |
| `--subjectsdayshvprintsubjectslegend` | false | 2 |
| `--subjectsdayshvprintactivitytagslegend` | false | 2 |
| `--subjectsdayshvprintteacherslegend` | false | 2 |
| `--subjectsdayshvprintstudentslegend` | false | 2 |
| `--subjectsdayshvprintroomslegend` | false | 0 |
| `--subjectsdayshvprintlegendcodesfirst` | false | 0 |
| `--subjectstimehvprintdaysnames` | true | 0 |
| `--subjectstimehvprintdayslongnames` | false | 0 |
| `--subjectstimehvprinthoursnames` | true | 0 |
| `--subjectstimehvprinthourslongnames` | false | 0 |
| `--subjectstimehvprintsubjectsnames` | true | 0 |
| `--subjectstimehvprintsubjectslongnames` | false | 0 |
| `--subjectstimehvprintsubjectscodes` | false | 0 |
| `--subjectstimehvprintactivitytagsnames` | true | 2 |
| `--subjectstimehvprintactivitytagslongnames` | false | 0 |
| `--subjectstimehvprintactivitytagscodes` | false | 0 |
| `--subjectstimehvprintteachersnames` | true | 2 |
| `--subjectstimehvprintteacherslongnames` | false | 0 |
| `--subjectstimehvprintteacherscodes` | false | 0 |
| `--subjectstimehvprintstudentsnames` | true | 2 |
| `--subjectstimehvprintstudentslongnames` | false | 0 |
| `--subjectstimehvprintstudentscodes` | false | 0 |
| `--subjectstimehvprintroomsnames` | true | 0 |
| `--subjectstimehvprintroomslongnames` | false | 0 |
| `--subjectstimehvprintroomscodes` | false | 0 |
| `--subjectstimehvprintsubjectslegend` | false | 2 |
| `--subjectstimehvprintactivitytagslegend` | false | 2 |
| `--subjectstimehvprintteacherslegend` | false | 2 |
| `--subjectstimehvprintstudentslegend` | false | 2 |
| `--subjectstimehvprintroomslegend` | false | 0 |
| `--subjectstimehvprintlegendcodesfirst` | false | 0 |
| `--activitytagsdayshvprintdaysnames` | true | 0 |
| `--activitytagsdayshvprintdayslongnames` | false | 0 |
| `--activitytagsdayshvprinthoursnames` | true | 0 |
| `--activitytagsdayshvprinthourslongnames` | false | 0 |
| `--activitytagsdayshvprintsubjectsnames` | true | 2 |
| `--activitytagsdayshvprintsubjectslongnames` | false | 0 |
| `--activitytagsdayshvprintsubjectscodes` | false | 0 |
| `--activitytagsdayshvprintactivitytagsnames` | true | 2 |
| `--activitytagsdayshvprintactivitytagslongnames` | false | 0 |
| `--activitytagsdayshvprintactivitytagscodes` | false | 0 |
| `--activitytagsdayshvprintteachersnames` | true | 2 |
| `--activitytagsdayshvprintteacherslongnames` | false | 0 |
| `--activitytagsdayshvprintteacherscodes` | false | 0 |
| `--activitytagsdayshvprintstudentsnames` | true | 2 |
| `--activitytagsdayshvprintstudentslongnames` | false | 0 |
| `--activitytagsdayshvprintstudentscodes` | false | 0 |
| `--activitytagsdayshvprintroomsnames` | true | 0 |
| `--activitytagsdayshvprintroomslongnames` | false | 0 |
| `--activitytagsdayshvprintroomscodes` | false | 0 |
| `--activitytagsdayshvprintsubjectslegend` | false | 2 |
| `--activitytagsdayshvprintactivitytagslegend` | false | 2 |
| `--activitytagsdayshvprintteacherslegend` | false | 2 |
| `--activitytagsdayshvprintstudentslegend` | false | 2 |
| `--activitytagsdayshvprintroomslegend` | false | 0 |
| `--activitytagsdayshvprintlegendcodesfirst` | false | 0 |
| `--activitytagstimehvprintdaysnames` | true | 0 |
| `--activitytagstimehvprintdayslongnames` | false | 0 |
| `--activitytagstimehvprinthoursnames` | true | 0 |
| `--activitytagstimehvprinthourslongnames` | false | 0 |
| `--activitytagstimehvprintsubjectsnames` | true | 2 |
| `--activitytagstimehvprintsubjectslongnames` | false | 0 |
| `--activitytagstimehvprintsubjectscodes` | false | 0 |
| `--activitytagstimehvprintactivitytagsnames` | true | 2 |
| `--activitytagstimehvprintactivitytagslongnames` | false | 0 |
| `--activitytagstimehvprintactivitytagscodes` | false | 0 |
| `--activitytagstimehvprintteachersnames` | true | 2 |
| `--activitytagstimehvprintteacherslongnames` | false | 0 |
| `--activitytagstimehvprintteacherscodes` | false | 0 |
| `--activitytagstimehvprintstudentsnames` | true | 2 |
| `--activitytagstimehvprintstudentslongnames` | false | 0 |
| `--activitytagstimehvprintstudentscodes` | false | 0 |
| `--activitytagstimehvprintroomsnames` | true | 0 |
| `--activitytagstimehvprintroomslongnames` | false | 0 |
| `--activitytagstimehvprintroomscodes` | false | 0 |
| `--activitytagstimehvprintsubjectslegend` | false | 2 |
| `--activitytagstimehvprintactivitytagslegend` | false | 2 |
| `--activitytagstimehvprintteacherslegend` | false | 2 |
| `--activitytagstimehvprintstudentslegend` | false | 2 |
| `--activitytagstimehvprintroomslegend` | false | 0 |
| `--activitytagstimehvprintlegendcodesfirst` | false | 0 |
| `--activitiesdayshvprintdaysnames` | true | 0 |
| `--activitiesdayshvprintdayslongnames` | false | 0 |
| `--activitiesdayshvprinthoursnames` | true | 0 |
| `--activitiesdayshvprinthourslongnames` | false | 0 |
| `--activitiesdayshvprintsubjectsnames` | true | 2 |
| `--activitiesdayshvprintsubjectslongnames` | false | 0 |
| `--activitiesdayshvprintsubjectscodes` | false | 0 |
| `--activitiesdayshvprintactivitytagsnames` | true | 2 |
| `--activitiesdayshvprintactivitytagslongnames` | false | 0 |
| `--activitiesdayshvprintactivitytagscodes` | false | 0 |
| `--activitiesdayshvprintteachersnames` | true | 2 |
| `--activitiesdayshvprintteacherslongnames` | false | 0 |
| `--activitiesdayshvprintteacherscodes` | false | 0 |
| `--activitiesdayshvprintstudentsnames` | true | 2 |
| `--activitiesdayshvprintstudentslongnames` | false | 0 |
| `--activitiesdayshvprintstudentscodes` | false | 0 |
| `--activitiesdayshvprintroomsnames` | true | 0 |
| `--activitiesdayshvprintroomslongnames` | false | 0 |
| `--activitiesdayshvprintroomscodes` | false | 0 |
| `--activitiesdayshvprintsubjectslegend` | false | 2 |
| `--activitiesdayshvprintactivitytagslegend` | false | 2 |
| `--activitiesdayshvprintteacherslegend` | false | 2 |
| `--activitiesdayshvprintstudentslegend` | false | 2 |
| `--activitiesdayshvprintroomslegend` | false | 0 |
| `--activitiesdayshvprintlegendcodesfirst` | false | 0 |
| `--activitiestimehvprintdaysnames` | true | 0 |
| `--activitiestimehvprintdayslongnames` | false | 0 |
| `--activitiestimehvprinthoursnames` | true | 0 |
| `--activitiestimehvprinthourslongnames` | false | 0 |
| `--activitiestimehvprintsubjectsnames` | true | 2 |
| `--activitiestimehvprintsubjectslongnames` | false | 0 |
| `--activitiestimehvprintsubjectscodes` | false | 0 |
| `--activitiestimehvprintactivitytagsnames` | true | 2 |
| `--activitiestimehvprintactivitytagslongnames` | false | 0 |
| `--activitiestimehvprintactivitytagscodes` | false | 0 |
| `--activitiestimehvprintteachersnames` | true | 2 |
| `--activitiestimehvprintteacherslongnames` | false | 0 |
| `--activitiestimehvprintteacherscodes` | false | 0 |
| `--activitiestimehvprintstudentsnames` | true | 2 |
| `--activitiestimehvprintstudentslongnames` | false | 0 |
| `--activitiestimehvprintstudentscodes` | false | 0 |
| `--activitiestimehvprintroomsnames` | true | 0 |
| `--activitiestimehvprintroomslongnames` | false | 0 |
| `--activitiestimehvprintroomscodes` | false | 0 |
| `--activitiestimehvprintsubjectslegend` | false | 2 |
| `--activitiestimehvprintactivitytagslegend` | false | 2 |
| `--activitiestimehvprintteacherslegend` | false | 2 |
| `--activitiestimehvprintstudentslegend` | false | 2 |
| `--activitiestimehvprintroomslegend` | false | 0 |
| `--activitiestimehvprintlegendcodesfirst` | false | 0 |
| `--teachersfreeperiodsprintdaysnames` | true | 0 |
| `--teachersfreeperiodsprintdayslongnames` | false | 0 |
| `--teachersfreeperiodsprinthoursnames` | true | 0 |
| `--teachersfreeperiodsprinthourslongnames` | false | 0 |
| `--teachersfreeperiodsprintteachersnames` | true | 0 |
| `--teachersfreeperiodsprintteacherslongnames` | false | 0 |
| `--teachersfreeperiodsprintteacherscodes` | false | 0 |
| `--statisticsprintteachersnames` | true | 0 |
| `--statisticsprintteacherslongnames` | false | 0 |
| `--statisticsprintteacherscodes` | false | 0 |
| `--statisticsprintstudentsnames` | true | 0 |
| `--statisticsprintstudentslongnames` | false | 1 |
| `--statisticsprintstudentscodes` | false | 1 |
