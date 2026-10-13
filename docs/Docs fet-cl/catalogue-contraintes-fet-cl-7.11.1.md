# Catalogue des contraintes et capacites de fet-cl 7.11.1

Genere le 07/10/2026 08:59 par le validateur d'interfacage fet-cl 3.0.0 a partir d'executions reelles de `/tmp/fet-7.11.1/build/src/cl/fet-cl`.

Chaque type de contrainte a ete injecte dans un petit etablissement de reference (3 enseignants, 3 matieres, 2 annees dont une avec groupes et sous-groupes, 3 salles dans 2 batiments, 10 activites) puis soumis a fet-cl dans les 4 modes (Official, Mornings_Afternoons, Block_Planning, Terms), avec un poids de 100 %, 50 %, 0 % et 101 %, et avec `Active=false`.

## Comment lire la classification

- **toujours bloquante (poids 100 % obligatoire)** : fet-cl refuse le fichier si le poids est < 100 % (code 1, message du type `Please make weight 100%`). La contrainte est une regle dure.
- **toujours bloquante (poids < 100 % : abandon du programme)** : meme regle, mais fet-cl 7.11.1 ne refuse pas proprement : il s'arrete sur une assertion (signal SIGABRT : code -6 vu de Python, 134 vu du shell). Votre interface doit imposer 100 % avant l'appel.
- **facultative possible (poids < 100 % accepte)** : a 100 % la contrainte est bloquante ; en dessous, elle devient une preference : une violation n'empeche pas la generation et est comptee dans `soft_conflicts.txt` (voir la section Poids).
- **inutilisable avec l'instance de sonde** : aucun des 4 modes n'a accepte l'instance generee automatiquement (prerequis particulier, voir le message).

## Synthese

| Classification | Temps | Espace | Total |
|---|---:|---:|---:|
| toujours bloquante (poids 100 % obligatoire) | 194 | 60 | 254 |
| facultative possible (poids < 100 % accepte) | 67 | 15 | 82 |
| toujours bloquante (poids < 100 % : abandon du programme) | 10 | 6 | 16 |
| **Total** | 271 | 81 | **352** |

### Modes acceptes

| Modes (Off = Official, MA = matins/apres-midis, Bloc = Block_Planning, Trim = Terms) | Nombre de contraintes |
|---|---:|
| Off, MA, Bloc, Trim | 201 |
| MA | 136 |
| Trim | 6 |
| Off, Bloc, Trim | 6 |
| Bloc | 3 |

### Abandons du programme (assertions) observes

| Contrainte | Situation | Message |
|---|---|---|
| `ConstraintActivityTagsNotOverlapping` | poids 101 | Assertion `catno->weightPercentage>=0.0 && catno->weightPercentage<=100.0' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintMinDaysBetweenActivities` | poids 101 | Assertion `md->weightPercentage>=0 && md->weightPercentage<=100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintMaxDaysBetweenActivities` | poids 101 | Assertion `md->weightPercentage >=0 && md->weightPercentage<=100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintActivitiesMaxHourlySpan` | poids 101 | Assertion `ms->weightPercentage >=0 && ms->weightPercentage<=100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintMinGapsBetweenActivities` | poids 101 | Assertion `mg->weightPercentage >=0 && mg->weightPercentage<=100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintMaxGapsBetweenActivities` | poids 101 | Assertion `mg->weightPercentage >=0 && mg->weightPercentage<=100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintTeacherMaxActivityTagsPerDayFromSet` | poids 50, poids 0, poids 101 | Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintTeachersMaxActivityTagsPerDayFromSet` | poids 50, poids 0, poids 101 | Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintTeacherMaxZeroGapsPerAfternoon` | poids 50, poids 0, poids 101 | Assertion `tg->weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintTeachersMaxZeroGapsPerAfternoon` | poids 50, poids 0, poids 101 | Assertion `tg->weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintMinHalfDaysBetweenActivities` | poids 101 | Assertion `md->weightPercentage>=0 && md->weightPercentage<=100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintMaxTermsBetweenActivities` | poids 101 | Assertion `mt->weightPercentage >=0 && mt->weightPercentage<=100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintStudentsSetMaxActivityTagsPerDayFromSet` | poids 50, poids 0, poids 101 | Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintStudentsMaxActivityTagsPerDayFromSet` | poids 50, poids 0, poids 101 | Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintTeacherMaxActivityTagsPerRealDayFromSet` | poids 50, poids 0, poids 101 | Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintTeachersMaxActivityTagsPerRealDayFromSet` | poids 50, poids 0, poids 101 | Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintStudentsSetMaxActivityTagsPerRealDayFromSet` | poids 50, poids 0, poids 101 | Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintStudentsMaxActivityTagsPerRealDayFromSet` | poids 50, poids 0, poids 101 | Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintMaxHalfDaysBetweenActivities` | poids 101 | Assertion `md->weightPercentage >=0 && md->weightPercentage<=100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintRoomMaxActivityTagsPerDayFromSet` | poids 50, poids 0, poids 101 | Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintRoomMaxActivityTagsPerRealDayFromSet` | poids 50, poids 0, poids 101 | Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintRoomMaxActivityTagsPerWeekFromSet` | poids 50, poids 0, poids 101 | Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintRoomsMaxActivityTagsPerDayFromSet` | poids 50, poids 0, poids 101 | Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintRoomsMaxActivityTagsPerRealDayFromSet` | poids 50, poids 0, poids 101 | Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)] |
| `ConstraintRoomsMaxActivityTagsPerWeekFromSet` | poids 50, poids 0, poids 101 | Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)] |

## Avertissements de la campagne

14 test(s) en avertissement : comportement non bloquant pour la recette, mais a connaitre pour l'interfacage. Le detail figure dans le rapport HTML de la campagne. Les abandons lies au poids des contraintes (tests TC / SC, classes en reussite) sont listes plus haut dans « Abandons du programme (assertions) observes ».

| Test | Categorie | Sujet | Constat | Consequence pour l'interface |
|---|---|---|---|---|
| ARG-14 | 2. Arguments et codes de retour | Graines s20..s22 entre m2 et m1-1 | -6 (tue par le signal SIGABRT); -6 (tue par le signal SIGABRT) | Borner s20, s21 et s22 a 4294944442 dans le superviseur (fet-cl ne le fait pas). |
| GEN-08 | 4. Generation et sorties | --language=fr | fet_fr.qm introuvable : repli en_US (installez translations/ a cote de fet-cl ou dans ../share/fet/translations) | Livrer le dossier translations (fet_fr.qm) a cote de fet-cl, sinon les messages restent en anglais. |
| CAP-02 | 6. Capacites et modes | Mode matins/apres-midis sans comportement enseignant | abandon du programme (Assertion `0' failed, SIGABRT) | Toujours ecrire <Mornings_Afternoons_Behavior> avec une valeur valide pour chaque enseignant en mode matins/apres-midis. |
| CAP-11 | 6. Capacites et modes | Creneau duplique dans un ensemble de creneaux | abandon du programme (Assertion `ts.count()==tl.count()' failed, SIGABRT) | Verifier l'unicite des creneaux de chaque ensemble avant d'ecrire le fichier .fet. |
| CAP-13 | 6. Capacites et modes | References invalides dans une contrainte | abandon du programme (Assertion `this->teacherIndex>=0' failed, SIGABRT) | Verifier que chaque enseignant, groupe, salle ou activite cite dans une contrainte existe. |
| PDS-04 | 7. Poids : bloquant / facultatif | Valeurs de poids limites ou invalides | 99,5 -> acceptee (relu 0), 101 -> acceptee (relu 101), -5 -> acceptee (relu -5), abc -> acceptee (relu 0), (vide) -> acceptee (relu 0) | Borner les poids a [0, 100] et ecrire un point decimal (99.5), jamais une virgule. |
| OPT-03 | 9. Options de ligne de commande | Lecture des valeurs booleennes | valeur lue par sa fin : --writetimetablesxml=TRUE -> active, --writetimetablesxml=1 -> active, --writetimetablesxml=xtrue -> active, --writetimetablesxml=notfalse -> desactive, --exportcsv=TRUE -> desactive, --exportcsv=1 -> desactive, --exportcsv=xtrue -> active, --exportcsv=notfalse -> desactive | Ecrire exactement true ou false (en minuscules) pour les options booleennes. |
| ROB-05 | 12. Robustesse des donnees | Id d'activite nul | acceptee : donnee invalide acceptee sans message | Numeroter les activites a partir de 1 (0 signifie "aucun" pour Activity_Group_Id). |
| ROB-11 | 12. Robustesse des donnees | Nom de jour en double | acceptee : donnee invalide acceptee sans message | Verifier l'unicite des noms de jours avant d'ecrire le .fet. |
| ROB-43 | 12. Robustesse des donnees | Nom de jour vide | acceptee : donnee invalide acceptee sans message; AMBIGU: activite 5 non placee | Refuser les noms de jours ou d'heures vides : Day="" se confond avec une activite non placee. |
| ROB-44 | 12. Robustesse des donnees | Nom d'heure en double | acceptee : donnee invalide acceptee sans message; AMBIGU: chevauchement enseignant 'Prof A' le Mercredi a H1 : activites 1 et 2; AMBIGU: chevauchement sous-groupe 'Y1 G1 a' le Mercredi a H1 : activites 1 et 2; AMBIGU: chevauchement sous-groupe 'Y1 G1 b' le Mercredi a H1 : activites 1 et 2 | Verifier l'unicite des noms d'heures : les sorties ne designent les creneaux que par leur nom. |
| ROB-50 | 12. Robustesse des donnees | Fuzzing aleatoire reproductible (1000 mutations) | vide-element Name; vide-element Name; vide-element Name; 3 abandon(s), 2 signature(s) | Valider le .fet cote superviseur (noms, references, batiments, poids) avant d'appeler fet-cl. |
| SYS-05 | 14. Integration systeme Linux | Disque plein simule (RLIMIT_FSIZE et /dev/full) | code -25 (tue par le signal SIGXFSZ) mais result.txt indique 'Generation successful' : toujours verifier le code ET la completude des sorties | Verifier le code de sortie ET la presence de <nom>_activities.xml, pas seulement result.txt. |
| SYS-13 | 14. Integration systeme Linux | Deux executions simultanees dans le meme --outputdir | logs/ est partage : la trace d'une des executions est ecrasee; moyen | Un --outputdir neuf par execution : logs/ est partage. |

## Capacites, modes et robustesse

### CAP-01 - Les 4 modes de FET (PASS)

- Official : acceptee, 6 jours x 6 heures, 10 activites placees
- Mornings_Afternoons : acceptee, 8 jours x 4 heures, 10 activites placees
- Block_Planning : acceptee, 6 jours x 6 heures, 10 activites placees
- Terms : acceptee, 6 jours x 6 heures, 10 activites placees

### CAP-02 - Mode matins/apres-midis sans comportement enseignant (WARN)

- resultat : abandon du programme - Assertion `0' failed. [code -6 (tue par le signal SIGABRT)]
- valeur inconnue : abandon du programme - Assertion `0' failed. [code -6 (tue par le signal SIGABRT)]

### CAP-03 - Limites : jours et heures (PASS)

- jours=0 : refusee (lecture) - Could not read file - XML parse error at line 5, column 45: | Number_of_Days is incorrect
- heures=0 : refusee (lecture) - Could not read file - XML parse error at line 6, column 48: | Number_of_Hours is incorrect
- jours=1000 : acceptee
- jours=1001 : refusee (lecture) - Could not read file - XML parse error at line 5, column 48: | Number_of_Days is too large. Maximum allowed is 1000.
- heures=1440 : acceptee
- heures=1441 : refusee (lecture) - Could not read file - XML parse error at line 6, column 51: | Number is too large. Maximum allowed is 1440.

### CAP-04 - Duree d'activite superieure a la journee (PASS)

- refusee (precalcul) - Activity with id=20 (7 - Prof C - Maths - Y2) has no allowed slot - please correct that. | Button 0 text: Skip rest | Button 1 text: See next | Default button: 1

### CAP-05 - Activites fractionnees (sous-activites) (PASS)


### CAP-06 - Plusieurs enseignants et groupes par activite (PASS)


### CAP-07 - Activites sans enseignant / sans eleves / inactives (PASS)


### CAP-08 - Activite verrouillee (Permanently_Locked) (PASS)


### CAP-09 - Salle virtuelle (ensembles de salles reelles) (PASS)

- acceptee 
- sortie : <Id>1</Id> <Day>Mercredi</Day> <Hour>H1</Hour> <Room>V1</Room> <Real_Room>R3</Real_Room> <Real_Room>R2</Real_Room> </Activity>

### CAP-10 - Montee en charge (PASS)

- 5 classes, 119 activites : Generation successful en 0.1 s
- 10 classes, 232 activites : Generation successful en 0.1 s
- 20 classes, 471 activites : Generation successful en 0.1 s
- 40 classes, 941 activites : Generation successful en 0.1 s
- 80 classes, 1872 activites : Generation successful en 0.3 s

### CAP-11 - Creneau duplique dans un ensemble de creneaux (WARN)

- abandon du programme - Assertion `ts.count()==tl.count()' failed. [code -6 (tue par le signal SIGABRT)]

### CAP-12 - Balise de contrainte inconnue (PASS)

- acceptee - There is an unrecognized XML tag in your input file. It is written below. Your file will be opened, but this tag will be ignored and it probably represents a mistake in your input file: | Line 14, column 193: ConstraintI

### CAP-13 - References invalides dans une contrainte (WARN)

- enseignant inexistant : abandon du programme - Assertion `this->teacherIndex>=0' failed. [code -6 (tue par le signal SIGABRT)]
- activite inexistante : refusee (precalcul) - Following constraint is wrong (because it refers to invalid activity id). Please correct it (maybe removing it is a solution): | Time constraint | Activity with id=? (Invalid (nonexistent) id for acti

### CAP-14 - Fichier d'une ancienne version / racine incorrecte (PASS)

- version 5.0.0 : acceptee - Opening an older file - it will be converted to the latest format. FET detected that this file was generated with a FET-5 version. After opening, please check your constraints. If this is not true, pl
- version 99.0.0 : acceptee - Opening a file generated with a newer version than your current FET software ... file will be opened but it is recommended to update your FET software to the latest version | Your FET version: 7.11.1,
- racine incorrecte : refusee (precalcul) - File is incorrect...it cannot be opened

### CAP-15 - Donnees impossibles detectees au precalcul (PASS)

- infaisable (Time exceeded) - Found constraint activity preferred starting time, with unspecified tag 'permanently locked' - this tag will be set to 'false' by default. You can always modify it by editing the constraint in the 'Data' menu | Explanati


## Poids : bloquant ou facultatif

Experiences ciblees sur la semantique du poids (Weight_Percentage).

### PDS-01 - Contrainte bloquante (100 %) en conflit (PASS)

- refusee (precalcul) - Activity with id=1 (1 - Prof A - Maths - Tag1 - Y1 G1) has no allowed slot - please correct that. | Button 0 text: Skip rest | Button 1 text: See next | Default button: 1

### PDS-02 - Meme contrainte a 95 % : facultative (PASS)

- total des conflits souples = 0.95 (poids de la contrainte violee : 95)

### PDS-03 - Poids 0 % et contrainte inactive (PASS)

- poids 0 % : conflits souples = 0.0

### PDS-04 - Valeurs de poids limites ou invalides (WARN)

- poids '99.5' : acceptee, relu 99.5
- poids '99,5' : acceptee, relu 0
- poids '100.0' : acceptee, relu 100
- poids '101' : acceptee, relu 101
- poids '-5' : acceptee, relu -5
- poids 'abc' : acceptee, relu 0
- poids '' : acceptee, relu 0

### PDS-05 - Cumul des conflits souples (PASS)

- Total soft conflicts = 1.75 pour deux violations de poids 95 et 80

### PDS-06 - Poids < 100 % sur contrainte satisfiable : taux de respect (PASS)

- poids 50 % : preference respectee dans 0/6 solutions
- poids 90 % : preference respectee dans 0/6 solutions
- poids 100 % : preference respectee dans 6/6 solutions


## Respect effectif des contraintes

Chaque contrainte est posee a 100 % puis le resultat (`*_activities.xml`) est verifie par le validateur, independamment de FET.

### RSP-01 - Activite 1 imposee Mercredi H3 (PASS)


### RSP-02 - Activite 1 : debut Mardi H2 ou Jeudi H5 (PASS)


### RSP-03 - Activite 7 (2 h) dans Vendredi H1-H3 (PASS)


### RSP-04 - Prof A indisponible lundi-mercredi (PASS)


### RSP-05 - Y2 indisponible vendredi et samedi (PASS)


### RSP-06 - Pause chaque jour a H3 (PASS)


### RSP-07 - Activites 4 et 5 simultanees (PASS)


### RSP-08 - Activites 3 et 5 jamais en meme temps (PASS)


### RSP-09 - Activites 1 et 2 a 3 jours d'ecart minimum (PASS)


### RSP-10 - Activites 1 et 5 le meme jour (ecart max 0) (PASS)


### RSP-11 - Activite 5 immediatement apres l'activite 4 (PASS)


### RSP-12 - Activite 5 avant l'activite 4 (PASS)


### RSP-13 - Prof B : 2 h maximum par jour (PASS)


### RSP-14 - Prof A : 1 jour de travail maximum (PASS)


### RSP-15 - Prof B : aucun trou dans la journee (PASS)


### RSP-16 - Y1 G1 : 2 h maximum par jour (PASS)


### RSP-17 - Prof C : 0 ou au moins 2 h par jour (PASS)


### RSP-18 - Enseignants : 2 h d'affilee maximum (PASS)


### RSP-19 - Prof A : 1 h etiquetee Tag1 par jour (PASS)


### RSP-20 - Activite 6 termine la journee de Y2 (PASS)


### RSP-21 - Activite 1 en salle R2 (PASS)


### RSP-22 - Physique en salle R3 (PASS)


### RSP-23 - R1 indisponible lundi-mercredi (Maths en R1) (PASS)


| Test | Contrainte | Verdict |
|---|---|---|
| RSP-01 | Activite 1 imposee Mercredi H3 | PASS |
| RSP-02 | Activite 1 : debut Mardi H2 ou Jeudi H5 | PASS |
| RSP-03 | Activite 7 (2 h) dans Vendredi H1-H3 | PASS |
| RSP-04 | Prof A indisponible lundi-mercredi | PASS |
| RSP-05 | Y2 indisponible vendredi et samedi | PASS |
| RSP-06 | Pause chaque jour a H3 | PASS |
| RSP-07 | Activites 4 et 5 simultanees | PASS |
| RSP-08 | Activites 3 et 5 jamais en meme temps | PASS |
| RSP-09 | Activites 1 et 2 a 3 jours d'ecart minimum | PASS |
| RSP-10 | Activites 1 et 5 le meme jour (ecart max 0) | PASS |
| RSP-11 | Activite 5 immediatement apres l'activite 4 | PASS |
| RSP-12 | Activite 5 avant l'activite 4 | PASS |
| RSP-13 | Prof B : 2 h maximum par jour | PASS |
| RSP-14 | Prof A : 1 jour de travail maximum | PASS |
| RSP-15 | Prof B : aucun trou dans la journee | PASS |
| RSP-16 | Y1 G1 : 2 h maximum par jour | PASS |
| RSP-17 | Prof C : 0 ou au moins 2 h par jour | PASS |
| RSP-18 | Enseignants : 2 h d'affilee maximum | PASS |
| RSP-19 | Prof A : 1 h etiquetee Tag1 par jour | PASS |
| RSP-20 | Activite 6 termine la journee de Y2 | PASS |
| RSP-21 | Activite 1 en salle R2 | PASS |
| RSP-22 | Physique en salle R3 | PASS |
| RSP-23 | R1 indisponible lundi-mercredi (Maths en R1) | PASS |

## Options de ligne de commande

### OPT-01 - Toutes les options documentees sont reconnues (PASS)

- options analysees par fet-cl mais absentes de --help : --randomseedx, --randomseedy, --timetablehtmllevel
- 534 options documentees, 521 booleennes selon les sources

### OPT-02 - Effet de chaque option booleenne (PASS)

- reference : 58 fichiers (--exportcsv=true, htmllevel 2)
- 521 options booleennes testees : 155 avec effet visible, 366 sans effet sur cette instance (dependantes d'un autre reglage ou des donnees)

### OPT-03 - Lecture des valeurs booleennes (WARN)

- interpretation : --writetimetablesxml=true -> active, --writetimetablesxml=false -> desactive, --writetimetablesxml=TRUE -> active, --writetimetablesxml=FALSE -> active, --writetimetablesxml=1 -> active, --writetimetablesxml=0 -> active, --writetimetablesxml=yes -> active, --writetimetablesxml=no -> active, --writetimetablesxml=xtrue -> active, --writetimetablesxml=notfalse -> desactive, --writetimetablesxml=maybe -> active, --writetimetablesxml= -> active, --exportcsv=true -> active, --exportcsv=false -> desactive, --exportcsv=TRUE -> desactive, --exportcsv=FALSE -> desactive, --exportcsv=1 -> desactive, --exportcsv=0 -> desactive, --exportcsv=yes -> desactive, --exportcsv=no -> desactive, --exportcsv=xtrue -> active, --exportcsv=notfalse -> desactive, --exportcsv=maybe -> desactive, --exportcsv= -> desactive

### OPT-04 - Valeurs invalides des options a valeur (PASS)

- --htmllevel=-1 : code 1, pas de resultat - Incorrect command-line parameters (The HTML level must be 0, 1, 2, 3, 4, 5, 6, or 7).
- --htmllevel=8 : code 1, pas de resultat - Incorrect command-line parameters (The HTML level must be 0, 1, 2, 3, 4, 5, 6, or 7).
- --htmllevel=abc : code 0, Generation successful
- --timelimitseconds=0 : code 1, pas de resultat - Incorrect command-line parameters (Time limit is 0 seconds).
- --timelimitseconds=-5 : code 0, Time exceeded
- --timelimitseconds=abc : code 1, pas de resultat - Incorrect command-line parameters (Time limit is 0 seconds).
- --timelimitseconds=99999999999 : code 1, pas de resultat - Incorrect command-line parameters (Time limit is 0 seconds).
- --language=xx : code 0, Generation successful
- --language=FR : code 0, Generation successful
- --language= : code 0, Generation successful
- --quotescsv=guillemets : code 0, Generation successful
- --fieldseparatorcsv=tab : code 0, Generation successful
- --HTMLLEVEL=3 : code 0, Generation successful - Unrecognized option: --HTMLLEVEL=3
- --exportcsv : code 0, Generation successful - Unrecognized option: --exportcsv
- --timetablehtmllevel=7 : code 0, Generation successful

### OPT-05 - Option repetee et ordre des options (PASS)

- taille HTML : 0 -> 246358 o, 5 -> 642706 o, 0 puis 5 -> 642706 o, 5 puis 0 -> 246358 o

### OPT-06 - Mode verbeux (PASS)

- lignes en sortie : verbose=false 3, verbose=true 65


### Effet observe de chaque option booleenne

Valeur par defaut d'apres les sources de fetcl.cpp ; effet = fichiers modifies / ajoutes / supprimes par la valeur inverse, avec `--exportcsv=true` et `--htmllevel=2`.

| Option | Defaut | Defaut verifie | Fichiers modifies | ajoutes | supprimes |
|---|---|---|---:|---:|---:|
| `--activitiesdayshvprintactivitytagscodes` | false | oui | 0 | 0 | 0 |
| `--activitiesdayshvprintactivitytagslegend` | false | oui | 2 | 0 | 0 |
| `--activitiesdayshvprintactivitytagslongnames` | false | oui | 0 | 0 | 0 |
| `--activitiesdayshvprintactivitytagsnames` | true | oui | 2 | 0 | 0 |
| `--activitiesdayshvprintdayslongnames` | false | oui | 0 | 0 | 0 |
| `--activitiesdayshvprintdaysnames` | true | oui | 0 | 0 | 0 |
| `--activitiesdayshvprinthourslongnames` | false | oui | 0 | 0 | 0 |
| `--activitiesdayshvprinthoursnames` | true | oui | 0 | 0 | 0 |
| `--activitiesdayshvprintlegendcodesfirst` | false | oui | 0 | 0 | 0 |
| `--activitiesdayshvprintroomscodes` | false | oui | 0 | 0 | 0 |
| `--activitiesdayshvprintroomslegend` | false | oui | 0 | 0 | 0 |
| `--activitiesdayshvprintroomslongnames` | false | oui | 0 | 0 | 0 |
| `--activitiesdayshvprintroomsnames` | true | oui | 0 | 0 | 0 |
| `--activitiesdayshvprintstudentscodes` | false | oui | 0 | 0 | 0 |
| `--activitiesdayshvprintstudentslegend` | false | oui | 2 | 0 | 0 |
| `--activitiesdayshvprintstudentslongnames` | false | oui | 0 | 0 | 0 |
| `--activitiesdayshvprintstudentsnames` | true | oui | 2 | 0 | 0 |
| `--activitiesdayshvprintsubjectscodes` | false | oui | 0 | 0 | 0 |
| `--activitiesdayshvprintsubjectslegend` | false | oui | 2 | 0 | 0 |
| `--activitiesdayshvprintsubjectslongnames` | false | oui | 0 | 0 | 0 |
| `--activitiesdayshvprintsubjectsnames` | true | oui | 2 | 0 | 0 |
| `--activitiesdayshvprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--activitiesdayshvprintteacherslegend` | false | oui | 2 | 0 | 0 |
| `--activitiesdayshvprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--activitiesdayshvprintteachersnames` | true | oui | 2 | 0 | 0 |
| `--activitiestimehvprintactivitytagscodes` | false | oui | 0 | 0 | 0 |
| `--activitiestimehvprintactivitytagslegend` | false | oui | 2 | 0 | 0 |
| `--activitiestimehvprintactivitytagslongnames` | false | oui | 0 | 0 | 0 |
| `--activitiestimehvprintactivitytagsnames` | true | oui | 2 | 0 | 0 |
| `--activitiestimehvprintdayslongnames` | false | oui | 0 | 0 | 0 |
| `--activitiestimehvprintdaysnames` | true | oui | 0 | 0 | 0 |
| `--activitiestimehvprinthourslongnames` | false | oui | 0 | 0 | 0 |
| `--activitiestimehvprinthoursnames` | true | oui | 0 | 0 | 0 |
| `--activitiestimehvprintlegendcodesfirst` | false | oui | 0 | 0 | 0 |
| `--activitiestimehvprintroomscodes` | false | oui | 0 | 0 | 0 |
| `--activitiestimehvprintroomslegend` | false | oui | 0 | 0 | 0 |
| `--activitiestimehvprintroomslongnames` | false | oui | 0 | 0 | 0 |
| `--activitiestimehvprintroomsnames` | true | oui | 0 | 0 | 0 |
| `--activitiestimehvprintstudentscodes` | false | oui | 0 | 0 | 0 |
| `--activitiestimehvprintstudentslegend` | false | oui | 2 | 0 | 0 |
| `--activitiestimehvprintstudentslongnames` | false | oui | 0 | 0 | 0 |
| `--activitiestimehvprintstudentsnames` | true | oui | 2 | 0 | 0 |
| `--activitiestimehvprintsubjectscodes` | false | oui | 0 | 0 | 0 |
| `--activitiestimehvprintsubjectslegend` | false | oui | 2 | 0 | 0 |
| `--activitiestimehvprintsubjectslongnames` | false | oui | 0 | 0 | 0 |
| `--activitiestimehvprintsubjectsnames` | true | oui | 2 | 0 | 0 |
| `--activitiestimehvprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--activitiestimehvprintteacherslegend` | false | oui | 2 | 0 | 0 |
| `--activitiestimehvprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--activitiestimehvprintteachersnames` | true | oui | 2 | 0 | 0 |
| `--activitytagsdayshvprintactivitytagscodes` | false | oui | 0 | 0 | 0 |
| `--activitytagsdayshvprintactivitytagslegend` | false | oui | 2 | 0 | 0 |
| `--activitytagsdayshvprintactivitytagslongnames` | false | oui | 0 | 0 | 0 |
| `--activitytagsdayshvprintactivitytagsnames` | true | oui | 2 | 0 | 0 |
| `--activitytagsdayshvprintdayslongnames` | false | oui | 0 | 0 | 0 |
| `--activitytagsdayshvprintdaysnames` | true | oui | 0 | 0 | 0 |
| `--activitytagsdayshvprinthourslongnames` | false | oui | 0 | 0 | 0 |
| `--activitytagsdayshvprinthoursnames` | true | oui | 0 | 0 | 0 |
| `--activitytagsdayshvprintlegendcodesfirst` | false | oui | 0 | 0 | 0 |
| `--activitytagsdayshvprintroomscodes` | false | oui | 0 | 0 | 0 |
| `--activitytagsdayshvprintroomslegend` | false | oui | 0 | 0 | 0 |
| `--activitytagsdayshvprintroomslongnames` | false | oui | 0 | 0 | 0 |
| `--activitytagsdayshvprintroomsnames` | true | oui | 0 | 0 | 0 |
| `--activitytagsdayshvprintstudentscodes` | false | oui | 0 | 0 | 0 |
| `--activitytagsdayshvprintstudentslegend` | false | oui | 2 | 0 | 0 |
| `--activitytagsdayshvprintstudentslongnames` | false | oui | 0 | 0 | 0 |
| `--activitytagsdayshvprintstudentsnames` | true | oui | 2 | 0 | 0 |
| `--activitytagsdayshvprintsubjectscodes` | false | oui | 0 | 0 | 0 |
| `--activitytagsdayshvprintsubjectslegend` | false | oui | 2 | 0 | 0 |
| `--activitytagsdayshvprintsubjectslongnames` | false | oui | 0 | 0 | 0 |
| `--activitytagsdayshvprintsubjectsnames` | true | oui | 2 | 0 | 0 |
| `--activitytagsdayshvprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--activitytagsdayshvprintteacherslegend` | false | oui | 2 | 0 | 0 |
| `--activitytagsdayshvprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--activitytagsdayshvprintteachersnames` | true | oui | 2 | 0 | 0 |
| `--activitytagstimehvprintactivitytagscodes` | false | oui | 0 | 0 | 0 |
| `--activitytagstimehvprintactivitytagslegend` | false | oui | 2 | 0 | 0 |
| `--activitytagstimehvprintactivitytagslongnames` | false | oui | 0 | 0 | 0 |
| `--activitytagstimehvprintactivitytagsnames` | true | oui | 2 | 0 | 0 |
| `--activitytagstimehvprintdayslongnames` | false | oui | 0 | 0 | 0 |
| `--activitytagstimehvprintdaysnames` | true | oui | 0 | 0 | 0 |
| `--activitytagstimehvprinthourslongnames` | false | oui | 0 | 0 | 0 |
| `--activitytagstimehvprinthoursnames` | true | oui | 0 | 0 | 0 |
| `--activitytagstimehvprintlegendcodesfirst` | false | oui | 0 | 0 | 0 |
| `--activitytagstimehvprintroomscodes` | false | oui | 0 | 0 | 0 |
| `--activitytagstimehvprintroomslegend` | false | oui | 0 | 0 | 0 |
| `--activitytagstimehvprintroomslongnames` | false | oui | 0 | 0 | 0 |
| `--activitytagstimehvprintroomsnames` | true | oui | 0 | 0 | 0 |
| `--activitytagstimehvprintstudentscodes` | false | oui | 0 | 0 | 0 |
| `--activitytagstimehvprintstudentslegend` | false | oui | 2 | 0 | 0 |
| `--activitytagstimehvprintstudentslongnames` | false | oui | 0 | 0 | 0 |
| `--activitytagstimehvprintstudentsnames` | true | oui | 2 | 0 | 0 |
| `--activitytagstimehvprintsubjectscodes` | false | oui | 0 | 0 | 0 |
| `--activitytagstimehvprintsubjectslegend` | false | oui | 2 | 0 | 0 |
| `--activitytagstimehvprintsubjectslongnames` | false | oui | 0 | 0 | 0 |
| `--activitytagstimehvprintsubjectsnames` | true | oui | 2 | 0 | 0 |
| `--activitytagstimehvprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--activitytagstimehvprintteacherslegend` | false | oui | 2 | 0 | 0 |
| `--activitytagstimehvprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--activitytagstimehvprintteachersnames` | true | oui | 2 | 0 | 0 |
| `--buildingsdayshvprintactivitytagscodes` | false | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintactivitytagslegend` | false | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintactivitytagslongnames` | false | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintactivitytagsnames` | true | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintdayslongnames` | false | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintdaysnames` | true | oui | 0 | 0 | 0 |
| `--buildingsdayshvprinthourslongnames` | false | oui | 0 | 0 | 0 |
| `--buildingsdayshvprinthoursnames` | true | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintlegendcodesfirst` | false | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintroomscodes` | false | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintroomslegend` | false | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintroomslongnames` | false | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintroomsnames` | true | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintstudentscodes` | false | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintstudentslegend` | false | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintstudentslongnames` | false | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintstudentsnames` | true | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintsubjectscodes` | false | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintsubjectslegend` | false | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintsubjectslongnames` | false | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintsubjectsnames` | true | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintteacherslegend` | false | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--buildingsdayshvprintteachersnames` | true | oui | 0 | 0 | 0 |
| `--buildingstimehvprintactivitytagscodes` | false | oui | 0 | 0 | 0 |
| `--buildingstimehvprintactivitytagslegend` | false | oui | 2 | 0 | 0 |
| `--buildingstimehvprintactivitytagslongnames` | false | oui | 0 | 0 | 0 |
| `--buildingstimehvprintactivitytagsnames` | true | oui | 0 | 0 | 0 |
| `--buildingstimehvprintdayslongnames` | false | oui | 0 | 0 | 0 |
| `--buildingstimehvprintdaysnames` | true | oui | 0 | 0 | 0 |
| `--buildingstimehvprinthourslongnames` | false | oui | 0 | 0 | 0 |
| `--buildingstimehvprinthoursnames` | true | oui | 0 | 0 | 0 |
| `--buildingstimehvprintlegendcodesfirst` | false | oui | 0 | 0 | 0 |
| `--buildingstimehvprintroomscodes` | false | oui | 0 | 0 | 0 |
| `--buildingstimehvprintroomslegend` | false | oui | 0 | 0 | 0 |
| `--buildingstimehvprintroomslongnames` | false | oui | 0 | 0 | 0 |
| `--buildingstimehvprintroomsnames` | true | oui | 0 | 0 | 0 |
| `--buildingstimehvprintstudentscodes` | false | oui | 0 | 0 | 0 |
| `--buildingstimehvprintstudentslegend` | false | oui | 2 | 0 | 0 |
| `--buildingstimehvprintstudentslongnames` | false | oui | 0 | 0 | 0 |
| `--buildingstimehvprintstudentsnames` | true | oui | 0 | 0 | 0 |
| `--buildingstimehvprintsubjectscodes` | false | oui | 0 | 0 | 0 |
| `--buildingstimehvprintsubjectslegend` | false | oui | 2 | 0 | 0 |
| `--buildingstimehvprintsubjectslongnames` | false | oui | 0 | 0 | 0 |
| `--buildingstimehvprintsubjectsnames` | true | oui | 0 | 0 | 0 |
| `--buildingstimehvprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--buildingstimehvprintteacherslegend` | false | oui | 2 | 0 | 0 |
| `--buildingstimehvprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--buildingstimehvprintteachersnames` | true | oui | 0 | 0 | 0 |
| `--dividetimeaxisbydays` | false | oui | 18 | 0 | 0 |
| `--duplicateverticalheaders` | false | oui | 40 | 0 | 0 |
| `--embedcssinhtmlhead` | false | oui | 41 | 0 | 1 |
| `--exportcsv` | false | oui | 0 | 0 | 0 |
| `--firstlineisheadingcsv` | true | oui | 9 | 0 | 0 |
| `--groupsdayshvprintactivitytagscodes` | false | oui | 0 | 0 | 0 |
| `--groupsdayshvprintactivitytagslegend` | false | oui | 2 | 0 | 0 |
| `--groupsdayshvprintactivitytagslongnames` | false | oui | 0 | 0 | 0 |
| `--groupsdayshvprintactivitytagsnames` | true | oui | 2 | 0 | 0 |
| `--groupsdayshvprintdayslongnames` | false | oui | 0 | 0 | 0 |
| `--groupsdayshvprintdaysnames` | true | oui | 0 | 0 | 0 |
| `--groupsdayshvprinthourslongnames` | false | oui | 0 | 0 | 0 |
| `--groupsdayshvprinthoursnames` | true | oui | 0 | 0 | 0 |
| `--groupsdayshvprintlegendcodesfirst` | false | oui | 0 | 0 | 0 |
| `--groupsdayshvprintroomscodes` | false | oui | 0 | 0 | 0 |
| `--groupsdayshvprintroomslegend` | false | oui | 0 | 0 | 0 |
| `--groupsdayshvprintroomslongnames` | false | oui | 0 | 0 | 0 |
| `--groupsdayshvprintroomsnames` | true | oui | 0 | 0 | 0 |
| `--groupsdayshvprintstudentscodes` | false | oui | 2 | 0 | 0 |
| `--groupsdayshvprintstudentslegend` | false | oui | 2 | 0 | 0 |
| `--groupsdayshvprintstudentslongnames` | false | oui | 2 | 0 | 0 |
| `--groupsdayshvprintstudentsnames` | true | oui | 2 | 0 | 0 |
| `--groupsdayshvprintsubjectscodes` | false | oui | 0 | 0 | 0 |
| `--groupsdayshvprintsubjectslegend` | false | oui | 2 | 0 | 0 |
| `--groupsdayshvprintsubjectslongnames` | false | oui | 0 | 0 | 0 |
| `--groupsdayshvprintsubjectsnames` | true | oui | 2 | 0 | 0 |
| `--groupsdayshvprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--groupsdayshvprintteacherslegend` | false | oui | 2 | 0 | 0 |
| `--groupsdayshvprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--groupsdayshvprintteachersnames` | true | oui | 2 | 0 | 0 |
| `--groupstimehvprintactivitytagscodes` | false | oui | 0 | 0 | 0 |
| `--groupstimehvprintactivitytagslegend` | false | oui | 2 | 0 | 0 |
| `--groupstimehvprintactivitytagslongnames` | false | oui | 0 | 0 | 0 |
| `--groupstimehvprintactivitytagsnames` | true | oui | 2 | 0 | 0 |
| `--groupstimehvprintdayslongnames` | false | oui | 0 | 0 | 0 |
| `--groupstimehvprintdaysnames` | true | oui | 0 | 0 | 0 |
| `--groupstimehvprinthourslongnames` | false | oui | 0 | 0 | 0 |
| `--groupstimehvprinthoursnames` | true | oui | 0 | 0 | 0 |
| `--groupstimehvprintlegendcodesfirst` | false | oui | 0 | 0 | 0 |
| `--groupstimehvprintroomscodes` | false | oui | 0 | 0 | 0 |
| `--groupstimehvprintroomslegend` | false | oui | 0 | 0 | 0 |
| `--groupstimehvprintroomslongnames` | false | oui | 0 | 0 | 0 |
| `--groupstimehvprintroomsnames` | true | oui | 0 | 0 | 0 |
| `--groupstimehvprintstudentscodes` | false | oui | 2 | 0 | 0 |
| `--groupstimehvprintstudentslegend` | false | oui | 2 | 0 | 0 |
| `--groupstimehvprintstudentslongnames` | false | oui | 2 | 0 | 0 |
| `--groupstimehvprintstudentsnames` | true | oui | 2 | 0 | 0 |
| `--groupstimehvprintsubjectscodes` | false | oui | 0 | 0 | 0 |
| `--groupstimehvprintsubjectslegend` | false | oui | 2 | 0 | 0 |
| `--groupstimehvprintsubjectslongnames` | false | oui | 0 | 0 | 0 |
| `--groupstimehvprintsubjectsnames` | true | oui | 2 | 0 | 0 |
| `--groupstimehvprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--groupstimehvprintteacherslegend` | false | oui | 2 | 0 | 0 |
| `--groupstimehvprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--groupstimehvprintteachersnames` | true | oui | 2 | 0 | 0 |
| `--htmlusespan` | true | oui | 20 | 0 | 0 |
| `--overwritecsv` | false | oui | 0 | 0 | 0 |
| `--printactivitytags` | true | oui | 28 | 0 | 0 |
| `--printactivitytagscomments` | false | oui | 0 | 0 | 0 |
| `--printbreak` | true | oui | 0 | 0 | 0 |
| `--printbuildingscomments` | false | oui | 0 | 0 | 0 |
| `--printdetailedteachersfreeperiodstimetables` | true | oui | 3 | 0 | 0 |
| `--printdetailedtimetables` | true | oui | 4 | 0 | 0 |
| `--printgroupscomments` | false | oui | 0 | 0 | 0 |
| `--printnotavailable` | true | oui | 0 | 0 | 0 |
| `--printrooms` | true | oui | 0 | 0 | 0 |
| `--printroomscomments` | false | oui | 0 | 0 | 0 |
| `--printsimultaneousactivities` | false | oui | 0 | 0 | 0 |
| `--printstudents` | true | oui | 28 | 0 | 0 |
| `--printsubgroupscomments` | false | oui | 0 | 0 | 0 |
| `--printsubjects` | true | oui | 28 | 0 | 0 |
| `--printsubjectscomments` | false | oui | 0 | 0 | 0 |
| `--printteachers` | true | oui | 24 | 0 | 0 |
| `--printteacherscomments` | false | oui | 0 | 0 | 0 |
| `--printyearscomments` | false | oui | 0 | 0 | 0 |
| `--roomsdayshvprintactivitytagscodes` | false | oui | 0 | 0 | 0 |
| `--roomsdayshvprintactivitytagslegend` | false | oui | 0 | 0 | 0 |
| `--roomsdayshvprintactivitytagslongnames` | false | oui | 0 | 0 | 0 |
| `--roomsdayshvprintactivitytagsnames` | true | oui | 0 | 0 | 0 |
| `--roomsdayshvprintdayslongnames` | false | oui | 0 | 0 | 0 |
| `--roomsdayshvprintdaysnames` | true | oui | 0 | 0 | 0 |
| `--roomsdayshvprinthourslongnames` | false | oui | 0 | 0 | 0 |
| `--roomsdayshvprinthoursnames` | true | oui | 0 | 0 | 0 |
| `--roomsdayshvprintlegendcodesfirst` | false | oui | 0 | 0 | 0 |
| `--roomsdayshvprintroomscodes` | false | oui | 0 | 0 | 0 |
| `--roomsdayshvprintroomslegend` | false | oui | 0 | 0 | 0 |
| `--roomsdayshvprintroomslongnames` | false | oui | 0 | 0 | 0 |
| `--roomsdayshvprintroomsnames` | true | oui | 0 | 0 | 0 |
| `--roomsdayshvprintstudentscodes` | false | oui | 0 | 0 | 0 |
| `--roomsdayshvprintstudentslegend` | false | oui | 0 | 0 | 0 |
| `--roomsdayshvprintstudentslongnames` | false | oui | 0 | 0 | 0 |
| `--roomsdayshvprintstudentsnames` | true | oui | 0 | 0 | 0 |
| `--roomsdayshvprintsubjectscodes` | false | oui | 0 | 0 | 0 |
| `--roomsdayshvprintsubjectslegend` | false | oui | 0 | 0 | 0 |
| `--roomsdayshvprintsubjectslongnames` | false | oui | 0 | 0 | 0 |
| `--roomsdayshvprintsubjectsnames` | true | oui | 0 | 0 | 0 |
| `--roomsdayshvprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--roomsdayshvprintteacherslegend` | false | oui | 0 | 0 | 0 |
| `--roomsdayshvprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--roomsdayshvprintteachersnames` | true | oui | 0 | 0 | 0 |
| `--roomstimehvprintactivitytagscodes` | false | oui | 0 | 0 | 0 |
| `--roomstimehvprintactivitytagslegend` | false | oui | 2 | 0 | 0 |
| `--roomstimehvprintactivitytagslongnames` | false | oui | 0 | 0 | 0 |
| `--roomstimehvprintactivitytagsnames` | true | oui | 0 | 0 | 0 |
| `--roomstimehvprintdayslongnames` | false | oui | 0 | 0 | 0 |
| `--roomstimehvprintdaysnames` | true | oui | 0 | 0 | 0 |
| `--roomstimehvprinthourslongnames` | false | oui | 0 | 0 | 0 |
| `--roomstimehvprinthoursnames` | true | oui | 0 | 0 | 0 |
| `--roomstimehvprintlegendcodesfirst` | false | oui | 0 | 0 | 0 |
| `--roomstimehvprintroomscodes` | false | oui | 0 | 0 | 0 |
| `--roomstimehvprintroomslegend` | false | oui | 0 | 0 | 0 |
| `--roomstimehvprintroomslongnames` | false | oui | 0 | 0 | 0 |
| `--roomstimehvprintroomsnames` | true | oui | 0 | 0 | 0 |
| `--roomstimehvprintstudentscodes` | false | oui | 0 | 0 | 0 |
| `--roomstimehvprintstudentslegend` | false | oui | 2 | 0 | 0 |
| `--roomstimehvprintstudentslongnames` | false | oui | 0 | 0 | 0 |
| `--roomstimehvprintstudentsnames` | true | oui | 0 | 0 | 0 |
| `--roomstimehvprintsubjectscodes` | false | oui | 0 | 0 | 0 |
| `--roomstimehvprintsubjectslegend` | false | oui | 2 | 0 | 0 |
| `--roomstimehvprintsubjectslongnames` | false | oui | 0 | 0 | 0 |
| `--roomstimehvprintsubjectsnames` | true | oui | 0 | 0 | 0 |
| `--roomstimehvprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--roomstimehvprintteacherslegend` | false | oui | 2 | 0 | 0 |
| `--roomstimehvprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--roomstimehvprintteachersnames` | true | oui | 0 | 0 | 0 |
| `--separateactivitytagsnamelongnamecodebybreak` | false | oui | 0 | 0 | 0 |
| `--separatebuildingsnamelongnamecodebybreak` | false | oui | 0 | 0 | 0 |
| `--separatedaysnamelongnamebybreak` | false | oui | 0 | 0 | 0 |
| `--separatehoursnamelongnamebybreak` | false | oui | 0 | 0 | 0 |
| `--separateroomsnamelongnamecodebybreak` | false | oui | 0 | 0 | 0 |
| `--separatestudentsnamelongnamecodebybreak` | false | oui | 0 | 0 | 0 |
| `--separatesubjectsnamelongnamecodebybreak` | false | oui | 0 | 0 | 0 |
| `--separateteachersnamelongnamecodebybreak` | false | oui | 0 | 0 | 0 |
| `--showvirtualrooms` | false | oui | 0 | 0 | 0 |
| `--sortactivitiesbytags` | false | oui | 4 | 0 | 0 |
| `--sortsubgroups` | false | oui | 0 | 0 | 0 |
| `--statisticsprintstudentscodes` | false | oui | 1 | 0 | 0 |
| `--statisticsprintstudentslongnames` | false | oui | 1 | 0 | 0 |
| `--statisticsprintstudentsnames` | true | oui | 0 | 0 | 0 |
| `--statisticsprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--statisticsprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--statisticsprintteachersnames` | true | oui | 0 | 0 | 0 |
| `--subgroupsdayshvprintactivitytagscodes` | false | oui | 0 | 0 | 0 |
| `--subgroupsdayshvprintactivitytagslegend` | false | oui | 2 | 0 | 0 |
| `--subgroupsdayshvprintactivitytagslongnames` | false | oui | 0 | 0 | 0 |
| `--subgroupsdayshvprintactivitytagsnames` | true | oui | 2 | 0 | 0 |
| `--subgroupsdayshvprintdayslongnames` | false | oui | 0 | 0 | 0 |
| `--subgroupsdayshvprintdaysnames` | true | oui | 0 | 0 | 0 |
| `--subgroupsdayshvprinthourslongnames` | false | oui | 0 | 0 | 0 |
| `--subgroupsdayshvprinthoursnames` | true | oui | 0 | 0 | 0 |
| `--subgroupsdayshvprintlegendcodesfirst` | false | oui | 0 | 0 | 0 |
| `--subgroupsdayshvprintroomscodes` | false | oui | 0 | 0 | 0 |
| `--subgroupsdayshvprintroomslegend` | false | oui | 0 | 0 | 0 |
| `--subgroupsdayshvprintroomslongnames` | false | oui | 0 | 0 | 0 |
| `--subgroupsdayshvprintroomsnames` | true | oui | 0 | 0 | 0 |
| `--subgroupsdayshvprintstudentscodes` | false | oui | 2 | 0 | 0 |
| `--subgroupsdayshvprintstudentslegend` | false | oui | 2 | 0 | 0 |
| `--subgroupsdayshvprintstudentslongnames` | false | oui | 2 | 0 | 0 |
| `--subgroupsdayshvprintstudentsnames` | true | oui | 2 | 0 | 0 |
| `--subgroupsdayshvprintsubjectscodes` | false | oui | 0 | 0 | 0 |
| `--subgroupsdayshvprintsubjectslegend` | false | oui | 2 | 0 | 0 |
| `--subgroupsdayshvprintsubjectslongnames` | false | oui | 0 | 0 | 0 |
| `--subgroupsdayshvprintsubjectsnames` | true | oui | 2 | 0 | 0 |
| `--subgroupsdayshvprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--subgroupsdayshvprintteacherslegend` | false | oui | 2 | 0 | 0 |
| `--subgroupsdayshvprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--subgroupsdayshvprintteachersnames` | true | oui | 2 | 0 | 0 |
| `--subgroupstimehvprintactivitytagscodes` | false | oui | 0 | 0 | 0 |
| `--subgroupstimehvprintactivitytagslegend` | false | oui | 2 | 0 | 0 |
| `--subgroupstimehvprintactivitytagslongnames` | false | oui | 0 | 0 | 0 |
| `--subgroupstimehvprintactivitytagsnames` | true | oui | 2 | 0 | 0 |
| `--subgroupstimehvprintdayslongnames` | false | oui | 0 | 0 | 0 |
| `--subgroupstimehvprintdaysnames` | true | oui | 0 | 0 | 0 |
| `--subgroupstimehvprinthourslongnames` | false | oui | 0 | 0 | 0 |
| `--subgroupstimehvprinthoursnames` | true | oui | 0 | 0 | 0 |
| `--subgroupstimehvprintlegendcodesfirst` | false | oui | 0 | 0 | 0 |
| `--subgroupstimehvprintroomscodes` | false | oui | 0 | 0 | 0 |
| `--subgroupstimehvprintroomslegend` | false | oui | 0 | 0 | 0 |
| `--subgroupstimehvprintroomslongnames` | false | oui | 0 | 0 | 0 |
| `--subgroupstimehvprintroomsnames` | true | oui | 0 | 0 | 0 |
| `--subgroupstimehvprintstudentscodes` | false | oui | 2 | 0 | 0 |
| `--subgroupstimehvprintstudentslegend` | false | oui | 2 | 0 | 0 |
| `--subgroupstimehvprintstudentslongnames` | false | oui | 2 | 0 | 0 |
| `--subgroupstimehvprintstudentsnames` | true | oui | 2 | 0 | 0 |
| `--subgroupstimehvprintsubjectscodes` | false | oui | 0 | 0 | 0 |
| `--subgroupstimehvprintsubjectslegend` | false | oui | 2 | 0 | 0 |
| `--subgroupstimehvprintsubjectslongnames` | false | oui | 0 | 0 | 0 |
| `--subgroupstimehvprintsubjectsnames` | true | oui | 2 | 0 | 0 |
| `--subgroupstimehvprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--subgroupstimehvprintteacherslegend` | false | oui | 2 | 0 | 0 |
| `--subgroupstimehvprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--subgroupstimehvprintteachersnames` | true | oui | 2 | 0 | 0 |
| `--subjectsdayshvprintactivitytagscodes` | false | oui | 0 | 0 | 0 |
| `--subjectsdayshvprintactivitytagslegend` | false | oui | 2 | 0 | 0 |
| `--subjectsdayshvprintactivitytagslongnames` | false | oui | 0 | 0 | 0 |
| `--subjectsdayshvprintactivitytagsnames` | true | oui | 2 | 0 | 0 |
| `--subjectsdayshvprintdayslongnames` | false | oui | 0 | 0 | 0 |
| `--subjectsdayshvprintdaysnames` | true | oui | 0 | 0 | 0 |
| `--subjectsdayshvprinthourslongnames` | false | oui | 0 | 0 | 0 |
| `--subjectsdayshvprinthoursnames` | true | oui | 0 | 0 | 0 |
| `--subjectsdayshvprintlegendcodesfirst` | false | oui | 0 | 0 | 0 |
| `--subjectsdayshvprintroomscodes` | false | oui | 0 | 0 | 0 |
| `--subjectsdayshvprintroomslegend` | false | oui | 0 | 0 | 0 |
| `--subjectsdayshvprintroomslongnames` | false | oui | 0 | 0 | 0 |
| `--subjectsdayshvprintroomsnames` | true | oui | 0 | 0 | 0 |
| `--subjectsdayshvprintstudentscodes` | false | oui | 0 | 0 | 0 |
| `--subjectsdayshvprintstudentslegend` | false | oui | 2 | 0 | 0 |
| `--subjectsdayshvprintstudentslongnames` | false | oui | 0 | 0 | 0 |
| `--subjectsdayshvprintstudentsnames` | true | oui | 2 | 0 | 0 |
| `--subjectsdayshvprintsubjectscodes` | false | oui | 0 | 0 | 0 |
| `--subjectsdayshvprintsubjectslegend` | false | oui | 2 | 0 | 0 |
| `--subjectsdayshvprintsubjectslongnames` | false | oui | 0 | 0 | 0 |
| `--subjectsdayshvprintsubjectsnames` | true | oui | 0 | 0 | 0 |
| `--subjectsdayshvprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--subjectsdayshvprintteacherslegend` | false | oui | 2 | 0 | 0 |
| `--subjectsdayshvprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--subjectsdayshvprintteachersnames` | true | oui | 2 | 0 | 0 |
| `--subjectstimehvprintactivitytagscodes` | false | oui | 0 | 0 | 0 |
| `--subjectstimehvprintactivitytagslegend` | false | oui | 2 | 0 | 0 |
| `--subjectstimehvprintactivitytagslongnames` | false | oui | 0 | 0 | 0 |
| `--subjectstimehvprintactivitytagsnames` | true | oui | 2 | 0 | 0 |
| `--subjectstimehvprintdayslongnames` | false | oui | 0 | 0 | 0 |
| `--subjectstimehvprintdaysnames` | true | oui | 0 | 0 | 0 |
| `--subjectstimehvprinthourslongnames` | false | oui | 0 | 0 | 0 |
| `--subjectstimehvprinthoursnames` | true | oui | 0 | 0 | 0 |
| `--subjectstimehvprintlegendcodesfirst` | false | oui | 0 | 0 | 0 |
| `--subjectstimehvprintroomscodes` | false | oui | 0 | 0 | 0 |
| `--subjectstimehvprintroomslegend` | false | oui | 0 | 0 | 0 |
| `--subjectstimehvprintroomslongnames` | false | oui | 0 | 0 | 0 |
| `--subjectstimehvprintroomsnames` | true | oui | 0 | 0 | 0 |
| `--subjectstimehvprintstudentscodes` | false | oui | 0 | 0 | 0 |
| `--subjectstimehvprintstudentslegend` | false | oui | 2 | 0 | 0 |
| `--subjectstimehvprintstudentslongnames` | false | oui | 0 | 0 | 0 |
| `--subjectstimehvprintstudentsnames` | true | oui | 2 | 0 | 0 |
| `--subjectstimehvprintsubjectscodes` | false | oui | 0 | 0 | 0 |
| `--subjectstimehvprintsubjectslegend` | false | oui | 2 | 0 | 0 |
| `--subjectstimehvprintsubjectslongnames` | false | oui | 0 | 0 | 0 |
| `--subjectstimehvprintsubjectsnames` | true | oui | 0 | 0 | 0 |
| `--subjectstimehvprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--subjectstimehvprintteacherslegend` | false | oui | 2 | 0 | 0 |
| `--subjectstimehvprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--subjectstimehvprintteachersnames` | true | oui | 2 | 0 | 0 |
| `--teachersdayshvprintactivitytagscodes` | false | oui | 0 | 0 | 0 |
| `--teachersdayshvprintactivitytagslegend` | false | oui | 2 | 0 | 0 |
| `--teachersdayshvprintactivitytagslongnames` | false | oui | 0 | 0 | 0 |
| `--teachersdayshvprintactivitytagsnames` | true | oui | 2 | 0 | 0 |
| `--teachersdayshvprintdayslongnames` | false | oui | 0 | 0 | 0 |
| `--teachersdayshvprintdaysnames` | true | oui | 0 | 0 | 0 |
| `--teachersdayshvprinthourslongnames` | false | oui | 0 | 0 | 0 |
| `--teachersdayshvprinthoursnames` | true | oui | 0 | 0 | 0 |
| `--teachersdayshvprintlegendcodesfirst` | false | oui | 0 | 0 | 0 |
| `--teachersdayshvprintroomscodes` | false | oui | 0 | 0 | 0 |
| `--teachersdayshvprintroomslegend` | false | oui | 0 | 0 | 0 |
| `--teachersdayshvprintroomslongnames` | false | oui | 0 | 0 | 0 |
| `--teachersdayshvprintroomsnames` | true | oui | 0 | 0 | 0 |
| `--teachersdayshvprintstudentscodes` | false | oui | 0 | 0 | 0 |
| `--teachersdayshvprintstudentslegend` | false | oui | 2 | 0 | 0 |
| `--teachersdayshvprintstudentslongnames` | false | oui | 0 | 0 | 0 |
| `--teachersdayshvprintstudentsnames` | true | oui | 2 | 0 | 0 |
| `--teachersdayshvprintsubjectscodes` | false | oui | 0 | 0 | 0 |
| `--teachersdayshvprintsubjectslegend` | false | oui | 2 | 0 | 0 |
| `--teachersdayshvprintsubjectslongnames` | false | oui | 0 | 0 | 0 |
| `--teachersdayshvprintsubjectsnames` | true | oui | 2 | 0 | 0 |
| `--teachersdayshvprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--teachersdayshvprintteacherslegend` | false | oui | 2 | 0 | 0 |
| `--teachersdayshvprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--teachersdayshvprintteachersnames` | true | oui | 0 | 0 | 0 |
| `--teachersfreeperiodsprintdayslongnames` | false | oui | 0 | 0 | 0 |
| `--teachersfreeperiodsprintdaysnames` | true | oui | 0 | 0 | 0 |
| `--teachersfreeperiodsprinthourslongnames` | false | oui | 0 | 0 | 0 |
| `--teachersfreeperiodsprinthoursnames` | true | oui | 0 | 0 | 0 |
| `--teachersfreeperiodsprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--teachersfreeperiodsprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--teachersfreeperiodsprintteachersnames` | true | oui | 0 | 0 | 0 |
| `--teacherstimehvprintactivitytagscodes` | false | oui | 0 | 0 | 0 |
| `--teacherstimehvprintactivitytagslegend` | false | oui | 2 | 0 | 0 |
| `--teacherstimehvprintactivitytagslongnames` | false | oui | 0 | 0 | 0 |
| `--teacherstimehvprintactivitytagsnames` | true | oui | 2 | 0 | 0 |
| `--teacherstimehvprintdayslongnames` | false | oui | 0 | 0 | 0 |
| `--teacherstimehvprintdaysnames` | true | oui | 0 | 0 | 0 |
| `--teacherstimehvprinthourslongnames` | false | oui | 0 | 0 | 0 |
| `--teacherstimehvprinthoursnames` | true | oui | 0 | 0 | 0 |
| `--teacherstimehvprintlegendcodesfirst` | false | oui | 0 | 0 | 0 |
| `--teacherstimehvprintroomscodes` | false | oui | 0 | 0 | 0 |
| `--teacherstimehvprintroomslegend` | false | oui | 0 | 0 | 0 |
| `--teacherstimehvprintroomslongnames` | false | oui | 0 | 0 | 0 |
| `--teacherstimehvprintroomsnames` | true | oui | 0 | 0 | 0 |
| `--teacherstimehvprintstudentscodes` | false | oui | 0 | 0 | 0 |
| `--teacherstimehvprintstudentslegend` | false | oui | 2 | 0 | 0 |
| `--teacherstimehvprintstudentslongnames` | false | oui | 0 | 0 | 0 |
| `--teacherstimehvprintstudentsnames` | true | oui | 2 | 0 | 0 |
| `--teacherstimehvprintsubjectscodes` | false | oui | 0 | 0 | 0 |
| `--teacherstimehvprintsubjectslegend` | false | oui | 2 | 0 | 0 |
| `--teacherstimehvprintsubjectslongnames` | false | oui | 0 | 0 | 0 |
| `--teacherstimehvprintsubjectsnames` | true | oui | 2 | 0 | 0 |
| `--teacherstimehvprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--teacherstimehvprintteacherslegend` | false | oui | 2 | 0 | 0 |
| `--teacherstimehvprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--teacherstimehvprintteachersnames` | true | oui | 0 | 0 | 0 |
| `--verbose` | false | oui | 0 | 0 | 0 |
| `--warnifusingactivitiesnotfixedtimefixedspacevirtualroomsrealrooms` | true | oui | 0 | 0 | 0 |
| `--warnifusinggroupactivitiesininitialorder` | true | oui | 0 | 0 | 0 |
| `--warnifusingmaxhoursdailywithlessthan100percentweight` | true | oui | 0 | 0 | 0 |
| `--warnsubgroupswiththesameactivities` | true | oui | 0 | 0 | 0 |
| `--writetimetableconflicts` | true | oui | 1 | 0 | 1 |
| `--writetimetablesactivities` | true | oui | 1 | 0 | 5 |
| `--writetimetablesactivitytags` | true | oui | 1 | 0 | 4 |
| `--writetimetablesbuildings` | true | oui | 1 | 0 | 4 |
| `--writetimetablesdayshorizontal` | true | oui | 1 | 0 | 10 |
| `--writetimetablesdaysvertical` | true | oui | 1 | 0 | 10 |
| `--writetimetablesgroups` | true | oui | 1 | 0 | 4 |
| `--writetimetablesrooms` | true | oui | 1 | 0 | 4 |
| `--writetimetablesstatistics` | true | oui | 1 | 0 | 2 |
| `--writetimetablessubgroups` | true | oui | 1 | 0 | 5 |
| `--writetimetablessubjects` | true | oui | 1 | 0 | 4 |
| `--writetimetablesteachers` | true | oui | 1 | 0 | 6 |
| `--writetimetablesteachersfreeperiods` | true | oui | 1 | 0 | 2 |
| `--writetimetablestimehorizontal` | true | oui | 1 | 0 | 9 |
| `--writetimetablestimevertical` | true | oui | 1 | 0 | 9 |
| `--writetimetablesxml` | true | oui | 1 | 0 | 3 |
| `--writetimetablesyears` | true | oui | 1 | 0 | 4 |
| `--yearsdayshvprintactivitytagscodes` | false | oui | 0 | 0 | 0 |
| `--yearsdayshvprintactivitytagslegend` | false | oui | 2 | 0 | 0 |
| `--yearsdayshvprintactivitytagslongnames` | false | oui | 0 | 0 | 0 |
| `--yearsdayshvprintactivitytagsnames` | true | oui | 2 | 0 | 0 |
| `--yearsdayshvprintdayslongnames` | false | oui | 0 | 0 | 0 |
| `--yearsdayshvprintdaysnames` | true | oui | 0 | 0 | 0 |
| `--yearsdayshvprinthourslongnames` | false | oui | 0 | 0 | 0 |
| `--yearsdayshvprinthoursnames` | true | oui | 0 | 0 | 0 |
| `--yearsdayshvprintlegendcodesfirst` | false | oui | 0 | 0 | 0 |
| `--yearsdayshvprintroomscodes` | false | oui | 0 | 0 | 0 |
| `--yearsdayshvprintroomslegend` | false | oui | 0 | 0 | 0 |
| `--yearsdayshvprintroomslongnames` | false | oui | 0 | 0 | 0 |
| `--yearsdayshvprintroomsnames` | true | oui | 0 | 0 | 0 |
| `--yearsdayshvprintstudentscodes` | false | oui | 0 | 0 | 0 |
| `--yearsdayshvprintstudentslegend` | false | oui | 2 | 0 | 0 |
| `--yearsdayshvprintstudentslongnames` | false | oui | 0 | 0 | 0 |
| `--yearsdayshvprintstudentsnames` | true | oui | 2 | 0 | 0 |
| `--yearsdayshvprintsubjectscodes` | false | oui | 0 | 0 | 0 |
| `--yearsdayshvprintsubjectslegend` | false | oui | 2 | 0 | 0 |
| `--yearsdayshvprintsubjectslongnames` | false | oui | 0 | 0 | 0 |
| `--yearsdayshvprintsubjectsnames` | true | oui | 2 | 0 | 0 |
| `--yearsdayshvprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--yearsdayshvprintteacherslegend` | false | oui | 2 | 0 | 0 |
| `--yearsdayshvprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--yearsdayshvprintteachersnames` | true | oui | 2 | 0 | 0 |
| `--yearstimehvprintactivitytagscodes` | false | oui | 0 | 0 | 0 |
| `--yearstimehvprintactivitytagslegend` | false | oui | 2 | 0 | 0 |
| `--yearstimehvprintactivitytagslongnames` | false | oui | 0 | 0 | 0 |
| `--yearstimehvprintactivitytagsnames` | true | oui | 2 | 0 | 0 |
| `--yearstimehvprintdayslongnames` | false | oui | 0 | 0 | 0 |
| `--yearstimehvprintdaysnames` | true | oui | 0 | 0 | 0 |
| `--yearstimehvprinthourslongnames` | false | oui | 0 | 0 | 0 |
| `--yearstimehvprinthoursnames` | true | oui | 0 | 0 | 0 |
| `--yearstimehvprintlegendcodesfirst` | false | oui | 0 | 0 | 0 |
| `--yearstimehvprintroomscodes` | false | oui | 0 | 0 | 0 |
| `--yearstimehvprintroomslegend` | false | oui | 0 | 0 | 0 |
| `--yearstimehvprintroomslongnames` | false | oui | 0 | 0 | 0 |
| `--yearstimehvprintroomsnames` | true | oui | 0 | 0 | 0 |
| `--yearstimehvprintstudentscodes` | false | oui | 0 | 0 | 0 |
| `--yearstimehvprintstudentslegend` | false | oui | 2 | 0 | 0 |
| `--yearstimehvprintstudentslongnames` | false | oui | 0 | 0 | 0 |
| `--yearstimehvprintstudentsnames` | true | oui | 2 | 0 | 0 |
| `--yearstimehvprintsubjectscodes` | false | oui | 0 | 0 | 0 |
| `--yearstimehvprintsubjectslegend` | false | oui | 2 | 0 | 0 |
| `--yearstimehvprintsubjectslongnames` | false | oui | 0 | 0 | 0 |
| `--yearstimehvprintsubjectsnames` | true | oui | 2 | 0 | 0 |
| `--yearstimehvprintteacherscodes` | false | oui | 0 | 0 | 0 |
| `--yearstimehvprintteacherslegend` | false | oui | 2 | 0 | 0 |
| `--yearstimehvprintteacherslongnames` | false | oui | 0 | 0 | 0 |
| `--yearstimehvprintteachersnames` | true | oui | 2 | 0 | 0 |

## Contraintes de temps (271)

Colonnes p50, p0, p101 : resultat avec un poids de 50 %, 0 % et 101 % ; Inactive : avec `Active=false`.

| Balise XML | Nom (FR) | Categorie | Classification | Modes | p50 | p0 | p101 | Inactive | Prerequis |
|---|---|---|---|---|---|---|---|---|---|
| `ActivitiesBeginOrEndStudentsDay` | Activités débutent ou terminent la journée des apprenants | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivitiesBeginOrEndTeachersDay` | Activités débutent ou terminent la journée des enseignants | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivitiesBeginStudentsDay` | Activités débutent la journée des apprenants | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivitiesBeginTeachersDay` | Activités débutent la journée des enseignants | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivitiesEndStudentsDay` | Activités terminent la journée des apprenants | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivitiesEndTeachersDay` | Activités terminent la journée des enseignants | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivitiesMaxActivityTagsFromSetInSelectedTimeSlots` | Activités limite codes activité depuis un jeu dans les créneaux horaires sélectionnés | Activites | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `ActivitiesMaxHourlySpan` | Activités amplitude horaire max | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | ABANDON | accepte |  |
| `ActivitiesMaxInATerm` | Activités max par période | Activites | bloquante | Trim | refus | refus | refus | accepte |  |
| `ActivitiesMaxSimultaneousInSelectedTimeSlots` | Activités limite simultanées dans les créneaux horaires sélectionnés | Activites | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `ActivitiesMaxTotalNumberOfStudentsInSelectedTimeSlots` | Activités nombre total maximal d'apprenants dans les créneaux horaires sélectionnés | Activites | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `ActivitiesMinInATerm` | Activités min par période | Activites | bloquante | Trim | refus | refus | refus | accepte |  |
| `ActivitiesMinSimultaneousInSelectedTimeSlots` | Activités minimum simultanées dans les créneaux horaires sélectionnés | Activites | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `ActivitiesNotOverlapping` | Activités sans chevauchement | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivitiesOccupyMaxSetsOfTimeSlotsFromSelection` | Activités occupent limite jeux de créneaux horaires dans la sélection | Activites | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `ActivitiesOccupyMaxTerms` | Activités limite occupation périodes | Activites | bloquante | Trim | refus | refus | refus | accepte |  |
| `ActivitiesOccupyMaxTimeSlotsFromSelection` | Activités occupent limite créneaux horaires dans la sélection | Activites | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `ActivitiesOccupyMinTimeSlotsFromSelection` | Activités occupent minimum créneaux horaires dans la sélection | Activites | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `ActivitiesOverlapCompletelyOrDoNotOverlap` | Activités se chevauchent totalement ou ne se chevauchent pas | Activites | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte | n'a de sens qu'avec des activites de duree > 1 |
| `ActivitiesPairOfMutuallyExclusiveSetsOfTimeSlots` | Activités paire de jeux de créneaux horaires mutuellement exclusifs | Activites | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `ActivitiesPairOfMutuallyExclusiveTimeSlots` | Activités paire de créneaux horaires mutuellement exclusifs | Activites | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `ActivitiesPreferredStartingTimes` | Activités temps de démarrage préférés | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivitiesPreferredTimeSlots` | Activités créneaux horaires préférés | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivitiesSameStartingDay` | Activités même jour de démarrage | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivitiesSameStartingHour` | Activités même heure de démarrage | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivitiesSameStartingTime` | Activités démarrent en même temps | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivityBeginsOrEndsStudentsDay` | Activité débute ou termine la journée des apprenants | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivityBeginsOrEndsTeachersDay` | Activité débute ou termine la journée des enseignants | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivityBeginsStudentsDay` | Activité débute la journée des apprenants | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivityBeginsTeachersDay` | Activité débute la journée des enseignants | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivityEndsStudentsDay` | Activité termine la journée des apprenants | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivityEndsTeachersDay` | Activité termine la journée des enseignants | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivityPreferredDay` | ConstraintActivityPreferredDay | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivityPreferredStartingTime` | Activité temps de démarrage préféré | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivityPreferredStartingTimes` | Activité temps de démarrage préférés | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivityPreferredTimeSlots` | Activité créneaux horaires préférés | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `MaxDaysBetweenActivities` | Jours max entre activités | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | ABANDON | accepte |  |
| `MaxDaysBetweenEachPairOfConsecutiveActivities` | Limite jours entre chaque paire d'activités consécutives | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `MaxGapsBetweenActivities` | Vides max entre activités | Activites | facultative possible | Bloc | accepte | accepte | ABANDON | accepte |  |
| `MaxHalfDaysBetweenActivities` | Demi-journées max entre activités | Activites | facultative possible | MA | accepte | accepte | ABANDON | accepte |  |
| `MaxTermsBetweenActivities` | Périodes max entre activités | Activites | facultative possible | Trim | accepte | accepte | ABANDON | accepte |  |
| `MaxTotalActivitiesFromSetInSelectedTimeSlots` | Limite activités totales du jeu dans les créneaux horaires sélectionnés | Activites | bloquante | Bloc | refus | refus | refus | accepte |  |
| `MinDaysBetweenActivities` | Jours min entre activités | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | ABANDON | accepte |  |
| `MinGapsBetweenActivities` | Vides min entre activités | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | ABANDON | accepte |  |
| `MinHalfDaysBetweenActivities` | Demi-journées min entre activités | Activites | facultative possible | MA | accepte | accepte | ABANDON | accepte |  |
| `SubactivitiesPreferredStartingTimes` | Sous-activités temps préférés de démarrage | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `SubactivitiesPreferredTimeSlots` | Sous-activités créneaux horaires préférés | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ThreeActivitiesGrouped` | Trois activités groupées | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `TwoActivitiesConsecutive` | Deux activités consécutives | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `TwoActivitiesGrouped` | Deux activités groupées | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `TwoActivitiesOrdered` | Deux activités ordonnées | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `TwoActivitiesOrderedIfSameDay` | Deux activités ordonnées si même jour | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `TwoSetsOfActivitiesOrdered` | Deux jeux d'activités ordonnés | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `TwoSetsOfActivitiesSameSections` | Deux jeux d'activités ont les mêmes sections | Activites | bloquante | Bloc | refus | refus | refus | accepte | mode Block_Planning ; les activites des deux ensembles doivent avoir respectivement les memes eleves et la meme duree |
| `BasicCompulsoryTime` | Temporelles obligatoires de base | Base | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `StudentsActivityTagMaxHoursContinuously` | Apprenants code activité limite heures continues | Eleves | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `StudentsActivityTagMaxHoursDaily` | Apprenants code activité limite heures quotidiennes | Eleves | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `StudentsActivityTagMaxHoursDailyRealDays` | Apprenants code activité limite heures quotidiennes par jours réels | Eleves | facultative possible | MA | accepte | accepte | accepte | accepte |  |
| `StudentsActivityTagMinHoursDaily` | Apprenants code activité minimum heures quotidiennes | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsAfternoonIntervalMaxDaysPerWeek` | Après-midi apprenants intervalle limite jours par semaine | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsAfternoonsEarlyMaxBeginningsAtSecondHour` | Après-midis apprenants au plus tôt limite débuts en seconde heure | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsEarlyMaxBeginningsAtSecondHour` | Apprenants tôt limite débuts en seconde heure | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsIntervalMaxDaysPerWeek` | Apprenants intervalle limite jours par semaine | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMaxActivityTagChangesPerDay` | Apprenants changements balise activité quotidiens max | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMaxActivityTagChangesPerWeek` | Apprenants changements balise activité hebdomadaires max | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMaxActivityTagsPerDayFromSet` | Apprenants limite codes activité par jour depuis le jeu | Eleves | bloquante (abandon si < 100 %) | Off, MA, Bloc, Trim | ABANDON | ABANDON | ABANDON | accepte |  |
| `StudentsMaxActivityTagsPerRealDayFromSet` | Apprenants limite codes activité par jour réel depuis le jeu | Eleves | bloquante (abandon si < 100 %) | MA | ABANDON | ABANDON | ABANDON | accepte |  |
| `StudentsMaxAfternoonsPerWeek` | Apprenants limite après-midis par semaine | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMaxDaysPerWeek` | Apprenants jours max par semaine | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMaxGapsPerDay` | Apprenants vides max par jour | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMaxGapsPerRealDay` | Apprenants vides max par jour réel | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMaxGapsPerWeek` | Apprenants vides max par semaine | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMaxGapsPerWeekForRealDays` | Apprenants limite vides par semaine pour jours réels | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMaxHoursContinuously` | Apprenants heures continues max | Eleves | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `StudentsMaxHoursContinuouslyRealDays` | Apprenants heures continues max pour jours réels | Eleves | facultative possible | MA | accepte | accepte | accepte | accepte |  |
| `StudentsMaxHoursDaily` | Apprenants heures quotidiennes max | Eleves | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `StudentsMaxHoursDailyInInterval` | Apprenants limite heures quotidiennes dans intervalle | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMaxHoursDailyRealDays` | Apprenants limite heures quotidiennes pour jours réels | Eleves | facultative possible | MA | accepte | accepte | accepte | accepte |  |
| `StudentsMaxHoursPerAllAfternoons` | Apprenants limite heures pour tous les après-midis | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMaxMorningsPerWeek` | Apprenants limite matinées par semaine | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMaxRealDaysPerWeek` | Apprenants limite jours réels par semaine | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMaxSingleEarlyAfternoonGaps` | Apprenants interruptions simples max en début d'après-midi | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMaxSingleEarlyMorningGaps` | Apprenants interruptions simples max en début de matinée | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMaxSingleGapsBetweenMorningAndAfternoon` | Apprenants interruptions simples max entre matin et après-midi | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMaxSingleGapsInSelectedTimeSlots` | Apprenants limide vide unique dans les créneaux horaires sélectionnés | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMaxSpanPerDay` | Apprenants limite amplitude quotidienne | Eleves | bloquante | Off, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMaxSpanPerRealDay` | Apprenants limite amplitude par jour réel | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMaxThreeConsecutiveDays` | Apprenants limite trois jours consécutifs | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMinAfternoonsPerWeek` | Apprenants minimum après-midis par semaine | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMinGapsBetweenActivityTag` | Apprenants vides minimum entre code activité | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMinGapsBetweenActivityTagBetweenMorningAndAfternoon` | Vides minimum entre code activité entre matinée et après-midi pour apprenants | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMinGapsBetweenActivityTagPerRealDay` | Vides minimum entre code activité par jour réel pour apprenants | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMinGapsBetweenOrderedPairOfActivityTags` | Vides minimum entre couple ordonné de codes activité pour apprenants | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon` | Apprenants vides minimum entre paire ordonnée de codes activité entre matinée et après-midi | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMinGapsBetweenOrderedPairOfActivityTagsPerRealDay` | Vides minimum entre couple ordonné de codes activité par jour réel pour apprenants | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMinHoursDaily` | Apprenants heures quotidiennes min | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMinHoursPerAfternoon` | Apprenants heures minimum par après-midi | Eleves | bloquante | MA | refus | refus | refus | accepte | exige aussi une contrainte 'min heures par jour' pour le meme enseignant / les memes eleves |
| `StudentsMinHoursPerMorning` | Apprenants heures minimum par matinée | Eleves | bloquante | MA | refus | refus | refus | accepte | exige aussi une contrainte 'min heures par jour' pour le meme enseignant / les memes eleves |
| `StudentsMinMorningsPerWeek` | Apprenants matinées minimum par semaine | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMinRestingHours` | Apprenants heures de repos min | Eleves | bloquante | Off, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMinRestingHoursBetweenMorningAndAfternoon` | Apprenants heures minimum de repos entre matinée et après-midi | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMorningIntervalMaxDaysPerWeek` | Matinée apprenants intervalle limite jours par semaine | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMorningsEarlyMaxBeginningsAtSecondHour` | Apprenants matins au plus tôt limite débuts en seconde heure | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsOccupyMaxSetsOfTimeSlotsFromSelection` | Apprenants occupent limite jeux de créneaux horaires depuis la sélection | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsPairOfMutuallyExclusiveSetsOfTimeSlots` | Apprenants paire de jeux de créneaux horaires mutuellement exclusifs | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsPairOfMutuallyExclusiveTimeSlots` | Apprenants paire de créneaux horaires mutuellement exclusifs | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetActivityTagMaxHoursContinuously` | Groupe code activité limite heures continues | Eleves | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `StudentsSetActivityTagMaxHoursDaily` | Groupe code activité limite heures quotidiennes | Eleves | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `StudentsSetActivityTagMaxHoursDailyRealDays` | Groupe code activité limite heures quotidiennes par jours réels | Eleves | facultative possible | MA | accepte | accepte | accepte | accepte |  |
| `StudentsSetActivityTagMinHoursDaily` | Groupe code activité minimum heures quotidiennes | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetAfternoonIntervalMaxDaysPerWeek` | Après-midi groupe intervalle limite jours par semaine | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetAfternoonsEarlyMaxBeginningsAtSecondHour` | Après-midis groupe au plus tôt limite débuts en seconde heure | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetEarlyMaxBeginningsAtSecondHour` | Groupe tôt limite débuts en seconde heure | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetIntervalMaxDaysPerWeek` | Groupe intervalle limite jours par semaine | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMaxActivityTagChangesPerDay` | Jeu d'apprenants changements balise activité quotidiens max | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMaxActivityTagChangesPerWeek` | Jeu d'apprenants changements balise activité hebdomadaires max | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMaxActivityTagsPerDayFromSet` | Groupe limite codes activité par jour depuis le jeu | Eleves | bloquante (abandon si < 100 %) | Off, MA, Bloc, Trim | ABANDON | ABANDON | ABANDON | accepte |  |
| `StudentsSetMaxActivityTagsPerRealDayFromSet` | Groupe limite codes activité par jour réel depuis le jeu | Eleves | bloquante (abandon si < 100 %) | MA | ABANDON | ABANDON | ABANDON | accepte |  |
| `StudentsSetMaxAfternoonsPerWeek` | Groupe limite après-midis par semaine | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMaxDaysPerWeek` | Groupe limite jours par semaine | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMaxGapsPerDay` | Groupe limite vides quotidiens | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMaxGapsPerRealDay` | Groupe limite vides par jour réel | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMaxGapsPerWeek` | Groupe limite vides par semaine | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMaxGapsPerWeekForRealDays` | Groupe limite vides par semaine pour jours réels | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMaxHoursContinuously` | Groupe limite heures continues | Eleves | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `StudentsSetMaxHoursContinuouslyRealDays` | Groupe heures continues max pour jours réels | Eleves | facultative possible | MA | accepte | accepte | accepte | accepte |  |
| `StudentsSetMaxHoursDaily` | Groupe limite heures quotidiennes | Eleves | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `StudentsSetMaxHoursDailyInInterval` | Groupe limite heures quotidiennes dans intervalle | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMaxHoursDailyRealDays` | Groupe limite heures quotidiennes pour jours réels | Eleves | facultative possible | MA | accepte | accepte | accepte | accepte |  |
| `StudentsSetMaxHoursPerAllAfternoons` | Groupe limite heures pour tous les après-midis | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMaxMorningsPerWeek` | Groupe limite matinées par semaine | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMaxRealDaysPerWeek` | Groupe limite jours réels par semaine | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMaxSingleEarlyAfternoonGaps` | Groupe interruptions simples max en début d'après-midi | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMaxSingleEarlyMorningGaps` | Groupe interruptions simples max en début de matinée | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMaxSingleGapsBetweenMorningAndAfternoon` | Groupe interruptions simples max entre matin et après-midi | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMaxSingleGapsInSelectedTimeSlots` | Groupe limide vide unique dans les créneaux horaires sélectionnés | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMaxSpanPerDay` | Groupe limite amplitude quotidienne | Eleves | bloquante | Off, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMaxSpanPerRealDay` | Groupe limite amplitude par jour réel | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMaxThreeConsecutiveDays` | Groupe limite trois jours consécutifs | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMinAfternoonsPerWeek` | Groupe minimum après-midis par semaine | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMinGapsBetweenActivityTag` | Groupe vides minimum entre code activité | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMinGapsBetweenActivityTagBetweenMorningAndAfternoon` | Vides minimum entre code activité entre matinée et après-midi pour groupe | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMinGapsBetweenActivityTagPerRealDay` | Vides minimum entre code activité par jour réel pour groupe | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMinGapsBetweenOrderedPairOfActivityTags` | Vides minimum entre couple ordonné de codes activité pour un groupe | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon` | Groupe vides minimum entre paire ordonnée de codes activité entre matinée et après-midi | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMinGapsBetweenOrderedPairOfActivityTagsPerRealDay` | Vides minimum entre couple ordonné de codes activité par jour réel pour groupe | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMinHoursDaily` | Groupe heures minimum quotidiennes | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMinHoursPerAfternoon` | Groupe heures minimum par après-midi | Eleves | bloquante | MA | refus | refus | refus | accepte | exige aussi une contrainte 'min heures par jour' pour le meme enseignant / les memes eleves |
| `StudentsSetMinHoursPerMorning` | Groupe heures minimum par matinée | Eleves | bloquante | MA | refus | refus | refus | accepte | exige aussi une contrainte 'min heures par jour' pour le meme enseignant / les memes eleves |
| `StudentsSetMinMorningsPerWeek` | Groupe matinées minimum par semaine | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMinRestingHours` | Groupe heures de repos minimum | Eleves | bloquante | Off, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMinRestingHoursBetweenMorningAndAfternoon` | Groupe heures minimum de repos entre matinée et après-midi | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMorningIntervalMaxDaysPerWeek` | Matinée groupe intervalle limite jours par semaine | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMorningsEarlyMaxBeginningsAtSecondHour` | Groupe matins au plus tôt limite débuts en seconde heure | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetNotAvailableTimes` | Contrainte groupe temps non disponibles | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetOccupiesMaxSetsOfTimeSlotsFromSelection` | Groupe occupe limite jeux de créneaux horaires depuis la sélection | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetPairOfMutuallyExclusiveSetsOfTimeSlots` | Groupe paire de jeux de créneaux horaires mutuellement exclusifs | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetPairOfMutuallyExclusiveTimeSlots` | Groupe paire de créneaux horaires mutuellement exclusifs | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherActivityTagMaxHoursContinuously` | Enseignant code activité limite heures continues | Enseignants | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `TeacherActivityTagMaxHoursDaily` | Enseignant code activité limite heures quotidiennes | Enseignants | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `TeacherActivityTagMaxHoursDailyRealDays` | Enseignant code activité limite heures quotidiennes pour jours réels | Enseignants | facultative possible | MA | accepte | accepte | accepte | accepte |  |
| `TeacherActivityTagMinHoursDaily` | Enseignant code activité minimum heures quotidiennes | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherAfternoonIntervalMaxDaysPerWeek` | Après-midi enseignant intervalle limite jours par semaine | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherAfternoonsEarlyMaxBeginningsAtSecondHour` | Après-midis enseignant au plus tôt limite débuts en seconde heure | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherIntervalMaxDaysPerWeek` | Enseignant intervalle limite jours par semaine | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMaxActivityTagChangesPerDay` | Enseignant changements balise activité quotidiens max | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMaxActivityTagChangesPerWeek` | Enseignant changements balise activité hebdomadaires max | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMaxActivityTagsPerDayFromSet` | Enseignant limite codes activité par jour depuis le jeu | Enseignants | bloquante (abandon si < 100 %) | Off, MA, Bloc, Trim | ABANDON | ABANDON | ABANDON | accepte |  |
| `TeacherMaxActivityTagsPerRealDayFromSet` | Enseignant limite codes activité par jour réel depuis le jeu | Enseignants | bloquante (abandon si < 100 %) | MA | ABANDON | ABANDON | ABANDON | accepte |  |
| `TeacherMaxAfternoonsPerWeek` | Enseignant après-midi max par semaine | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMaxDaysPerWeek` | Enseignant jours max par semaine | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMaxGapsPerDay` | Enseignant vides max par jour | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMaxGapsPerMorningAndAfternoon` | Enseignant limite vides par matin et après-midi | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMaxGapsPerRealDay` | Enseignant limite vides par jour réel | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMaxGapsPerWeek` | Enseignant vides max par semaine | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMaxGapsPerWeekForRealDays` | Enseignant limite vides par semaine pour jours réels | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMaxHoursContinuously` | Enseignant heures continues max | Enseignants | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `TeacherMaxHoursDaily` | Enseignant heures quotidiennes max | Enseignants | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `TeacherMaxHoursDailyInInterval` | Enseignant limite heures quotidiennes dans intervalle | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMaxHoursDailyRealDays` | Enseignant limite heures quotidiennes pour jours réels | Enseignants | facultative possible | MA | accepte | accepte | accepte | accepte |  |
| `TeacherMaxHoursPerAllAfternoons` | Enseignant limite heures pour tous les après-midis | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMaxHoursPerTerm` | Enseignant limite heures par période | Enseignants | bloquante | Trim | refus | refus | refus | accepte |  |
| `TeacherMaxMorningsPerWeek` | Enseignant matinées max par semaine | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMaxRealDaysPerWeek` | Enseignant limite jours réels par semaine | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMaxSingleGapsInSelectedTimeSlots` | Enseignant limide vide unique dans les créneaux horaires sélectionnés | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMaxSpanPerDay` | Enseignant amplitude max par jour | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMaxSpanPerRealDay` | Enseignant limite amplitude par jour réel | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMaxThreeConsecutiveDays` | Enseignant limite trois jours consécutifs | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMaxTwoConsecutiveAfternoons` | Enseignant deux après-midi consécutifs max | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMaxTwoConsecutiveMornings` | Enseignant deux matinées consécutives max | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMaxZeroGapsPerAfternoon` | Enseignant limite zéro vide par après-midi | Enseignants | bloquante (abandon si < 100 %) | MA | ABANDON | ABANDON | ABANDON | accepte |  |
| `TeacherMinAfternoonsPerWeek` | Enseignant après-midi min par semaine | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMinDaysPerWeek` | Enseignant jours min par semaine | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMinGapsBetweenActivityTag` | Enseignant vides minimum entre code activité | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMinGapsBetweenActivityTagBetweenMorningAndAfternoon` | Vides minimum entre code activité entre matinée et après-midi pour enseignant | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMinGapsBetweenActivityTagPerRealDay` | Vides minimum entre code activité par jour réel pour enseignant | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMinGapsBetweenOrderedPairOfActivityTags` | Vides minimum entre couple ordonné de codes activité pour enseignant | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon` | Enseignant vides minimum entre paire ordonnée de codes activité entre matinée et après-midi | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMinGapsBetweenOrderedPairOfActivityTagsPerRealDay` | Vides minimum entre couple ordonné de codes activité par jour réel pour enseignant | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMinHoursDaily` | Enseignant heures quotidiennes min | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMinHoursDailyRealDays` | Enseignant minimum heures quotidiennes pour jours réels | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMinHoursPerAfternoon` | Enseignant heures min par après-midi | Enseignants | bloquante | MA | refus | refus | refus | accepte | exige aussi une contrainte 'min heures par jour' pour le meme enseignant / les memes eleves |
| `TeacherMinHoursPerMorning` | Enseignant heures min par matinée | Enseignants | bloquante | MA | refus | refus | refus | accepte | exige aussi une contrainte 'min heures par jour' pour le meme enseignant / les memes eleves |
| `TeacherMinMorningsPerWeek` | Enseignant matinées min par semaine | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMinRealDaysPerWeek` | Enseignant jours réels minimum par semaine | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMinRestingHours` | Enseignant heures de repos min | Enseignants | bloquante | Off, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMinRestingHoursBetweenMorningAndAfternoon` | Enseignant heures minimum de repos entre matinée et après-midi | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMorningIntervalMaxDaysPerWeek` | Matinée enseignant intervalle limite jours par semaine | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMorningsEarlyMaxBeginningsAtSecondHour` | Enseignant matins au plus tôt limite débuts en seconde heure | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherNoTwoConsecutiveDays` | Enseignant sans deux jours consécutifs | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherNotAvailableTimes` | Enseignant temps non disponibles | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherOccupiesMaxSetsOfTimeSlotsFromSelection` | Enseignant occupe limite jeux de créneaux horaires depuis la sélection | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherPairOfMutuallyExclusiveSetsOfTimeSlots` | Enseignant paire de jeux de créneaux horaires mutuellement exclusifs | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherPairOfMutuallyExclusiveTimeSlots` | Enseignant paire de créneaux horaires mutuellement exclusifs | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersActivityTagMaxHoursContinuously` | Enseignants code activité limite heures continues | Enseignants | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `TeachersActivityTagMaxHoursDaily` | Enseignants code activité limite heures quotidiennes | Enseignants | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `TeachersActivityTagMaxHoursDailyRealDays` | Enseignants code activité limite heures quotidiennes pour jours réels | Enseignants | facultative possible | MA | accepte | accepte | accepte | accepte |  |
| `TeachersActivityTagMinHoursDaily` | Enseignants code activité minimum heures quotidiennes | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersAfternoonIntervalMaxDaysPerWeek` | Après-midi enseignants intervalle limite jours par semaine | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersAfternoonsEarlyMaxBeginningsAtSecondHour` | Après-midis enseignants au plus tôt limite débuts en seconde heure | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersIntervalMaxDaysPerWeek` | Enseignants intervalle limite jours par semaine | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMaxActivityTagChangesPerDay` | Enseignants changements balise activité quotidiens max | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMaxActivityTagChangesPerWeek` | Enseignants changements balise activité hebdomadaires max | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMaxActivityTagsPerDayFromSet` | Enseignants limite codes activité par jour depuis le jeu | Enseignants | bloquante (abandon si < 100 %) | Off, MA, Bloc, Trim | ABANDON | ABANDON | ABANDON | accepte |  |
| `TeachersMaxActivityTagsPerRealDayFromSet` | Enseignants limite codes activité par jour réel depuis le jeu | Enseignants | bloquante (abandon si < 100 %) | MA | ABANDON | ABANDON | ABANDON | accepte |  |
| `TeachersMaxAfternoonsPerWeek` | Enseignants après-midi max par semaine | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMaxDaysPerWeek` | Enseignants jours max par semaine | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMaxGapsPerDay` | Enseignants vides max par jour | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMaxGapsPerMorningAndAfternoon` | Enseignants limite vides par matin et après-midi | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMaxGapsPerRealDay` | Enseignants limite vides par jour réel | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMaxGapsPerWeek` | Enseignants vides max par semaine | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMaxGapsPerWeekForRealDays` | Enseignants limite vides par semaine pour jours réels | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMaxHoursContinuously` | Enseignants heures continues max | Enseignants | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `TeachersMaxHoursDaily` | Enseignants heures quotidiennes max | Enseignants | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `TeachersMaxHoursDailyInInterval` | Enseignants limite heures quotidiennes dans intervalle | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMaxHoursDailyRealDays` | Enseignants limite heures quotidiennes pour jours réels | Enseignants | facultative possible | MA | accepte | accepte | accepte | accepte |  |
| `TeachersMaxHoursPerAllAfternoons` | Enseignants limite heures pour tous les après-midis | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMaxHoursPerTerm` | Enseignants limite heures par période | Enseignants | bloquante | Trim | refus | refus | refus | accepte |  |
| `TeachersMaxMorningsPerWeek` | Enseignants matinées max par semaine | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMaxRealDaysPerWeek` | Enseignants limite jours réels par semaine | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMaxSingleGapsInSelectedTimeSlots` | Enseignants limide vide unique dans les créneaux horaires sélectionnés | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMaxSpanPerDay` | Enseignants amplitude max par jour | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMaxSpanPerRealDay` | Enseignants limite amplitude par jour réel | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMaxThreeConsecutiveDays` | Enseignants trois jours consécutifs max | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMaxTwoConsecutiveAfternoons` | Enseignants deux après-midi consécutifs max | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMaxTwoConsecutiveMornings` | Enseignants deux matinées consécutives max | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMaxZeroGapsPerAfternoon` | Enseignants limite zéro vide par après-midi | Enseignants | bloquante (abandon si < 100 %) | MA | ABANDON | ABANDON | ABANDON | accepte |  |
| `TeachersMinAfternoonsPerWeek` | Enseignants après-midi min par semaine | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMinDaysPerWeek` | Enseignants jours min par semaine | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMinGapsBetweenActivityTag` | Enseignants vides minimum entre code activité | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMinGapsBetweenActivityTagBetweenMorningAndAfternoon` | Vides minimum entre code activité entre matinée et après-midi pour enseignants | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMinGapsBetweenActivityTagPerRealDay` | Vides minimum entre code activité par jour réel pour enseignants | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMinGapsBetweenOrderedPairOfActivityTags` | Vides minimum entre couple ordonné de codes activité pour enseignants | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon` | Enseignants vides minimum entre paire ordonnée de codes activité entre matinée et après-midi | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMinGapsBetweenOrderedPairOfActivityTagsPerRealDay` | Vides minimum entre couple ordonné de codes activité par jour réel pour enseignants | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMinHoursDaily` | Enseignants heures quotidiennes min | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMinHoursDailyRealDays` | Enseignants minimum heures quotidiennes pour jours réels | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMinHoursPerAfternoon` | Enseignants heures min par après-midi | Enseignants | bloquante | MA | refus | refus | refus | accepte | exige aussi une contrainte 'min heures par jour' pour le meme enseignant / les memes eleves |
| `TeachersMinHoursPerMorning` | Enseignants heures min par matinée | Enseignants | bloquante | MA | refus | refus | refus | accepte | exige aussi une contrainte 'min heures par jour' pour le meme enseignant / les memes eleves |
| `TeachersMinMorningsPerWeek` | Enseignants matinées min par semaine | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMinRealDaysPerWeek` | Enseignants jours réels minimum par semaine | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMinRestingHours` | Enseignants heures de repos min | Enseignants | bloquante | Off, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMinRestingHoursBetweenMorningAndAfternoon` | Enseignants heures minimum de repos entre matinée et après-midi | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMorningIntervalMaxDaysPerWeek` | Matinée enseignants intervalle limite jours par semaine | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMorningsEarlyMaxBeginningsAtSecondHour` | Enseignants matins au plus tôt limite débuts en seconde heure | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersNoTwoConsecutiveDays` | Enseignants sans deux jours consécutifs | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersOccupyMaxSetsOfTimeSlotsFromSelection` | Enseignants occupent limite jeux de créneaux horaires depuis la sélection | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersPairOfMutuallyExclusiveSetsOfTimeSlots` | Enseignants paire de jeux de créneaux horaires mutuellement exclusifs | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersPairOfMutuallyExclusiveTimeSlots` | Enseignants paire de créneaux horaires mutuellement exclusifs | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `ActivityTagsNotOverlapping` | Balises sans chevauchement | Etiquettes | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | ABANDON | accepte |  |
| `BreakTimes` | Temps de pause | Pauses | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |

## Contraintes d'espace (81)

Colonnes p50, p0, p101 : resultat avec un poids de 50 %, 0 % et 101 % ; Inactive : avec `Active=false`.

| Balise XML | Nom (FR) | Categorie | Classification | Modes | p50 | p0 | p101 | Inactive | Prerequis |
|---|---|---|---|---|---|---|---|---|---|
| `ActivitiesOccupyMaxDifferentRooms` | Activités occupent salles différentes max | Activites | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `ActivitiesSameRoomIfConsecutive` | Activités même salle si consécutives | Activites | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `ActivityPreferredRoom` | Activité salle préférée | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivityPreferredRooms` | Activité salles préférées | Activites | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `BuildingMinOneActivityInEachAvailableTimeSlot` | Bâtiment une activité minimum dans chaque créneau disponible | Activites | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte | exige une contrainte 'salles preferees' a 100 % pour chaque activite et une duree totale d'activites au moins egale au nombre de creneaux disponibles du batiment / de la salle |
| `BuildingsMinOneActivityInEachAvailableTimeSlot` | Bâtiments une activité minimum dans chaque créneau disponible | Activites | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte | exige une contrainte 'salles preferees' a 100 % pour chaque activite et une duree totale d'activites au moins egale au nombre de creneaux disponibles du batiment / de la salle |
| `BasicCompulsorySpace` | Spatiales obligatoires de base | Base | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `StudentsMaxBuildingChangesPerDay` | Apprenants limite changements bâtiments quotidiens | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMaxBuildingChangesPerDayInInterval` | Apprenants limite changements bâtiments quotidiens dans l'intervalle | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMaxBuildingChangesPerRealDay` | Apprenants limite changements bâtiments par jour réel | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMaxBuildingChangesPerRealDayInInterval` | Apprenants limite changements bâtiments par jour réel dans l'intervalle | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMaxBuildingChangesPerWeek` | Apprenants limite changements bâtiments par semaine | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMaxRoomChangesPerDay` | Apprenants limite changements salles quotidiens | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMaxRoomChangesPerDayInInterval` | Apprenants limite changements salles quotidiens dans l'intervalle | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMaxRoomChangesPerRealDay` | Apprenants limite changements de salle par jour réel | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMaxRoomChangesPerRealDayInInterval` | Apprenants limite changements salles par jour réel dans l'intervalle | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsMaxRoomChangesPerWeek` | Apprenants limite changements salles hebdomadaires | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMinGapsBetweenBuildingChanges` | Apprenants vides minimum entre changements bâtiments | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsMinGapsBetweenRoomChanges` | Apprenants vides minimum entre changements salles | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetHomeRoom` | Groupe salle de référence | Eleves | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `StudentsSetHomeRooms` | Groupe salles de référence | Eleves | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `StudentsSetMaxBuildingChangesPerDay` | Groupe limite changements bâtiments quotidiens | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMaxBuildingChangesPerDayInInterval` | Groupes limite changements bâtiments quotidiens dans l'intervalle | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMaxBuildingChangesPerRealDay` | Groupe limite changements bâtiments par jour réel | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMaxBuildingChangesPerRealDayInInterval` | Groupes limite changements bâtiments par jour réel dans l'intervalle | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMaxBuildingChangesPerWeek` | Groupe limite changements bâtiments par semaine | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMaxRoomChangesPerDay` | Groupe limite changements salles quotidiens | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMaxRoomChangesPerDayInInterval` | Groupe limite changements salles quotidiens dans l'intervalle | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMaxRoomChangesPerRealDay` | Groupe limite changements de salle par jour réel | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMaxRoomChangesPerRealDayInInterval` | Groupe limite changements salles par jour réel dans l'intervalle | Eleves | bloquante | MA | refus | refus | refus | accepte |  |
| `StudentsSetMaxRoomChangesPerWeek` | Groupe limite changements salles hebdomadaires | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMinGapsBetweenBuildingChanges` | Groupe vides minimum entre changements bâtiments | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `StudentsSetMinGapsBetweenRoomChanges` | Groupe vides minimum entre changements salles | Eleves | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherHomeRoom` | Enseignant salle de référence | Enseignants | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `TeacherHomeRooms` | Enseignant salles de référence | Enseignants | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `TeacherMaxBuildingChangesPerDay` | Enseignant limite changements bâtiments quotidiens | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMaxBuildingChangesPerDayInInterval` | Enseignant limite changements bâtiments quotidiens dans l'intervalle | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMaxBuildingChangesPerRealDay` | Enseignant limite changements bâtiments par jour réel | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMaxBuildingChangesPerRealDayInInterval` | Enseignant limite changements bâtiments par jour réel dans l'intervalle | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMaxBuildingChangesPerWeek` | Enseignant limite changements bâtiments par semaine | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMaxRoomChangesPerDay` | Enseignant limite changements salles quotidiens | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMaxRoomChangesPerDayInInterval` | Enseignant limite changements salles quotidiens dans l'intervalle | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMaxRoomChangesPerRealDay` | Enseignant limite changements de salle par jour réel | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMaxRoomChangesPerRealDayInInterval` | Enseignant limite changements salles par jour réel dans l'intervalle | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeacherMaxRoomChangesPerWeek` | Enseignant limite changements salles hebdomadaires | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMinGapsBetweenBuildingChanges` | Enseignant vides minimum entre changements bâtiments | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherMinGapsBetweenRoomChanges` | Enseignant vides minimum entre changements salles | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeacherRoomNotAvailableTimes` | Enseignant salle temps non disponibles | Enseignants | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `TeachersMaxBuildingChangesPerDay` | Enseignants limite changements bâtiments quotidiens | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMaxBuildingChangesPerDayInInterval` | Enseignants limite changements bâtiments quotidiens dans l'intervalle | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMaxBuildingChangesPerRealDay` | Enseignants limite changements bâtiments par jour réel | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMaxBuildingChangesPerRealDayInInterval` | Enseignants limite changements bâtiments par jour réel dans l'intervalle | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMaxBuildingChangesPerWeek` | Enseignants limite changements bâtiments par semaine | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMaxRoomChangesPerDay` | Enseignants limite changements salles quotidiens | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMaxRoomChangesPerDayInInterval` | Enseignants limite changements salles quotidiens dans l'intervalle | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMaxRoomChangesPerRealDay` | Enseignants limite changements de salle par jour réel | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMaxRoomChangesPerRealDayInInterval` | Enseignants limite changements salles par jour réel dans l'intervalle | Enseignants | bloquante | MA | refus | refus | refus | accepte |  |
| `TeachersMaxRoomChangesPerWeek` | Enseignants limite changements salles hebdomadaires | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMinGapsBetweenBuildingChanges` | Enseignants vides minimum entre changements bâtiments | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `TeachersMinGapsBetweenRoomChanges` | Enseignants vides minimum entre changements salles | Enseignants | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `ActivityTagPreferredRoom` | Balise salle préférée | Etiquettes | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `ActivityTagPreferredRooms` | Balise salles préférées | Etiquettes | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `SubjectActivityTagPreferredRoom` | Matière code activité salle préférée | Matieres | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `SubjectActivityTagPreferredRooms` | Matière code activité salles préférées | Matieres | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `SubjectPreferredRoom` | Matière salle préférée | Matieres | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `SubjectPreferredRooms` | Matière salles préférées | Matieres | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `RoomMaxActivitiesPerTeacher` | Salle limite activités par enseignant | Salles | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `RoomMaxActivityTagsPerDayFromSet` | Salle limite codes activité par jour depuis le jeu | Salles | bloquante (abandon si < 100 %) | Off, MA, Bloc, Trim | ABANDON | ABANDON | ABANDON | accepte |  |
| `RoomMaxActivityTagsPerRealDayFromSet` | Salle limite codes activité par jour réel depuis le jeu | Salles | bloquante (abandon si < 100 %) | MA | ABANDON | ABANDON | ABANDON | accepte |  |
| `RoomMaxActivityTagsPerWeekFromSet` | Salle limite codes activité par semaine depuis le jeu | Salles | bloquante (abandon si < 100 %) | Off, MA, Bloc, Trim | ABANDON | ABANDON | ABANDON | accepte |  |
| `RoomNotAvailableTimes` | Salle temps non disponibles | Salles | facultative possible | Off, MA, Bloc, Trim | accepte | accepte | accepte | accepte |  |
| `RoomOccupiesMaxSetsOfTimeSlotsFromSelection` | Salle occupe limite jeux de créneaux horaires depuis la sélection | Salles | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `RoomPairOfMutuallyExclusiveSetsOfTimeSlots` | Salle paire de jeux de créneaux horaires mutuellement exclusifs | Salles | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `RoomPairOfMutuallyExclusiveTimeSlots` | Salle paire de créneaux horaires mutuellement exclusifs | Salles | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `RoomsMaxActivitiesPerTeacher` | Salles limite activités par enseignant | Salles | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `RoomsMaxActivityTagsPerDayFromSet` | Salles limite codes activité par jour depuis le jeu | Salles | bloquante (abandon si < 100 %) | Off, MA, Bloc, Trim | ABANDON | ABANDON | ABANDON | accepte |  |
| `RoomsMaxActivityTagsPerRealDayFromSet` | Salles limite codes activité par jour réel depuis le jeu | Salles | bloquante (abandon si < 100 %) | MA | ABANDON | ABANDON | ABANDON | accepte |  |
| `RoomsMaxActivityTagsPerWeekFromSet` | Salles limite codes activité par semaine depuis le jeu | Salles | bloquante (abandon si < 100 %) | Off, MA, Bloc, Trim | ABANDON | ABANDON | ABANDON | accepte |  |
| `RoomsOccupyMaxSetsOfTimeSlotsFromSelection` | Salles occupent limite jeux de créneaux horaires depuis la sélection | Salles | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `RoomsPairOfMutuallyExclusiveSetsOfTimeSlots` | Salles paire de jeux de créneaux horaires mutuellement exclusifs | Salles | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |
| `RoomsPairOfMutuallyExclusiveTimeSlots` | Salles paire de créneaux horaires mutuellement exclusifs | Salles | bloquante | Off, MA, Bloc, Trim | refus | refus | refus | accepte |  |

## Fiches detaillees

### ConstraintActivitiesOccupyMaxDifferentRooms

- Nom : Activités occupent salles différentes max (Activities occupy max different rooms)
- Famille / categorie : espace / Activites
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, Max_Number_of_Different_Rooms
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'activities occupy max different rooms' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Activités occupent salles différentes max

```xml
<ConstraintActivitiesOccupyMaxDifferentRooms>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<Max_Number_of_Different_Rooms>3</Max_Number_of_Different_Rooms>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesOccupyMaxDifferentRooms>
```

### ConstraintActivitiesSameRoomIfConsecutive

- Nom : Activités même salle si consécutives (Activities same room if consecutive)
- Famille / categorie : espace / Activites
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'activities same room if consecutive' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Activités même salle si consécutives

```xml
<ConstraintActivitiesSameRoomIfConsecutive>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesSameRoomIfConsecutive>
```

### ConstraintActivityPreferredRoom

- Nom : Activité salle préférée (Activity preferred room)
- Famille / categorie : espace / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Id, Room, Number_of_Real_Rooms, Real_Room

```xml
<ConstraintActivityPreferredRoom>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Id>1</Activity_Id>
<Room>R1</Room>
<Number_of_Real_Rooms>0</Number_of_Real_Rooms>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivityPreferredRoom>
```

### ConstraintActivityPreferredRooms

- Nom : Activité salles préférées (Activity preferred rooms)
- Famille / categorie : espace / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Id, Number_of_Preferred_Rooms, Preferred_Room

```xml
<ConstraintActivityPreferredRooms>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Id>1</Activity_Id>
<Number_of_Preferred_Rooms>2</Number_of_Preferred_Rooms>
<Preferred_Room>R1</Preferred_Room>
<Preferred_Room>R2</Preferred_Room>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivityPreferredRooms>
```

### ConstraintActivityTagPreferredRoom

- Nom : Balise salle préférée (Activity tag preferred room)
- Famille / categorie : espace / Etiquettes
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Tag, Room

```xml
<ConstraintActivityTagPreferredRoom>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Tag>Tag1</Activity_Tag>
<Room>R1</Room>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivityTagPreferredRoom>
```

### ConstraintActivityTagPreferredRooms

- Nom : Balise salles préférées (Activity tag preferred rooms)
- Famille / categorie : espace / Etiquettes
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Tag, Number_of_Preferred_Rooms, Preferred_Room

```xml
<ConstraintActivityTagPreferredRooms>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Tag>Tag1</Activity_Tag>
<Number_of_Preferred_Rooms>2</Number_of_Preferred_Rooms>
<Preferred_Room>R1</Preferred_Room>
<Preferred_Room>R2</Preferred_Room>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivityTagPreferredRooms>
```

### ConstraintBasicCompulsorySpace

- Nom : Spatiales obligatoires de base (Basic compulsory space)
- Famille / categorie : espace / Base
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : (aucun)
- Description : Ce sont les contraintes obligatoires de base (se référant à l'allocation des salles) pour tous les plannings

```xml
<ConstraintBasicCompulsorySpace>
<Weight_Percentage>100</Weight_Percentage>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintBasicCompulsorySpace>
```

### ConstraintBuildingMinOneActivityInEachAvailableTimeSlot

- Nom : Bâtiment une activité minimum dans chaque créneau disponible (Building min one activity in each available time slot)
- Famille / categorie : espace / Activites
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Building
- Prerequis : exige une contrainte 'salles preferees' a 100 % pour chaque activite et une duree totale d'activites au moins egale au nombre de creneaux disponibles du batiment / de la salle
- Message a 50 % : Cannot optimize, because there is a space constraint building min one activity in each available time slot with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un bâtiment a une activité minimum dans chaque créneau disponible

```xml
<ConstraintBuildingMinOneActivityInEachAvailableTimeSlot>
<Weight_Percentage>100</Weight_Percentage>
<Building>Bat1</Building>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintBuildingMinOneActivityInEachAvailableTimeSlot>
```

### ConstraintBuildingsMinOneActivityInEachAvailableTimeSlot

- Nom : Bâtiments une activité minimum dans chaque créneau disponible (Buildings min one activity in each available time slot)
- Famille / categorie : espace / Activites
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = infaisable (Time exceeded), Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : (aucun)
- Prerequis : exige une contrainte 'salles preferees' a 100 % pour chaque activite et une duree totale d'activites au moins egale au nombre de creneaux disponibles du batiment / de la salle
- Message a 50 % : Cannot optimize, because there is a space constraint buildings min one activity in each available time slot with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les bâtiments ont une activité minimum dans chaque créneau disponible

```xml
<ConstraintBuildingsMinOneActivityInEachAvailableTimeSlot>
<Weight_Percentage>100</Weight_Percentage>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintBuildingsMinOneActivityInEachAvailableTimeSlot>
```

### ConstraintRoomMaxActivitiesPerTeacher

- Nom : Salle limite activités par enseignant (Room max activities per teacher)
- Famille / categorie : espace / Salles
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Room, Max_Activities_Per_Teacher, Keep_Same_Room_In_A_Building
- Message a 50 % : Cannot optimize, because there is a space constraint room max activities per teacher with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Salle limite activités par enseignant

```xml
<ConstraintRoomMaxActivitiesPerTeacher>
<Weight_Percentage>100</Weight_Percentage>
<Room>R1</Room>
<Max_Activities_Per_Teacher>20</Max_Activities_Per_Teacher>
<Keep_Same_Room_In_A_Building>true</Keep_Same_Room_In_A_Building>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintRoomMaxActivitiesPerTeacher>
```

### ConstraintRoomMaxActivityTagsPerDayFromSet

- Nom : Salle limite codes activité par jour depuis le jeu (Room max activity tags per day from set)
- Famille / categorie : espace / Salles
- Classification : **toujours bloquante (poids < 100 % : abandon du programme)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = abandon du programme, 0 % = abandon du programme, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Room, Number_of_Activity_Tags, Activity_Tag, Maximum_Allowed_Activity_Tags
- Message a 50 % : Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)]
- Description : Une salle doit respecter le nombre maximum de codes activité par jour depuis un jeu

```xml
<ConstraintRoomMaxActivityTagsPerDayFromSet>
<Weight_Percentage>100</Weight_Percentage>
<Room>R1</Room>
<Number_of_Activity_Tags>2</Number_of_Activity_Tags>
<Activity_Tag>Tag1</Activity_Tag>
<Activity_Tag>Tag2</Activity_Tag>
<Maximum_Allowed_Activity_Tags>3</Maximum_Allowed_Activity_Tags>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintRoomMaxActivityTagsPerDayFromSet>
```

### ConstraintRoomMaxActivityTagsPerRealDayFromSet

- Nom : Salle limite codes activité par jour réel depuis le jeu (Room max activity tags per real day from set)
- Famille / categorie : espace / Salles
- Classification : **toujours bloquante (poids < 100 % : abandon du programme)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = abandon du programme, 0 % = abandon du programme, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Room, Number_of_Activity_Tags, Activity_Tag, Maximum_Allowed_Activity_Tags
- Message a 50 % : Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)]
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Une salle doit respecter le nombre maximum de codes activité par jour réel depuis un jeu

```xml
<ConstraintRoomMaxActivityTagsPerRealDayFromSet>
<Weight_Percentage>100</Weight_Percentage>
<Room>R1</Room>
<Number_of_Activity_Tags>2</Number_of_Activity_Tags>
<Activity_Tag>Tag1</Activity_Tag>
<Activity_Tag>Tag2</Activity_Tag>
<Maximum_Allowed_Activity_Tags>3</Maximum_Allowed_Activity_Tags>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintRoomMaxActivityTagsPerRealDayFromSet>
```

### ConstraintRoomMaxActivityTagsPerWeekFromSet

- Nom : Salle limite codes activité par semaine depuis le jeu (Room max activity tags per week from set)
- Famille / categorie : espace / Salles
- Classification : **toujours bloquante (poids < 100 % : abandon du programme)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = abandon du programme, 0 % = abandon du programme, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Room, Number_of_Activity_Tags, Activity_Tag, Maximum_Allowed_Activity_Tags
- Message a 50 % : Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)]
- Description : Une salle doit respecter le nombre maximum de codes activité par semaine depuis un jeu

```xml
<ConstraintRoomMaxActivityTagsPerWeekFromSet>
<Weight_Percentage>100</Weight_Percentage>
<Room>R1</Room>
<Number_of_Activity_Tags>2</Number_of_Activity_Tags>
<Activity_Tag>Tag1</Activity_Tag>
<Activity_Tag>Tag2</Activity_Tag>
<Maximum_Allowed_Activity_Tags>3</Maximum_Allowed_Activity_Tags>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintRoomMaxActivityTagsPerWeekFromSet>
```

### ConstraintRoomNotAvailableTimes

- Nom : Salle temps non disponibles (Room not available times)
- Famille / categorie : espace / Salles
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Room, Number_of_Not_Available_Times, Not_Available_Time

```xml
<ConstraintRoomNotAvailableTimes>
<Weight_Percentage>100</Weight_Percentage>
<Room>R1</Room>
<Number_of_Not_Available_Times>1</Number_of_Not_Available_Times>
<Not_Available_Time>
<Day>Samedi</Day>
<Hour>H6</Hour>
</Not_Available_Time>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintRoomNotAvailableTimes>
```

### ConstraintRoomOccupiesMaxSetsOfTimeSlotsFromSelection

- Nom : Salle occupe limite jeux de créneaux horaires depuis la sélection (Room occupies max sets of time slots from selection)
- Famille / categorie : espace / Salles
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Room, Maximum_Number_of_Occupied_Sets, Number_of_Selected_Sets_of_Time_Slots, Selected_Set_of_Time_Slots
- Message a 50 % : Cannot optimize, because there is a space constraint room occupies max sets of time slots from selection with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Une salle occupe un nombre maximum de jeux de créneaux horaires depuis une sélection

```xml
<ConstraintRoomOccupiesMaxSetsOfTimeSlotsFromSelection>
<Weight_Percentage>100</Weight_Percentage>
<Room>R1</Room>
<Maximum_Number_of_Occupied_Sets>2</Maximum_Number_of_Occupied_Sets>
<Number_of_Selected_Sets_of_Time_Slots>2</Number_of_Selected_Sets_of_Time_Slots>
<Selected_Set_of_Time_Slots>
<Number_of_Selected_Time_Slots>2</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
</Selected_Set_of_Time_Slots>
<Selected_Set_of_Time_Slots>
<Number_of_Selected_Time_Slots>2</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
</Selected_Set_of_Time_Slots>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintRoomOccupiesMaxSetsOfTimeSlotsFromSelection>
```

### ConstraintRoomPairOfMutuallyExclusiveSetsOfTimeSlots

- Nom : Salle paire de jeux de créneaux horaires mutuellement exclusifs (Room pair of mutually exclusive sets of time slots)
- Famille / categorie : espace / Salles
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Room, Number_of_Selected_Time_Slots_in_First_Set, Selected_Time_Slot_in_First_Set, Number_of_Selected_Time_Slots_in_Second_Set, Selected_Time_Slot_in_Second_Set
- Message a 50 % : Cannot optimize, because there is a space constraint room pair of mutually exclusive sets of time slots with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Une salle a une paire de jeux de créneaux horaires mutuellement exclusifs

```xml
<ConstraintRoomPairOfMutuallyExclusiveSetsOfTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Room>R1</Room>
<Number_of_Selected_Time_Slots_in_First_Set>1</Number_of_Selected_Time_Slots_in_First_Set>
<Selected_Time_Slot_in_First_Set>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot_in_First_Set>
<Number_of_Selected_Time_Slots_in_Second_Set>1</Number_of_Selected_Time_Slots_in_Second_Set>
<Selected_Time_Slot_in_Second_Set>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot_in_Second_Set>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintRoomPairOfMutuallyExclusiveSetsOfTimeSlots>
```

### ConstraintRoomPairOfMutuallyExclusiveTimeSlots

- Nom : Salle paire de créneaux horaires mutuellement exclusifs (Room pair of mutually exclusive time slots)
- Famille / categorie : espace / Salles
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Room, First_Time_Slot, Second_Time_Slot
- Message a 50 % : Cannot optimize, because there is a space constraint room pair of mutually exclusive time slots with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Une salle a une paire de créneaux horaires mutuellement exclusifs

```xml
<ConstraintRoomPairOfMutuallyExclusiveTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Room>R1</Room>
<First_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</First_Time_Slot>
<Second_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Second_Time_Slot>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintRoomPairOfMutuallyExclusiveTimeSlots>
```

### ConstraintRoomsMaxActivitiesPerTeacher

- Nom : Salles limite activités par enseignant (Rooms max activities per teacher)
- Famille / categorie : espace / Salles
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Activities_Per_Teacher, Keep_Same_Room_In_A_Building
- Message a 50 % : Cannot optimize, because there is a space constraint rooms max activities per teacher with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Salles limite activités par enseignant

```xml
<ConstraintRoomsMaxActivitiesPerTeacher>
<Weight_Percentage>100</Weight_Percentage>
<Max_Activities_Per_Teacher>20</Max_Activities_Per_Teacher>
<Keep_Same_Room_In_A_Building>true</Keep_Same_Room_In_A_Building>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintRoomsMaxActivitiesPerTeacher>
```

### ConstraintRoomsMaxActivityTagsPerDayFromSet

- Nom : Salles limite codes activité par jour depuis le jeu (Rooms max activity tags per day from set)
- Famille / categorie : espace / Salles
- Classification : **toujours bloquante (poids < 100 % : abandon du programme)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = abandon du programme, 0 % = abandon du programme, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Number_of_Activity_Tags, Activity_Tag, Maximum_Allowed_Activity_Tags
- Message a 50 % : Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)]
- Description : Toutes les salles doivent respecter le nombre maximum de codes activité par jour depuis un jeu

```xml
<ConstraintRoomsMaxActivityTagsPerDayFromSet>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activity_Tags>2</Number_of_Activity_Tags>
<Activity_Tag>Tag1</Activity_Tag>
<Activity_Tag>Tag2</Activity_Tag>
<Maximum_Allowed_Activity_Tags>3</Maximum_Allowed_Activity_Tags>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintRoomsMaxActivityTagsPerDayFromSet>
```

### ConstraintRoomsMaxActivityTagsPerRealDayFromSet

- Nom : Salles limite codes activité par jour réel depuis le jeu (Rooms max activity tags per real day from set)
- Famille / categorie : espace / Salles
- Classification : **toujours bloquante (poids < 100 % : abandon du programme)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = abandon du programme, 0 % = abandon du programme, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Number_of_Activity_Tags, Activity_Tag, Maximum_Allowed_Activity_Tags
- Message a 50 % : Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)]
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Toutes les salles doivent respecter le nombre maximum de codes activité par jour réel depuis un jeu

```xml
<ConstraintRoomsMaxActivityTagsPerRealDayFromSet>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activity_Tags>2</Number_of_Activity_Tags>
<Activity_Tag>Tag1</Activity_Tag>
<Activity_Tag>Tag2</Activity_Tag>
<Maximum_Allowed_Activity_Tags>3</Maximum_Allowed_Activity_Tags>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintRoomsMaxActivityTagsPerRealDayFromSet>
```

### ConstraintRoomsMaxActivityTagsPerWeekFromSet

- Nom : Salles limite codes activité par semaine depuis le jeu (Rooms max activity tags per week from set)
- Famille / categorie : espace / Salles
- Classification : **toujours bloquante (poids < 100 % : abandon du programme)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = abandon du programme, 0 % = abandon du programme, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Number_of_Activity_Tags, Activity_Tag, Maximum_Allowed_Activity_Tags
- Message a 50 % : Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)]
- Description : Toutes les salles doivent respecter le nombre maximum de codes activité par semaine depuis un jeu

```xml
<ConstraintRoomsMaxActivityTagsPerWeekFromSet>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activity_Tags>2</Number_of_Activity_Tags>
<Activity_Tag>Tag1</Activity_Tag>
<Activity_Tag>Tag2</Activity_Tag>
<Maximum_Allowed_Activity_Tags>3</Maximum_Allowed_Activity_Tags>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintRoomsMaxActivityTagsPerWeekFromSet>
```

### ConstraintRoomsOccupyMaxSetsOfTimeSlotsFromSelection

- Nom : Salles occupent limite jeux de créneaux horaires depuis la sélection (Rooms occupy max sets of time slots from selection)
- Famille / categorie : espace / Salles
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Maximum_Number_of_Occupied_Sets, Number_of_Selected_Sets_of_Time_Slots, Selected_Set_of_Time_Slots
- Message a 50 % : Cannot optimize, because there is a space constraint rooms occupy max sets of time slots from selection with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Toutes les salles occupent un nombre maximum de jeux de créneaux horaires depuis une sélection

```xml
<ConstraintRoomsOccupyMaxSetsOfTimeSlotsFromSelection>
<Weight_Percentage>100</Weight_Percentage>
<Maximum_Number_of_Occupied_Sets>2</Maximum_Number_of_Occupied_Sets>
<Number_of_Selected_Sets_of_Time_Slots>2</Number_of_Selected_Sets_of_Time_Slots>
<Selected_Set_of_Time_Slots>
<Number_of_Selected_Time_Slots>2</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
</Selected_Set_of_Time_Slots>
<Selected_Set_of_Time_Slots>
<Number_of_Selected_Time_Slots>2</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
</Selected_Set_of_Time_Slots>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintRoomsOccupyMaxSetsOfTimeSlotsFromSelection>
```

### ConstraintRoomsPairOfMutuallyExclusiveSetsOfTimeSlots

- Nom : Salles paire de jeux de créneaux horaires mutuellement exclusifs (Rooms pair of mutually exclusive sets of time slots)
- Famille / categorie : espace / Salles
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Selected_Time_Slots_in_First_Set, Selected_Time_Slot_in_First_Set, Number_of_Selected_Time_Slots_in_Second_Set, Selected_Time_Slot_in_Second_Set
- Message a 50 % : Cannot optimize, because there is a space constraint rooms pair of mutually exclusive sets of time slots with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Toutes les salles ont une paire de jeux de créneaux horaires mutuellement exclusifs

```xml
<ConstraintRoomsPairOfMutuallyExclusiveSetsOfTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Selected_Time_Slots_in_First_Set>1</Number_of_Selected_Time_Slots_in_First_Set>
<Selected_Time_Slot_in_First_Set>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot_in_First_Set>
<Number_of_Selected_Time_Slots_in_Second_Set>1</Number_of_Selected_Time_Slots_in_Second_Set>
<Selected_Time_Slot_in_Second_Set>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot_in_Second_Set>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintRoomsPairOfMutuallyExclusiveSetsOfTimeSlots>
```

### ConstraintRoomsPairOfMutuallyExclusiveTimeSlots

- Nom : Salles paire de créneaux horaires mutuellement exclusifs (Rooms pair of mutually exclusive time slots)
- Famille / categorie : espace / Salles
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : First_Time_Slot, Second_Time_Slot
- Message a 50 % : Cannot optimize, because there is a space constraint rooms pair of mutually exclusive time slots with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Toutes les salles ont une paire de créneaux horaires mutuellement exclusifs

```xml
<ConstraintRoomsPairOfMutuallyExclusiveTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<First_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</First_Time_Slot>
<Second_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Second_Time_Slot>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintRoomsPairOfMutuallyExclusiveTimeSlots>
```

### ConstraintStudentsMaxBuildingChangesPerDay

- Nom : Apprenants limite changements bâtiments quotidiens (Students max building changes per day)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Building_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint students max building changes per day with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Apprenants limite changements bâtiments quotidiens

```xml
<ConstraintStudentsMaxBuildingChangesPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Building_Changes_Per_Day>6</Max_Building_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxBuildingChangesPerDay>
```

### ConstraintStudentsMaxBuildingChangesPerDayInInterval

- Nom : Apprenants limite changements bâtiments quotidiens dans l'intervalle (Students max building changes per day in interval)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Building_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint students max building changes per day in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Apprenants limite changements bâtiments quotidiens dans l'intervalle horaire

```xml
<ConstraintStudentsMaxBuildingChangesPerDayInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Building_Changes_Per_Day>6</Max_Building_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxBuildingChangesPerDayInInterval>
```

### ConstraintStudentsMaxBuildingChangesPerRealDay

- Nom : Apprenants limite changements bâtiments par jour réel (Students max building changes per real day)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Building_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint students max building changes per real day with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Apprenants limite changements bâtiments par jour réel

```xml
<ConstraintStudentsMaxBuildingChangesPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Building_Changes_Per_Day>4</Max_Building_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxBuildingChangesPerRealDay>
```

### ConstraintStudentsMaxBuildingChangesPerRealDayInInterval

- Nom : Apprenants limite changements bâtiments par jour réel dans l'intervalle (Students max building changes per real day in interval)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Interval_Start_Day, Interval_Start_Hour, Interval_Start_Day, Interval_Start_Hour, Interval_End_Day, Interval_End_Hour, Interval_End_Day, Interval_End_Hour, Interval_End_Day, Interval_End_Hour, Max_Building_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint students max building changes per real day in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Apprenants limite changements bâtiments par jour réel dans l'intervalle horaire

```xml
<ConstraintStudentsMaxBuildingChangesPerRealDayInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Interval_Start_Day>Morning</Interval_Start_Day>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Day>Morning</Interval_End_Day>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Building_Changes_Per_Day>4</Max_Building_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxBuildingChangesPerRealDayInInterval>
```

### ConstraintStudentsMaxBuildingChangesPerWeek

- Nom : Apprenants limite changements bâtiments par semaine (Students max building changes per week)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Building_Changes_Per_Week
- Message a 50 % : Cannot optimize, because there is a space constraint students max building changes per week with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Apprenants limite changements bâtiments par semaine

```xml
<ConstraintStudentsMaxBuildingChangesPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Max_Building_Changes_Per_Week>6</Max_Building_Changes_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxBuildingChangesPerWeek>
```

### ConstraintStudentsMaxRoomChangesPerDay

- Nom : Apprenants limite changements salles quotidiens (Students max room changes per day)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Room_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint students max room changes per day with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Apprenants limite changements salles quotidiens

```xml
<ConstraintStudentsMaxRoomChangesPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Room_Changes_Per_Day>6</Max_Room_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxRoomChangesPerDay>
```

### ConstraintStudentsMaxRoomChangesPerDayInInterval

- Nom : Apprenants limite changements salles quotidiens dans l'intervalle (Students max room changes per day in interval)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Room_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint students max room changes per day in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Apprenants limite changements salles quotidiens dans l'intervalle horaire

```xml
<ConstraintStudentsMaxRoomChangesPerDayInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Room_Changes_Per_Day>6</Max_Room_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxRoomChangesPerDayInInterval>
```

### ConstraintStudentsMaxRoomChangesPerRealDay

- Nom : Apprenants limite changements de salle par jour réel (Students max room changes per real day)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Room_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint students max room changes per real day with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Apprenants limite changements de salle par jour réel

```xml
<ConstraintStudentsMaxRoomChangesPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Room_Changes_Per_Day>4</Max_Room_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxRoomChangesPerRealDay>
```

### ConstraintStudentsMaxRoomChangesPerRealDayInInterval

- Nom : Apprenants limite changements salles par jour réel dans l'intervalle (Students max room changes per real day in interval)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Interval_Start_Day, Interval_Start_Hour, Interval_Start_Day, Interval_Start_Hour, Interval_End_Day, Interval_End_Hour, Interval_End_Day, Interval_End_Hour, Interval_End_Day, Interval_End_Hour, Max_Room_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint students max room changes per real day in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Apprenants limite changements salles par jour réel dans l'intervalle horaire

```xml
<ConstraintStudentsMaxRoomChangesPerRealDayInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Interval_Start_Day>Morning</Interval_Start_Day>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Day>Morning</Interval_End_Day>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Room_Changes_Per_Day>4</Max_Room_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxRoomChangesPerRealDayInInterval>
```

### ConstraintStudentsMaxRoomChangesPerWeek

- Nom : Apprenants limite changements salles hebdomadaires (Students max room changes per week)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Room_Changes_Per_Week
- Message a 50 % : Cannot optimize, because there is a space constraint students max room changes per week with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Apprenants limite changements salles hebdomadaires

```xml
<ConstraintStudentsMaxRoomChangesPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Max_Room_Changes_Per_Week>6</Max_Room_Changes_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxRoomChangesPerWeek>
```

### ConstraintStudentsMinGapsBetweenBuildingChanges

- Nom : Apprenants vides minimum entre changements bâtiments (Students min gaps between building changes)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Min_Gaps_Between_Building_Changes
- Message a 50 % : Cannot optimize, because there is a space constraint students min gaps between building changes with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Apprenants vides minimum entre changements bâtiments

```xml
<ConstraintStudentsMinGapsBetweenBuildingChanges>
<Weight_Percentage>100</Weight_Percentage>
<Min_Gaps_Between_Building_Changes>0</Min_Gaps_Between_Building_Changes>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMinGapsBetweenBuildingChanges>
```

### ConstraintStudentsMinGapsBetweenRoomChanges

- Nom : Apprenants vides minimum entre changements salles (Students min gaps between room changes)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Min_Gaps_Between_Room_Changes
- Message a 50 % : Cannot optimize, because there is a space constraint students min gaps between room changes with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Apprenants vides minimum entre changements salles

```xml
<ConstraintStudentsMinGapsBetweenRoomChanges>
<Weight_Percentage>100</Weight_Percentage>
<Min_Gaps_Between_Room_Changes>0</Min_Gaps_Between_Room_Changes>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMinGapsBetweenRoomChanges>
```

### ConstraintStudentsSetHomeRoom

- Nom : Groupe salle de référence (Students set home room)
- Famille / categorie : espace / Eleves
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Students, Room

```xml
<ConstraintStudentsSetHomeRoom>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Room>R1</Room>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetHomeRoom>
```

### ConstraintStudentsSetHomeRooms

- Nom : Groupe salles de référence (Students set home rooms)
- Famille / categorie : espace / Eleves
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Students, Number_of_Preferred_Rooms, Preferred_Room

```xml
<ConstraintStudentsSetHomeRooms>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Number_of_Preferred_Rooms>2</Number_of_Preferred_Rooms>
<Preferred_Room>R1</Preferred_Room>
<Preferred_Room>R2</Preferred_Room>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetHomeRooms>
```

### ConstraintStudentsSetMaxBuildingChangesPerDay

- Nom : Groupe limite changements bâtiments quotidiens (Students set max building changes per day)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Max_Building_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint students set max building changes per day with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Groupe limite changements bâtiments quotidiens

```xml
<ConstraintStudentsSetMaxBuildingChangesPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Max_Building_Changes_Per_Day>6</Max_Building_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxBuildingChangesPerDay>
```

### ConstraintStudentsSetMaxBuildingChangesPerDayInInterval

- Nom : Groupes limite changements bâtiments quotidiens dans l'intervalle (Students set max building changes per day in interval)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Building_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint students set max building changes per day in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Groupe limite changements bâtiments quotidiens dans l'intervalle horaire

```xml
<ConstraintStudentsSetMaxBuildingChangesPerDayInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Building_Changes_Per_Day>6</Max_Building_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxBuildingChangesPerDayInInterval>
```

### ConstraintStudentsSetMaxBuildingChangesPerRealDay

- Nom : Groupe limite changements bâtiments par jour réel (Students set max building changes per real day)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Max_Building_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint students set max building changes per real day with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Groupe limite changements bâtiments par jour réel

```xml
<ConstraintStudentsSetMaxBuildingChangesPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Max_Building_Changes_Per_Day>4</Max_Building_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxBuildingChangesPerRealDay>
```

### ConstraintStudentsSetMaxBuildingChangesPerRealDayInInterval

- Nom : Groupes limite changements bâtiments par jour réel dans l'intervalle (Students set max building changes per real day in interval)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Interval_Start_Day, Interval_Start_Hour, Interval_Start_Day, Interval_Start_Hour, Interval_End_Day, Interval_End_Hour, Interval_End_Day, Interval_End_Hour, Interval_End_Day, Interval_End_Hour, Max_Building_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint students set max building changes per real day in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Groupes limite changements bâtiments par jour réel dans l'intervalle horaire

```xml
<ConstraintStudentsSetMaxBuildingChangesPerRealDayInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Interval_Start_Day>Morning</Interval_Start_Day>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Day>Morning</Interval_End_Day>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Building_Changes_Per_Day>4</Max_Building_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxBuildingChangesPerRealDayInInterval>
```

### ConstraintStudentsSetMaxBuildingChangesPerWeek

- Nom : Groupe limite changements bâtiments par semaine (Students set max building changes per week)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Max_Building_Changes_Per_Week
- Message a 50 % : Cannot optimize, because there is a space constraint students set max building changes per week with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Groupe limite changements bâtiments par semaine

```xml
<ConstraintStudentsSetMaxBuildingChangesPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Max_Building_Changes_Per_Week>6</Max_Building_Changes_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxBuildingChangesPerWeek>
```

### ConstraintStudentsSetMaxRoomChangesPerDay

- Nom : Groupe limite changements salles quotidiens (Students set max room changes per day)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Max_Room_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint students set max room changes per day with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Apprenants limite changements salles quotidiens

```xml
<ConstraintStudentsSetMaxRoomChangesPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Max_Room_Changes_Per_Day>6</Max_Room_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxRoomChangesPerDay>
```

### ConstraintStudentsSetMaxRoomChangesPerDayInInterval

- Nom : Groupe limite changements salles quotidiens dans l'intervalle (Students set max room changes per day in interval)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Room_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint students set max room changes per day in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Groupe limite changements salles quotidiens dans l'intervalle horaire

```xml
<ConstraintStudentsSetMaxRoomChangesPerDayInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Room_Changes_Per_Day>6</Max_Room_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxRoomChangesPerDayInInterval>
```

### ConstraintStudentsSetMaxRoomChangesPerRealDay

- Nom : Groupe limite changements de salle par jour réel (Students set max room changes per real day)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Max_Room_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint students set max room changes per real day with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Groupe limite changements de salle par jour réel

```xml
<ConstraintStudentsSetMaxRoomChangesPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Max_Room_Changes_Per_Day>4</Max_Room_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxRoomChangesPerRealDay>
```

### ConstraintStudentsSetMaxRoomChangesPerRealDayInInterval

- Nom : Groupe limite changements salles par jour réel dans l'intervalle (Students set max room changes per real day in interval)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Interval_Start_Day, Interval_Start_Hour, Interval_Start_Day, Interval_Start_Hour, Interval_End_Day, Interval_End_Hour, Interval_End_Day, Interval_End_Hour, Interval_End_Day, Interval_End_Hour, Max_Room_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint students set max room changes per real day in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Groupe limite changements salles par jour réel dans l'intervalle horaire

```xml
<ConstraintStudentsSetMaxRoomChangesPerRealDayInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Interval_Start_Day>Morning</Interval_Start_Day>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Day>Morning</Interval_End_Day>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Room_Changes_Per_Day>4</Max_Room_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxRoomChangesPerRealDayInInterval>
```

### ConstraintStudentsSetMaxRoomChangesPerWeek

- Nom : Groupe limite changements salles hebdomadaires (Students set max room changes per week)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Max_Room_Changes_Per_Week
- Message a 50 % : Cannot optimize, because there is a space constraint students set max room changes per week with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Groupe limite changements salles hebdomadaires

```xml
<ConstraintStudentsSetMaxRoomChangesPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Max_Room_Changes_Per_Week>6</Max_Room_Changes_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxRoomChangesPerWeek>
```

### ConstraintStudentsSetMinGapsBetweenBuildingChanges

- Nom : Groupe vides minimum entre changements bâtiments (Students set min gaps between building changes)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Min_Gaps_Between_Building_Changes
- Message a 50 % : Cannot optimize, because there is a space constraint students set min gaps between building changes with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Groupe vides minimum entre changements bâtiments

```xml
<ConstraintStudentsSetMinGapsBetweenBuildingChanges>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Min_Gaps_Between_Building_Changes>0</Min_Gaps_Between_Building_Changes>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMinGapsBetweenBuildingChanges>
```

### ConstraintStudentsSetMinGapsBetweenRoomChanges

- Nom : Groupe vides minimum entre changements salles (Students set min gaps between room changes)
- Famille / categorie : espace / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Min_Gaps_Between_Room_Changes
- Message a 50 % : Cannot optimize, because there is a space constraint students set min gaps between room changes with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Groupe vides minimum entre changements salles

```xml
<ConstraintStudentsSetMinGapsBetweenRoomChanges>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Min_Gaps_Between_Room_Changes>0</Min_Gaps_Between_Room_Changes>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMinGapsBetweenRoomChanges>
```

### ConstraintSubjectActivityTagPreferredRoom

- Nom : Matière code activité salle préférée (Subject activity tag preferred room)
- Famille / categorie : espace / Matieres
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Subject, Activity_Tag, Room
- Description : Matière balise salle préférée

```xml
<ConstraintSubjectActivityTagPreferredRoom>
<Weight_Percentage>100</Weight_Percentage>
<Subject>Maths</Subject>
<Activity_Tag>Tag1</Activity_Tag>
<Room>R1</Room>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintSubjectActivityTagPreferredRoom>
```

### ConstraintSubjectActivityTagPreferredRooms

- Nom : Matière code activité salles préférées (Subject activity tag preferred rooms)
- Famille / categorie : espace / Matieres
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Subject, Activity_Tag, Number_of_Preferred_Rooms, Preferred_Room
- Description : Matière balise salles préférées

```xml
<ConstraintSubjectActivityTagPreferredRooms>
<Weight_Percentage>100</Weight_Percentage>
<Subject>Maths</Subject>
<Activity_Tag>Tag1</Activity_Tag>
<Number_of_Preferred_Rooms>2</Number_of_Preferred_Rooms>
<Preferred_Room>R1</Preferred_Room>
<Preferred_Room>R2</Preferred_Room>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintSubjectActivityTagPreferredRooms>
```

### ConstraintSubjectPreferredRoom

- Nom : Matière salle préférée (Subject preferred room)
- Famille / categorie : espace / Matieres
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Subject, Room

```xml
<ConstraintSubjectPreferredRoom>
<Weight_Percentage>100</Weight_Percentage>
<Subject>Maths</Subject>
<Room>R1</Room>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintSubjectPreferredRoom>
```

### ConstraintSubjectPreferredRooms

- Nom : Matière salles préférées (Subject preferred rooms)
- Famille / categorie : espace / Matieres
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Subject, Number_of_Preferred_Rooms, Preferred_Room

```xml
<ConstraintSubjectPreferredRooms>
<Weight_Percentage>100</Weight_Percentage>
<Subject>Maths</Subject>
<Number_of_Preferred_Rooms>2</Number_of_Preferred_Rooms>
<Preferred_Room>R1</Preferred_Room>
<Preferred_Room>R2</Preferred_Room>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintSubjectPreferredRooms>
```

### ConstraintTeacherHomeRoom

- Nom : Enseignant salle de référence (Teacher home room)
- Famille / categorie : espace / Enseignants
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Teacher, Room

```xml
<ConstraintTeacherHomeRoom>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Room>R1</Room>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherHomeRoom>
```

### ConstraintTeacherHomeRooms

- Nom : Enseignant salles de référence (Teacher home rooms)
- Famille / categorie : espace / Enseignants
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Teacher, Number_of_Preferred_Rooms, Preferred_Room

```xml
<ConstraintTeacherHomeRooms>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Number_of_Preferred_Rooms>2</Number_of_Preferred_Rooms>
<Preferred_Room>R1</Preferred_Room>
<Preferred_Room>R2</Preferred_Room>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherHomeRooms>
```

### ConstraintTeacherMaxBuildingChangesPerDay

- Nom : Enseignant limite changements bâtiments quotidiens (Teacher max building changes per day)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Building_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint teacher max building changes per day with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Enseignant changements de bâtiment maximum par jour

```xml
<ConstraintTeacherMaxBuildingChangesPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Building_Changes_Per_Day>6</Max_Building_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxBuildingChangesPerDay>
```

### ConstraintTeacherMaxBuildingChangesPerDayInInterval

- Nom : Enseignant limite changements bâtiments quotidiens dans l'intervalle (Teacher max building changes per day in interval)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Building_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint teacher max building changes per day in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Enseignant limite changements bâtiments quotidiens dans l'intervalle horaire

```xml
<ConstraintTeacherMaxBuildingChangesPerDayInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Building_Changes_Per_Day>6</Max_Building_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxBuildingChangesPerDayInInterval>
```

### ConstraintTeacherMaxBuildingChangesPerRealDay

- Nom : Enseignant limite changements bâtiments par jour réel (Teacher max building changes per real day)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Building_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint teacher max building changes per real day with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Enseignant limite changements bâtiments par jour réel

```xml
<ConstraintTeacherMaxBuildingChangesPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Building_Changes_Per_Day>4</Max_Building_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxBuildingChangesPerRealDay>
```

### ConstraintTeacherMaxBuildingChangesPerRealDayInInterval

- Nom : Enseignant limite changements bâtiments par jour réel dans l'intervalle (Teacher max building changes per real day in interval)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Interval_Start_Day, Interval_Start_Hour, Interval_Start_Day, Interval_Start_Hour, Interval_End_Day, Interval_End_Hour, Interval_End_Day, Interval_End_Hour, Interval_End_Day, Interval_End_Hour, Max_Building_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint teacher max building changes per real day in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Enseignant limite changements bâtiments par jour réel dans l'intervalle horaire

```xml
<ConstraintTeacherMaxBuildingChangesPerRealDayInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Interval_Start_Day>Morning</Interval_Start_Day>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Day>Morning</Interval_End_Day>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Building_Changes_Per_Day>4</Max_Building_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxBuildingChangesPerRealDayInInterval>
```

### ConstraintTeacherMaxBuildingChangesPerWeek

- Nom : Enseignant limite changements bâtiments par semaine (Teacher max building changes per week)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Building_Changes_Per_Week
- Message a 50 % : Cannot optimize, because there is a space constraint teacher max building changes per week with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Enseignant changements de bâtiment maximum par semaine

```xml
<ConstraintTeacherMaxBuildingChangesPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Building_Changes_Per_Week>6</Max_Building_Changes_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxBuildingChangesPerWeek>
```

### ConstraintTeacherMaxRoomChangesPerDay

- Nom : Enseignant limite changements salles quotidiens (Teacher max room changes per day)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Room_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint teacher max room changes per day with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Enseignant changements de salle maximum par jour

```xml
<ConstraintTeacherMaxRoomChangesPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Room_Changes_Per_Day>6</Max_Room_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxRoomChangesPerDay>
```

### ConstraintTeacherMaxRoomChangesPerDayInInterval

- Nom : Enseignant limite changements salles quotidiens dans l'intervalle (Teacher max room changes per day in interval)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Room_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint teacher max room changes per day in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Enseignant limite changements salles quotidiens dans l'intervalle horaire

```xml
<ConstraintTeacherMaxRoomChangesPerDayInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Room_Changes_Per_Day>6</Max_Room_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxRoomChangesPerDayInInterval>
```

### ConstraintTeacherMaxRoomChangesPerRealDay

- Nom : Enseignant limite changements de salle par jour réel (Teacher max room changes per real day)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Room_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint teacher max room changes per real day with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Enseignant limite changements de salles par jour réel

```xml
<ConstraintTeacherMaxRoomChangesPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Room_Changes_Per_Day>4</Max_Room_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxRoomChangesPerRealDay>
```

### ConstraintTeacherMaxRoomChangesPerRealDayInInterval

- Nom : Enseignant limite changements salles par jour réel dans l'intervalle (Teacher max room changes per real day in interval)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Interval_Start_Day, Interval_Start_Hour, Interval_Start_Day, Interval_Start_Hour, Interval_End_Day, Interval_End_Hour, Interval_End_Day, Interval_End_Hour, Interval_End_Day, Interval_End_Hour, Max_Room_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint teacher max room changes per real day in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Enseignant limite changements salles par jour réel dans l'intervalle horaire

```xml
<ConstraintTeacherMaxRoomChangesPerRealDayInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Interval_Start_Day>Morning</Interval_Start_Day>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Day>Morning</Interval_End_Day>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Room_Changes_Per_Day>4</Max_Room_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxRoomChangesPerRealDayInInterval>
```

### ConstraintTeacherMaxRoomChangesPerWeek

- Nom : Enseignant limite changements salles hebdomadaires (Teacher max room changes per week)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Room_Changes_Per_Week
- Message a 50 % : Cannot optimize, because there is a space constraint teacher max room changes per week with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Enseignant changements de salle maximum par semaine

```xml
<ConstraintTeacherMaxRoomChangesPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Room_Changes_Per_Week>6</Max_Room_Changes_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxRoomChangesPerWeek>
```

### ConstraintTeacherMinGapsBetweenBuildingChanges

- Nom : Enseignant vides minimum entre changements bâtiments (Teacher min gaps between building changes)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Min_Gaps_Between_Building_Changes
- Message a 50 % : Cannot optimize, because there is a space constraint teacher min gaps between building changes with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Enseignant vides minimum entre changements de bâtiment

```xml
<ConstraintTeacherMinGapsBetweenBuildingChanges>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Min_Gaps_Between_Building_Changes>0</Min_Gaps_Between_Building_Changes>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMinGapsBetweenBuildingChanges>
```

### ConstraintTeacherMinGapsBetweenRoomChanges

- Nom : Enseignant vides minimum entre changements salles (Teacher min gaps between room changes)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Min_Gaps_Between_Room_Changes
- Message a 50 % : Cannot optimize, because there is a space constraint teacher min gaps between room changes with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Enseignant vides minimum entre changements de salle

```xml
<ConstraintTeacherMinGapsBetweenRoomChanges>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Min_Gaps_Between_Room_Changes>0</Min_Gaps_Between_Room_Changes>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMinGapsBetweenRoomChanges>
```

### ConstraintTeacherRoomNotAvailableTimes

- Nom : Enseignant salle temps non disponibles (Teacher room not available times)
- Famille / categorie : espace / Enseignants
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Teacher, Room, Number_of_Not_Available_Times, Not_Available_Time

```xml
<ConstraintTeacherRoomNotAvailableTimes>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Room>R1</Room>
<Number_of_Not_Available_Times>1</Number_of_Not_Available_Times>
<Not_Available_Time>
<Day>Samedi</Day>
<Hour>H6</Hour>
</Not_Available_Time>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherRoomNotAvailableTimes>
```

### ConstraintTeachersMaxBuildingChangesPerDay

- Nom : Enseignants limite changements bâtiments quotidiens (Teachers max building changes per day)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Building_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint teachers max building changes per day with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Enseignants changements de bâtiment maximum par jour

```xml
<ConstraintTeachersMaxBuildingChangesPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Building_Changes_Per_Day>6</Max_Building_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxBuildingChangesPerDay>
```

### ConstraintTeachersMaxBuildingChangesPerDayInInterval

- Nom : Enseignants limite changements bâtiments quotidiens dans l'intervalle (Teachers max building changes per day in interval)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Building_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint teachers max building changes per day in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Enseignants limite changements bâtiments quotidiens dans l'intervalle horaire

```xml
<ConstraintTeachersMaxBuildingChangesPerDayInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Building_Changes_Per_Day>6</Max_Building_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxBuildingChangesPerDayInInterval>
```

### ConstraintTeachersMaxBuildingChangesPerRealDay

- Nom : Enseignants limite changements bâtiments par jour réel (Teachers max building changes per real day)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Building_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint teachers max building changes per real day with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Enseignants limite changements bâtiments par jour réel

```xml
<ConstraintTeachersMaxBuildingChangesPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Building_Changes_Per_Day>4</Max_Building_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxBuildingChangesPerRealDay>
```

### ConstraintTeachersMaxBuildingChangesPerRealDayInInterval

- Nom : Enseignants limite changements bâtiments par jour réel dans l'intervalle (Teachers max building changes per real day in interval)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Interval_Start_Day, Interval_Start_Hour, Interval_Start_Day, Interval_Start_Hour, Interval_End_Day, Interval_End_Hour, Interval_End_Day, Interval_End_Hour, Interval_End_Day, Interval_End_Hour, Max_Building_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint teachers max building changes per real day in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Enseignants limite changements bâtiments par jour réel dans l'intervalle horaire

```xml
<ConstraintTeachersMaxBuildingChangesPerRealDayInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Interval_Start_Day>Morning</Interval_Start_Day>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Day>Morning</Interval_End_Day>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Building_Changes_Per_Day>4</Max_Building_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxBuildingChangesPerRealDayInInterval>
```

### ConstraintTeachersMaxBuildingChangesPerWeek

- Nom : Enseignants limite changements bâtiments par semaine (Teachers max building changes per week)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Building_Changes_Per_Week
- Message a 50 % : Cannot optimize, because there is a space constraint teachers max building changes per week with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Enseignants changements de bâtiment maximum par semaine

```xml
<ConstraintTeachersMaxBuildingChangesPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Max_Building_Changes_Per_Week>6</Max_Building_Changes_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxBuildingChangesPerWeek>
```

### ConstraintTeachersMaxRoomChangesPerDay

- Nom : Enseignants limite changements salles quotidiens (Teachers max room changes per day)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Room_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint teachers max room changes per day with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Enseignants changements de salle maximum par jour

```xml
<ConstraintTeachersMaxRoomChangesPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Room_Changes_Per_Day>6</Max_Room_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxRoomChangesPerDay>
```

### ConstraintTeachersMaxRoomChangesPerDayInInterval

- Nom : Enseignants limite changements salles quotidiens dans l'intervalle (Teachers max room changes per day in interval)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Room_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint teachers max room changes per day in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Enseignants limite changements salles quotidiens dans l'intervalle horaire

```xml
<ConstraintTeachersMaxRoomChangesPerDayInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Room_Changes_Per_Day>6</Max_Room_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxRoomChangesPerDayInInterval>
```

### ConstraintTeachersMaxRoomChangesPerRealDay

- Nom : Enseignants limite changements de salle par jour réel (Teachers max room changes per real day)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Room_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint teachers max room changes per real day with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Enseignants limite changements de salles par jour réel

```xml
<ConstraintTeachersMaxRoomChangesPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Room_Changes_Per_Day>4</Max_Room_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxRoomChangesPerRealDay>
```

### ConstraintTeachersMaxRoomChangesPerRealDayInInterval

- Nom : Enseignants limite changements salles par jour réel dans l'intervalle (Teachers max room changes per real day in interval)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Interval_Start_Day, Interval_Start_Hour, Interval_Start_Day, Interval_Start_Hour, Interval_End_Day, Interval_End_Hour, Interval_End_Day, Interval_End_Hour, Interval_End_Day, Interval_End_Hour, Max_Room_Changes_Per_Day
- Message a 50 % : Cannot optimize, because there is a space constraint teachers max room changes per real day in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Enseignants limite changements salles par jour réel dans l'intervalle horaire

```xml
<ConstraintTeachersMaxRoomChangesPerRealDayInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Interval_Start_Day>Morning</Interval_Start_Day>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Day>Morning</Interval_End_Day>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Room_Changes_Per_Day>4</Max_Room_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxRoomChangesPerRealDayInInterval>
```

### ConstraintTeachersMaxRoomChangesPerWeek

- Nom : Enseignants limite changements salles hebdomadaires (Teachers max room changes per week)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Room_Changes_Per_Week
- Message a 50 % : Cannot optimize, because there is a space constraint teachers max room changes per week with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Enseignants changements de salle maximum par semaine

```xml
<ConstraintTeachersMaxRoomChangesPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Max_Room_Changes_Per_Week>6</Max_Room_Changes_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxRoomChangesPerWeek>
```

### ConstraintTeachersMinGapsBetweenBuildingChanges

- Nom : Enseignants vides minimum entre changements bâtiments (Teachers min gaps between building changes)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Min_Gaps_Between_Building_Changes
- Message a 50 % : Cannot optimize, because there is a space constraint teachers min gaps between building changes with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Enseignants vides minimum entre changements de bâtiment

```xml
<ConstraintTeachersMinGapsBetweenBuildingChanges>
<Weight_Percentage>100</Weight_Percentage>
<Min_Gaps_Between_Building_Changes>0</Min_Gaps_Between_Building_Changes>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMinGapsBetweenBuildingChanges>
```

### ConstraintTeachersMinGapsBetweenRoomChanges

- Nom : Enseignants vides minimum entre changements salles (Teachers min gaps between room changes)
- Famille / categorie : espace / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Min_Gaps_Between_Room_Changes
- Message a 50 % : Cannot optimize, because there is a space constraint teachers min gaps between room changes with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Enseignants vides minimum entre changements de salle

```xml
<ConstraintTeachersMinGapsBetweenRoomChanges>
<Weight_Percentage>100</Weight_Percentage>
<Min_Gaps_Between_Room_Changes>0</Min_Gaps_Between_Room_Changes>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMinGapsBetweenRoomChanges>
```

### ConstraintActivitiesBeginOrEndStudentsDay

- Nom : Activités débutent ou terminent la journée des apprenants (Activities begin or end students day)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Teacher, Students, Subject, Activity_Tag

```xml
<ConstraintActivitiesBeginOrEndStudentsDay>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Students>Y1</Students>
<Subject>Maths</Subject>
<Activity_Tag>Tag1</Activity_Tag>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesBeginOrEndStudentsDay>
```

### ConstraintActivitiesBeginOrEndTeachersDay

- Nom : Activités débutent ou terminent la journée des enseignants (Activities begin or end teachers day)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Teacher, Students, Subject, Activity_Tag

```xml
<ConstraintActivitiesBeginOrEndTeachersDay>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Students>Y1</Students>
<Subject>Maths</Subject>
<Activity_Tag>Tag1</Activity_Tag>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesBeginOrEndTeachersDay>
```

### ConstraintActivitiesBeginStudentsDay

- Nom : Activités débutent la journée des apprenants (Activities begin students day)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Teacher, Students, Subject, Activity_Tag

```xml
<ConstraintActivitiesBeginStudentsDay>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Students>Y1</Students>
<Subject>Maths</Subject>
<Activity_Tag>Tag1</Activity_Tag>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesBeginStudentsDay>
```

### ConstraintActivitiesBeginTeachersDay

- Nom : Activités débutent la journée des enseignants (Activities begin teachers day)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Teacher, Students, Subject, Activity_Tag

```xml
<ConstraintActivitiesBeginTeachersDay>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Students>Y1</Students>
<Subject>Maths</Subject>
<Activity_Tag>Tag1</Activity_Tag>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesBeginTeachersDay>
```

### ConstraintActivitiesEndStudentsDay

- Nom : Activités terminent la journée des apprenants (Activities end students day)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Teacher, Students, Subject, Activity_Tag

```xml
<ConstraintActivitiesEndStudentsDay>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Students>Y1</Students>
<Subject>Maths</Subject>
<Activity_Tag>Tag1</Activity_Tag>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesEndStudentsDay>
```

### ConstraintActivitiesEndTeachersDay

- Nom : Activités terminent la journée des enseignants (Activities end teachers day)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Teacher, Students, Subject, Activity_Tag

```xml
<ConstraintActivitiesEndTeachersDay>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Students>Y1</Students>
<Subject>Maths</Subject>
<Activity_Tag>Tag1</Activity_Tag>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesEndTeachersDay>
```

### ConstraintActivitiesMaxActivityTagsFromSetInSelectedTimeSlots

- Nom : Activités limite codes activité depuis un jeu dans les créneaux horaires sélectionnés (Activities max activity tags from set in selected time slots)
- Famille / categorie : temps / Activites
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, Number_of_Activity_Tags, Activity_Tag, Maximum_Allowed_Activity_Tags, Number_of_Selected_Time_Slots, Selected_Time_Slot
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'activities max activity tags from set in selected time slots' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Activités occupent créneaux horaires max depuis une sélection

```xml
<ConstraintActivitiesMaxActivityTagsFromSetInSelectedTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<Number_of_Activity_Tags>2</Number_of_Activity_Tags>
<Activity_Tag>Tag1</Activity_Tag>
<Activity_Tag>Tag2</Activity_Tag>
<Maximum_Allowed_Activity_Tags>3</Maximum_Allowed_Activity_Tags>
<Number_of_Selected_Time_Slots>3</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesMaxActivityTagsFromSetInSelectedTimeSlots>
```

### ConstraintActivitiesMaxHourlySpan

- Nom : Activités amplitude horaire max (Activities max hourly span)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, MaxHourlySpan

```xml
<ConstraintActivitiesMaxHourlySpan>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<MaxHourlySpan>6</MaxHourlySpan>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesMaxHourlySpan>
```

### ConstraintActivitiesMaxInATerm

- Nom : Activités max par période (Activities max in a term)
- Famille / categorie : temps / Activites
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = incompatible avec le mode, Block_Planning = incompatible avec le mode, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, Max_Number_of_Activities_in_A_Term
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'activities max in a term' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const

```xml
<ConstraintActivitiesMaxInATerm>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<Max_Number_of_Activities_in_A_Term>20</Max_Number_of_Activities_in_A_Term>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesMaxInATerm>
```

### ConstraintActivitiesMaxSimultaneousInSelectedTimeSlots

- Nom : Activités limite simultanées dans les créneaux horaires sélectionnés (Activities max simultaneous in selected time slots)
- Famille / categorie : temps / Activites
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, Number_of_Selected_Time_Slots, Selected_Time_Slot, Max_Number_of_Simultaneous_Activities
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'activities max simultaneous in selected time slots' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Activités simultanées max dans les créneaux horaires sélectionnés

```xml
<ConstraintActivitiesMaxSimultaneousInSelectedTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<Number_of_Selected_Time_Slots>3</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Max_Number_of_Simultaneous_Activities>5</Max_Number_of_Simultaneous_Activities>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesMaxSimultaneousInSelectedTimeSlots>
```

### ConstraintActivitiesMaxTotalNumberOfStudentsInSelectedTimeSlots

- Nom : Activités nombre total maximal d'apprenants dans les créneaux horaires sélectionnés (Activities max total number of students in selected time slots)
- Famille / categorie : temps / Activites
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, Number_of_Selected_Time_Slots, Selected_Time_Slot, Max_Total_Number_of_Students
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'activities max total number of students in selected time slots' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Activités nombre total max d'apprenants dans les créneaux horaires sélectionnés

```xml
<ConstraintActivitiesMaxTotalNumberOfStudentsInSelectedTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<Number_of_Selected_Time_Slots>3</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Max_Total_Number_of_Students>500</Max_Total_Number_of_Students>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesMaxTotalNumberOfStudentsInSelectedTimeSlots>
```

### ConstraintActivitiesMinInATerm

- Nom : Activités min par période (Activities min in a term)
- Famille / categorie : temps / Activites
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = incompatible avec le mode, Block_Planning = incompatible avec le mode, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, Min_Number_of_Activities_in_A_Term, Allow_Empty_Terms, Allow_Empty_Terms
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'activities min in a term' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const

```xml
<ConstraintActivitiesMinInATerm>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<Min_Number_of_Activities_in_A_Term>0</Min_Number_of_Activities_in_A_Term>
<Allow_Empty_Terms>true</Allow_Empty_Terms>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesMinInATerm>
```

### ConstraintActivitiesMinSimultaneousInSelectedTimeSlots

- Nom : Activités minimum simultanées dans les créneaux horaires sélectionnés (Activities min simultaneous in selected time slots)
- Famille / categorie : temps / Activites
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, Number_of_Selected_Time_Slots, Selected_Time_Slot, Min_Number_of_Simultaneous_Activities, Allow_Empty_Slots
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'activities min simultaneous in selected time slots' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Activités simultanées min dans les créneaux horaires sélectionnés

```xml
<ConstraintActivitiesMinSimultaneousInSelectedTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<Number_of_Selected_Time_Slots>3</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Min_Number_of_Simultaneous_Activities>1</Min_Number_of_Simultaneous_Activities>
<Allow_Empty_Slots>true</Allow_Empty_Slots>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesMinSimultaneousInSelectedTimeSlots>
```

### ConstraintActivitiesNotOverlapping

- Nom : Activités sans chevauchement (Activities not overlapping)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id

```xml
<ConstraintActivitiesNotOverlapping>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesNotOverlapping>
```

### ConstraintActivitiesOccupyMaxSetsOfTimeSlotsFromSelection

- Nom : Activités occupent limite jeux de créneaux horaires dans la sélection (Activities occupy max sets of time slots from selection)
- Famille / categorie : temps / Activites
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, Maximum_Number_of_Occupied_Sets, Number_of_Selected_Sets_of_Time_Slots, Selected_Set_of_Time_Slots
- Message a 50 % : Cannot optimize, because there is a time constraint activities occupy max sets of time slots from selection with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Activités occupent un nombre max de jeux de créneaux horaires depuis une sélection

```xml
<ConstraintActivitiesOccupyMaxSetsOfTimeSlotsFromSelection>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<Maximum_Number_of_Occupied_Sets>2</Maximum_Number_of_Occupied_Sets>
<Number_of_Selected_Sets_of_Time_Slots>2</Number_of_Selected_Sets_of_Time_Slots>
<Selected_Set_of_Time_Slots>
<Number_of_Selected_Time_Slots>2</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
</Selected_Set_of_Time_Slots>
<Selected_Set_of_Time_Slots>
<Number_of_Selected_Time_Slots>2</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
</Selected_Set_of_Time_Slots>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesOccupyMaxSetsOfTimeSlotsFromSelection>
```

### ConstraintActivitiesOccupyMaxTerms

- Nom : Activités limite occupation périodes (Activities occupy max terms)
- Famille / categorie : temps / Activites
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = incompatible avec le mode, Block_Planning = incompatible avec le mode, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, Max_Number_of_Occupied_Terms
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'activities occupy max terms' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const

```xml
<ConstraintActivitiesOccupyMaxTerms>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<Max_Number_of_Occupied_Terms>2</Max_Number_of_Occupied_Terms>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesOccupyMaxTerms>
```

### ConstraintActivitiesOccupyMaxTimeSlotsFromSelection

- Nom : Activités occupent limite créneaux horaires dans la sélection (Activities occupy max time slots from selection)
- Famille / categorie : temps / Activites
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, Number_of_Selected_Time_Slots, Selected_Time_Slot, Max_Number_of_Occupied_Time_Slots
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'activities occupy max time slots from selection' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Activités occupent créneaux horaires max depuis une sélection

```xml
<ConstraintActivitiesOccupyMaxTimeSlotsFromSelection>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<Number_of_Selected_Time_Slots>3</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Max_Number_of_Occupied_Time_Slots>36</Max_Number_of_Occupied_Time_Slots>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesOccupyMaxTimeSlotsFromSelection>
```

### ConstraintActivitiesOccupyMinTimeSlotsFromSelection

- Nom : Activités occupent minimum créneaux horaires dans la sélection (Activities occupy min time slots from selection)
- Famille / categorie : temps / Activites
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, Number_of_Selected_Time_Slots, Selected_Time_Slot, Min_Number_of_Occupied_Time_Slots
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'activities occupy min time slots from selection' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Activités occupent créneaux horaires min depuis une sélection

```xml
<ConstraintActivitiesOccupyMinTimeSlotsFromSelection>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<Number_of_Selected_Time_Slots>3</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Min_Number_of_Occupied_Time_Slots>1</Min_Number_of_Occupied_Time_Slots>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesOccupyMinTimeSlotsFromSelection>
```

### ConstraintActivitiesOverlapCompletelyOrDoNotOverlap

- Nom : Activités se chevauchent totalement ou ne se chevauchent pas (Activities overlap completely or do not overlap)
- Famille / categorie : temps / Activites
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id
- Prerequis : n'a de sens qu'avec des activites de duree > 1
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'activities overlap completely or do not overlap' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Activités se chevauchent ou totalement ou aucunement

```xml
<ConstraintActivitiesOverlapCompletelyOrDoNotOverlap>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>7</Activity_Id>
<Activity_Id>9</Activity_Id>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesOverlapCompletelyOrDoNotOverlap>
```

### ConstraintActivitiesPairOfMutuallyExclusiveSetsOfTimeSlots

- Nom : Activités paire de jeux de créneaux horaires mutuellement exclusifs (Activities pair of mutually exclusive sets of time slots)
- Famille / categorie : temps / Activites
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, Number_of_Selected_Time_Slots_in_First_Set, Selected_Time_Slot_in_First_Set, Number_of_Selected_Time_Slots_in_Second_Set, Selected_Time_Slot_in_Second_Set
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'activities pair of mutually exclusive sets of time slots' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Les activités ont une paire de jeux de créneaux horaires mutuellement exclusifs

```xml
<ConstraintActivitiesPairOfMutuallyExclusiveSetsOfTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<Number_of_Selected_Time_Slots_in_First_Set>1</Number_of_Selected_Time_Slots_in_First_Set>
<Selected_Time_Slot_in_First_Set>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot_in_First_Set>
<Number_of_Selected_Time_Slots_in_Second_Set>1</Number_of_Selected_Time_Slots_in_Second_Set>
<Selected_Time_Slot_in_Second_Set>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot_in_Second_Set>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesPairOfMutuallyExclusiveSetsOfTimeSlots>
```

### ConstraintActivitiesPairOfMutuallyExclusiveTimeSlots

- Nom : Activités paire de créneaux horaires mutuellement exclusifs (Activities pair of mutually exclusive time slots)
- Famille / categorie : temps / Activites
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, First_Time_Slot, Second_Time_Slot
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'activities pair of mutually exclusive time slots' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Les activités ont une paire de créneaux horaires mutuellement exclusifs

```xml
<ConstraintActivitiesPairOfMutuallyExclusiveTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<First_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</First_Time_Slot>
<Second_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Second_Time_Slot>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesPairOfMutuallyExclusiveTimeSlots>
```

### ConstraintActivitiesPreferredStartingTimes

- Nom : Activités temps de démarrage préférés (Activities preferred starting times)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Teacher, Students, Subject, Activity_Tag, Duration, Duration, Number_of_Preferred_Starting_Times, Preferred_Starting_Time

```xml
<ConstraintActivitiesPreferredStartingTimes>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Students>Y1</Students>
<Subject>Maths</Subject>
<Activity_Tag>Tag1</Activity_Tag>
<Duration>1</Duration>
<Number_of_Preferred_Starting_Times>36</Number_of_Preferred_Starting_Times>
<Preferred_Starting_Time>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Lundi</Day>
<Hour>H3</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Lundi</Day>
<Hour>H4</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Lundi</Day>
<Hour>H5</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Lundi</Day>
<Hour>H6</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mardi</Day>
<Hour>H2</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mardi</Day>
<Hour>H3</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mardi</Day>
<Hour>H4</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mardi</Day>
<Hour>H5</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mardi</Day>
<Hour>H6</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mercredi</Day>
<Hour>H1</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mercredi</Day>
<Hour>H2</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mercredi</Day>
<Hour>H3</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mercredi</Day>
<Hour>H4</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mercredi</Day>
<Hour>H5</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mercredi</Day>
<Hour>H6</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Jeudi</Day>
<Hour>H1</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Jeudi</Day>
<Hour>H2</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Jeudi</Day>
<Hour>H3</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Jeudi</Day>
<Hour>H4</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Jeudi</Day>
<Hour>H5</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Jeudi</Day>
<Hour>H6</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Vendredi</Day>
<Hour>H1</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Vendredi</Day>
<Hour>H2</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Vendredi</Day>
<Hour>H3</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Vendredi</Day>
<Hour>H4</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Vendredi</Day>
<Hour>H5</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Vendredi</Day>
<Hour>H6</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Samedi</Day>
<Hour>H1</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Samedi</Day>
<Hour>H2</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Samedi</Day>
<Hour>H3</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Samedi</Day>
<Hour>H4</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Samedi</Day>
<Hour>H5</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Samedi</Day>
<Hour>H6</Hour>
</Preferred_Starting_Time>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesPreferredStartingTimes>
```

### ConstraintActivitiesPreferredTimeSlots

- Nom : Activités créneaux horaires préférés (Activities preferred time slots)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Teacher, Students, Subject, Activity_Tag, Duration, Duration, Number_of_Preferred_Time_Slots, Preferred_Time_Slot

```xml
<ConstraintActivitiesPreferredTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Students>Y1</Students>
<Subject>Maths</Subject>
<Activity_Tag>Tag1</Activity_Tag>
<Duration>1</Duration>
<Number_of_Preferred_Time_Slots>36</Number_of_Preferred_Time_Slots>
<Preferred_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Lundi</Day>
<Hour>H3</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Lundi</Day>
<Hour>H4</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Lundi</Day>
<Hour>H5</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Lundi</Day>
<Hour>H6</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mardi</Day>
<Hour>H2</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mardi</Day>
<Hour>H3</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mardi</Day>
<Hour>H4</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mardi</Day>
<Hour>H5</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mardi</Day>
<Hour>H6</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mercredi</Day>
<Hour>H1</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mercredi</Day>
<Hour>H2</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mercredi</Day>
<Hour>H3</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mercredi</Day>
<Hour>H4</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mercredi</Day>
<Hour>H5</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mercredi</Day>
<Hour>H6</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Jeudi</Day>
<Hour>H1</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Jeudi</Day>
<Hour>H2</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Jeudi</Day>
<Hour>H3</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Jeudi</Day>
<Hour>H4</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Jeudi</Day>
<Hour>H5</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Jeudi</Day>
<Hour>H6</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Vendredi</Day>
<Hour>H1</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Vendredi</Day>
<Hour>H2</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Vendredi</Day>
<Hour>H3</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Vendredi</Day>
<Hour>H4</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Vendredi</Day>
<Hour>H5</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Vendredi</Day>
<Hour>H6</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Samedi</Day>
<Hour>H1</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Samedi</Day>
<Hour>H2</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Samedi</Day>
<Hour>H3</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Samedi</Day>
<Hour>H4</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Samedi</Day>
<Hour>H5</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Samedi</Day>
<Hour>H6</Hour>
</Preferred_Time_Slot>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesPreferredTimeSlots>
```

### ConstraintActivitiesSameStartingDay

- Nom : Activités même jour de démarrage (Activities same starting day)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id
- Description : Les activités doivent débuter le même jour

```xml
<ConstraintActivitiesSameStartingDay>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesSameStartingDay>
```

### ConstraintActivitiesSameStartingHour

- Nom : Activités même heure de démarrage (Activities same starting hour)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id
- Description : Les activités doivent débuter à la même heure

```xml
<ConstraintActivitiesSameStartingHour>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesSameStartingHour>
```

### ConstraintActivitiesSameStartingTime

- Nom : Activités démarrent en même temps (Activities same starting time)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id
- Description : Les activités doivent débuter en même temps

```xml
<ConstraintActivitiesSameStartingTime>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivitiesSameStartingTime>
```

### ConstraintActivityBeginsOrEndsStudentsDay

- Nom : Activité débute ou termine la journée des apprenants (Activity begins or ends students day)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Id
- Description : L'activité doit débuter ou terminer la journée des apprenants

```xml
<ConstraintActivityBeginsOrEndsStudentsDay>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Id>1</Activity_Id>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivityBeginsOrEndsStudentsDay>
```

### ConstraintActivityBeginsOrEndsTeachersDay

- Nom : Activité débute ou termine la journée des enseignants (Activity begins or ends teachers day)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Id
- Description : L'activité doit débuter ou terminer la journée des enseignants

```xml
<ConstraintActivityBeginsOrEndsTeachersDay>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Id>1</Activity_Id>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivityBeginsOrEndsTeachersDay>
```

### ConstraintActivityBeginsStudentsDay

- Nom : Activité débute la journée des apprenants (Activity begins students day)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Id
- Description : L'activité doit débuter la journée des apprenants

```xml
<ConstraintActivityBeginsStudentsDay>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Id>1</Activity_Id>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivityBeginsStudentsDay>
```

### ConstraintActivityBeginsTeachersDay

- Nom : Activité débute la journée des enseignants (Activity begins teachers day)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Id
- Description : L'activité doit débuter la journée des enseignants

```xml
<ConstraintActivityBeginsTeachersDay>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Id>1</Activity_Id>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivityBeginsTeachersDay>
```

### ConstraintActivityEndsStudentsDay

- Nom : Activité termine la journée des apprenants (Activity ends students day)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Id
- Description : L'activité doit terminer la journée des apprenants

```xml
<ConstraintActivityEndsStudentsDay>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Id>1</Activity_Id>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivityEndsStudentsDay>
```

### ConstraintActivityEndsTeachersDay

- Nom : Activité termine la journée des enseignants (Activity ends teachers day)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Id
- Description : L'activité doit terminer la journée des enseignants

```xml
<ConstraintActivityEndsTeachersDay>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Id>1</Activity_Id>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivityEndsTeachersDay>
```

### ConstraintActivityPreferredDay

- Nom : ConstraintActivityPreferredDay
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Id, Day

```xml
<ConstraintActivityPreferredDay>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Id>1</Activity_Id>
<Day>Lundi</Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivityPreferredDay>
```

### ConstraintActivityPreferredStartingTime

- Nom : Activité temps de démarrage préféré (Activity preferred starting time)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Id, Day, Hour
- Description : a une heure de début préférée:

```xml
<ConstraintActivityPreferredStartingTime>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Id>1</Activity_Id>
<Day>Lundi</Day>
<Hour>H1</Hour>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivityPreferredStartingTime>
```

### ConstraintActivityPreferredStartingTimes

- Nom : Activité temps de démarrage préférés (Activity preferred starting times)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Id, Number_of_Preferred_Starting_Times, Preferred_Starting_Time
- Description : a un jeu d'heures de début préférées:

```xml
<ConstraintActivityPreferredStartingTimes>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Id>1</Activity_Id>
<Number_of_Preferred_Starting_Times>36</Number_of_Preferred_Starting_Times>
<Preferred_Starting_Time>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Lundi</Day>
<Hour>H3</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Lundi</Day>
<Hour>H4</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Lundi</Day>
<Hour>H5</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Lundi</Day>
<Hour>H6</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mardi</Day>
<Hour>H2</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mardi</Day>
<Hour>H3</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mardi</Day>
<Hour>H4</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mardi</Day>
<Hour>H5</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mardi</Day>
<Hour>H6</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mercredi</Day>
<Hour>H1</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mercredi</Day>
<Hour>H2</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mercredi</Day>
<Hour>H3</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mercredi</Day>
<Hour>H4</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mercredi</Day>
<Hour>H5</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mercredi</Day>
<Hour>H6</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Jeudi</Day>
<Hour>H1</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Jeudi</Day>
<Hour>H2</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Jeudi</Day>
<Hour>H3</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Jeudi</Day>
<Hour>H4</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Jeudi</Day>
<Hour>H5</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Jeudi</Day>
<Hour>H6</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Vendredi</Day>
<Hour>H1</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Vendredi</Day>
<Hour>H2</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Vendredi</Day>
<Hour>H3</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Vendredi</Day>
<Hour>H4</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Vendredi</Day>
<Hour>H5</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Vendredi</Day>
<Hour>H6</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Samedi</Day>
<Hour>H1</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Samedi</Day>
<Hour>H2</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Samedi</Day>
<Hour>H3</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Samedi</Day>
<Hour>H4</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Samedi</Day>
<Hour>H5</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Samedi</Day>
<Hour>H6</Hour>
</Preferred_Starting_Time>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivityPreferredStartingTimes>
```

### ConstraintActivityPreferredTimeSlots

- Nom : Activité créneaux horaires préférés (Activity preferred time slots)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Id, Number_of_Preferred_Time_Slots, Preferred_Time_Slot
- Description : a un jeu de créneaux horaires préférés (toutes les heures de l'activité doivent être sur des créneaux autorisés) :

```xml
<ConstraintActivityPreferredTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Id>1</Activity_Id>
<Number_of_Preferred_Time_Slots>36</Number_of_Preferred_Time_Slots>
<Preferred_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Lundi</Day>
<Hour>H3</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Lundi</Day>
<Hour>H4</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Lundi</Day>
<Hour>H5</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Lundi</Day>
<Hour>H6</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mardi</Day>
<Hour>H2</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mardi</Day>
<Hour>H3</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mardi</Day>
<Hour>H4</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mardi</Day>
<Hour>H5</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mardi</Day>
<Hour>H6</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mercredi</Day>
<Hour>H1</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mercredi</Day>
<Hour>H2</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mercredi</Day>
<Hour>H3</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mercredi</Day>
<Hour>H4</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mercredi</Day>
<Hour>H5</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mercredi</Day>
<Hour>H6</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Jeudi</Day>
<Hour>H1</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Jeudi</Day>
<Hour>H2</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Jeudi</Day>
<Hour>H3</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Jeudi</Day>
<Hour>H4</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Jeudi</Day>
<Hour>H5</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Jeudi</Day>
<Hour>H6</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Vendredi</Day>
<Hour>H1</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Vendredi</Day>
<Hour>H2</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Vendredi</Day>
<Hour>H3</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Vendredi</Day>
<Hour>H4</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Vendredi</Day>
<Hour>H5</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Vendredi</Day>
<Hour>H6</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Samedi</Day>
<Hour>H1</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Samedi</Day>
<Hour>H2</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Samedi</Day>
<Hour>H3</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Samedi</Day>
<Hour>H4</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Samedi</Day>
<Hour>H5</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Samedi</Day>
<Hour>H6</Hour>
</Preferred_Time_Slot>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivityPreferredTimeSlots>
```

### ConstraintActivityTagsNotOverlapping

- Nom : Balises sans chevauchement (Activity tags not overlapping)
- Famille / categorie : temps / Etiquettes
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Number_of_Activity_Tags, Activity_Tag
- Description : Les balises activité ne doivent pas se chevaucher

```xml
<ConstraintActivityTagsNotOverlapping>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activity_Tags>2</Number_of_Activity_Tags>
<Activity_Tag>Tag1</Activity_Tag>
<Activity_Tag>Tag2</Activity_Tag>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintActivityTagsNotOverlapping>
```

### ConstraintBasicCompulsoryTime

- Nom : Temporelles obligatoires de base (Basic compulsory time)
- Famille / categorie : temps / Base
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : (aucun)
- Description : Ce sont les contraintes obligatoires de base (se référant à l'allocation du temps) pour tous les plannings

```xml
<ConstraintBasicCompulsoryTime>
<Weight_Percentage>100</Weight_Percentage>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintBasicCompulsoryTime>
```

### ConstraintBreakTimes

- Nom : Temps de pause (Break times)
- Famille / categorie : temps / Pauses
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Break_Times, Break_Time
- Message a 50 % : Cannot optimize, because you have constraints of type break with weight percentage less than 100%. Currently, FET can only optimize with constraints break with 100% weight (or no constraint). Please modify your data accordingly and try again.

```xml
<ConstraintBreakTimes>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Break_Times>1</Number_of_Break_Times>
<Break_Time>
<Day>Samedi</Day>
<Hour>H6</Hour>
</Break_Time>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintBreakTimes>
```

### ConstraintMaxDaysBetweenActivities

- Nom : Jours max entre activités (Max days between activities)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, MaxDays
- Description : Nombre maximum de jours entre activités

```xml
<ConstraintMaxDaysBetweenActivities>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<MaxDays>5</MaxDays>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintMaxDaysBetweenActivities>
```

### ConstraintMaxDaysBetweenEachPairOfConsecutiveActivities

- Nom : Limite jours entre chaque paire d'activités consécutives (Max days between each pair of consecutive activities)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, MaxDays, Circular
- Description : Limite jours entre chaque paire d'activités consécutives

```xml
<ConstraintMaxDaysBetweenEachPairOfConsecutiveActivities>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<MaxDays>5</MaxDays>
<Circular>false</Circular>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintMaxDaysBetweenEachPairOfConsecutiveActivities>
```

### ConstraintMaxGapsBetweenActivities

- Nom : Vides max entre activités (Max gaps between activities)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = incompatible avec le mode, Block_Planning = acceptee, Terms = incompatible avec le mode
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, MaxGaps
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Limite vides entre activités (si les activités sont le même jour)

```xml
<ConstraintMaxGapsBetweenActivities>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<MaxGaps>3</MaxGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintMaxGapsBetweenActivities>
```

### ConstraintMaxHalfDaysBetweenActivities

- Nom : Demi-journées max entre activités (Max half days between activities)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, MaxDays
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Nombre maximum de demi-journées entre activités

```xml
<ConstraintMaxHalfDaysBetweenActivities>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<MaxDays>7</MaxDays>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintMaxHalfDaysBetweenActivities>
```

### ConstraintMaxTermsBetweenActivities

- Nom : Périodes max entre activités (Max terms between activities)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = incompatible avec le mode, Block_Planning = incompatible avec le mode, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, MaxTerms
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Nombre maximum de périodes entre activités

```xml
<ConstraintMaxTermsBetweenActivities>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<MaxTerms>2</MaxTerms>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintMaxTermsBetweenActivities>
```

### ConstraintMaxTotalActivitiesFromSetInSelectedTimeSlots

- Nom : Limite activités totales du jeu dans les créneaux horaires sélectionnés (Max total activities from set in selected time slots)
- Famille / categorie : temps / Activites
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = incompatible avec le mode, Block_Planning = acceptee, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, Number_of_Selected_Time_Slots, Selected_Time_Slot, Max_Total_Number_of_Activities
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'max total activities from set in selected time slots' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Limite activités totales du jeu dans les créneaux horaires sélectionnés

```xml
<ConstraintMaxTotalActivitiesFromSetInSelectedTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<Number_of_Selected_Time_Slots>3</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Max_Total_Number_of_Activities>10</Max_Total_Number_of_Activities>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintMaxTotalActivitiesFromSetInSelectedTimeSlots>
```

### ConstraintMinDaysBetweenActivities

- Nom : Jours min entre activités (Min days between activities)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, MinDays
- Description : Nombre minimum de jours entre activités

```xml
<ConstraintMinDaysBetweenActivities>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<MinDays>1</MinDays>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintMinDaysBetweenActivities>
```

### ConstraintMinGapsBetweenActivities

- Nom : Vides min entre activités (Min gaps between activities)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, MinGaps
- Description : Vides minimum entre activités (si les activités sont le même jour)

```xml
<ConstraintMinGapsBetweenActivities>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintMinGapsBetweenActivities>
```

### ConstraintMinHalfDaysBetweenActivities

- Nom : Demi-journées min entre activités (Min half days between activities)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Number_of_Activities, Activity_Id, MinDays
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Nombre minimum de demi-journées entre activités

```xml
<ConstraintMinHalfDaysBetweenActivities>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activities>2</Number_of_Activities>
<Activity_Id>4</Activity_Id>
<Activity_Id>5</Activity_Id>
<MinDays>1</MinDays>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintMinHalfDaysBetweenActivities>
```

### ConstraintStudentsActivityTagMaxHoursContinuously

- Nom : Apprenants code activité limite heures continues (Students activity tag max hours continuously)
- Famille / categorie : temps / Eleves
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Tag, Maximum_Hours_Continuously
- Description : Tous les apprenants, pour un code activité, doivent respecter le nombre maximum d'heures continues

```xml
<ConstraintStudentsActivityTagMaxHoursContinuously>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Tag>Tag1</Activity_Tag>
<Maximum_Hours_Continuously>6</Maximum_Hours_Continuously>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsActivityTagMaxHoursContinuously>
```

### ConstraintStudentsActivityTagMaxHoursDaily

- Nom : Apprenants code activité limite heures quotidiennes (Students activity tag max hours daily)
- Famille / categorie : temps / Eleves
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Tag, Maximum_Hours_Daily
- Description : Tous les apprenants, pour un code activité, doivent respecter le nombre maximum d'heures quotidiennes

```xml
<ConstraintStudentsActivityTagMaxHoursDaily>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Tag>Tag1</Activity_Tag>
<Maximum_Hours_Daily>6</Maximum_Hours_Daily>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsActivityTagMaxHoursDaily>
```

### ConstraintStudentsActivityTagMaxHoursDailyRealDays

- Nom : Apprenants code activité limite heures quotidiennes par jours réels (Students activity tag max hours daily real days)
- Famille / categorie : temps / Eleves
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Tag, Maximum_Hours_Daily
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants, pour un code activité, doivent respecter le nombre maximum d'heures quotidiennes par jour réel

```xml
<ConstraintStudentsActivityTagMaxHoursDailyRealDays>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Tag>Tag1</Activity_Tag>
<Maximum_Hours_Daily>4</Maximum_Hours_Daily>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsActivityTagMaxHoursDailyRealDays>
```

### ConstraintStudentsActivityTagMinHoursDaily

- Nom : Apprenants code activité minimum heures quotidiennes (Students activity tag min hours daily)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Activity_Tag, Minimum_Hours_Daily, Minimum_Days_With_Tag
- Message a 50 % : Cannot optimize for students, because the constraint of type activity tag min hours daily relating to students has no 100% weight. Please modify your data accordingly and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les apprenants, pour un code activité, doivent respecter le nombre minimum d'heures quotidiennes

```xml
<ConstraintStudentsActivityTagMinHoursDaily>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Tag>Tag1</Activity_Tag>
<Minimum_Hours_Daily>1</Minimum_Hours_Daily>
<Minimum_Days_With_Tag>1</Minimum_Days_With_Tag>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsActivityTagMinHoursDaily>
```

### ConstraintStudentsAfternoonIntervalMaxDaysPerWeek

- Nom : Après-midi apprenants intervalle limite jours par semaine (Students afternoon interval max days per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint students afternoon interval max days per week with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants respectent le travail dans un intervalle horaire l'après-midi un nombre maximum de jours par semaine

```xml
<ConstraintStudentsAfternoonIntervalMaxDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Days_Per_Week>4</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsAfternoonIntervalMaxDaysPerWeek>
```

### ConstraintStudentsAfternoonsEarlyMaxBeginningsAtSecondHour

- Nom : Après-midis apprenants au plus tôt limite débuts en seconde heure (Students afternoons early max beginnings at second hour)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Beginnings_At_Second_Hour
- Message a 50 % : Cannot optimize for subgroup Y1 G1 a, because you have an afternoons early max beginnings at second hour constraint with weight percentage less than 100%. Currently, the algorithm can only optimize with not existing constraint early m.b.a.s.h. or existing with 100% weight for it. Please modify your 
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : (pauses et jeu d'apprenants non disponibles non comptabilisés)

```xml
<ConstraintStudentsAfternoonsEarlyMaxBeginningsAtSecondHour>
<Weight_Percentage>100</Weight_Percentage>
<Max_Beginnings_At_Second_Hour>4</Max_Beginnings_At_Second_Hour>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsAfternoonsEarlyMaxBeginningsAtSecondHour>
```

### ConstraintStudentsEarlyMaxBeginningsAtSecondHour

- Nom : Apprenants tôt limite débuts en seconde heure (Students early max beginnings at second hour)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Beginnings_At_Second_Hour
- Message a 50 % : Cannot optimize for subgroup Y1 G1 a, because you have an early max beginnings at second hour constraint with weight percentage less than 100%. Currently, the algorithm can only optimize with not existing constraint early m.b.a.s.h. or existing with 100% weight for it. Please modify your data corres
- Description : (pauses et jeu d'apprenants non disponibles non comptabilisés)

```xml
<ConstraintStudentsEarlyMaxBeginningsAtSecondHour>
<Weight_Percentage>100</Weight_Percentage>
<Max_Beginnings_At_Second_Hour>6</Max_Beginnings_At_Second_Hour>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsEarlyMaxBeginningsAtSecondHour>
```

### ConstraintStudentsIntervalMaxDaysPerWeek

- Nom : Apprenants intervalle limite jours par semaine (Students interval max days per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint students interval max days per week with weight (percentage) below 100. Starting with FET version 5.6.2 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next
- Description : Tous les apprenants respectent le travail dans un intervalle horaire un nombre maximum de jours par semaine

```xml
<ConstraintStudentsIntervalMaxDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Days_Per_Week>6</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsIntervalMaxDaysPerWeek>
```

### ConstraintStudentsMaxActivityTagChangesPerDay

- Nom : Apprenants changements balise activité quotidiens max (Students max activity tag changes per day)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Activity_Tag_Changes_Per_Day
- Message a 50 % : Cannot optimize, because you have a constraint students max activity tag changes per day with weight (percentage) below 100. It is only possible to use 100% weight for such constraints. Please make the weight 100% and try again! \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 
- Description : Tous les apprenants doivent respecter le nombre maximum de changements quotidiens de balise activité

```xml
<ConstraintStudentsMaxActivityTagChangesPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Activity_Tag_Changes_Per_Day>6</Max_Activity_Tag_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxActivityTagChangesPerDay>
```

### ConstraintStudentsMaxActivityTagChangesPerWeek

- Nom : Apprenants changements balise activité hebdomadaires max (Students max activity tag changes per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Activity_Tag_Changes_Per_Week
- Message a 50 % : Cannot optimize, because you have a constraint students max activity tag changes per week with weight (percentage) below 100. It is only possible to use 100% weight for such constraints. Please make the weight 100% and try again! \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button:
- Description : Tous les apprenants doivent respecter le nombre maximum de changements hebdomadaires de balise activité

```xml
<ConstraintStudentsMaxActivityTagChangesPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Max_Activity_Tag_Changes_Per_Week>6</Max_Activity_Tag_Changes_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxActivityTagChangesPerWeek>
```

### ConstraintStudentsMaxActivityTagsPerDayFromSet

- Nom : Apprenants limite codes activité par jour depuis le jeu (Students max activity tags per day from set)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids < 100 % : abandon du programme)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = abandon du programme, 0 % = abandon du programme, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Number_of_Activity_Tags, Activity_Tag, Maximum_Allowed_Activity_Tags
- Message a 50 % : Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)]
- Description : Tous les étudiants doivent respecter le nombre maximum de codes activité par jour depuis un jeu

```xml
<ConstraintStudentsMaxActivityTagsPerDayFromSet>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activity_Tags>2</Number_of_Activity_Tags>
<Activity_Tag>Tag1</Activity_Tag>
<Activity_Tag>Tag2</Activity_Tag>
<Maximum_Allowed_Activity_Tags>3</Maximum_Allowed_Activity_Tags>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxActivityTagsPerDayFromSet>
```

### ConstraintStudentsMaxActivityTagsPerRealDayFromSet

- Nom : Apprenants limite codes activité par jour réel depuis le jeu (Students max activity tags per real day from set)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids < 100 % : abandon du programme)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = abandon du programme, 0 % = abandon du programme, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Number_of_Activity_Tags, Activity_Tag, Maximum_Allowed_Activity_Tags
- Message a 50 % : Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)]
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les étudiants doivent respecter le nombre maximum de codes activité par jour réel depuis un jeu

```xml
<ConstraintStudentsMaxActivityTagsPerRealDayFromSet>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activity_Tags>2</Number_of_Activity_Tags>
<Activity_Tag>Tag1</Activity_Tag>
<Activity_Tag>Tag2</Activity_Tag>
<Maximum_Allowed_Activity_Tags>3</Maximum_Allowed_Activity_Tags>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxActivityTagsPerRealDayFromSet>
```

### ConstraintStudentsMaxAfternoonsPerWeek

- Nom : Apprenants limite après-midis par semaine (Students max afternoons per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Afternoons_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint students max afternoons per week with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter le nombre maximum d'après-midis par semaine

```xml
<ConstraintStudentsMaxAfternoonsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Max_Afternoons_Per_Week>4</Max_Afternoons_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxAfternoonsPerWeek>
```

### ConstraintStudentsMaxDaysPerWeek

- Nom : Apprenants jours max par semaine (Students max days per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint students max days per week with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les apprenants doivent respecter le nombre maximum de jours par semaine

```xml
<ConstraintStudentsMaxDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Max_Days_Per_Week>6</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxDaysPerWeek>
```

### ConstraintStudentsMaxGapsPerDay

- Nom : Apprenants vides max par jour (Students max gaps per day)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Gaps
- Message a 50 % : Cannot optimize for subgroup Y1 G1 a, because you have a max gaps constraint with weight percentage less than 100%. Currently, the algorithm can only optimize with not existing constraint max gaps or existing with 100% weight for it. Please modify your data correspondingly and try again \| Button 0 t
- Description : Tous les apprenants doivent respecter le nombre maximum de vides quotidiens

```xml
<ConstraintStudentsMaxGapsPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Gaps>3</Max_Gaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxGapsPerDay>
```

### ConstraintStudentsMaxGapsPerRealDay

- Nom : Apprenants vides max par jour réel (Students max gaps per real day)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Gaps
- Message a 50 % : Cannot optimize for subgroup Y1 G1 a, because you have a max gaps constraint with weight percentage less than 100%. Currently, the algorithm can only optimize with not existing constraint max gaps or existing with 100% weight for it. Please modify your data correspondingly and try again \| Button 0 t
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter le nombre maximum de vides par jour réel

```xml
<ConstraintStudentsMaxGapsPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Gaps>3</Max_Gaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxGapsPerRealDay>
```

### ConstraintStudentsMaxGapsPerWeek

- Nom : Apprenants vides max par semaine (Students max gaps per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Gaps
- Message a 50 % : Cannot optimize for subgroup Y1 G1 a, because you have a max gaps constraint with weight percentage less than 100%. Currently, the algorithm can only optimize with not existing constraint max gaps or existing with 100% weight for it. Please modify your data correspondingly and try again \| Button 0 t
- Description : Tous les apprenants doivent respecter le nombre maximum de vides par semaine

```xml
<ConstraintStudentsMaxGapsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Max_Gaps>3</Max_Gaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxGapsPerWeek>
```

### ConstraintStudentsMaxGapsPerWeekForRealDays

- Nom : Apprenants limite vides par semaine pour jours réels (Students max gaps per week for real days)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Gaps
- Message a 50 % : Cannot optimize for subgroup Y1 G1 a, because you have a max gaps constraint with weight percentage less than 100%. Currently, the algorithm can only optimize with not existing constraint max gaps or existing with 100% weight for it. Please modify your data correspondingly and try again \| Button 0 t
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter le nombre maximum de vides par semaine pour jours réels

```xml
<ConstraintStudentsMaxGapsPerWeekForRealDays>
<Weight_Percentage>100</Weight_Percentage>
<Max_Gaps>3</Max_Gaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxGapsPerWeekForRealDays>
```

### ConstraintStudentsMaxHoursContinuously

- Nom : Apprenants heures continues max (Students max hours continuously)
- Famille / categorie : temps / Eleves
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Maximum_Hours_Continuously
- Description : Tous les apprenants doivent respecter le nombre maximum d'heures continues

```xml
<ConstraintStudentsMaxHoursContinuously>
<Weight_Percentage>100</Weight_Percentage>
<Maximum_Hours_Continuously>6</Maximum_Hours_Continuously>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxHoursContinuously>
```

### ConstraintStudentsMaxHoursContinuouslyRealDays

- Nom : Apprenants heures continues max pour jours réels (Students max hours continuously real days)
- Famille / categorie : temps / Eleves
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Maximum_Hours_Continuously
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter le nombre maximum d'heures continues pour les jours réels

```xml
<ConstraintStudentsMaxHoursContinuouslyRealDays>
<Weight_Percentage>100</Weight_Percentage>
<Maximum_Hours_Continuously>4</Maximum_Hours_Continuously>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxHoursContinuouslyRealDays>
```

### ConstraintStudentsMaxHoursDaily

- Nom : Apprenants heures quotidiennes max (Students max hours daily)
- Famille / categorie : temps / Eleves
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Maximum_Hours_Daily
- Description : Tous les apprenants doivent respecter le nombre maximum d'heures quotidiennes

```xml
<ConstraintStudentsMaxHoursDaily>
<Weight_Percentage>100</Weight_Percentage>
<Maximum_Hours_Daily>6</Maximum_Hours_Daily>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxHoursDaily>
```

### ConstraintStudentsMaxHoursDailyInInterval

- Nom : Apprenants limite heures quotidiennes dans intervalle (Students max hours daily in interval)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Maximum_Hours_Daily
- Message a 50 % : Cannot optimize, because there is a time constraint students max hours daily in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les apprenants doivent respecter le nombre maximum d'heures quotidiennes dans un intervalle horaire

```xml
<ConstraintStudentsMaxHoursDailyInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Maximum_Hours_Daily>6</Maximum_Hours_Daily>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxHoursDailyInInterval>
```

### ConstraintStudentsMaxHoursDailyRealDays

- Nom : Apprenants limite heures quotidiennes pour jours réels (Students max hours daily real days)
- Famille / categorie : temps / Eleves
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Maximum_Hours_Daily
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter le nombre maximum d'heures quotidiennes par jour réel

```xml
<ConstraintStudentsMaxHoursDailyRealDays>
<Weight_Percentage>100</Weight_Percentage>
<Maximum_Hours_Daily>4</Maximum_Hours_Daily>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxHoursDailyRealDays>
```

### ConstraintStudentsMaxHoursPerAllAfternoons

- Nom : Apprenants limite heures pour tous les après-midis (Students max hours per all afternoons)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Maximum_Hours_Per_All_Afternoons
- Message a 50 % : Cannot optimize, because you have constraint students max hours per all afternoons with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter le nombre maximum d'heures pour tous les après-midis

```xml
<ConstraintStudentsMaxHoursPerAllAfternoons>
<Weight_Percentage>100</Weight_Percentage>
<Maximum_Hours_Per_All_Afternoons>32</Maximum_Hours_Per_All_Afternoons>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxHoursPerAllAfternoons>
```

### ConstraintStudentsMaxMorningsPerWeek

- Nom : Apprenants limite matinées par semaine (Students max mornings per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Mornings_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint students max mornings per week with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter le nombre maximum de matinées par semaine

```xml
<ConstraintStudentsMaxMorningsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Max_Mornings_Per_Week>4</Max_Mornings_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxMorningsPerWeek>
```

### ConstraintStudentsMaxRealDaysPerWeek

- Nom : Apprenants limite jours réels par semaine (Students max real days per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = refusee (lecture), Mornings_Afternoons = acceptee, Block_Planning = refusee (lecture), Terms = refusee (lecture)
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint students max real days per week with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : Could not read file - XML parse error at line 14, column 290: \| Max_Days_Per_Week is incorrect
- Description : Tous les apprenants doivent respecter le nombre maximum de jours réels par semaine

```xml
<ConstraintStudentsMaxRealDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Max_Days_Per_Week>4</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxRealDaysPerWeek>
```

### ConstraintStudentsMaxSingleEarlyAfternoonGaps

- Nom : Apprenants interruptions simples max en début d'après-midi (Students max single early afternoon gaps)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Single_Gaps
- Message a 50 % : Cannot optimize, because you have a time constraint students max single early afternoon gaps with weight under 100%. Please correct and try again! \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter le nombre maximum d'interruptions simples en début d'après-midi

```xml
<ConstraintStudentsMaxSingleEarlyAfternoonGaps>
<Weight_Percentage>100</Weight_Percentage>
<Max_Single_Gaps>3</Max_Single_Gaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxSingleEarlyAfternoonGaps>
```

### ConstraintStudentsMaxSingleEarlyMorningGaps

- Nom : Apprenants interruptions simples max en début de matinée (Students max single early morning gaps)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Single_Gaps
- Message a 50 % : Cannot optimize, because you have a time constraint students max single early morning gaps with weight under 100%. Please correct and try again! \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter le nombre maximum d'interruptions simples en début de matinée

```xml
<ConstraintStudentsMaxSingleEarlyMorningGaps>
<Weight_Percentage>100</Weight_Percentage>
<Max_Single_Gaps>3</Max_Single_Gaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxSingleEarlyMorningGaps>
```

### ConstraintStudentsMaxSingleGapsBetweenMorningAndAfternoon

- Nom : Apprenants interruptions simples max entre matin et après-midi (Students max single gaps between morning and afternoon)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Single_Gaps
- Message a 50 % : Cannot optimize, because you have a time constraint students max single gaps between morning and afternoon with weight under 100%. Please correct and try again! \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter un nombre maximal d'interruptions simples entre matin et après-midi

```xml
<ConstraintStudentsMaxSingleGapsBetweenMorningAndAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Max_Single_Gaps>3</Max_Single_Gaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxSingleGapsBetweenMorningAndAfternoon>
```

### ConstraintStudentsMaxSingleGapsInSelectedTimeSlots

- Nom : Apprenants limide vide unique dans les créneaux horaires sélectionnés (Students max single gaps in selected time slots)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Single_Gaps, Number_of_Selected_Time_Slots, Selected_Time_Slot
- Message a 50 % : Cannot optimize for students, because the constraint of type max single gaps in selected time slots relating to students has no 100% weight. Please modify your data accordingly and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les apprenants doivent respecter un nombre maximal de vides uniques dans les créneaux horaires sélectionnés

```xml
<ConstraintStudentsMaxSingleGapsInSelectedTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Max_Single_Gaps>3</Max_Single_Gaps>
<Number_of_Selected_Time_Slots>3</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxSingleGapsInSelectedTimeSlots>
```

### ConstraintStudentsMaxSpanPerDay

- Nom : Apprenants limite amplitude quotidienne (Students max span per day)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = incompatible avec le mode, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Span
- Message a 50 % : Cannot optimize, because you have constraint students max span per day with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Mornings_Afternoons : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter le nombre maximum d'amplitude (en heures) quotidienne

```xml
<ConstraintStudentsMaxSpanPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Span>6</Max_Span>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxSpanPerDay>
```

### ConstraintStudentsMaxSpanPerRealDay

- Nom : Apprenants limite amplitude par jour réel (Students max span per real day)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Span
- Message a 50 % : Cannot optimize, because you have constraint students max span per real day with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter le nombre maximum d'amplitude (en heures) par jour réel

```xml
<ConstraintStudentsMaxSpanPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Span>4</Max_Span>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxSpanPerRealDay>
```

### ConstraintStudentsMaxThreeConsecutiveDays

- Nom : Apprenants limite trois jours consécutifs (Students max three consecutive days)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Allow_Afternoon_Morning_Afternoon_Morning_Exception
- Message a 50 % : Cannot optimize, because you have constraint students max three consecutive days with weight (percentage) below 100%. It is only possible to use 100% weight for such constraints. Please make weight 100% and try again. \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter un maximum de trois jours de travail consécutifs

```xml
<ConstraintStudentsMaxThreeConsecutiveDays>
<Weight_Percentage>100</Weight_Percentage>
<Allow_Afternoon_Morning_Afternoon_Morning_Exception>true</Allow_Afternoon_Morning_Afternoon_Morning_Exception>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMaxThreeConsecutiveDays>
```

### ConstraintStudentsMinAfternoonsPerWeek

- Nom : Apprenants minimum après-midis par semaine (Students min afternoons per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Min_Afternoons_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint students min afternoons per week with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter le nombre minimum d'après-midis par semaine

```xml
<ConstraintStudentsMinAfternoonsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Min_Afternoons_Per_Week>1</Min_Afternoons_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMinAfternoonsPerWeek>
```

### ConstraintStudentsMinGapsBetweenActivityTag

- Nom : Apprenants vides minimum entre code activité (Students min gaps between activity tag)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'students min gaps between activity tag' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les apprenants doivent respecter les vides minimum entre un code activité

```xml
<ConstraintStudentsMinGapsBetweenActivityTag>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Tag>Tag1</Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMinGapsBetweenActivityTag>
```

### ConstraintStudentsMinGapsBetweenActivityTagBetweenMorningAndAfternoon

- Nom : Vides minimum entre code activité entre matinée et après-midi pour apprenants (Students min gaps between activity tag between morning and afternoon)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'students min gaps between activity tag between morning and afternoon' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter les vides minimum entre un code activité entre matinée et après-midi

```xml
<ConstraintStudentsMinGapsBetweenActivityTagBetweenMorningAndAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Tag>Tag1</Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMinGapsBetweenActivityTagBetweenMorningAndAfternoon>
```

### ConstraintStudentsMinGapsBetweenActivityTagPerRealDay

- Nom : Vides minimum entre code activité par jour réel pour apprenants (Students min gaps between activity tag per real day)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'students min gaps between activity tag per real day' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter les vides minimum entre un code activité par jour réel

```xml
<ConstraintStudentsMinGapsBetweenActivityTagPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Tag>Tag1</Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMinGapsBetweenActivityTagPerRealDay>
```

### ConstraintStudentsMinGapsBetweenOrderedPairOfActivityTags

- Nom : Vides minimum entre couple ordonné de codes activité pour apprenants (Students min gaps between ordered pair of activity tags)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : First_Activity_Tag, Second_Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'students min gaps between ordered pair of activity tags' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les apprenants doivent respecter les vides minimum entre couple ordonné de codes activité

```xml
<ConstraintStudentsMinGapsBetweenOrderedPairOfActivityTags>
<Weight_Percentage>100</Weight_Percentage>
<First_Activity_Tag>Tag1</First_Activity_Tag>
<Second_Activity_Tag>Tag2</Second_Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMinGapsBetweenOrderedPairOfActivityTags>
```

### ConstraintStudentsMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon

- Nom : Apprenants vides minimum entre paire ordonnée de codes activité entre matinée et après-midi (Students min gaps between ordered pair of activity tags between morning and afternoon)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : First_Activity_Tag, Second_Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'students min gaps between ordered pair of activity tags between morning and afternoon' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter les vides minimum entre une paire ordonnée de codes activité entre matinée et après-midi

```xml
<ConstraintStudentsMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<First_Activity_Tag>Tag1</First_Activity_Tag>
<Second_Activity_Tag>Tag2</Second_Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon>
```

### ConstraintStudentsMinGapsBetweenOrderedPairOfActivityTagsPerRealDay

- Nom : Vides minimum entre couple ordonné de codes activité par jour réel pour apprenants (Students min gaps between ordered pair of activity tags per real day)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : First_Activity_Tag, Second_Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'students min gaps between ordered pair of activity tags per real day' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter les vides minimum entre un couple ordonné de codes activité par jour réel

```xml
<ConstraintStudentsMinGapsBetweenOrderedPairOfActivityTagsPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<First_Activity_Tag>Tag1</First_Activity_Tag>
<Second_Activity_Tag>Tag2</Second_Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMinGapsBetweenOrderedPairOfActivityTagsPerRealDay>
```

### ConstraintStudentsMinHoursDaily

- Nom : Apprenants heures quotidiennes min (Students min hours daily)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Hours_Daily, Allow_Empty_Days, Allow_Empty_Days
- Message a 50 % : Cannot optimize for students, because the constraint of type min hours daily relating to students has no 100% weight. Please modify your data accordingly and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les apprenants doivent respecter le nombre minimum d'heures quotidiennes

```xml
<ConstraintStudentsMinHoursDaily>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Hours_Daily>2</Minimum_Hours_Daily>
<Allow_Empty_Days>true</Allow_Empty_Days>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMinHoursDaily>
```

### ConstraintStudentsMinHoursPerAfternoon

- Nom : Apprenants heures minimum par après-midi (Students min hours per afternoon)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Hours_Per_Afternoon, Allow_Empty_Afternoons, Allow_Empty_Afternoons
- Prerequis : exige aussi une contrainte 'min heures par jour' pour le meme enseignant / les memes eleves
- Message a 50 % : Cannot optimize, because you have constraint students min hours per afternoon with weight (percentage) below 100. Starting with FET version 5.4.0 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| 
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter le nombre minimum d'heures par après-midi

```xml
<ConstraintStudentsMinHoursPerAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Hours_Per_Afternoon>1</Minimum_Hours_Per_Afternoon>
<Allow_Empty_Afternoons>true</Allow_Empty_Afternoons>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMinHoursPerAfternoon>
```

### ConstraintStudentsMinHoursPerMorning

- Nom : Apprenants heures minimum par matinée (Students min hours per morning)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Hours_Per_Morning, Allow_Empty_Mornings, Allow_Empty_Mornings
- Prerequis : exige aussi une contrainte 'min heures par jour' pour le meme enseignant / les memes eleves
- Message a 50 % : Cannot optimize, because you have constraint students min hours per morning with weight (percentage) below 100. Starting with FET version 5.4.0 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| De
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter le nombre minimum d'heures par matinée

```xml
<ConstraintStudentsMinHoursPerMorning>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Hours_Per_Morning>1</Minimum_Hours_Per_Morning>
<Allow_Empty_Mornings>true</Allow_Empty_Mornings>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMinHoursPerMorning>
```

### ConstraintStudentsMinMorningsPerWeek

- Nom : Apprenants matinées minimum par semaine (Students min mornings per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Min_Mornings_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint students min mornings per week with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter le nombre minimum de matinées par semaine

```xml
<ConstraintStudentsMinMorningsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Min_Mornings_Per_Week>1</Min_Mornings_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMinMorningsPerWeek>
```

### ConstraintStudentsMinRestingHours

- Nom : Apprenants heures de repos min (Students min resting hours)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = incompatible avec le mode, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Resting_Hours, Circular
- Message a 50 % : Cannot optimize, because you have constraint students min resting hours with weight (percentage) below 100. It is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Mornings_Afternoons : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter le minimum d'heures de repos (entre les jours)

```xml
<ConstraintStudentsMinRestingHours>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Resting_Hours>1</Minimum_Resting_Hours>
<Circular>false</Circular>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMinRestingHours>
```

### ConstraintStudentsMinRestingHoursBetweenMorningAndAfternoon

- Nom : Apprenants heures minimum de repos entre matinée et après-midi (Students min resting hours between morning and afternoon)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Resting_Hours
- Message a 50 % : Cannot optimize, because you have constraint students min resting hours with weight (percentage) below 100. It is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants doivent respecter le minimum d'heures de repos (entre matinée et après-midi)

```xml
<ConstraintStudentsMinRestingHoursBetweenMorningAndAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Resting_Hours>1</Minimum_Resting_Hours>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMinRestingHoursBetweenMorningAndAfternoon>
```

### ConstraintStudentsMorningIntervalMaxDaysPerWeek

- Nom : Matinée apprenants intervalle limite jours par semaine (Students morning interval max days per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint students morning interval max days per week with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les apprenants respectent le travail dans un intervalle horaire le matin un nombre maximum de jours par semaine

```xml
<ConstraintStudentsMorningIntervalMaxDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Days_Per_Week>4</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMorningIntervalMaxDaysPerWeek>
```

### ConstraintStudentsMorningsEarlyMaxBeginningsAtSecondHour

- Nom : Apprenants matins au plus tôt limite débuts en seconde heure (Students mornings early max beginnings at second hour)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Beginnings_At_Second_Hour
- Message a 50 % : Cannot optimize for subgroup Y1 G1 a, because you have an mornings early max beginnings at second hour constraint with weight percentage less than 100%. Currently, the algorithm can only optimize with not existing constraint early m.b.a.s.h. or existing with 100% weight for it. Please modify your da
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : (pauses et jeu d'apprenants non disponibles non comptabilisés)

```xml
<ConstraintStudentsMorningsEarlyMaxBeginningsAtSecondHour>
<Weight_Percentage>100</Weight_Percentage>
<Max_Beginnings_At_Second_Hour>4</Max_Beginnings_At_Second_Hour>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsMorningsEarlyMaxBeginningsAtSecondHour>
```

### ConstraintStudentsOccupyMaxSetsOfTimeSlotsFromSelection

- Nom : Apprenants occupent limite jeux de créneaux horaires depuis la sélection (Students occupy max sets of time slots from selection)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Maximum_Number_of_Occupied_Sets, Number_of_Selected_Sets_of_Time_Slots, Selected_Set_of_Time_Slots
- Message a 50 % : Cannot optimize, because there is a time constraint students occupy max sets of time slots from selection with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les apprenants occupent un nombre maximum de jeux de créneaux horaires depuis une sélection

```xml
<ConstraintStudentsOccupyMaxSetsOfTimeSlotsFromSelection>
<Weight_Percentage>100</Weight_Percentage>
<Maximum_Number_of_Occupied_Sets>2</Maximum_Number_of_Occupied_Sets>
<Number_of_Selected_Sets_of_Time_Slots>2</Number_of_Selected_Sets_of_Time_Slots>
<Selected_Set_of_Time_Slots>
<Number_of_Selected_Time_Slots>2</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
</Selected_Set_of_Time_Slots>
<Selected_Set_of_Time_Slots>
<Number_of_Selected_Time_Slots>2</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
</Selected_Set_of_Time_Slots>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsOccupyMaxSetsOfTimeSlotsFromSelection>
```

### ConstraintStudentsPairOfMutuallyExclusiveSetsOfTimeSlots

- Nom : Apprenants paire de jeux de créneaux horaires mutuellement exclusifs (Students pair of mutually exclusive sets of time slots)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Selected_Time_Slots_in_First_Set, Selected_Time_Slot_in_First_Set, Number_of_Selected_Time_Slots_in_Second_Set, Selected_Time_Slot_in_Second_Set
- Message a 50 % : Cannot optimize, because there is a time constraint students pair of mutually exclusive sets of time slots with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les apprenants ont une paire de jeux de créneaux horaires mutuellement exclusifs

```xml
<ConstraintStudentsPairOfMutuallyExclusiveSetsOfTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Selected_Time_Slots_in_First_Set>1</Number_of_Selected_Time_Slots_in_First_Set>
<Selected_Time_Slot_in_First_Set>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot_in_First_Set>
<Number_of_Selected_Time_Slots_in_Second_Set>1</Number_of_Selected_Time_Slots_in_Second_Set>
<Selected_Time_Slot_in_Second_Set>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot_in_Second_Set>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsPairOfMutuallyExclusiveSetsOfTimeSlots>
```

### ConstraintStudentsPairOfMutuallyExclusiveTimeSlots

- Nom : Apprenants paire de créneaux horaires mutuellement exclusifs (Students pair of mutually exclusive time slots)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : First_Time_Slot, Second_Time_Slot
- Message a 50 % : Cannot optimize, because there is a time constraint students pair of mutually exclusive time slots with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les apprenants ont une paire de créneaux horaires mutuellement exclusifs

```xml
<ConstraintStudentsPairOfMutuallyExclusiveTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<First_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</First_Time_Slot>
<Second_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Second_Time_Slot>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsPairOfMutuallyExclusiveTimeSlots>
```

### ConstraintStudentsSetActivityTagMaxHoursContinuously

- Nom : Groupe code activité limite heures continues (Students set activity tag max hours continuously)
- Famille / categorie : temps / Eleves
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Maximum_Hours_Continuously, Students, Activity_Tag
- Description : Un groupe, pour un code activité, doit respecter le nombre maximum d'heures continues

```xml
<ConstraintStudentsSetActivityTagMaxHoursContinuously>
<Weight_Percentage>100</Weight_Percentage>
<Maximum_Hours_Continuously>6</Maximum_Hours_Continuously>
<Students>Y1</Students>
<Activity_Tag>Tag1</Activity_Tag>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetActivityTagMaxHoursContinuously>
```

### ConstraintStudentsSetActivityTagMaxHoursDaily

- Nom : Groupe code activité limite heures quotidiennes (Students set activity tag max hours daily)
- Famille / categorie : temps / Eleves
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Maximum_Hours_Daily, Students, Activity_Tag
- Description : Un groupe, pour un code activité, doit respecter le nombre maximum d'heures quotidiennes

```xml
<ConstraintStudentsSetActivityTagMaxHoursDaily>
<Weight_Percentage>100</Weight_Percentage>
<Maximum_Hours_Daily>6</Maximum_Hours_Daily>
<Students>Y1</Students>
<Activity_Tag>Tag1</Activity_Tag>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetActivityTagMaxHoursDaily>
```

### ConstraintStudentsSetActivityTagMaxHoursDailyRealDays

- Nom : Groupe code activité limite heures quotidiennes par jours réels (Students set activity tag max hours daily real days)
- Famille / categorie : temps / Eleves
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Maximum_Hours_Daily, Students, Activity_Tag
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe, pour un code activité, doit respecter le nombre maximum d'heures quotidiennes par jour réel

```xml
<ConstraintStudentsSetActivityTagMaxHoursDailyRealDays>
<Weight_Percentage>100</Weight_Percentage>
<Maximum_Hours_Daily>4</Maximum_Hours_Daily>
<Students>Y1</Students>
<Activity_Tag>Tag1</Activity_Tag>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetActivityTagMaxHoursDailyRealDays>
```

### ConstraintStudentsSetActivityTagMinHoursDaily

- Nom : Groupe code activité minimum heures quotidiennes (Students set activity tag min hours daily)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Activity_Tag, Minimum_Hours_Daily, Minimum_Days_With_Tag
- Message a 50 % : Cannot optimize for students, because the constraint of type activity tag min hours daily relating to students set Y1 has no 100% weight. Please modify your data accordingly and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un groupe, pour un code activité, doit respecter le nombre minimum d'heures quotidiennes

```xml
<ConstraintStudentsSetActivityTagMinHoursDaily>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Activity_Tag>Tag1</Activity_Tag>
<Minimum_Hours_Daily>1</Minimum_Hours_Daily>
<Minimum_Days_With_Tag>1</Minimum_Days_With_Tag>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetActivityTagMinHoursDaily>
```

### ConstraintStudentsSetAfternoonIntervalMaxDaysPerWeek

- Nom : Après-midi groupe intervalle limite jours par semaine (Students set afternoon interval max days per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint students set afternoon interval max days per week with weight (percentage) below 100 for students set Y1. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe respecte le travail dans un intervalle horaire l'après-midi un nombre maximum de jours par semaine

```xml
<ConstraintStudentsSetAfternoonIntervalMaxDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Days_Per_Week>4</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetAfternoonIntervalMaxDaysPerWeek>
```

### ConstraintStudentsSetAfternoonsEarlyMaxBeginningsAtSecondHour

- Nom : Après-midis groupe au plus tôt limite débuts en seconde heure (Students set afternoons early max beginnings at second hour)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Beginnings_At_Second_Hour, Students
- Message a 50 % : Cannot optimize for subgroup Y1 G1 a, because you have an afternoons early max beginnings at second hour constraint with weight percentage less than 100%. Currently, the algorithm can only optimize with not existing constraint early m.b.a.s.h. or existing with 100% weight for it. Please modify your 
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit débuter les après-midis au plus tôt, respectant un nombre maximum de débuts tardifs, en seconde heure

```xml
<ConstraintStudentsSetAfternoonsEarlyMaxBeginningsAtSecondHour>
<Weight_Percentage>100</Weight_Percentage>
<Max_Beginnings_At_Second_Hour>4</Max_Beginnings_At_Second_Hour>
<Students>Y1</Students>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetAfternoonsEarlyMaxBeginningsAtSecondHour>
```

### ConstraintStudentsSetEarlyMaxBeginningsAtSecondHour

- Nom : Groupe tôt limite débuts en seconde heure (Students set early max beginnings at second hour)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Beginnings_At_Second_Hour, Students
- Message a 50 % : Cannot optimize for subgroup Y1 G1 a, because you have an early max beginnings at second hour constraint with weight percentage less than 100%. Currently, the algorithm can only optimize with not existing constraint early m.b.a.s.h. or existing with 100% weight for it. Please modify your data corres
- Description : Un groupe doit débuter ses activités tôt, respectant un nombre maximum de débuts tardifs, en seconde heure

```xml
<ConstraintStudentsSetEarlyMaxBeginningsAtSecondHour>
<Weight_Percentage>100</Weight_Percentage>
<Max_Beginnings_At_Second_Hour>6</Max_Beginnings_At_Second_Hour>
<Students>Y1</Students>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetEarlyMaxBeginningsAtSecondHour>
```

### ConstraintStudentsSetIntervalMaxDaysPerWeek

- Nom : Groupe intervalle limite jours par semaine (Students set interval max days per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint students set interval max days per week with weight (percentage) below 100 for students set Y1. Starting with FET version 5.6.2 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \|
- Description : Un groupe respecte le travail dans un intervalle horaire un nombre maximum de jours par semaine

```xml
<ConstraintStudentsSetIntervalMaxDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Days_Per_Week>6</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetIntervalMaxDaysPerWeek>
```

### ConstraintStudentsSetMaxActivityTagChangesPerDay

- Nom : Jeu d'apprenants changements balise activité quotidiens max (Students set max activity tag changes per day)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Max_Activity_Tag_Changes_Per_Day
- Message a 50 % : Cannot optimize, because you have a constraint students set max activity tag changes per day for students set Y1 with weight (percentage) below 100. It is only possible to use 100% weight for such constraints. Please make the weight 100% and try again! \| Button 0 text: Skip rest \| Button 1 text: See
- Description : Un jeu d'apprenants doit respecter le nombre maximum de changements quotidiens de balise activité

```xml
<ConstraintStudentsSetMaxActivityTagChangesPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Max_Activity_Tag_Changes_Per_Day>6</Max_Activity_Tag_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxActivityTagChangesPerDay>
```

### ConstraintStudentsSetMaxActivityTagChangesPerWeek

- Nom : Jeu d'apprenants changements balise activité hebdomadaires max (Students set max activity tag changes per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Max_Activity_Tag_Changes_Per_Week
- Message a 50 % : Cannot optimize, because you have a constraint students set max activity tag changes per week for students set Y1 with weight (percentage) below 100. It is only possible to use 100% weight for such constraints. Please make the weight 100% and try again! \| Button 0 text: Skip rest \| Button 1 text: Se
- Description : Un jeu d'apprenants doit respecter le nombre maximum de changements hebdomadaires de balise activité

```xml
<ConstraintStudentsSetMaxActivityTagChangesPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Max_Activity_Tag_Changes_Per_Week>6</Max_Activity_Tag_Changes_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxActivityTagChangesPerWeek>
```

### ConstraintStudentsSetMaxActivityTagsPerDayFromSet

- Nom : Groupe limite codes activité par jour depuis le jeu (Students set max activity tags per day from set)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids < 100 % : abandon du programme)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = abandon du programme, 0 % = abandon du programme, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Students, Number_of_Activity_Tags, Activity_Tag, Maximum_Allowed_Activity_Tags
- Message a 50 % : Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)]
- Description : Un groupe doit respecter le nombre maximum de codes activité par jour depuis un jeu

```xml
<ConstraintStudentsSetMaxActivityTagsPerDayFromSet>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Number_of_Activity_Tags>2</Number_of_Activity_Tags>
<Activity_Tag>Tag1</Activity_Tag>
<Activity_Tag>Tag2</Activity_Tag>
<Maximum_Allowed_Activity_Tags>3</Maximum_Allowed_Activity_Tags>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxActivityTagsPerDayFromSet>
```

### ConstraintStudentsSetMaxActivityTagsPerRealDayFromSet

- Nom : Groupe limite codes activité par jour réel depuis le jeu (Students set max activity tags per real day from set)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids < 100 % : abandon du programme)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = abandon du programme, 0 % = abandon du programme, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Students, Number_of_Activity_Tags, Activity_Tag, Maximum_Allowed_Activity_Tags
- Message a 50 % : Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)]
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter le nombre maximum de codes activité par jour réel depuis un jeu

```xml
<ConstraintStudentsSetMaxActivityTagsPerRealDayFromSet>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Number_of_Activity_Tags>2</Number_of_Activity_Tags>
<Activity_Tag>Tag1</Activity_Tag>
<Activity_Tag>Tag2</Activity_Tag>
<Maximum_Allowed_Activity_Tags>3</Maximum_Allowed_Activity_Tags>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxActivityTagsPerRealDayFromSet>
```

### ConstraintStudentsSetMaxAfternoonsPerWeek

- Nom : Groupe limite après-midis par semaine (Students set max afternoons per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Max_Afternoons_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint students set max afternoons per week with weight (percentage) below 100 for students set Y1. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter le nombre maximum d'après-midis par semaine

```xml
<ConstraintStudentsSetMaxAfternoonsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Max_Afternoons_Per_Week>4</Max_Afternoons_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxAfternoonsPerWeek>
```

### ConstraintStudentsSetMaxDaysPerWeek

- Nom : Groupe limite jours par semaine (Students set max days per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint students set max days per week with weight (percentage) below 100 for students set Y1. It is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button
- Description : Un groupe doit respecter le nombre maximum de jours par semaine

```xml
<ConstraintStudentsSetMaxDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Max_Days_Per_Week>6</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxDaysPerWeek>
```

### ConstraintStudentsSetMaxGapsPerDay

- Nom : Groupe limite vides quotidiens (Students set max gaps per day)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Gaps, Students
- Message a 50 % : Cannot optimize for subgroup Y1 G1 a, because you have a max gaps constraint with weight percentage less than 100%. Currently, the algorithm can only optimize with not existing constraint max gaps or existing with 100% weight for it. Please modify your data correspondingly and try again \| Button 0 t
- Description : Un groupe doit respecter le nombre maximum de vides quotidiens

```xml
<ConstraintStudentsSetMaxGapsPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Gaps>3</Max_Gaps>
<Students>Y1</Students>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxGapsPerDay>
```

### ConstraintStudentsSetMaxGapsPerRealDay

- Nom : Groupe limite vides par jour réel (Students set max gaps per real day)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Gaps, Students
- Message a 50 % : Cannot optimize for subgroup Y1 G1 a, because you have a max gaps constraint with weight percentage less than 100%. Currently, the algorithm can only optimize with not existing constraint max gaps or existing with 100% weight for it. Please modify your data correspondingly and try again \| Button 0 t
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter le nombre maximum de vides par jour réel

```xml
<ConstraintStudentsSetMaxGapsPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Gaps>3</Max_Gaps>
<Students>Y1</Students>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxGapsPerRealDay>
```

### ConstraintStudentsSetMaxGapsPerWeek

- Nom : Groupe limite vides par semaine (Students set max gaps per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Gaps, Students
- Message a 50 % : Cannot optimize for subgroup Y1 G1 a, because you have a max gaps constraint with weight percentage less than 100%. Currently, the algorithm can only optimize with not existing constraint max gaps or existing with 100% weight for it. Please modify your data correspondingly and try again \| Button 0 t
- Description : Un groupe doit respecter le nombre maximum de vides par semaine

```xml
<ConstraintStudentsSetMaxGapsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Max_Gaps>3</Max_Gaps>
<Students>Y1</Students>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxGapsPerWeek>
```

### ConstraintStudentsSetMaxGapsPerWeekForRealDays

- Nom : Groupe limite vides par semaine pour jours réels (Students set max gaps per week for real days)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Gaps, Students
- Message a 50 % : Cannot optimize for subgroup Y1 G1 a, because you have a max gaps constraint with weight percentage less than 100%. Currently, the algorithm can only optimize with not existing constraint max gaps or existing with 100% weight for it. Please modify your data correspondingly and try again \| Button 0 t
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter le nombre maximum de vides par semaine pour jours réels

```xml
<ConstraintStudentsSetMaxGapsPerWeekForRealDays>
<Weight_Percentage>100</Weight_Percentage>
<Max_Gaps>3</Max_Gaps>
<Students>Y1</Students>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxGapsPerWeekForRealDays>
```

### ConstraintStudentsSetMaxHoursContinuously

- Nom : Groupe limite heures continues (Students set max hours continuously)
- Famille / categorie : temps / Eleves
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Maximum_Hours_Continuously, Students
- Description : Un groupe doit respecter le nombre maximum d'heures continues

```xml
<ConstraintStudentsSetMaxHoursContinuously>
<Weight_Percentage>100</Weight_Percentage>
<Maximum_Hours_Continuously>6</Maximum_Hours_Continuously>
<Students>Y1</Students>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxHoursContinuously>
```

### ConstraintStudentsSetMaxHoursContinuouslyRealDays

- Nom : Groupe heures continues max pour jours réels (Students set max hours continuously real days)
- Famille / categorie : temps / Eleves
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Maximum_Hours_Continuously, Students
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter le nombre maximum d'heures continues pour les jours réels

```xml
<ConstraintStudentsSetMaxHoursContinuouslyRealDays>
<Weight_Percentage>100</Weight_Percentage>
<Maximum_Hours_Continuously>4</Maximum_Hours_Continuously>
<Students>Y1</Students>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxHoursContinuouslyRealDays>
```

### ConstraintStudentsSetMaxHoursDaily

- Nom : Groupe limite heures quotidiennes (Students set max hours daily)
- Famille / categorie : temps / Eleves
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Maximum_Hours_Daily, Students
- Description : Un groupe doit respecter le nombre maximum d'heures quotidiennes

```xml
<ConstraintStudentsSetMaxHoursDaily>
<Weight_Percentage>100</Weight_Percentage>
<Maximum_Hours_Daily>6</Maximum_Hours_Daily>
<Students>Y1</Students>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxHoursDaily>
```

### ConstraintStudentsSetMaxHoursDailyInInterval

- Nom : Groupe limite heures quotidiennes dans intervalle (Students set max hours daily in interval)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Maximum_Hours_Daily
- Message a 50 % : Cannot optimize, because there is a time constraint students set max hours daily in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un groupe doit respecter le nombre maximum d'heures quotidiennes dans un intervalle horaire

```xml
<ConstraintStudentsSetMaxHoursDailyInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Maximum_Hours_Daily>6</Maximum_Hours_Daily>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxHoursDailyInInterval>
```

### ConstraintStudentsSetMaxHoursDailyRealDays

- Nom : Groupe limite heures quotidiennes pour jours réels (Students set max hours daily real days)
- Famille / categorie : temps / Eleves
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Maximum_Hours_Daily, Students
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter le nombre maximum d'heures quotidiennes par jour réel

```xml
<ConstraintStudentsSetMaxHoursDailyRealDays>
<Weight_Percentage>100</Weight_Percentage>
<Maximum_Hours_Daily>4</Maximum_Hours_Daily>
<Students>Y1</Students>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxHoursDailyRealDays>
```

### ConstraintStudentsSetMaxHoursPerAllAfternoons

- Nom : Groupe limite heures pour tous les après-midis (Students set max hours per all afternoons)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Maximum_Hours_Per_All_Afternoons
- Message a 50 % : Cannot optimize, because you have constraint students set max hours per all afternoons for students set Y1 with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter le nombre maximum d'heures pour tous les après-midis

```xml
<ConstraintStudentsSetMaxHoursPerAllAfternoons>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Maximum_Hours_Per_All_Afternoons>32</Maximum_Hours_Per_All_Afternoons>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxHoursPerAllAfternoons>
```

### ConstraintStudentsSetMaxMorningsPerWeek

- Nom : Groupe limite matinées par semaine (Students set max mornings per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Max_Mornings_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint students set max mornings per week with weight (percentage) below 100 for students set Y1. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter le nombre maximum de matinées par semaine

```xml
<ConstraintStudentsSetMaxMorningsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Max_Mornings_Per_Week>4</Max_Mornings_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxMorningsPerWeek>
```

### ConstraintStudentsSetMaxRealDaysPerWeek

- Nom : Groupe limite jours réels par semaine (Students set max real days per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = refusee (lecture), Mornings_Afternoons = acceptee, Block_Planning = refusee (lecture), Terms = refusee (lecture)
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint students set max real days per week with weight (percentage) below 100 for students set Y1. It is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default b
- Refus en mode Official : Could not read file - XML parse error at line 14, column 316: \| Max_Days_Per_Week is incorrect
- Description : Un groupe doit respecter le nombre maximum de jours réels par semaine

```xml
<ConstraintStudentsSetMaxRealDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Max_Days_Per_Week>4</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxRealDaysPerWeek>
```

### ConstraintStudentsSetMaxSingleEarlyAfternoonGaps

- Nom : Groupe interruptions simples max en début d'après-midi (Students set max single early afternoon gaps)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Max_Single_Gaps
- Message a 50 % : Cannot optimize, because you have a time constraint students set Y1 max single early afternoon gaps with weight under 100%. Please correct and try again! \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter le nombre maximum d'interruptions simples en début d'après-midi

```xml
<ConstraintStudentsSetMaxSingleEarlyAfternoonGaps>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Max_Single_Gaps>3</Max_Single_Gaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxSingleEarlyAfternoonGaps>
```

### ConstraintStudentsSetMaxSingleEarlyMorningGaps

- Nom : Groupe interruptions simples max en début de matinée (Students set max single early morning gaps)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Max_Single_Gaps
- Message a 50 % : Cannot optimize, because you have a time constraint students set Y1 max single early morning gaps with weight under 100%. Please correct and try again! \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter le nombre maximum d'interruptions simples en début de matinée

```xml
<ConstraintStudentsSetMaxSingleEarlyMorningGaps>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Max_Single_Gaps>3</Max_Single_Gaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxSingleEarlyMorningGaps>
```

### ConstraintStudentsSetMaxSingleGapsBetweenMorningAndAfternoon

- Nom : Groupe interruptions simples max entre matin et après-midi (Students set max single gaps between morning and afternoon)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Max_Single_Gaps
- Message a 50 % : Cannot optimize, because you have a time constraint students set Y1 max single gaps between morning and afternoon with weight under 100%. Please correct and try again! \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter un nombre maximal d'interruptions simples entre matin et après-midi

```xml
<ConstraintStudentsSetMaxSingleGapsBetweenMorningAndAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Max_Single_Gaps>3</Max_Single_Gaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxSingleGapsBetweenMorningAndAfternoon>
```

### ConstraintStudentsSetMaxSingleGapsInSelectedTimeSlots

- Nom : Groupe limide vide unique dans les créneaux horaires sélectionnés (Students set max single gaps in selected time slots)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Max_Single_Gaps, Number_of_Selected_Time_Slots, Selected_Time_Slot
- Message a 50 % : Cannot optimize for students, because the constraint of type max single gaps in selected time slots relating to students set Y1 has no 100% weight. Please modify your data accordingly and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un groupe doit respecter un nombre maximal de vides uniques dans les créneaux horaires sélectionnés

```xml
<ConstraintStudentsSetMaxSingleGapsInSelectedTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Max_Single_Gaps>3</Max_Single_Gaps>
<Number_of_Selected_Time_Slots>3</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxSingleGapsInSelectedTimeSlots>
```

### ConstraintStudentsSetMaxSpanPerDay

- Nom : Groupe limite amplitude quotidienne (Students set max span per day)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = incompatible avec le mode, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Span, Students
- Message a 50 % : Cannot optimize, because you have constraint students set max span per day for students Y1 with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Mornings_Afternoons : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter le nombre maximum d'amplitude (en heures) quotidienne

```xml
<ConstraintStudentsSetMaxSpanPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Span>6</Max_Span>
<Students>Y1</Students>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxSpanPerDay>
```

### ConstraintStudentsSetMaxSpanPerRealDay

- Nom : Groupe limite amplitude par jour réel (Students set max span per real day)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Span, Students
- Message a 50 % : Cannot optimize, because you have constraint students set max span per real day for students Y1 with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter le nombre maximum d'amplitude (en heures) par jour réel

```xml
<ConstraintStudentsSetMaxSpanPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Span>4</Max_Span>
<Students>Y1</Students>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxSpanPerRealDay>
```

### ConstraintStudentsSetMaxThreeConsecutiveDays

- Nom : Groupe limite trois jours consécutifs (Students set max three consecutive days)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Allow_Afternoon_Morning_Afternoon_Morning_Exception
- Message a 50 % : Cannot optimize, because you have constraint students set max three consecutive days with weight (percentage) below 100% for students set Y1. It is only possible to use 100% weight for such constraints. Please make weight 100% and try again. \| Button 0 text: Skip rest \| Button 1 text: See next \| Def
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter un maximum de trois jours de travail consécutifs

```xml
<ConstraintStudentsSetMaxThreeConsecutiveDays>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Allow_Afternoon_Morning_Afternoon_Morning_Exception>true</Allow_Afternoon_Morning_Afternoon_Morning_Exception>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMaxThreeConsecutiveDays>
```

### ConstraintStudentsSetMinAfternoonsPerWeek

- Nom : Groupe minimum après-midis par semaine (Students set min afternoons per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Min_Afternoons_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint students set min afternoons per week for students set Y1 with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter le nombre minimum d'après-midis par semaine

```xml
<ConstraintStudentsSetMinAfternoonsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Min_Afternoons_Per_Week>1</Min_Afternoons_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMinAfternoonsPerWeek>
```

### ConstraintStudentsSetMinGapsBetweenActivityTag

- Nom : Groupe vides minimum entre code activité (Students set min gaps between activity tag)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'students set min gaps between activity tag' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un groupe doit respecter les vides minimum entre un code activité

```xml
<ConstraintStudentsSetMinGapsBetweenActivityTag>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Activity_Tag>Tag1</Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMinGapsBetweenActivityTag>
```

### ConstraintStudentsSetMinGapsBetweenActivityTagBetweenMorningAndAfternoon

- Nom : Vides minimum entre code activité entre matinée et après-midi pour groupe (Students set min gaps between activity tag between morning and afternoon)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'students set min gaps between activity tag between morning and afternoon' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter les vides minimum entre un code activité entre matinée et après-midi

```xml
<ConstraintStudentsSetMinGapsBetweenActivityTagBetweenMorningAndAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Activity_Tag>Tag1</Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMinGapsBetweenActivityTagBetweenMorningAndAfternoon>
```

### ConstraintStudentsSetMinGapsBetweenActivityTagPerRealDay

- Nom : Vides minimum entre code activité par jour réel pour groupe (Students set min gaps between activity tag per real day)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'students set min gaps between activity tag per real day' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter les vides minimum entre un code activité par jour réel

```xml
<ConstraintStudentsSetMinGapsBetweenActivityTagPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Activity_Tag>Tag1</Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMinGapsBetweenActivityTagPerRealDay>
```

### ConstraintStudentsSetMinGapsBetweenOrderedPairOfActivityTags

- Nom : Vides minimum entre couple ordonné de codes activité pour un groupe (Students set min gaps between ordered pair of activity tags)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, First_Activity_Tag, Second_Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'students set min gaps between ordered pair of activity tags' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un groupe doit respecter les vides minimum entre un couple ordonné de codes activité

```xml
<ConstraintStudentsSetMinGapsBetweenOrderedPairOfActivityTags>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<First_Activity_Tag>Tag1</First_Activity_Tag>
<Second_Activity_Tag>Tag2</Second_Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMinGapsBetweenOrderedPairOfActivityTags>
```

### ConstraintStudentsSetMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon

- Nom : Groupe vides minimum entre paire ordonnée de codes activité entre matinée et après-midi (Students set min gaps between ordered pair of activity tags between morning and afternoon)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, First_Activity_Tag, Second_Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'students set min gaps between ordered pair of activity tags between morning and afternoon' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter les vides minimum entre une paire ordonnée de codes activité entre matinée et après-midi

```xml
<ConstraintStudentsSetMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<First_Activity_Tag>Tag1</First_Activity_Tag>
<Second_Activity_Tag>Tag2</Second_Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon>
```

### ConstraintStudentsSetMinGapsBetweenOrderedPairOfActivityTagsPerRealDay

- Nom : Vides minimum entre couple ordonné de codes activité par jour réel pour groupe (Students set min gaps between ordered pair of activity tags per real day)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, First_Activity_Tag, Second_Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'students set min gaps between ordered pair of activity tags per real day' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter les vides minimum entre un couple ordonné de codes activité par jour réel

```xml
<ConstraintStudentsSetMinGapsBetweenOrderedPairOfActivityTagsPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<First_Activity_Tag>Tag1</First_Activity_Tag>
<Second_Activity_Tag>Tag2</Second_Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMinGapsBetweenOrderedPairOfActivityTagsPerRealDay>
```

### ConstraintStudentsSetMinHoursDaily

- Nom : Groupe heures minimum quotidiennes (Students set min hours daily)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Hours_Daily, Students, Allow_Empty_Days, Allow_Empty_Days
- Message a 50 % : Cannot optimize for students set Y1, because the constraint of type min hours daily relating to it has no 100% weight. Please modify your data accordingly and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un groupe doit respecter le nombre minimum d'heures quotidiennes

```xml
<ConstraintStudentsSetMinHoursDaily>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Hours_Daily>2</Minimum_Hours_Daily>
<Students>Y1</Students>
<Allow_Empty_Days>true</Allow_Empty_Days>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMinHoursDaily>
```

### ConstraintStudentsSetMinHoursPerAfternoon

- Nom : Groupe heures minimum par après-midi (Students set min hours per afternoon)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Hours_Per_Afternoon, Students, Allow_Empty_Afternoons, Allow_Empty_Afternoons
- Prerequis : exige aussi une contrainte 'min heures par jour' pour le meme enseignant / les memes eleves
- Message a 50 % : Cannot optimize, because you have constraint students set min hours per afternoon for students set Y1 with weight (percentage) below 100. Starting with FET version 5.4.0 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Bu
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter le nombre minimum d'heures par après-midi

```xml
<ConstraintStudentsSetMinHoursPerAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Hours_Per_Afternoon>1</Minimum_Hours_Per_Afternoon>
<Students>Y1</Students>
<Allow_Empty_Afternoons>true</Allow_Empty_Afternoons>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMinHoursPerAfternoon>
```

### ConstraintStudentsSetMinHoursPerMorning

- Nom : Groupe heures minimum par matinée (Students set min hours per morning)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Hours_Per_Morning, Students, Allow_Empty_Mornings, Allow_Empty_Mornings
- Prerequis : exige aussi une contrainte 'min heures par jour' pour le meme enseignant / les memes eleves
- Message a 50 % : Cannot optimize, because you have constraint students set min hours per morning for students set Y1 with weight (percentage) below 100. Starting with FET version 5.4.0 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Butt
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter le nombre minimum d'heures par matinée

```xml
<ConstraintStudentsSetMinHoursPerMorning>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Hours_Per_Morning>1</Minimum_Hours_Per_Morning>
<Students>Y1</Students>
<Allow_Empty_Mornings>true</Allow_Empty_Mornings>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMinHoursPerMorning>
```

### ConstraintStudentsSetMinMorningsPerWeek

- Nom : Groupe matinées minimum par semaine (Students set min mornings per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Min_Mornings_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint students set min mornings per week for students set Y1 with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter le nombre minimum de matinées par semaine

```xml
<ConstraintStudentsSetMinMorningsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Min_Mornings_Per_Week>1</Min_Mornings_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMinMorningsPerWeek>
```

### ConstraintStudentsSetMinRestingHours

- Nom : Groupe heures de repos minimum (Students set min resting hours)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = incompatible avec le mode, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Resting_Hours, Students, Circular
- Message a 50 % : Cannot optimize, because you have constraint students set min resting hours for students set Y1 with weight (percentage) below 100. It is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button
- Refus en mode Mornings_Afternoons : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter le minimum d'heures de repos (entre les jours)

```xml
<ConstraintStudentsSetMinRestingHours>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Resting_Hours>1</Minimum_Resting_Hours>
<Students>Y1</Students>
<Circular>false</Circular>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMinRestingHours>
```

### ConstraintStudentsSetMinRestingHoursBetweenMorningAndAfternoon

- Nom : Groupe heures minimum de repos entre matinée et après-midi (Students set min resting hours between morning and afternoon)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Resting_Hours, Students
- Message a 50 % : Cannot optimize, because you have constraint students set min resting hours between morning and afternoon for students set Y1 with weight (percentage) below 100. It is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 t
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit respecter le minimum d'heures de repos (entre matinée et après-midi)

```xml
<ConstraintStudentsSetMinRestingHoursBetweenMorningAndAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Resting_Hours>1</Minimum_Resting_Hours>
<Students>Y1</Students>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMinRestingHoursBetweenMorningAndAfternoon>
```

### ConstraintStudentsSetMorningIntervalMaxDaysPerWeek

- Nom : Matinée groupe intervalle limite jours par semaine (Students set morning interval max days per week)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint students set morning interval max days per week with weight (percentage) below 100 for students set Y1. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe respecte le travail dans un intervalle horaire le matin un nombre maximum de jours par semaine

```xml
<ConstraintStudentsSetMorningIntervalMaxDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Days_Per_Week>4</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMorningIntervalMaxDaysPerWeek>
```

### ConstraintStudentsSetMorningsEarlyMaxBeginningsAtSecondHour

- Nom : Groupe matins au plus tôt limite débuts en seconde heure (Students set mornings early max beginnings at second hour)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Beginnings_At_Second_Hour, Students
- Message a 50 % : Cannot optimize for subgroup Y1 G1 a, because you have an mornings early max beginnings at second hour constraint with weight percentage less than 100%. Currently, the algorithm can only optimize with not existing constraint early m.b.a.s.h. or existing with 100% weight for it. Please modify your da
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un groupe doit débuter les matins au plus tôt, en respectant un nombre maximum de débuts tardifs, en seconde heure

```xml
<ConstraintStudentsSetMorningsEarlyMaxBeginningsAtSecondHour>
<Weight_Percentage>100</Weight_Percentage>
<Max_Beginnings_At_Second_Hour>4</Max_Beginnings_At_Second_Hour>
<Students>Y1</Students>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetMorningsEarlyMaxBeginningsAtSecondHour>
```

### ConstraintStudentsSetNotAvailableTimes

- Nom : Contrainte groupe temps non disponibles (Students set not available times)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Number_of_Not_Available_Times, Not_Available_Time
- Message a 50 % : Cannot optimize, because you have constraints of type students set not available with weight percentage less than 100% for students set Y1. Currently, FET can only optimize with constraints students set not available with 100% weight (or no constraint). Please modify your data accordingly and try ag
- Description : Un groupe n'est pas disponible

```xml
<ConstraintStudentsSetNotAvailableTimes>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Number_of_Not_Available_Times>1</Number_of_Not_Available_Times>
<Not_Available_Time>
<Day>Samedi</Day>
<Hour>H6</Hour>
</Not_Available_Time>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetNotAvailableTimes>
```

### ConstraintStudentsSetOccupiesMaxSetsOfTimeSlotsFromSelection

- Nom : Groupe occupe limite jeux de créneaux horaires depuis la sélection (Students set occupies max sets of time slots from selection)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Maximum_Number_of_Occupied_Sets, Number_of_Selected_Sets_of_Time_Slots, Selected_Set_of_Time_Slots
- Message a 50 % : Cannot optimize, because there is a time constraint students set occupies max sets of time slots from selection with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un groupe occupe un nombre maximum de jeux de créneaux horaires depuis une sélection

```xml
<ConstraintStudentsSetOccupiesMaxSetsOfTimeSlotsFromSelection>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Maximum_Number_of_Occupied_Sets>2</Maximum_Number_of_Occupied_Sets>
<Number_of_Selected_Sets_of_Time_Slots>2</Number_of_Selected_Sets_of_Time_Slots>
<Selected_Set_of_Time_Slots>
<Number_of_Selected_Time_Slots>2</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
</Selected_Set_of_Time_Slots>
<Selected_Set_of_Time_Slots>
<Number_of_Selected_Time_Slots>2</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
</Selected_Set_of_Time_Slots>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetOccupiesMaxSetsOfTimeSlotsFromSelection>
```

### ConstraintStudentsSetPairOfMutuallyExclusiveSetsOfTimeSlots

- Nom : Groupe paire de jeux de créneaux horaires mutuellement exclusifs (Students set pair of mutually exclusive sets of time slots)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, Number_of_Selected_Time_Slots_in_First_Set, Selected_Time_Slot_in_First_Set, Number_of_Selected_Time_Slots_in_Second_Set, Selected_Time_Slot_in_Second_Set
- Message a 50 % : Cannot optimize, because there is a time constraint students set pair of mutually exclusive sets of time slots with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un groupe a une paire de jeux de créneaux horaires mutuellement exclusifs

```xml
<ConstraintStudentsSetPairOfMutuallyExclusiveSetsOfTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<Number_of_Selected_Time_Slots_in_First_Set>1</Number_of_Selected_Time_Slots_in_First_Set>
<Selected_Time_Slot_in_First_Set>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot_in_First_Set>
<Number_of_Selected_Time_Slots_in_Second_Set>1</Number_of_Selected_Time_Slots_in_Second_Set>
<Selected_Time_Slot_in_Second_Set>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot_in_Second_Set>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetPairOfMutuallyExclusiveSetsOfTimeSlots>
```

### ConstraintStudentsSetPairOfMutuallyExclusiveTimeSlots

- Nom : Groupe paire de créneaux horaires mutuellement exclusifs (Students set pair of mutually exclusive time slots)
- Famille / categorie : temps / Eleves
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Students, First_Time_Slot, Second_Time_Slot
- Message a 50 % : Cannot optimize, because there is a time constraint students set pair of mutually exclusive time slots with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un groupe a une paire de créneaux horaires mutuellement exclusifs

```xml
<ConstraintStudentsSetPairOfMutuallyExclusiveTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Students>Y1</Students>
<First_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</First_Time_Slot>
<Second_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Second_Time_Slot>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintStudentsSetPairOfMutuallyExclusiveTimeSlots>
```

### ConstraintSubactivitiesPreferredStartingTimes

- Nom : Sous-activités temps préférés de démarrage (Subactivities preferred starting times)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Component_Number, Teacher, Students, Subject, Activity_Tag, Duration, Duration, Number_of_Preferred_Starting_Times, Preferred_Starting_Time

```xml
<ConstraintSubactivitiesPreferredStartingTimes>
<Weight_Percentage>100</Weight_Percentage>
<Component_Number>1</Component_Number>
<Teacher>Prof A</Teacher>
<Students>Y1</Students>
<Subject>Maths</Subject>
<Activity_Tag>Tag1</Activity_Tag>
<Duration>1</Duration>
<Number_of_Preferred_Starting_Times>36</Number_of_Preferred_Starting_Times>
<Preferred_Starting_Time>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Lundi</Day>
<Hour>H3</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Lundi</Day>
<Hour>H4</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Lundi</Day>
<Hour>H5</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Lundi</Day>
<Hour>H6</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mardi</Day>
<Hour>H2</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mardi</Day>
<Hour>H3</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mardi</Day>
<Hour>H4</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mardi</Day>
<Hour>H5</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mardi</Day>
<Hour>H6</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mercredi</Day>
<Hour>H1</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mercredi</Day>
<Hour>H2</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mercredi</Day>
<Hour>H3</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mercredi</Day>
<Hour>H4</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mercredi</Day>
<Hour>H5</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Mercredi</Day>
<Hour>H6</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Jeudi</Day>
<Hour>H1</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Jeudi</Day>
<Hour>H2</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Jeudi</Day>
<Hour>H3</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Jeudi</Day>
<Hour>H4</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Jeudi</Day>
<Hour>H5</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Jeudi</Day>
<Hour>H6</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Vendredi</Day>
<Hour>H1</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Vendredi</Day>
<Hour>H2</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Vendredi</Day>
<Hour>H3</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Vendredi</Day>
<Hour>H4</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Vendredi</Day>
<Hour>H5</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Vendredi</Day>
<Hour>H6</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Samedi</Day>
<Hour>H1</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Samedi</Day>
<Hour>H2</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Samedi</Day>
<Hour>H3</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Samedi</Day>
<Hour>H4</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Samedi</Day>
<Hour>H5</Hour>
</Preferred_Starting_Time>
<Preferred_Starting_Time>
<Day>Samedi</Day>
<Hour>H6</Hour>
</Preferred_Starting_Time>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintSubactivitiesPreferredStartingTimes>
```

### ConstraintSubactivitiesPreferredTimeSlots

- Nom : Sous-activités créneaux horaires préférés (Subactivities preferred time slots)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Component_Number, Teacher, Students, Subject, Activity_Tag, Duration, Duration, Number_of_Preferred_Time_Slots, Preferred_Time_Slot

```xml
<ConstraintSubactivitiesPreferredTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Component_Number>1</Component_Number>
<Teacher>Prof A</Teacher>
<Students>Y1</Students>
<Subject>Maths</Subject>
<Activity_Tag>Tag1</Activity_Tag>
<Duration>1</Duration>
<Number_of_Preferred_Time_Slots>36</Number_of_Preferred_Time_Slots>
<Preferred_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Lundi</Day>
<Hour>H3</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Lundi</Day>
<Hour>H4</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Lundi</Day>
<Hour>H5</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Lundi</Day>
<Hour>H6</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mardi</Day>
<Hour>H2</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mardi</Day>
<Hour>H3</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mardi</Day>
<Hour>H4</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mardi</Day>
<Hour>H5</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mardi</Day>
<Hour>H6</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mercredi</Day>
<Hour>H1</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mercredi</Day>
<Hour>H2</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mercredi</Day>
<Hour>H3</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mercredi</Day>
<Hour>H4</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mercredi</Day>
<Hour>H5</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Mercredi</Day>
<Hour>H6</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Jeudi</Day>
<Hour>H1</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Jeudi</Day>
<Hour>H2</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Jeudi</Day>
<Hour>H3</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Jeudi</Day>
<Hour>H4</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Jeudi</Day>
<Hour>H5</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Jeudi</Day>
<Hour>H6</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Vendredi</Day>
<Hour>H1</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Vendredi</Day>
<Hour>H2</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Vendredi</Day>
<Hour>H3</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Vendredi</Day>
<Hour>H4</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Vendredi</Day>
<Hour>H5</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Vendredi</Day>
<Hour>H6</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Samedi</Day>
<Hour>H1</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Samedi</Day>
<Hour>H2</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Samedi</Day>
<Hour>H3</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Samedi</Day>
<Hour>H4</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Samedi</Day>
<Hour>H5</Hour>
</Preferred_Time_Slot>
<Preferred_Time_Slot>
<Day>Samedi</Day>
<Hour>H6</Hour>
</Preferred_Time_Slot>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintSubactivitiesPreferredTimeSlots>
```

### ConstraintTeacherActivityTagMaxHoursContinuously

- Nom : Enseignant code activité limite heures continues (Teacher activity tag max hours continuously)
- Famille / categorie : temps / Enseignants
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Teacher, Activity_Tag, Maximum_Hours_Continuously
- Description : Un enseignant pour un code activité doit respecter le nombre maximum d'heures continues

```xml
<ConstraintTeacherActivityTagMaxHoursContinuously>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Activity_Tag>Tag1</Activity_Tag>
<Maximum_Hours_Continuously>6</Maximum_Hours_Continuously>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherActivityTagMaxHoursContinuously>
```

### ConstraintTeacherActivityTagMaxHoursDaily

- Nom : Enseignant code activité limite heures quotidiennes (Teacher activity tag max hours daily)
- Famille / categorie : temps / Enseignants
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Teacher, Activity_Tag, Maximum_Hours_Daily
- Description : Un enseignant pour un code activité doit respecter le nombre maximum d'heures quotidiennes

```xml
<ConstraintTeacherActivityTagMaxHoursDaily>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Activity_Tag>Tag1</Activity_Tag>
<Maximum_Hours_Daily>6</Maximum_Hours_Daily>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherActivityTagMaxHoursDaily>
```

### ConstraintTeacherActivityTagMaxHoursDailyRealDays

- Nom : Enseignant code activité limite heures quotidiennes pour jours réels (Teacher activity tag max hours daily real days)
- Famille / categorie : temps / Enseignants
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Teacher, Activity_Tag, Maximum_Hours_Daily
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant, pour un code activité, doit respecter le nombre maximum d'heures quotidiennes par jour réel

```xml
<ConstraintTeacherActivityTagMaxHoursDailyRealDays>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Activity_Tag>Tag1</Activity_Tag>
<Maximum_Hours_Daily>4</Maximum_Hours_Daily>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherActivityTagMaxHoursDailyRealDays>
```

### ConstraintTeacherActivityTagMinHoursDaily

- Nom : Enseignant code activité minimum heures quotidiennes (Teacher activity tag min hours daily)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Activity_Tag, Minimum_Hours_Daily, Minimum_Days_With_Tag
- Message a 50 % : Cannot optimize for teachers, because the constraint of type activity tag min hours daily relating to teacher Prof A has no 100% weight. Please modify your data accordingly and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un enseignant pour un code activité doit respecter le nombre minimum d'heures quotidiennes

```xml
<ConstraintTeacherActivityTagMinHoursDaily>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Activity_Tag>Tag1</Activity_Tag>
<Minimum_Hours_Daily>1</Minimum_Hours_Daily>
<Minimum_Days_With_Tag>1</Minimum_Days_With_Tag>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherActivityTagMinHoursDaily>
```

### ConstraintTeacherAfternoonIntervalMaxDaysPerWeek

- Nom : Après-midi enseignant intervalle limite jours par semaine (Teacher afternoon interval max days per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teacher afternoon interval max days per week with weight (percentage) below 100 for teacher Prof A. Starting with FET version 5.6.2 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip re
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant respecte le travail dans un intervalle horaire l'après-midi un nombre maximum de jours par semaine

```xml
<ConstraintTeacherAfternoonIntervalMaxDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Days_Per_Week>4</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherAfternoonIntervalMaxDaysPerWeek>
```

### ConstraintTeacherAfternoonsEarlyMaxBeginningsAtSecondHour

- Nom : Après-midis enseignant au plus tôt limite débuts en seconde heure (Teacher afternoons early max beginnings at second hour)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Beginnings_At_Second_Hour, Teacher
- Message a 50 % : Cannot optimize for teacher Prof A, because you have an afternoons early max beginnings at second hour constraint with weight percentage less than 100%. Currently, the algorithm can only optimize with not existing constraint early m.b.a.s.h. or existing with 100% weight for it. Please modify your da
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un(e) enseignant(e) doit débuter ses après-midis au plus tôt, en respectant un nombre maximum de débuts tardifs, en seconde heure

```xml
<ConstraintTeacherAfternoonsEarlyMaxBeginningsAtSecondHour>
<Weight_Percentage>100</Weight_Percentage>
<Max_Beginnings_At_Second_Hour>4</Max_Beginnings_At_Second_Hour>
<Teacher>Prof A</Teacher>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherAfternoonsEarlyMaxBeginningsAtSecondHour>
```

### ConstraintTeacherIntervalMaxDaysPerWeek

- Nom : Enseignant intervalle limite jours par semaine (Teacher interval max days per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teacher interval max days per week with weight (percentage) below 100 for teacher Prof A. Starting with FET version 5.6.2 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Butto
- Description : Un enseignant respecte le travail dans un intervalle horaire un nombre maximum de jours par semaine

```xml
<ConstraintTeacherIntervalMaxDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Days_Per_Week>6</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherIntervalMaxDaysPerWeek>
```

### ConstraintTeacherMaxActivityTagChangesPerDay

- Nom : Enseignant changements balise activité quotidiens max (Teacher max activity tag changes per day)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Activity_Tag_Changes_Per_Day
- Message a 50 % : Cannot optimize, because you have a constraint teacher max activity tag changes per day for teacher Prof A with weight (percentage) below 100. It is only possible to use 100% weight for such constraints. Please make the weight 100% and try again! \| Button 0 text: Skip rest \| Button 1 text: See next 
- Description : Un enseignant doit respecter le nombre maximum de changements quotidiens de balise activité

```xml
<ConstraintTeacherMaxActivityTagChangesPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Activity_Tag_Changes_Per_Day>6</Max_Activity_Tag_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxActivityTagChangesPerDay>
```

### ConstraintTeacherMaxActivityTagChangesPerWeek

- Nom : Enseignant changements balise activité hebdomadaires max (Teacher max activity tag changes per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Activity_Tag_Changes_Per_Week
- Message a 50 % : Cannot optimize, because you have a constraint teacher max activity tag changes per week for teacher Prof A with weight (percentage) below 100. It is only possible to use 100% weight for such constraints. Please make the weight 100% and try again! \| Button 0 text: Skip rest \| Button 1 text: See next
- Description : Un enseignant doit respecter le nombre maximum de changements hebdomadaires de balise activité

```xml
<ConstraintTeacherMaxActivityTagChangesPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Activity_Tag_Changes_Per_Week>6</Max_Activity_Tag_Changes_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxActivityTagChangesPerWeek>
```

### ConstraintTeacherMaxActivityTagsPerDayFromSet

- Nom : Enseignant limite codes activité par jour depuis le jeu (Teacher max activity tags per day from set)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids < 100 % : abandon du programme)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = abandon du programme, 0 % = abandon du programme, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Teacher, Number_of_Activity_Tags, Activity_Tag, Maximum_Allowed_Activity_Tags
- Message a 50 % : Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)]
- Description : Un enseignant doit respecter le nombre maximum de codes activité par jour depuis un jeu

```xml
<ConstraintTeacherMaxActivityTagsPerDayFromSet>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Number_of_Activity_Tags>2</Number_of_Activity_Tags>
<Activity_Tag>Tag1</Activity_Tag>
<Activity_Tag>Tag2</Activity_Tag>
<Maximum_Allowed_Activity_Tags>3</Maximum_Allowed_Activity_Tags>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxActivityTagsPerDayFromSet>
```

### ConstraintTeacherMaxActivityTagsPerRealDayFromSet

- Nom : Enseignant limite codes activité par jour réel depuis le jeu (Teacher max activity tags per real day from set)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids < 100 % : abandon du programme)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = abandon du programme, 0 % = abandon du programme, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Teacher, Number_of_Activity_Tags, Activity_Tag, Maximum_Allowed_Activity_Tags
- Message a 50 % : Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)]
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter le nombre maximum de codes activité par jour réel depuis un jeu

```xml
<ConstraintTeacherMaxActivityTagsPerRealDayFromSet>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Number_of_Activity_Tags>2</Number_of_Activity_Tags>
<Activity_Tag>Tag1</Activity_Tag>
<Activity_Tag>Tag2</Activity_Tag>
<Maximum_Allowed_Activity_Tags>3</Maximum_Allowed_Activity_Tags>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxActivityTagsPerRealDayFromSet>
```

### ConstraintTeacherMaxAfternoonsPerWeek

- Nom : Enseignant après-midi max par semaine (Teacher max afternoons per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = refusee (lecture), Mornings_Afternoons = acceptee, Block_Planning = refusee (lecture), Terms = refusee (lecture)
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Afternoons_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teacher max afternoons per week with weight (percentage) below 100 for teacher Prof A. Starting with FET version 5.2.17 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 
- Refus en mode Official : Could not read file - XML parse error at line 14, column 328: \| Max_Afternoons_Per_Week is incorrect
- Description : Un enseignant doit respecter le nombre maximum d'après-midis par semaine

```xml
<ConstraintTeacherMaxAfternoonsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Afternoons_Per_Week>4</Max_Afternoons_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxAfternoonsPerWeek>
```

### ConstraintTeacherMaxDaysPerWeek

- Nom : Enseignant jours max par semaine (Teacher max days per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teacher max days per week with weight (percentage) below 100 for teacher Prof A. Starting with FET version 5.2.17 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text
- Description : Un enseignant doit respecter le nombre maximum de jours par semaine

```xml
<ConstraintTeacherMaxDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Days_Per_Week>6</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxDaysPerWeek>
```

### ConstraintTeacherMaxGapsPerDay

- Nom : Enseignant vides max par jour (Teacher max gaps per day)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Gaps
- Message a 50 % : Cannot optimize, because you have constraint teacher max gaps per day with weight (percentage) below 100 for teacher Prof A. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un enseignant doit respecter le nombre maximum de vides quotidiens

```xml
<ConstraintTeacherMaxGapsPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Gaps>3</Max_Gaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxGapsPerDay>
```

### ConstraintTeacherMaxGapsPerMorningAndAfternoon

- Nom : Enseignant limite vides par matin et après-midi (Teacher max gaps per morning and afternoon)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Gaps
- Message a 50 % : Cannot optimize, because you have constraint teacher max gaps per morning and afternoon with weight (percentage) below 100 for teacher Prof A. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter le nombre maximum de vides par matin et après-midi

```xml
<ConstraintTeacherMaxGapsPerMorningAndAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Gaps>3</Max_Gaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxGapsPerMorningAndAfternoon>
```

### ConstraintTeacherMaxGapsPerRealDay

- Nom : Enseignant limite vides par jour réel (Teacher max gaps per real day)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Gaps, Allow_One_Day_Exception_of_Plus_One
- Message a 50 % : Cannot optimize, because you have constraint teacher max gaps per real day with weight (percentage) below 100 for teacher Prof A. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter le nombre maximum de vides par jour réel

```xml
<ConstraintTeacherMaxGapsPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Gaps>3</Max_Gaps>
<Allow_One_Day_Exception_of_Plus_One>true</Allow_One_Day_Exception_of_Plus_One>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxGapsPerRealDay>
```

### ConstraintTeacherMaxGapsPerWeek

- Nom : Enseignant vides max par semaine (Teacher max gaps per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Gaps
- Message a 50 % : Cannot optimize, because you have constraint teacher max gaps per week with weight (percentage) below 100 for teacher Prof A. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un enseignant doit respecter le nombre maximum de vides par semaine

```xml
<ConstraintTeacherMaxGapsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Gaps>3</Max_Gaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxGapsPerWeek>
```

### ConstraintTeacherMaxGapsPerWeekForRealDays

- Nom : Enseignant limite vides par semaine pour jours réels (Teacher max gaps per week for real days)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Gaps
- Message a 50 % : Cannot optimize, because you have constraint teacher max gaps per week for real days with weight (percentage) below 100 for teacher Prof A. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter le nombre maximum de vides par semaine pour jours réels

```xml
<ConstraintTeacherMaxGapsPerWeekForRealDays>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Gaps>3</Max_Gaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxGapsPerWeekForRealDays>
```

### ConstraintTeacherMaxHoursContinuously

- Nom : Enseignant heures continues max (Teacher max hours continuously)
- Famille / categorie : temps / Enseignants
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Teacher, Maximum_Hours_Continuously
- Description : Un enseignant doit respecter le nombre maximum d'heures continues

```xml
<ConstraintTeacherMaxHoursContinuously>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Maximum_Hours_Continuously>6</Maximum_Hours_Continuously>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxHoursContinuously>
```

### ConstraintTeacherMaxHoursDaily

- Nom : Enseignant heures quotidiennes max (Teacher max hours daily)
- Famille / categorie : temps / Enseignants
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Teacher, Maximum_Hours_Daily
- Description : Un enseignant doit respecter le nombre maximum d'heures quotidiennes

```xml
<ConstraintTeacherMaxHoursDaily>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Maximum_Hours_Daily>6</Maximum_Hours_Daily>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxHoursDaily>
```

### ConstraintTeacherMaxHoursDailyInInterval

- Nom : Enseignant limite heures quotidiennes dans intervalle (Teacher max hours daily in interval)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Maximum_Hours_Daily
- Message a 50 % : Cannot optimize, because there is a time constraint teacher max hours daily in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un enseignant doit respecter le nombre maximum d'heures quotidiennes dans un intervalle horaire

```xml
<ConstraintTeacherMaxHoursDailyInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Maximum_Hours_Daily>6</Maximum_Hours_Daily>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxHoursDailyInInterval>
```

### ConstraintTeacherMaxHoursDailyRealDays

- Nom : Enseignant limite heures quotidiennes pour jours réels (Teacher max hours daily real days)
- Famille / categorie : temps / Enseignants
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Teacher, Maximum_Hours_Daily
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter le nombre maximum d'heures quotidiennes par jour réel

```xml
<ConstraintTeacherMaxHoursDailyRealDays>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Maximum_Hours_Daily>4</Maximum_Hours_Daily>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxHoursDailyRealDays>
```

### ConstraintTeacherMaxHoursPerAllAfternoons

- Nom : Enseignant limite heures pour tous les après-midis (Teacher max hours per all afternoons)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Maximum_Hours_Per_All_Afternoons
- Message a 50 % : Cannot optimize, because you have constraint teacher max hours per all afternoons for teacher Prof A with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter le nombre maximum d'heures pour tous les après-midis

```xml
<ConstraintTeacherMaxHoursPerAllAfternoons>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Maximum_Hours_Per_All_Afternoons>32</Maximum_Hours_Per_All_Afternoons>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxHoursPerAllAfternoons>
```

### ConstraintTeacherMaxHoursPerTerm

- Nom : Enseignant limite heures par période (Teacher max hours per term)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = incompatible avec le mode, Block_Planning = incompatible avec le mode, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Hours_Per_Term
- Message a 50 % : Cannot optimize, because you have a constraint teacher max hours per term with weight (percentage) below 100% for teacher Prof A. It is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter le nombre maximum d'heures par période

```xml
<ConstraintTeacherMaxHoursPerTerm>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Hours_Per_Term>10</Max_Hours_Per_Term>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxHoursPerTerm>
```

### ConstraintTeacherMaxMorningsPerWeek

- Nom : Enseignant matinées max par semaine (Teacher max mornings per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = refusee (lecture), Mornings_Afternoons = acceptee, Block_Planning = refusee (lecture), Terms = refusee (lecture)
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Mornings_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teacher max mornings per week with weight (percentage) below 100 for teacher Prof A. Starting with FET version 5.2.17 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 
- Refus en mode Official : Could not read file - XML parse error at line 14, column 322: \| Max_Mornings_Per_Week is incorrect
- Description : Un enseignant doit respecter le nombre maximum de matinées par semaine

```xml
<ConstraintTeacherMaxMorningsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Mornings_Per_Week>4</Max_Mornings_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxMorningsPerWeek>
```

### ConstraintTeacherMaxRealDaysPerWeek

- Nom : Enseignant limite jours réels par semaine (Teacher max real days per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = refusee (lecture), Mornings_Afternoons = acceptee, Block_Planning = refusee (lecture), Terms = refusee (lecture)
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teacher max real days per week with weight (percentage) below 100 for teacher Prof A. Starting with FET version 5.2.17 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1
- Refus en mode Official : Could not read file - XML parse error at line 14, column 314: \| Max_Days_Per_Week is incorrect
- Description : Un enseignant doit respecter le nombre maximum de jours réels par semaine

```xml
<ConstraintTeacherMaxRealDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Days_Per_Week>4</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxRealDaysPerWeek>
```

### ConstraintTeacherMaxSingleGapsInSelectedTimeSlots

- Nom : Enseignant limide vide unique dans les créneaux horaires sélectionnés (Teacher max single gaps in selected time slots)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Single_Gaps, Number_of_Selected_Time_Slots, Selected_Time_Slot
- Message a 50 % : Cannot optimize for teachers, because the constraint of type max single gaps in selected time slots relating to teacher Prof A has no 100% weight. Please modify your data accordingly and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un enseignant doit respecter un nombre maximal de vides uniques dans les créneaux horaires sélectionnés

```xml
<ConstraintTeacherMaxSingleGapsInSelectedTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Single_Gaps>3</Max_Single_Gaps>
<Number_of_Selected_Time_Slots>3</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxSingleGapsInSelectedTimeSlots>
```

### ConstraintTeacherMaxSpanPerDay

- Nom : Enseignant amplitude max par jour (Teacher max span per day)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Span, Allow_One_Day_Exception_of_Plus_One
- Message a 50 % : Cannot optimize, because you have constraint teacher max span per day for teacher Prof A with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un enseignant doit respecter le nombre maximum d'amplitude (en heures) quotidienne

```xml
<ConstraintTeacherMaxSpanPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Span>6</Max_Span>
<Allow_One_Day_Exception_of_Plus_One>true</Allow_One_Day_Exception_of_Plus_One>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxSpanPerDay>
```

### ConstraintTeacherMaxSpanPerRealDay

- Nom : Enseignant limite amplitude par jour réel (Teacher max span per real day)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Max_Span, Allow_One_Day_Exception_of_Plus_One
- Message a 50 % : Cannot optimize, because you have constraint teacher max span per real day for teacher Prof A with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter le nombre maximum d'amplitude (en heures) par jour réel

```xml
<ConstraintTeacherMaxSpanPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Max_Span>4</Max_Span>
<Allow_One_Day_Exception_of_Plus_One>true</Allow_One_Day_Exception_of_Plus_One>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxSpanPerRealDay>
```

### ConstraintTeacherMaxThreeConsecutiveDays

- Nom : Enseignant limite trois jours consécutifs (Teacher max three consecutive days)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Allow_Afternoon_Morning_Afternoon_Morning_Exception
- Message a 50 % : Cannot optimize, because you have constraint teacher max three consecutive days with weight (percentage) below 100% for teacher Prof A. It is only possible to use 100% weight for such constraints. Please make weight 100% and try again. \| Button 0 text: Skip rest \| Button 1 text: See next \| Default b
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter un maximum de trois jours de travail consécutifs

```xml
<ConstraintTeacherMaxThreeConsecutiveDays>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Allow_Afternoon_Morning_Afternoon_Morning_Exception>true</Allow_Afternoon_Morning_Afternoon_Morning_Exception>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxThreeConsecutiveDays>
```

### ConstraintTeacherMaxTwoConsecutiveAfternoons

- Nom : Enseignant deux après-midi consécutifs max (Teacher max two consecutive afternoons)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher
- Message a 50 % : Cannot optimize, because you have constraint teacher max two consecutive afternoons for teacher Prof A with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter deux après-midis consécutifs au maximum

```xml
<ConstraintTeacherMaxTwoConsecutiveAfternoons>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxTwoConsecutiveAfternoons>
```

### ConstraintTeacherMaxTwoConsecutiveMornings

- Nom : Enseignant deux matinées consécutives max (Teacher max two consecutive mornings)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher
- Message a 50 % : Cannot optimize, because you have constraint teacher max two consecutive mornings for teacher Prof A with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter deux matinées consécutives au maximum

```xml
<ConstraintTeacherMaxTwoConsecutiveMornings>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxTwoConsecutiveMornings>
```

### ConstraintTeacherMaxZeroGapsPerAfternoon

- Nom : Enseignant limite zéro vide par après-midi (Teacher max zero gaps per afternoon)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids < 100 % : abandon du programme)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = abandon du programme, 0 % = abandon du programme, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Teacher
- Message a 50 % : Assertion `tg->weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)]
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter le nombre de zéro vide par après-midi

```xml
<ConstraintTeacherMaxZeroGapsPerAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMaxZeroGapsPerAfternoon>
```

### ConstraintTeacherMinAfternoonsPerWeek

- Nom : Enseignant après-midi min par semaine (Teacher min afternoons per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Minimum_Afternoons_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teacher min afternoons per week for teacher Prof A with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter le nombre minimum d'après-midis par semaine

```xml
<ConstraintTeacherMinAfternoonsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Minimum_Afternoons_Per_Week>1</Minimum_Afternoons_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMinAfternoonsPerWeek>
```

### ConstraintTeacherMinDaysPerWeek

- Nom : Enseignant jours min par semaine (Teacher min days per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Minimum_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teacher min days per week for teacher Prof A with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un enseignant doit respecter le nombre minimum de jours par semaine

```xml
<ConstraintTeacherMinDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Minimum_Days_Per_Week>1</Minimum_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMinDaysPerWeek>
```

### ConstraintTeacherMinGapsBetweenActivityTag

- Nom : Enseignant vides minimum entre code activité (Teacher min gaps between activity tag)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'teacher min gaps between activity tag' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un enseignant doit respecter les vides minimum entre un code activité

```xml
<ConstraintTeacherMinGapsBetweenActivityTag>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Activity_Tag>Tag1</Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMinGapsBetweenActivityTag>
```

### ConstraintTeacherMinGapsBetweenActivityTagBetweenMorningAndAfternoon

- Nom : Vides minimum entre code activité entre matinée et après-midi pour enseignant (Teacher min gaps between activity tag between morning and afternoon)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'teacher min gaps between activity tag between morning and afternoon' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter les vides minimum entre un code activité entre matinée et après-midi

```xml
<ConstraintTeacherMinGapsBetweenActivityTagBetweenMorningAndAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Activity_Tag>Tag1</Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMinGapsBetweenActivityTagBetweenMorningAndAfternoon>
```

### ConstraintTeacherMinGapsBetweenActivityTagPerRealDay

- Nom : Vides minimum entre code activité par jour réel pour enseignant (Teacher min gaps between activity tag per real day)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'teacher min gaps between activity tag per real day' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter les vides minimum entre un code activité par jour réel

```xml
<ConstraintTeacherMinGapsBetweenActivityTagPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Activity_Tag>Tag1</Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMinGapsBetweenActivityTagPerRealDay>
```

### ConstraintTeacherMinGapsBetweenOrderedPairOfActivityTags

- Nom : Vides minimum entre couple ordonné de codes activité pour enseignant (Teacher min gaps between ordered pair of activity tags)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, First_Activity_Tag, Second_Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'teacher min gaps between ordered pair of activity tags' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un enseignant doit respecter les vides minimum entre un couple ordonné de codes activité

```xml
<ConstraintTeacherMinGapsBetweenOrderedPairOfActivityTags>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<First_Activity_Tag>Tag1</First_Activity_Tag>
<Second_Activity_Tag>Tag2</Second_Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMinGapsBetweenOrderedPairOfActivityTags>
```

### ConstraintTeacherMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon

- Nom : Enseignant vides minimum entre paire ordonnée de codes activité entre matinée et après-midi (Teacher min gaps between ordered pair of activity tags between morning and afternoon)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, First_Activity_Tag, Second_Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'teacher min gaps between ordered pair of activity tags between morning and afternoon' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter les vides minimum entre une paire ordonnée de codes activité entre matinée et après-midi

```xml
<ConstraintTeacherMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<First_Activity_Tag>Tag1</First_Activity_Tag>
<Second_Activity_Tag>Tag2</Second_Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon>
```

### ConstraintTeacherMinGapsBetweenOrderedPairOfActivityTagsPerRealDay

- Nom : Vides minimum entre couple ordonné de codes activité par jour réel pour enseignant (Teacher min gaps between ordered pair of activity tags per real day)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, First_Activity_Tag, Second_Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'teacher min gaps between ordered pair of activity tags per real day' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter les vides minimum entre un couple ordonné de codes activité par jour réel

```xml
<ConstraintTeacherMinGapsBetweenOrderedPairOfActivityTagsPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<First_Activity_Tag>Tag1</First_Activity_Tag>
<Second_Activity_Tag>Tag2</Second_Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMinGapsBetweenOrderedPairOfActivityTagsPerRealDay>
```

### ConstraintTeacherMinHoursDaily

- Nom : Enseignant heures quotidiennes min (Teacher min hours daily)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Minimum_Hours_Daily, Allow_Empty_Days, Allow_Empty_Days
- Message a 50 % : Cannot optimize, because you have constraint teacher min hours daily for teacher Prof A with weight (percentage) below 100. Starting with FET version 5.4.0 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: S
- Description : Un enseignant doit respecter le nombre minimum d'heures quotidiennes

```xml
<ConstraintTeacherMinHoursDaily>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Minimum_Hours_Daily>2</Minimum_Hours_Daily>
<Allow_Empty_Days>true</Allow_Empty_Days>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMinHoursDaily>
```

### ConstraintTeacherMinHoursDailyRealDays

- Nom : Enseignant minimum heures quotidiennes pour jours réels (Teacher min hours daily for real days)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Minimum_Hours_Daily, Allow_Empty_Days, Allow_Empty_Days
- Message a 50 % : Cannot optimize, because you have constraint teacher min hours daily for real days for teacher Prof A with weight (percentage) below 100. Starting with FET version 5.4.0 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Bu
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter le nombre minimum d'heures quotidiennes pour jours réels

```xml
<ConstraintTeacherMinHoursDailyRealDays>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Minimum_Hours_Daily>2</Minimum_Hours_Daily>
<Allow_Empty_Days>true</Allow_Empty_Days>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMinHoursDailyRealDays>
```

### ConstraintTeacherMinHoursPerAfternoon

- Nom : Enseignant heures min par après-midi (Teacher min hours per afternoon)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Minimum_Hours_Per_Afternoon, Allow_Empty_Afternoons, Allow_Empty_Afternoons
- Prerequis : exige aussi une contrainte 'min heures par jour' pour le meme enseignant / les memes eleves
- Message a 50 % : Cannot optimize, because you have constraint teacher min hours per afternoon for teacher Prof A with weight (percentage) below 100. Starting with FET version 5.4.0 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter le nombre minimum d'heures par après-midi

```xml
<ConstraintTeacherMinHoursPerAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Minimum_Hours_Per_Afternoon>1</Minimum_Hours_Per_Afternoon>
<Allow_Empty_Afternoons>true</Allow_Empty_Afternoons>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMinHoursPerAfternoon>
```

### ConstraintTeacherMinHoursPerMorning

- Nom : Enseignant heures min par matinée (Teacher min hours per morning)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Minimum_Hours_Per_Morning, Allow_Empty_Mornings, Allow_Empty_Mornings
- Prerequis : exige aussi une contrainte 'min heures par jour' pour le meme enseignant / les memes eleves
- Message a 50 % : Cannot optimize, because you have constraint teacher min hours per morning for teacher Prof A with weight (percentage) below 100. Starting with FET version 5.4.0 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 t
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter le nombre minimum d'heures par matinée

```xml
<ConstraintTeacherMinHoursPerMorning>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Minimum_Hours_Per_Morning>1</Minimum_Hours_Per_Morning>
<Allow_Empty_Mornings>true</Allow_Empty_Mornings>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMinHoursPerMorning>
```

### ConstraintTeacherMinMorningsPerWeek

- Nom : Enseignant matinées min par semaine (Teacher min mornings per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Minimum_Mornings_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teacher min mornings per week for teacher Prof A with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter le nombre minimum de matinées par semaine

```xml
<ConstraintTeacherMinMorningsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Minimum_Mornings_Per_Week>1</Minimum_Mornings_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMinMorningsPerWeek>
```

### ConstraintTeacherMinRealDaysPerWeek

- Nom : Enseignant jours réels minimum par semaine (Teacher min real days per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Minimum_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teacher min real days per week for teacher Prof A with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter le nombre minimum de jours réels par semaine

```xml
<ConstraintTeacherMinRealDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Minimum_Days_Per_Week>1</Minimum_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMinRealDaysPerWeek>
```

### ConstraintTeacherMinRestingHours

- Nom : Enseignant heures de repos min (Teacher min resting hours)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = incompatible avec le mode, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Minimum_Resting_Hours, Circular
- Message a 50 % : Cannot optimize, because you have constraint teacher min resting hours for teacher Prof A with weight (percentage) below 100. It is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Mornings_Afternoons : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter le minimum d'heures de repos (entre les jours)

```xml
<ConstraintTeacherMinRestingHours>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Minimum_Resting_Hours>1</Minimum_Resting_Hours>
<Circular>false</Circular>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMinRestingHours>
```

### ConstraintTeacherMinRestingHoursBetweenMorningAndAfternoon

- Nom : Enseignant heures minimum de repos entre matinée et après-midi (Teacher min resting hours between morning and afternoon)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Minimum_Resting_Hours
- Message a 50 % : Cannot optimize, because you have constraint teacher min resting hours between morning and afternoon for teacher Prof A with weight (percentage) below 100. It is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: S
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant doit respecter le minimum d'heures de repos (entre matinée et après-midi)

```xml
<ConstraintTeacherMinRestingHoursBetweenMorningAndAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Minimum_Resting_Hours>1</Minimum_Resting_Hours>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMinRestingHoursBetweenMorningAndAfternoon>
```

### ConstraintTeacherMorningIntervalMaxDaysPerWeek

- Nom : Matinée enseignant intervalle limite jours par semaine (Teacher morning interval max days per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teacher morning interval max days per week with weight (percentage) below 100 for teacher Prof A. Starting with FET version 5.6.2 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un enseignant respecte le travail dans un intervalle horaire le matin un nombre maximum de jours par semaine

```xml
<ConstraintTeacherMorningIntervalMaxDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Days_Per_Week>4</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMorningIntervalMaxDaysPerWeek>
```

### ConstraintTeacherMorningsEarlyMaxBeginningsAtSecondHour

- Nom : Enseignant matins au plus tôt limite débuts en seconde heure (Teacher mornings early max beginnings at second hour)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Beginnings_At_Second_Hour, Teacher
- Message a 50 % : Cannot optimize for teacher Prof A, because you have an mornings early max beginnings at second hour constraint with weight percentage less than 100%. Currently, the algorithm can only optimize with not existing constraint early m.b.a.s.h. or existing with 100% weight for it. Please modify your data
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Un(e) enseignant(e) doit débuter ses matins au plus tôt, en respectant un nombre maximum de débuts tardifs, en seconde heure

```xml
<ConstraintTeacherMorningsEarlyMaxBeginningsAtSecondHour>
<Weight_Percentage>100</Weight_Percentage>
<Max_Beginnings_At_Second_Hour>4</Max_Beginnings_At_Second_Hour>
<Teacher>Prof A</Teacher>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherMorningsEarlyMaxBeginningsAtSecondHour>
```

### ConstraintTeacherNoTwoConsecutiveDays

- Nom : Enseignant sans deux jours consécutifs (Teacher no two consecutive days)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher
- Message a 50 % : Cannot optimize, because you have constraint teacher no two consecutive days with weight (percentage) below 100% for teacher Prof A. It is only possible to use 100% weight for such constraints. Please make weight 100% and try again. \| Button 0 text: Skip rest \| Button 1 text: See next \| Default butt
- Description : Un enseignant ne doit pas travailler deux jours consécutifs

```xml
<ConstraintTeacherNoTwoConsecutiveDays>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherNoTwoConsecutiveDays>
```

### ConstraintTeacherNotAvailableTimes

- Nom : Enseignant temps non disponibles (Teacher not available times)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Number_of_Not_Available_Times, Not_Available_Time
- Message a 50 % : Cannot optimize, because you have constraints of type teacher not available with weight percentage less than 100% for teacher Prof A. Currently, FET can only optimize with constraints teacher not available with 100% weight (or no constraint). Please modify your data accordingly and try again.

```xml
<ConstraintTeacherNotAvailableTimes>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Number_of_Not_Available_Times>1</Number_of_Not_Available_Times>
<Not_Available_Time>
<Day>Samedi</Day>
<Hour>H6</Hour>
</Not_Available_Time>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherNotAvailableTimes>
```

### ConstraintTeacherOccupiesMaxSetsOfTimeSlotsFromSelection

- Nom : Enseignant occupe limite jeux de créneaux horaires depuis la sélection (Teacher occupies max sets of time slots from selection)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Maximum_Number_of_Occupied_Sets, Number_of_Selected_Sets_of_Time_Slots, Selected_Set_of_Time_Slots
- Message a 50 % : Cannot optimize, because there is a time constraint teacher occupies max sets of time slots from selection with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un enseignant occupe un nombre maximum de jeux de créneaux horaires depuis une sélection

```xml
<ConstraintTeacherOccupiesMaxSetsOfTimeSlotsFromSelection>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Maximum_Number_of_Occupied_Sets>2</Maximum_Number_of_Occupied_Sets>
<Number_of_Selected_Sets_of_Time_Slots>2</Number_of_Selected_Sets_of_Time_Slots>
<Selected_Set_of_Time_Slots>
<Number_of_Selected_Time_Slots>2</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
</Selected_Set_of_Time_Slots>
<Selected_Set_of_Time_Slots>
<Number_of_Selected_Time_Slots>2</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
</Selected_Set_of_Time_Slots>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherOccupiesMaxSetsOfTimeSlotsFromSelection>
```

### ConstraintTeacherPairOfMutuallyExclusiveSetsOfTimeSlots

- Nom : Enseignant paire de jeux de créneaux horaires mutuellement exclusifs (Teacher pair of mutually exclusive sets of time slots)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, Number_of_Selected_Time_Slots_in_First_Set, Selected_Time_Slot_in_First_Set, Number_of_Selected_Time_Slots_in_Second_Set, Selected_Time_Slot_in_Second_Set
- Message a 50 % : Cannot optimize, because there is a time constraint teacher pair of mutually exclusive sets of time slots with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un enseignant a une paire de jeux de créneaux horaires mutuellement exclusifs

```xml
<ConstraintTeacherPairOfMutuallyExclusiveSetsOfTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<Number_of_Selected_Time_Slots_in_First_Set>1</Number_of_Selected_Time_Slots_in_First_Set>
<Selected_Time_Slot_in_First_Set>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot_in_First_Set>
<Number_of_Selected_Time_Slots_in_Second_Set>1</Number_of_Selected_Time_Slots_in_Second_Set>
<Selected_Time_Slot_in_Second_Set>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot_in_Second_Set>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherPairOfMutuallyExclusiveSetsOfTimeSlots>
```

### ConstraintTeacherPairOfMutuallyExclusiveTimeSlots

- Nom : Enseignant paire de créneaux horaires mutuellement exclusifs (Teacher pair of mutually exclusive time slots)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Teacher, First_Time_Slot, Second_Time_Slot
- Message a 50 % : Cannot optimize, because there is a time constraint teacher pair of mutually exclusive time slots with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Un enseignant a une paire de créneaux horaires mutuellement exclusifs

```xml
<ConstraintTeacherPairOfMutuallyExclusiveTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Teacher>Prof A</Teacher>
<First_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</First_Time_Slot>
<Second_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Second_Time_Slot>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeacherPairOfMutuallyExclusiveTimeSlots>
```

### ConstraintTeachersActivityTagMaxHoursContinuously

- Nom : Enseignants code activité limite heures continues (Teachers activity tag max hours continuously)
- Famille / categorie : temps / Enseignants
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Tag, Maximum_Hours_Continuously
- Description : Tous les enseignants, pour un code activité, doivent respecter le nombre maximum d'heures continues

```xml
<ConstraintTeachersActivityTagMaxHoursContinuously>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Tag>Tag1</Activity_Tag>
<Maximum_Hours_Continuously>6</Maximum_Hours_Continuously>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersActivityTagMaxHoursContinuously>
```

### ConstraintTeachersActivityTagMaxHoursDaily

- Nom : Enseignants code activité limite heures quotidiennes (Teachers activity tag max hours daily)
- Famille / categorie : temps / Enseignants
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Tag, Maximum_Hours_Daily
- Description : Tous les enseignants, pour un code activité, doivent respecter le nombre maximum d'heures quotidiennes

```xml
<ConstraintTeachersActivityTagMaxHoursDaily>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Tag>Tag1</Activity_Tag>
<Maximum_Hours_Daily>6</Maximum_Hours_Daily>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersActivityTagMaxHoursDaily>
```

### ConstraintTeachersActivityTagMaxHoursDailyRealDays

- Nom : Enseignants code activité limite heures quotidiennes pour jours réels (Teachers activity tag max hours daily real days)
- Famille / categorie : temps / Enseignants
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Activity_Tag, Maximum_Hours_Daily
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants, pour un code activité, doivent respecter le nombre maximum d'heures quotidiennes par jour réel

```xml
<ConstraintTeachersActivityTagMaxHoursDailyRealDays>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Tag>Tag1</Activity_Tag>
<Maximum_Hours_Daily>4</Maximum_Hours_Daily>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersActivityTagMaxHoursDailyRealDays>
```

### ConstraintTeachersActivityTagMinHoursDaily

- Nom : Enseignants code activité minimum heures quotidiennes (Teachers activity tag min hours daily)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Activity_Tag, Minimum_Hours_Daily, Minimum_Days_With_Tag
- Message a 50 % : Cannot optimize for teachers, because the constraint of type activity tag min hours daily relating to teachers has no 100% weight. Please modify your data accordingly and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les enseignants, pour un code activité, doivent respecter le nombre minimum d'heures quotidiennes

```xml
<ConstraintTeachersActivityTagMinHoursDaily>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Tag>Tag1</Activity_Tag>
<Minimum_Hours_Daily>1</Minimum_Hours_Daily>
<Minimum_Days_With_Tag>1</Minimum_Days_With_Tag>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersActivityTagMinHoursDaily>
```

### ConstraintTeachersAfternoonIntervalMaxDaysPerWeek

- Nom : Après-midi enseignants intervalle limite jours par semaine (Teachers afternoon interval max days per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teachers afternoon interval max days per week with weight (percentage) below 100. Starting with FET version 5.6.2 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants respectent le travail dans un intervalle horaire l'après-midi un nombre maximum de jours par semaine

```xml
<ConstraintTeachersAfternoonIntervalMaxDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Days_Per_Week>4</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersAfternoonIntervalMaxDaysPerWeek>
```

### ConstraintTeachersAfternoonsEarlyMaxBeginningsAtSecondHour

- Nom : Après-midis enseignants au plus tôt limite débuts en seconde heure (Teachers afternoons early max beginnings at second hour)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Beginnings_At_Second_Hour
- Message a 50 % : Cannot optimize for teacher Prof A, because you have an afternoons early max beginnings at second hour constraint with weight percentage less than 100%. Currently, the algorithm can only optimize with not existing constraint early m.b.a.s.h. or existing with 100% weight for it. Please modify your da
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : (pauses et enseignant non disponible non comptabilisés)

```xml
<ConstraintTeachersAfternoonsEarlyMaxBeginningsAtSecondHour>
<Weight_Percentage>100</Weight_Percentage>
<Max_Beginnings_At_Second_Hour>4</Max_Beginnings_At_Second_Hour>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersAfternoonsEarlyMaxBeginningsAtSecondHour>
```

### ConstraintTeachersIntervalMaxDaysPerWeek

- Nom : Enseignants intervalle limite jours par semaine (Teachers interval max days per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teachers interval max days per week with weight (percentage) below 100. Starting with FET version 5.6.2 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next
- Description : Tous les enseignants respectent le travail dans un intervalle horaire un nombre maximum de jours par semaine

```xml
<ConstraintTeachersIntervalMaxDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Days_Per_Week>6</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersIntervalMaxDaysPerWeek>
```

### ConstraintTeachersMaxActivityTagChangesPerDay

- Nom : Enseignants changements balise activité quotidiens max (Teachers max activity tag changes per day)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Activity_Tag_Changes_Per_Day
- Message a 50 % : Cannot optimize, because you have a constraint teachers max activity tag changes per day with weight (percentage) below 100. It is only possible to use 100% weight for such constraints. Please make the weight 100% and try again! \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 
- Description : Tous les enseignants doivent respecter le nombre maximum de changements quotidiens de balise activité

```xml
<ConstraintTeachersMaxActivityTagChangesPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Activity_Tag_Changes_Per_Day>6</Max_Activity_Tag_Changes_Per_Day>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxActivityTagChangesPerDay>
```

### ConstraintTeachersMaxActivityTagChangesPerWeek

- Nom : Enseignants changements balise activité hebdomadaires max (Teachers max activity tag changes per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Activity_Tag_Changes_Per_Week
- Message a 50 % : Cannot optimize, because you have a constraint teachers max activity tag changes per week with weight (percentage) below 100. It is only possible to use 100% weight for such constraints. Please make the weight 100% and try again! \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button:
- Description : Tous les enseignants doivent respecter le nombre maximum de changements hebdomadaires de balise activité

```xml
<ConstraintTeachersMaxActivityTagChangesPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Max_Activity_Tag_Changes_Per_Week>6</Max_Activity_Tag_Changes_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxActivityTagChangesPerWeek>
```

### ConstraintTeachersMaxActivityTagsPerDayFromSet

- Nom : Enseignants limite codes activité par jour depuis le jeu (Teachers max activity tags per day from set)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids < 100 % : abandon du programme)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = abandon du programme, 0 % = abandon du programme, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Number_of_Activity_Tags, Activity_Tag, Maximum_Allowed_Activity_Tags
- Message a 50 % : Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)]
- Description : Tous les enseignants doivent respecter le nombre maximum de codes activité par jour depuis un jeu

```xml
<ConstraintTeachersMaxActivityTagsPerDayFromSet>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activity_Tags>2</Number_of_Activity_Tags>
<Activity_Tag>Tag1</Activity_Tag>
<Activity_Tag>Tag2</Activity_Tag>
<Maximum_Allowed_Activity_Tags>3</Maximum_Allowed_Activity_Tags>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxActivityTagsPerDayFromSet>
```

### ConstraintTeachersMaxActivityTagsPerRealDayFromSet

- Nom : Enseignants limite codes activité par jour réel depuis le jeu (Teachers max activity tags per real day from set)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids < 100 % : abandon du programme)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = abandon du programme, 0 % = abandon du programme, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : Number_of_Activity_Tags, Activity_Tag, Maximum_Allowed_Activity_Tags
- Message a 50 % : Assertion `weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)]
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter le nombre maximum de codes activité par jour réel depuis un jeu

```xml
<ConstraintTeachersMaxActivityTagsPerRealDayFromSet>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Activity_Tags>2</Number_of_Activity_Tags>
<Activity_Tag>Tag1</Activity_Tag>
<Activity_Tag>Tag2</Activity_Tag>
<Maximum_Allowed_Activity_Tags>3</Maximum_Allowed_Activity_Tags>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxActivityTagsPerRealDayFromSet>
```

### ConstraintTeachersMaxAfternoonsPerWeek

- Nom : Enseignants après-midi max par semaine (Teachers max afternoons per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = refusee (lecture), Mornings_Afternoons = acceptee, Block_Planning = refusee (lecture), Terms = refusee (lecture)
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Afternoons_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teachers max afternoons per week with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : Could not read file - XML parse error at line 14, column 304: \| Max_Afternoons_Per_Week is incorrect
- Description : Tous les enseignants doivent respecter le nombre maximum d'après-midis par semaine

```xml
<ConstraintTeachersMaxAfternoonsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Max_Afternoons_Per_Week>4</Max_Afternoons_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxAfternoonsPerWeek>
```

### ConstraintTeachersMaxDaysPerWeek

- Nom : Enseignants jours max par semaine (Teachers max days per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teachers max days per week with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les enseignants doivent respecter le nombre maximum de jours par semaine

```xml
<ConstraintTeachersMaxDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Max_Days_Per_Week>6</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxDaysPerWeek>
```

### ConstraintTeachersMaxGapsPerDay

- Nom : Enseignants vides max par jour (Teachers max gaps per day)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Gaps
- Message a 50 % : Cannot optimize, because you have constraint teachers max gaps per day with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les enseignants doivent respecter le maximum de vides quotidiens

```xml
<ConstraintTeachersMaxGapsPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Gaps>3</Max_Gaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxGapsPerDay>
```

### ConstraintTeachersMaxGapsPerMorningAndAfternoon

- Nom : Enseignants limite vides par matin et après-midi (Teachers max gaps per morning and afternoon)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Gaps
- Message a 50 % : Cannot optimize, because you have constraint teachers max gaps per morning and afternoon with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter le nombre maximum de vides par matin et après-midi

```xml
<ConstraintTeachersMaxGapsPerMorningAndAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Max_Gaps>3</Max_Gaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxGapsPerMorningAndAfternoon>
```

### ConstraintTeachersMaxGapsPerRealDay

- Nom : Enseignants limite vides par jour réel (Teachers max gaps per real day)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Gaps, Allow_One_Day_Exception_of_Plus_One
- Message a 50 % : Cannot optimize, because you have constraint teachers max gaps per real day with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter le nombre maximum de vides par jour réel

```xml
<ConstraintTeachersMaxGapsPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Gaps>3</Max_Gaps>
<Allow_One_Day_Exception_of_Plus_One>true</Allow_One_Day_Exception_of_Plus_One>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxGapsPerRealDay>
```

### ConstraintTeachersMaxGapsPerWeek

- Nom : Enseignants vides max par semaine (Teachers max gaps per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Gaps
- Message a 50 % : Cannot optimize, because you have constraint teachers max gaps per week with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les enseignants doivent respecter le nombre maximum de vides par semaine

```xml
<ConstraintTeachersMaxGapsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Max_Gaps>3</Max_Gaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxGapsPerWeek>
```

### ConstraintTeachersMaxGapsPerWeekForRealDays

- Nom : Enseignants limite vides par semaine pour jours réels (Teachers max gaps per week for real days)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Gaps
- Message a 50 % : Cannot optimize, because you have constraint teachers max gaps per week for real days with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter le nombre maximum de vides par semaine pour jours réels

```xml
<ConstraintTeachersMaxGapsPerWeekForRealDays>
<Weight_Percentage>100</Weight_Percentage>
<Max_Gaps>3</Max_Gaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxGapsPerWeekForRealDays>
```

### ConstraintTeachersMaxHoursContinuously

- Nom : Enseignants heures continues max (Teachers max hours continuously)
- Famille / categorie : temps / Enseignants
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Maximum_Hours_Continuously
- Description : Tous les enseignants doivent respecter le nombre maximum d'heures continues

```xml
<ConstraintTeachersMaxHoursContinuously>
<Weight_Percentage>100</Weight_Percentage>
<Maximum_Hours_Continuously>6</Maximum_Hours_Continuously>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxHoursContinuously>
```

### ConstraintTeachersMaxHoursDaily

- Nom : Enseignants heures quotidiennes max (Teachers max hours daily)
- Famille / categorie : temps / Enseignants
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Maximum_Hours_Daily
- Description : Tous les enseignants doivent respecter le nombre maximum d'heures quotidiennes

```xml
<ConstraintTeachersMaxHoursDaily>
<Weight_Percentage>100</Weight_Percentage>
<Maximum_Hours_Daily>6</Maximum_Hours_Daily>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxHoursDaily>
```

### ConstraintTeachersMaxHoursDailyInInterval

- Nom : Enseignants limite heures quotidiennes dans intervalle (Teachers max hours daily in interval)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Maximum_Hours_Daily
- Message a 50 % : Cannot optimize, because there is a time constraint teachers max hours daily in hourly interval with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les enseignants doivent respecter le nombre maximum d'heures quotidiennes dans un intervalle horaire

```xml
<ConstraintTeachersMaxHoursDailyInInterval>
<Weight_Percentage>100</Weight_Percentage>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Maximum_Hours_Daily>6</Maximum_Hours_Daily>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxHoursDailyInInterval>
```

### ConstraintTeachersMaxHoursDailyRealDays

- Nom : Enseignants limite heures quotidiennes pour jours réels (Teachers max hours daily real days)
- Famille / categorie : temps / Enseignants
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : Maximum_Hours_Daily
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter le nombre maximum d'heures quotidiennes par jour réel

```xml
<ConstraintTeachersMaxHoursDailyRealDays>
<Weight_Percentage>100</Weight_Percentage>
<Maximum_Hours_Daily>4</Maximum_Hours_Daily>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxHoursDailyRealDays>
```

### ConstraintTeachersMaxHoursPerAllAfternoons

- Nom : Enseignants limite heures pour tous les après-midis (Teachers max hours per all afternoons)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Maximum_Hours_Per_All_Afternoons
- Message a 50 % : Cannot optimize, because you have constraint teachers max hours per all afternoons with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter le nombre maximum d'heures pour tous les après-midis

```xml
<ConstraintTeachersMaxHoursPerAllAfternoons>
<Weight_Percentage>100</Weight_Percentage>
<Maximum_Hours_Per_All_Afternoons>32</Maximum_Hours_Per_All_Afternoons>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxHoursPerAllAfternoons>
```

### ConstraintTeachersMaxHoursPerTerm

- Nom : Enseignants limite heures par période (Teachers max hours per term)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = incompatible avec le mode, Block_Planning = incompatible avec le mode, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Hours_Per_Term
- Message a 50 % : Cannot optimize, because you have a constraint teachers max hours per term with weight (percentage) below 100%. It is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter le nombre maximum d'heures par période

```xml
<ConstraintTeachersMaxHoursPerTerm>
<Weight_Percentage>100</Weight_Percentage>
<Max_Hours_Per_Term>10</Max_Hours_Per_Term>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxHoursPerTerm>
```

### ConstraintTeachersMaxMorningsPerWeek

- Nom : Enseignants matinées max par semaine (Teachers max mornings per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = refusee (lecture), Mornings_Afternoons = acceptee, Block_Planning = refusee (lecture), Terms = refusee (lecture)
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Mornings_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teachers max mornings per week with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : Could not read file - XML parse error at line 14, column 298: \| Max_Mornings_Per_Week is incorrect
- Description : Tous les enseignants doivent respecter le nombre maximum de matinées par semaine

```xml
<ConstraintTeachersMaxMorningsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Max_Mornings_Per_Week>4</Max_Mornings_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxMorningsPerWeek>
```

### ConstraintTeachersMaxRealDaysPerWeek

- Nom : Enseignants limite jours réels par semaine (Teachers max real days per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = refusee (lecture), Mornings_Afternoons = acceptee, Block_Planning = refusee (lecture), Terms = refusee (lecture)
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teachers max real days per week with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : Could not read file - XML parse error at line 14, column 290: \| Max_Days_Per_Week is incorrect
- Description : Tous les enseignants doivent respecter le nombre maximum de jours réels par semaine

```xml
<ConstraintTeachersMaxRealDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Max_Days_Per_Week>4</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxRealDaysPerWeek>
```

### ConstraintTeachersMaxSingleGapsInSelectedTimeSlots

- Nom : Enseignants limide vide unique dans les créneaux horaires sélectionnés (Teachers max single gaps in selected time slots)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Single_Gaps, Number_of_Selected_Time_Slots, Selected_Time_Slot
- Message a 50 % : Cannot optimize for teachers, because the constraint of type max single gaps in selected time slots relating to teachers has no 100% weight. Please modify your data accordingly and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les enseignants doivent respecter un nombre maximal de vides uniques dans les créneaux horaires sélectionnés

```xml
<ConstraintTeachersMaxSingleGapsInSelectedTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Max_Single_Gaps>3</Max_Single_Gaps>
<Number_of_Selected_Time_Slots>3</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxSingleGapsInSelectedTimeSlots>
```

### ConstraintTeachersMaxSpanPerDay

- Nom : Enseignants amplitude max par jour (Teachers max span per day)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Span, Allow_One_Day_Exception_of_Plus_One
- Message a 50 % : Cannot optimize, because you have constraint teachers max span per day with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les enseignants doivent respecter le nombre maximum d'amplitude (en heures) quotidienne

```xml
<ConstraintTeachersMaxSpanPerDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Span>6</Max_Span>
<Allow_One_Day_Exception_of_Plus_One>true</Allow_One_Day_Exception_of_Plus_One>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxSpanPerDay>
```

### ConstraintTeachersMaxSpanPerRealDay

- Nom : Enseignants limite amplitude par jour réel (Teachers max span per real day)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Span, Allow_One_Day_Exception_of_Plus_One
- Message a 50 % : Cannot optimize, because you have constraint teachers max span per real day with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter le nombre maximum d'amplitude (en heures) par jour réel

```xml
<ConstraintTeachersMaxSpanPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Max_Span>4</Max_Span>
<Allow_One_Day_Exception_of_Plus_One>true</Allow_One_Day_Exception_of_Plus_One>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxSpanPerRealDay>
```

### ConstraintTeachersMaxThreeConsecutiveDays

- Nom : Enseignants trois jours consécutifs max (Teachers max three consecutive days)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Allow_Afternoon_Morning_Afternoon_Morning_Exception
- Message a 50 % : Cannot optimize, because you have constraint teachers max three consecutive days with weight (percentage) below 100%. It is only possible to use 100% weight for such constraints. Please make weight 100% and try again. \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter un maximum de trois jours de travail consécutifs

```xml
<ConstraintTeachersMaxThreeConsecutiveDays>
<Weight_Percentage>100</Weight_Percentage>
<Allow_Afternoon_Morning_Afternoon_Morning_Exception>true</Allow_Afternoon_Morning_Afternoon_Morning_Exception>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxThreeConsecutiveDays>
```

### ConstraintTeachersMaxTwoConsecutiveAfternoons

- Nom : Enseignants deux après-midi consécutifs max (Teachers max two consecutive afternoons)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : (aucun)
- Message a 50 % : Cannot optimize, because you have constraint teachers max two consecutive afternoons with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter deux après-midis consécutifs au maximum

```xml
<ConstraintTeachersMaxTwoConsecutiveAfternoons>
<Weight_Percentage>100</Weight_Percentage>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxTwoConsecutiveAfternoons>
```

### ConstraintTeachersMaxTwoConsecutiveMornings

- Nom : Enseignants deux matinées consécutives max (Teachers max two consecutive mornings)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : (aucun)
- Message a 50 % : Cannot optimize, because you have constraint teachers max two consecutive mornings with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter deux matinées consécutives au maximum

```xml
<ConstraintTeachersMaxTwoConsecutiveMornings>
<Weight_Percentage>100</Weight_Percentage>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxTwoConsecutiveMornings>
```

### ConstraintTeachersMaxZeroGapsPerAfternoon

- Nom : Enseignants limite zéro vide par après-midi (Teachers max zero gaps per afternoon)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids < 100 % : abandon du programme)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = abandon du programme, 0 % = abandon du programme, 101 % = abandon du programme ; Active=false = acceptee
- Parametres : (aucun)
- Message a 50 % : Assertion `tg->weightPercentage==100' failed. [code -6 (tue par le signal SIGABRT)]
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter le nombre de zéro vide par après-midi

```xml
<ConstraintTeachersMaxZeroGapsPerAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMaxZeroGapsPerAfternoon>
```

### ConstraintTeachersMinAfternoonsPerWeek

- Nom : Enseignants après-midi min par semaine (Teachers min afternoons per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Afternoons_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teachers min afternoons per week with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter le nombre minimum d'après-midis par semaine

```xml
<ConstraintTeachersMinAfternoonsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Afternoons_Per_Week>1</Minimum_Afternoons_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMinAfternoonsPerWeek>
```

### ConstraintTeachersMinDaysPerWeek

- Nom : Enseignants jours min par semaine (Teachers min days per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teachers min days per week with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les enseignants doivent respecter le nombre minimum de jours par semaine

```xml
<ConstraintTeachersMinDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Days_Per_Week>1</Minimum_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMinDaysPerWeek>
```

### ConstraintTeachersMinGapsBetweenActivityTag

- Nom : Enseignants vides minimum entre code activité (Teachers min gaps between activity tag)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'teachers min gaps between activity tag' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les enseignants doivent respecter les vides minimum entre un code activité

```xml
<ConstraintTeachersMinGapsBetweenActivityTag>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Tag>Tag1</Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMinGapsBetweenActivityTag>
```

### ConstraintTeachersMinGapsBetweenActivityTagBetweenMorningAndAfternoon

- Nom : Vides minimum entre code activité entre matinée et après-midi pour enseignants (Teachers min gaps between activity tag between morning and afternoon)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'teachers min gaps between activity tag between morning and afternoon' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter les vides minimum entre un code activité entre matinée et après-midi

```xml
<ConstraintTeachersMinGapsBetweenActivityTagBetweenMorningAndAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Tag>Tag1</Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMinGapsBetweenActivityTagBetweenMorningAndAfternoon>
```

### ConstraintTeachersMinGapsBetweenActivityTagPerRealDay

- Nom : Vides minimum entre code activité par jour réel pour enseignants (Teachers min gaps between activity tag per real day)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'teachers min gaps between activity tag per real day' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter les vides minimum entre un code activité par jour réel

```xml
<ConstraintTeachersMinGapsBetweenActivityTagPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<Activity_Tag>Tag1</Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMinGapsBetweenActivityTagPerRealDay>
```

### ConstraintTeachersMinGapsBetweenOrderedPairOfActivityTags

- Nom : Vides minimum entre couple ordonné de codes activité pour enseignants (Teachers min gaps between ordered pair of activity tags)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : First_Activity_Tag, Second_Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'teachers min gaps between ordered pair of activity tags' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les enseignants doivent respecter les vides minimum entre un couple ordonné de codes activité

```xml
<ConstraintTeachersMinGapsBetweenOrderedPairOfActivityTags>
<Weight_Percentage>100</Weight_Percentage>
<First_Activity_Tag>Tag1</First_Activity_Tag>
<Second_Activity_Tag>Tag2</Second_Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMinGapsBetweenOrderedPairOfActivityTags>
```

### ConstraintTeachersMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon

- Nom : Enseignants vides minimum entre paire ordonnée de codes activité entre matinée et après-midi (Teachers min gaps between ordered pair of activity tags between morning and afternoon)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : First_Activity_Tag, Second_Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'teachers min gaps between ordered pair of activity tags between morning and afternoon' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter les vides minimum entre une paire ordonnée de codes activité entre matinée et après-midi

```xml
<ConstraintTeachersMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<First_Activity_Tag>Tag1</First_Activity_Tag>
<Second_Activity_Tag>Tag2</Second_Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMinGapsBetweenOrderedPairOfActivityTagsBetweenMorningAndAfternoon>
```

### ConstraintTeachersMinGapsBetweenOrderedPairOfActivityTagsPerRealDay

- Nom : Vides minimum entre couple ordonné de codes activité par jour réel pour enseignants (Teachers min gaps between ordered pair of activity tags per real day)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : First_Activity_Tag, Second_Activity_Tag, MinGaps
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'teachers min gaps between ordered pair of activity tags per real day' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les ensignants doivent respecter les vides minimum entre un couple ordonné de codes activité par jour réel

```xml
<ConstraintTeachersMinGapsBetweenOrderedPairOfActivityTagsPerRealDay>
<Weight_Percentage>100</Weight_Percentage>
<First_Activity_Tag>Tag1</First_Activity_Tag>
<Second_Activity_Tag>Tag2</Second_Activity_Tag>
<MinGaps>1</MinGaps>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMinGapsBetweenOrderedPairOfActivityTagsPerRealDay>
```

### ConstraintTeachersMinHoursDaily

- Nom : Enseignants heures quotidiennes min (Teachers min hours daily)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Hours_Daily, Allow_Empty_Days, Allow_Empty_Days
- Message a 50 % : Cannot optimize, because you have constraint teachers min hours daily with weight (percentage) below 100. Starting with FET version 5.4.0 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default 
- Description : Tous les enseignants doivent respecter le nombre minimum d'heures quotidiennes

```xml
<ConstraintTeachersMinHoursDaily>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Hours_Daily>2</Minimum_Hours_Daily>
<Allow_Empty_Days>true</Allow_Empty_Days>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMinHoursDaily>
```

### ConstraintTeachersMinHoursDailyRealDays

- Nom : Enseignants minimum heures quotidiennes pour jours réels (Teachers min hours daily for real days)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Hours_Daily, Allow_Empty_Days, Allow_Empty_Days
- Message a 50 % : Cannot optimize, because you have constraint teachers min hours daily for real days with weight (percentage) below 100. Starting with FET version 5.4.0 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See n
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter le nombre minimum d'heures quotidiennes pour jours réels

```xml
<ConstraintTeachersMinHoursDailyRealDays>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Hours_Daily>2</Minimum_Hours_Daily>
<Allow_Empty_Days>true</Allow_Empty_Days>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMinHoursDailyRealDays>
```

### ConstraintTeachersMinHoursPerAfternoon

- Nom : Enseignants heures min par après-midi (Teachers min hours per afternoon)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Hours_Per_Afternoon, Allow_Empty_Afternoons, Allow_Empty_Afternoons
- Prerequis : exige aussi une contrainte 'min heures par jour' pour le meme enseignant / les memes eleves
- Message a 50 % : Cannot optimize, because you have constraint teachers min hours per afternoon with weight (percentage) below 100. Starting with FET version 5.4.0 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| 
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter le nombre minimum d'heures par après-midi

```xml
<ConstraintTeachersMinHoursPerAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Hours_Per_Afternoon>1</Minimum_Hours_Per_Afternoon>
<Allow_Empty_Afternoons>true</Allow_Empty_Afternoons>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMinHoursPerAfternoon>
```

### ConstraintTeachersMinHoursPerMorning

- Nom : Enseignants heures min par matinée (Teachers min hours per morning)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Hours_Per_Morning, Allow_Empty_Mornings, Allow_Empty_Mornings
- Prerequis : exige aussi une contrainte 'min heures par jour' pour le meme enseignant / les memes eleves
- Message a 50 % : Cannot optimize, because you have constraint teachers min hours per morning with weight (percentage) below 100. Starting with FET version 5.4.0 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| De
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter le nombre minimum d'heures par matinée

```xml
<ConstraintTeachersMinHoursPerMorning>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Hours_Per_Morning>1</Minimum_Hours_Per_Morning>
<Allow_Empty_Mornings>true</Allow_Empty_Mornings>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMinHoursPerMorning>
```

### ConstraintTeachersMinMorningsPerWeek

- Nom : Enseignants matinées min par semaine (Teachers min mornings per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Mornings_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teachers min mornings per week with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter le nombre minimum de matinées par semaine

```xml
<ConstraintTeachersMinMorningsPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Mornings_Per_Week>1</Minimum_Mornings_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMinMorningsPerWeek>
```

### ConstraintTeachersMinRealDaysPerWeek

- Nom : Enseignants jours réels minimum par semaine (Teachers min real days per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teachers min real days per week with weight (percentage) below 100. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter le nombre minimum de jours réels par semaine

```xml
<ConstraintTeachersMinRealDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Days_Per_Week>1</Minimum_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMinRealDaysPerWeek>
```

### ConstraintTeachersMinRestingHours

- Nom : Enseignants heures de repos min (Teachers min resting hours)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = incompatible avec le mode, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Resting_Hours, Circular
- Message a 50 % : Cannot optimize, because you have constraint teachers min resting hours with weight (percentage) below 100. It is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Mornings_Afternoons : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter le minimum d'heures de repos (entre les jours)

```xml
<ConstraintTeachersMinRestingHours>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Resting_Hours>1</Minimum_Resting_Hours>
<Circular>false</Circular>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMinRestingHours>
```

### ConstraintTeachersMinRestingHoursBetweenMorningAndAfternoon

- Nom : Enseignants heures minimum de repos entre matinée et après-midi (Teachers min resting hours between morning and afternoon)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Minimum_Resting_Hours
- Message a 50 % : Cannot optimize, because you have constraint teachers min resting hours between morning and afternoon with weight (percentage) below 100. It is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default 
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants doivent respecter le minimum d'heures de repos (entre matinée et après-midi)

```xml
<ConstraintTeachersMinRestingHoursBetweenMorningAndAfternoon>
<Weight_Percentage>100</Weight_Percentage>
<Minimum_Resting_Hours>1</Minimum_Resting_Hours>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMinRestingHoursBetweenMorningAndAfternoon>
```

### ConstraintTeachersMorningIntervalMaxDaysPerWeek

- Nom : Matinée enseignants intervalle limite jours par semaine (Teachers morning interval max days per week)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Interval_Start_Hour, Interval_End_Hour, Interval_End_Hour, Max_Days_Per_Week
- Message a 50 % : Cannot optimize, because you have constraint teachers morning interval max days per week with weight (percentage) below 100. Starting with FET version 5.6.2 it is only possible to use 100% weight for such constraints. Please make weight 100% and try again \| Button 0 text: Skip rest \| Button 1 text: 
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Tous les enseignants respectent le travail dans un intervalle horaire le matin un nombre maximum de jours par semaine

```xml
<ConstraintTeachersMorningIntervalMaxDaysPerWeek>
<Weight_Percentage>100</Weight_Percentage>
<Interval_Start_Hour>H1</Interval_Start_Hour>
<Interval_End_Hour>H4</Interval_End_Hour>
<Max_Days_Per_Week>4</Max_Days_Per_Week>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMorningIntervalMaxDaysPerWeek>
```

### ConstraintTeachersMorningsEarlyMaxBeginningsAtSecondHour

- Nom : Enseignants matins au plus tôt limite débuts en seconde heure (Teachers mornings early max beginnings at second hour)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = acceptee, Block_Planning = incompatible avec le mode, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Max_Beginnings_At_Second_Hour
- Message a 50 % : Cannot optimize for teacher Prof A, because you have an mornings early max beginnings at second hour constraint with weight percentage less than 100%. Currently, the algorithm can only optimize with not existing constraint early m.b.a.s.h. or existing with 100% weight for it. Please modify your data
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : (pauses et enseignant non disponible non comptabilisés)

```xml
<ConstraintTeachersMorningsEarlyMaxBeginningsAtSecondHour>
<Weight_Percentage>100</Weight_Percentage>
<Max_Beginnings_At_Second_Hour>4</Max_Beginnings_At_Second_Hour>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersMorningsEarlyMaxBeginningsAtSecondHour>
```

### ConstraintTeachersNoTwoConsecutiveDays

- Nom : Enseignants sans deux jours consécutifs (Teachers no two consecutive days)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : (aucun)
- Message a 50 % : Cannot optimize, because you have constraint teachers no two consecutive days with weight (percentage) below 100%. It is only possible to use 100% weight for such constraints. Please make weight 100% and try again. \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les enseignants ne doivent pas travailler deux jours consécutifs

```xml
<ConstraintTeachersNoTwoConsecutiveDays>
<Weight_Percentage>100</Weight_Percentage>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersNoTwoConsecutiveDays>
```

### ConstraintTeachersOccupyMaxSetsOfTimeSlotsFromSelection

- Nom : Enseignants occupent limite jeux de créneaux horaires depuis la sélection (Teachers occupy max sets of time slots from selection)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Maximum_Number_of_Occupied_Sets, Number_of_Selected_Sets_of_Time_Slots, Selected_Set_of_Time_Slots
- Message a 50 % : Cannot optimize, because there is a time constraint teachers occupy max sets of time slots from selection with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les enseignants occupent un nombre maximum de jeux de créneaux horaires depuis une sélection

```xml
<ConstraintTeachersOccupyMaxSetsOfTimeSlotsFromSelection>
<Weight_Percentage>100</Weight_Percentage>
<Maximum_Number_of_Occupied_Sets>2</Maximum_Number_of_Occupied_Sets>
<Number_of_Selected_Sets_of_Time_Slots>2</Number_of_Selected_Sets_of_Time_Slots>
<Selected_Set_of_Time_Slots>
<Number_of_Selected_Time_Slots>2</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
</Selected_Set_of_Time_Slots>
<Selected_Set_of_Time_Slots>
<Number_of_Selected_Time_Slots>2</Number_of_Selected_Time_Slots>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot>
<Selected_Time_Slot>
<Day>Mardi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot>
</Selected_Set_of_Time_Slots>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersOccupyMaxSetsOfTimeSlotsFromSelection>
```

### ConstraintTeachersPairOfMutuallyExclusiveSetsOfTimeSlots

- Nom : Enseignants paire de jeux de créneaux horaires mutuellement exclusifs (Teachers pair of mutually exclusive sets of time slots)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : Number_of_Selected_Time_Slots_in_First_Set, Selected_Time_Slot_in_First_Set, Number_of_Selected_Time_Slots_in_Second_Set, Selected_Time_Slot_in_Second_Set
- Message a 50 % : Cannot optimize, because there is a time constraint teachers pair of mutually exclusive sets of time slots with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les enseignants ont une paire de jeux de créneaux horaires mutuellement exclusifs

```xml
<ConstraintTeachersPairOfMutuallyExclusiveSetsOfTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<Number_of_Selected_Time_Slots_in_First_Set>1</Number_of_Selected_Time_Slots_in_First_Set>
<Selected_Time_Slot_in_First_Set>
<Day>Lundi</Day>
<Hour>H1</Hour>
</Selected_Time_Slot_in_First_Set>
<Number_of_Selected_Time_Slots_in_Second_Set>1</Number_of_Selected_Time_Slots_in_Second_Set>
<Selected_Time_Slot_in_Second_Set>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Selected_Time_Slot_in_Second_Set>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersPairOfMutuallyExclusiveSetsOfTimeSlots>
```

### ConstraintTeachersPairOfMutuallyExclusiveTimeSlots

- Nom : Enseignants paire de créneaux horaires mutuellement exclusifs (Teachers pair of mutually exclusive time slots)
- Famille / categorie : temps / Enseignants
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : First_Time_Slot, Second_Time_Slot
- Message a 50 % : Cannot optimize, because there is a time constraint teachers pair of mutually exclusive time slots with weight under 100%. Please correct and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Description : Tous les enseignants ont une paire de créneaux horaires mutuellement exclusifs

```xml
<ConstraintTeachersPairOfMutuallyExclusiveTimeSlots>
<Weight_Percentage>100</Weight_Percentage>
<First_Time_Slot>
<Day>Lundi</Day>
<Hour>H1</Hour>
</First_Time_Slot>
<Second_Time_Slot>
<Day>Lundi</Day>
<Hour>H2</Hour>
</Second_Time_Slot>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTeachersPairOfMutuallyExclusiveTimeSlots>
```

### ConstraintThreeActivitiesGrouped

- Nom : Trois activités groupées (Three activities grouped)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : First_Activity_Id, Second_Activity_Id, Third_Activity_Id
- Description : Three activities grouped (the activities must be placed on the same day, 

```xml
<ConstraintThreeActivitiesGrouped>
<Weight_Percentage>100</Weight_Percentage>
<First_Activity_Id>4</First_Activity_Id>
<Second_Activity_Id>5</Second_Activity_Id>
<Third_Activity_Id>6</Third_Activity_Id>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintThreeActivitiesGrouped>
```

### ConstraintTwoActivitiesConsecutive

- Nom : Deux activités consécutives (Two activities consecutive)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : First_Activity_Id, Second_Activity_Id
- Description : Two activities consecutive (second activity must be placed immediately after the first

```xml
<ConstraintTwoActivitiesConsecutive>
<Weight_Percentage>100</Weight_Percentage>
<First_Activity_Id>4</First_Activity_Id>
<Second_Activity_Id>5</Second_Activity_Id>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTwoActivitiesConsecutive>
```

### ConstraintTwoActivitiesGrouped

- Nom : Deux activités groupées (Two activities grouped)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : First_Activity_Id, Second_Activity_Id
- Description : Two activities grouped (the activities must be placed on the same day, 

```xml
<ConstraintTwoActivitiesGrouped>
<Weight_Percentage>100</Weight_Percentage>
<First_Activity_Id>4</First_Activity_Id>
<Second_Activity_Id>5</Second_Activity_Id>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTwoActivitiesGrouped>
```

### ConstraintTwoActivitiesOrdered

- Nom : Deux activités ordonnées (Two activities ordered)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : First_Activity_Id, Second_Activity_Id
- Description : Two activities ordered (the second activity must begin at any time in the week later than the first

```xml
<ConstraintTwoActivitiesOrdered>
<Weight_Percentage>100</Weight_Percentage>
<First_Activity_Id>4</First_Activity_Id>
<Second_Activity_Id>5</Second_Activity_Id>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTwoActivitiesOrdered>
```

### ConstraintTwoActivitiesOrderedIfSameDay

- Nom : Deux activités ordonnées si même jour (Two activities ordered if same day)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : First_Activity_Id, Second_Activity_Id
- Description : Two activities are ordered if they are on the same day (the second activity must begin later than the first

```xml
<ConstraintTwoActivitiesOrderedIfSameDay>
<Weight_Percentage>100</Weight_Percentage>
<First_Activity_Id>4</First_Activity_Id>
<Second_Activity_Id>5</Second_Activity_Id>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTwoActivitiesOrderedIfSameDay>
```

### ConstraintTwoSetsOfActivitiesOrdered

- Nom : Deux jeux d'activités ordonnés (Two sets of activities ordered)
- Famille / categorie : temps / Activites
- Classification : **facultative possible (poids < 100 % accepte)**
- Modes : Official = acceptee, Mornings_Afternoons = acceptee, Block_Planning = acceptee, Terms = acceptee
- Poids : 50 % = acceptee, 0 % = acceptee, 101 % = acceptee ; Active=false = acceptee
- Parametres : First_Activities_Ids_Set, Second_Activities_Ids_Set
- Description : Two sets of activities ordered (each activity from the second set must begin at any time in the week later than each activity

```xml
<ConstraintTwoSetsOfActivitiesOrdered>
<Weight_Percentage>100</Weight_Percentage>
<First_Activities_Ids_Set>
<Number_of_Activities>1</Number_of_Activities>
<Activity_Id>4</Activity_Id>
</First_Activities_Ids_Set>
<Second_Activities_Ids_Set>
<Number_of_Activities>1</Number_of_Activities>
<Activity_Id>5</Activity_Id>
</Second_Activities_Ids_Set>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTwoSetsOfActivitiesOrdered>
```

### ConstraintTwoSetsOfActivitiesSameSections

- Nom : Deux jeux d'activités ont les mêmes sections (Two sets of activities have the same sections)
- Famille / categorie : temps / Activites
- Classification : **toujours bloquante (poids 100 % obligatoire)**
- Modes : Official = incompatible avec le mode, Mornings_Afternoons = incompatible avec le mode, Block_Planning = acceptee, Terms = incompatible avec le mode
- Poids : 50 % = refusee (precalcul), 0 % = refusee (precalcul), 101 % = refusee (precalcul) ; Active=false = acceptee
- Parametres : First_Activities_Ids_Set, Second_Activities_Ids_Set, Number_of_Exception_Time_Slots, Exception_Time_Slot
- Prerequis : mode Block_Planning ; les activites des deux ensembles doivent avoir respectivement les memes eleves et la meme duree
- Message a 50 % : Cannot optimize, because you have constraint(s) of type 'two sets of activities have the same sections' with weight (percentage) below 100.0%. Please make the weight 100.0% and try again \| Button 0 text: Skip rest \| Button 1 text: See next \| Default button: 1
- Refus en mode Official : You have constraints which are incompatible with the current mode. Please remove them from the all time/space constraint dialogs or change the mode. If this is a FET bug, please report it. These const
- Description : Deux jeux d'activités ont les mêmes sections

```xml
<ConstraintTwoSetsOfActivitiesSameSections>
<Weight_Percentage>100</Weight_Percentage>
<First_Activities_Ids_Set>
<Number_of_Activities>1</Number_of_Activities>
<Activity_Id>5</Activity_Id>
</First_Activities_Ids_Set>
<Second_Activities_Ids_Set>
<Number_of_Activities>1</Number_of_Activities>
<Activity_Id>6</Activity_Id>
</Second_Activities_Ids_Set>
<Number_of_Exception_Time_Slots>1</Number_of_Exception_Time_Slots>
<Exception_Time_Slot>
<Day>Samedi</Day>
<Hour>H1</Hour>
</Exception_Time_Slot>
<Active>true</Active>
<Comments>sonde</Comments>
</ConstraintTwoSetsOfActivitiesSameSections>
```

