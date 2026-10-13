# Rapport de tests détaillé — fet-cl 7.11.1 sous Linux

| | |
|---|---|
| Objet | Campagne approfondie de tests de `fet-cl` 7.11.1 : interfaçage, capacités, robustesse, charge, intégration Linux, sorties, combinaisons de contraintes |
| Date | 7 octobre 2026 |
| Outil | `fet-cl-validator` 3.0.0 (Linux uniquement), 529 tests en 16 catégories |
| Binaire testé | fet-cl 7.11.1 compilé depuis les [sources officielles](https://lalescu.ro/liviu/fet/download/fet-7.11.1.tar.xz), Qt 6.10.0 |
| Verdict | **CONFORME — 515 réussis, 14 avertissements, 0 échec, 0 erreur, 0 ignoré** |
| Documents liés | `fet-cl-7.11.1-documentation-developpeur.md` (capacités et limites, mise à jour avec ces résultats), `fet-cl-7.11.1-interfacage.md`, rapport automatique complet `validateur/exemples-rapports/rapport-detaille-20261007-085958.md` (détail de chaque test et de ses commandes), rapport HTML / JSON / JUnit de la campagne |

Sources de référence : [site de FET](https://lalescu.ro/liviu/fet/), [dépôt GitHub de FET](https://github.com/fet-project/fet), [page de manuel fet-cl (Ubuntu)](https://manpages.ubuntu.com/manpages/jammy/man1/fet-cl.1.html), [fichiers de diffusion SourceForge](https://sourceforge.net/projects/fet-timetabling/files/fet-timetabling/).

---

## 1. Synthèse

- **Aucun comportement contraire au contrat d'interfaçage.** Sur plus de 5 000 exécutions de fet-cl, aucun succès annoncé ne viole une contrainte à 100 %, aucune erreur de segmentation, aucun blocage au-delà de la limite de temps.
- **Les 446 tests de la campagne précédente (catégories 1 à 11) donnent exactement les mêmes statuts** ; le catalogue des 352 contraintes et des 521 options booléennes est identique.
- **83 nouveaux tests (catégories 12 à 16)** : 76 réussis, 7 avertissements. Ils révèlent des points à traiter par l'application appelante :
  1. fet-cl accepte sans message des **noms de jours ou d'heures vides ou en double** et un **Id d'activité 0**, ce qui rend les sorties ambiguës ;
  2. le fuzzing (1 000 fichiers) trouve **deux nouvelles signatures d'abandon** : salle rattachée à un bâtiment disparu, poids géant sur une contrainte exigeant 100 % ;
  3. **`Generation successful` est écrit avant les fichiers de sortie** : un processus tué ensuite (disque plein simulé, code -25) laisse un `result.txt` trompeur ;
  4. deux exécutions simultanées dans le même `--outputdir` partagent `logs/` et peuvent même écrire dans le **même dossier de résultat** ;
  5. la **mémoire** dépend fortement de la grille (965 Mio pour 200 jours × 50 heures et 4 000 activités) et la **durée** croît environ comme le carré du nombre d'activités ;
  6. la **limite de temps** est en temps réel, à une seconde près (une limite de 1 s peut s'arrêter dès 0,1 s).

## 2. Environnement et méthode

| Élément | Valeur |
|---|---|
| Système | Linux 6.1.155 x86_64, 2 cœurs, glibc 2.43 |
| Python | 3.14.3 (bibliothèque standard seule) |
| Bibliothèques Qt | Qt 6.10.0 via `LD_LIBRARY_PATH` (RPATH également présent) |
| Locale | `LC_ALL=C.UTF-8` (variantes `C` et `fr_FR.UTF-8` testées en SYS-02/03) |
| Commande | `python3 fet_validator.py --cli --fet-cl …/fet-cl --workers 2 --user-fet MHS_July2.fet` |
| Durée | 8 min 44 s |

Principes :

- chaque test crée ses propres données (petit établissement de référence, instances moyenne et difficile, établissements synthétiques jusqu'à 1 280 classes) et lance fet-cl dans un dossier isolé ;
- les graines aléatoires sont fixées partout où le résultat doit être reproductible ;
- chaque succès est **revérifié indépendamment** : chevauchements enseignants / sous-groupes / salles, créneaux, et respect de chaque contrainte posée. La vérification se fait contre `*_data_and_timetable.fet`, c'est-à-dire les données telles que fet-cl les a comprises, pour ne pas confondre une valeur par défaut appliquée par fet-cl avec une erreur ;
- pour chaque exécution sont relevés le code de sortie, la durée, le temps CPU et la mémoire maximale (`os.wait4`) ;
- statuts : PASS conforme ; WARN comportement à connaître (abandon au lieu d'un refus propre, donnée invalide acceptée en silence) ; FAIL contrat violé.

## 3. Résultats par catégorie

| Catégorie | Tests | PASS | WARN | FAIL | Durée cumulée |
|---|---:|---:|---:|---:|---:|
| 1. Environnement | 5 | 5 | 0 | 0 | < 1 s |
| 2. Arguments et codes de retour | 14 | 13 | 1 | 0 | 1 s |
| 3. Lecture des données | 6 | 6 | 0 | 0 | < 1 s |
| 4. Génération et sorties | 12 | 11 | 1 | 0 | 19 s |
| 5. Contrôle du processus | 7 | 7 | 0 | 0 | 20 s |
| 6. Capacités et modes | 15 | 12 | 3 | 0 | 11 s |
| 7. Poids : bloquant / facultatif | 6 | 5 | 1 | 0 | 2 s |
| 8. Respect des contraintes | 23 | 23 | 0 | 0 | 1 s |
| 9. Options de ligne de commande | 6 | 5 | 1 | 0 | 16 s |
| 10. Contraintes de temps | 271 | 271 | 0 | 0 | 1 min 53 s |
| 11. Contraintes d'espace | 81 | 81 | 0 | 0 | 41 s |
| 12. Robustesse des données | 45 | 40 | 5 | 0 | 54 s |
| 13. Charge et performances | 9 | 9 | 0 | 0 | 3 min 40 s |
| 14. Intégration système Linux | 15 | 13 | 2 | 0 | 26 s |
| 15. Validation des sorties | 9 | 9 | 0 | 0 | 4 s |
| 16. Combinaisons de contraintes | 5 | 5 | 0 | 0 | 3 min 30 s |
| **Total** | **529** | **515** | **14** | **0** | |

Les durées cumulées dépassent la durée réelle : les sondes des catégories 6 à 16 tournent à deux en parallèle.

## 4. Robustesse des données (catégorie 12)

### 4.1 Mutations ciblées (ROB-01 à ROB-44)

Chaque test applique une seule modification au fichier de référence.

| Test | Mutation | Résultat fet-cl | Statut |
|---|---|---|---|
| ROB-01/02/03 | `Duration` à 0, -1, `abc` | refus à la lecture : `Duration is incorrect` | PASS |
| ROB-04 | Id d'activité en double | refus : `Id is incorrect (already existing)` | PASS |
| ROB-05 | Id d'activité 0 | **accepté sans message** | WARN |
| ROB-06 | Id négatif | refus : `Id is incorrect` | PASS |
| ROB-07 | `Activity_Group_Id` vers une activité inexistante | accepté, génération cohérente | PASS |
| ROB-08 | `Total_Duration` incohérent | accepté (recalculé) | PASS |
| ROB-09/10 | Nom d'enseignant / de matière en double | refus (référence ambiguë signalée) | PASS |
| ROB-11 | Nom de jour en double | **accepté sans message** | WARN |
| ROB-43 | Nom de jour vide | **accepté** ; `activities.xml` écrit `Day=""`, indiscernable d'une activité non placée | WARN |
| ROB-44 | Nom d'heure en double | **accepté** ; deux créneaux `H1` indiscernables dans les sorties | WARN |
| ROB-12 | Groupe portant le nom de son année | refus : `Trying to add group Y1, which is already added as another year` | PASS |
| ROB-13/14 | `Number_of_Days` différent du nombre de jours listés | refus : `Number_of_Days and the number of Name read do not correspond` | PASS |
| ROB-15 | Nom d'enseignant vide | refus (activité citant l'enseignant invalide) | PASS |
| ROB-16 | Nom de 10 000 caractères | accepté, succès | PASS |
| ROB-17 | Capacité de salle négative | accepté | PASS |
| ROB-18 | Effectif négatif | refus : `Number_of_Students is incorrect` | PASS |
| ROB-19/20/21 | Activité avec matière, groupe ou étiquette inexistants | refus à la lecture | PASS |
| ROB-22/23 | Contrainte sur une salle ou un groupe inexistants | refus au précalcul, message explicite | PASS |
| ROB-24/25 | Contrainte avec jour ou heure inexistants | refus : `Day Dimanche is nonexistent`, `Hour H99 is nonexistent` | PASS |
| ROB-26/27 | Contrainte de base temps / espace absente | refus : `Cannot generate, because you do not have a constraint of type basic compulsory…` | PASS |
| ROB-28 | Contrainte de base en double | accepté | PASS |
| ROB-29 | Contrainte de base à 50 % | refus (même message) | PASS |
| ROB-30 | Sections dans le désordre (salles avant enseignants) | accepté | PASS |
| ROB-31 | `Days_List` absente | accepté : 5 jours par défaut `D1`..`D5` | PASS |
| ROB-32/33 | Balise `Mode` ou attribut `version` absents | accepté (mode `Official`) | PASS |
| ROB-34 | Expansion d'entités imbriquées (DTD interne) | refus : `Entity expands to more characters than the entity expansion limit` | PASS |
| ROB-35 | Entité externe `SYSTEM "file:///etc/hostname"` | accepté, entité **non résolue** (vide) : aucune fuite | PASS |
| ROB-36/37 | Commentaires, instructions de traitement, CDATA | accepté | PASS |
| ROB-38 | Activité de 6 h dans une journée de 6 h | accepté, succès | PASS |
| ROB-39 | Octets Latin-1 dans un fichier déclaré UTF-8 | refus : `File is incorrect…it cannot be opened` | PASS |
| ROB-40/41 | Fichier vide, contenu binaire | refus (même message) | PASS |
| ROB-42 | UTF-16 avec BOM | accepté, succès | PASS |

### 4.2 Fuzzing reproductible (ROB-50)

1 000 variantes du fichier de référence (graine 2026), huit familles de mutations : suppression, duplication ou vidage d'un élément, valeur numérique extrême (`-1`, `0`, `2147483648`, `1e9`, `0.5`, vide…), valeur textuelle, échange de noms, octets aléatoires, troncature.

| Mutation | Acceptée | Refus à la lecture | Refus au précalcul | Abandon |
|---|---:|---:|---:|---:|
| duplique-element | 96 | 29 | 0 | 0 |
| echange-noms | 130 | 0 | 0 | 0 |
| octets | 0 | 132 | 0 | 0 |
| supprime-element | 64 | 46 | 0 | 2 |
| tronque | 0 | 128 | 0 | 0 |
| valeur-numerique | 87 | 27 | 10 | 1 |
| valeur-texte | 78 | 26 | 1 | 0 |
| vide-element | 115 | 27 | 1 | 0 |
| **Total** | **570** | **415** | **12** | **3** |

| Indicateur | Résultat |
|---|---|
| Erreurs de segmentation | 0 |
| Blocages (délai de garde dépassé) | 0 |
| Succès avec emploi du temps incohérent | 0 |
| Sorties ambiguës (nom de jour ou d'heure vide ou en double) | 5 |
| Abandons `Assertion 'buildingIndex>=0 && buildingIndex<r.nInternalBuildings' failed` | 2 (nom d'un bâtiment supprimé, salle qui le cite) |
| Abandons `Assertion 'this->weightPercentage==100.0' failed` | 1 (`Weight_Percentage=2147483648` sur une contrainte exigeant 100 %) |

Conclusion : la lecture de fet-cl est robuste aux fichiers corrompus (troncature, octets aléatoires : 100 % de refus propres) ; les seuls risques viennent de données **bien formées mais incohérentes** que fet-cl ne contrôle pas.

## 5. Charge et performances (catégorie 13)

### 5.1 Montée en charge (STR-01)

Établissements synthétiques sans contrainte de trous, limite 600 s.

| Classes | Activités | Statut | Durée | CPU | Mémoire max | Fichier |
|---:|---:|---|---:|---:|---:|---:|
| 160 | 3 730 | succès | 0,8 s | 0,8 s | 47 Mio | 1,0 Mo |
| 320 | 7 416 | succès | 2,7 s | 2,6 s | 67 Mio | 2,0 Mo |
| 640 | 14 952 | succès | 11,0 s | 11,0 s | 116 Mio | 3,9 Mo |
| 1 280 | 29 719 | succès | 43,9 s | 43,9 s | 214 Mio | 7,9 Mo |

Exposant empirique de la durée : 1,93 (2,06 lors de la campagne de mise au point) : la durée est **environ quadratique** en nombre d'activités. La mémoire croît d'environ 6,6 Kio par activité.

### 5.2 Grilles extrêmes (STR-02)

| Grille (jours × heures) | Activités | Statut | Durée | Mémoire max |
|---|---:|---|---:|---:|
| 1000 × 2 | 1 500 | succès | 0,5 s | 105 Mio |
| 1 × 1440 | 1 000 | succès | 0,2 s | 62 Mio |
| 200 × 50 | 4 000 | succès | 3,9 s | **965 Mio** |

La mémoire dépend du produit créneaux × activités : prévoir environ 1 Gio pour 10 000 créneaux et 4 000 activités.

### 5.3 Précision de la limite de temps (STR-03)

| `--timelimitseconds` | Durée réelle | Écart | CPU |
|---:|---:|---:|---:|
| 1 | 0,10 s | -0,90 s | 0,08 s |
| 2 | 2,00 s | +0,00 s | 1,97 s |
| 5 | 5,01 s | +0,01 s | 4,97 s |
| 10 | 9,97 s | -0,03 s | 9,96 s |

La limite est vérifiée à la seconde près ; une limite de 1 s peut s'arrêter presque immédiatement (0,90 s lors d'une autre mesure). Utiliser au moins 2 s.

### 5.4 Parallélisme (STR-04)

| Processus simultanés | Durée totale | Générations / s | Accélération | Résultats identiques |
|---:|---:|---:|---:|---|
| 1 | 0,7 s | 1,42 | × 1,0 | oui |
| 2 | 0,7 s | 2,85 | × 2,0 | oui |
| 4 | 1,4 s | 2,88 | × 2,0 | oui |
| 8 | 2,8 s | 2,88 | × 2,0 | oui |

fet-cl est mono-thread : le débit plafonne au nombre de cœurs (2 ici). À graines égales, le résultat ne dépend pas de la charge.

### 5.5 Graines, mémoire, signaux (STR-05 à STR-09)

| Test | Mesure | Résultat |
|---|---|---|
| STR-05 | Instance difficile, 20 graines, 5 s | 4 succès sur 20 ; activités placées : min 219, médiane 222, max 223 sur 223 |
| STR-06 | Instance moyenne, 20 graines | 20 succès sur 20, 0,05 s chacune |
| STR-07 | Mémoire pendant 30 s de recherche | 16,9 Mio à 1 s, 17,5 Mio à la fin : pas de fuite |
| STR-08 | SIGTERM après 0,5 / 1 / 2 / 4 s | arrêt en 0,05 s chaque fois, code 0, `-highest` écrit |
| STR-09 | 3 fichiers `sigwrite` successifs | processus toujours actif ; `-current`, `-current-2`, `-current-3`, `-current-4` (dernier à l'arrêt) |

## 6. Intégration système Linux (catégorie 14)

| Test | Situation | Résultat | Statut |
|---|---|---|---|
| SYS-01 | Sans `LD_LIBRARY_PATH` | Qt trouvé par le RPATH du binaire ; sinon code 127 attendu (`error while loading shared libraries`) | PASS |
| SYS-02 | `LC_ALL=C`, noms et chemins accentués | avertissement Qt sur stderr ; succès ; noms intacts dans les XML | PASS |
| SYS-03 | `LANG=fr_FR.UTF-8` sans `LC_ALL` | statut et placement identiques à `C.UTF-8` | PASS |
| SYS-04 | Entrée en lecture seule, lien symbolique, chemin relatif | succès dans les trois cas ; entrée jamais modifiée | PASS |
| SYS-05 | `RLIMIT_FSIZE` = 64 Kio | tué par SIGXFSZ (code -25) **alors que `result.txt` contient `Generation successful`** | WARN |
| SYS-05 | stdout et stderr vers `/dev/full` | génération menée à terme, code 0 | PASS |
| SYS-06 | `RLIMIT_AS` 512 Mio / 4 Gio, grille 200 × 50 | 512 Mio : `std::bad_alloc` puis SIGABRT (code -6) ; 4 Gio : succès | PASS |
| SYS-07 | `RLIMIT_CPU` = 2 s | tué par SIGXCPU (code -24) après 2,0 s CPU, aucun `-highest` | PASS |
| SYS-08 | SIGHUP, SIGQUIT, SIGUSR1, SIGUSR2, SIGPIPE, SIGALRM | arrêt immédiat (codes -1, -3, -10, -12, -13, -14), aucun résultat | PASS |
| SYS-09 | SIGSTOP 5 s puis SIGCONT, limite 6 s | fin 0,1 s après la reprise : la limite compte le temps suspendu (temps réel) | PASS |
| SYS-10 | `--inputfile=/dev/stdin`, tube nommé (FIFO) | les deux acceptés ; résultat dans `timetables/stdin/` pour `/dev/stdin` | PASS |
| SYS-11 | `HOME` pointant vers un dossier vide | rien n'y est écrit | PASS |
| SYS-12 | `umask` 022 et 077 | fichiers en 644 et 600 | PASS |
| SYS-13 | Deux exécutions simultanées, même `--outputdir` | `logs/` partagé (une trace écrasée) ; selon le moment, `<nom>` + `<nom>-2` ou **un seul `<nom>` commun** (les deux cas observés) | WARN |
| SYS-14 | Composant de chemin de 300 caractères | code 1, message explicite | PASS |
| SYS-15 | Arborescence complète (instance moyenne, CSV) | 62 fichiers, 1,02 Mo : 41 HTML, 9 CSV, 6 TXT, 3 XML, 1 FET, 1 CSS, 1 LOG | PASS |

Signaux, synthèse :

| Signal | Effet | Code (Python / shell) | Solution écrite |
|---|---|---|---|
| SIGTERM | arrêt propre en 0,05 s | 0 / 0 | oui (`-current`, `-highest`) |
| fichier `sigwrite` | instantané sans arrêt | — | oui (`-current-N`, `-highest-N`) |
| SIGINT | arrêt immédiat | -2 / 130 | non |
| SIGKILL | arrêt immédiat | -9 / 137 | non |
| SIGHUP, SIGQUIT, SIGUSR1, SIGUSR2, SIGPIPE, SIGALRM | action par défaut | -N / 128+N | non |
| SIGXCPU, SIGXFSZ | limites de ressources | -24, -25 / 152, 153 | non (mais `result.txt` peut annoncer un succès avec SIGXFSZ) |
| SIGSTOP / SIGCONT | suspension, reprise | — | la limite de temps continue de courir |

## 7. Validation des sorties (catégorie 15)

| Test | Vérification | Résultat |
|---|---|---|
| OUT-01 | Tous les `.xml` et `.fet` produits (htmllevel 7, CSV) | bien formés |
| OUT-02 | HTML aux niveaux 0 à 7 | 41 pages à chaque niveau ; UTF-8 déclaré ; balises équilibrées ; de 240 Kio (niveau 0) à 641 Kio (niveau 6), 446 Kio au niveau 7 |
| OUT-03 | Noms contenant `& < > " '` | XML bien formés et noms exacts restitués ; HTML échappé ; CSV correct |
| OUT-04 | 3 séparateurs × 3 modes de guillemets CSV | 9 combinaisons, 9 fichiers chacune, nombre de colonnes constant |
| OUT-05 | `activities.xml` / `teachers.xml` / `subgroups.xml` dans les 4 modes | cohérence complète |
| OUT-06 | Réinjection de `*_data_and_timetable.fet` | même placement et mêmes salles ; 10 contraintes `ActivityPreferredStartingTime` ajoutées (non verrouillées) ; 0,05 s |
| OUT-07 | Trois préférences violées (95, 80, 60 %) | `Total soft conflicts: 2.35` = somme des lignes |
| OUT-08 | Solution partielle `-highest` après « Time exceeded » | 220 activités placées sur 223, aucun chevauchement |
| OUT-09 | Heures par enseignant dans les statistiques HTML | conformes à l'entrée |

## 8. Combinaisons de contraintes (catégorie 16)

| Test | Essai | Résultat |
|---|---|---|
| CMB-01 | Les 253 paires des 23 contraintes vérifiables, à 100 % | 240 succès, 8 infaisables, 5 refus, 0 abandon ; **0 violation** |
| CMB-05 | 200 triplets tirés au hasard | 169 succès, 20 infaisables, 11 refus, 0 abandon ; **0 violation** |
| CMB-02 | Préférence satisfiable, 8 poids × 10 graines | voir tableau ci-dessous |
| CMB-03 | Même contrainte écrite deux fois | acceptée et respectée |
| CMB-04 | Contradictions directes | ordre circulaire A<B et B<A : non détecté au précalcul, « Time exceeded » après la limite ; même début + non-chevauchement : refus au précalcul (0,1 s) ; créneau imposé indisponible : refus au précalcul (`has no allowed slot`) ; deux activités du même groupe au même créneau imposé : « Time exceeded » |

| Poids | 0 % | 25 % | 50 % | 75 % | 90 % | 95 % | 99 % | 100 % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Préférence respectée (sur 10) | 0 | 0 | 0 | 0 | 1 | 4 | 8 | 10 |

Cas particulier relevé et vérifié dans le code (`src/engine/timeconstraint.cpp`) : avec une pause, `TwoActivitiesConsecutive` considère comme consécutives deux activités séparées **uniquement par des créneaux de pause** (4 combinaisons concernées). C'est voulu ; ce n'est pas compté comme violation.

Certaines contradictions ne sont détectées qu'en épuisant la limite de temps : un superviseur doit pouvoir distinguer « refus immédiat » (code 1) de « non trouvé » (code 0, « Time exceeded »).

## 9. Avertissements et recommandations

| Test | Constat | Recommandation pour l'application |
|---|---|---|
| ARG-14 | s20..s22 entre 4 294 944 443 et 4 294 967 086 acceptés puis abandon `_s20 < m2` | Borner s20, s21, s22 à 4 294 944 442 |
| GEN-08 | `fet_fr.qm` absent du binaire de test : repli en_US | Livrer `translations/` à côté de fet-cl ou dans `../share/fet/translations` |
| CAP-02 | `Mornings_Afternoons_Behavior` absent ou inconnu : abandon | Toujours l'écrire en mode matins/après-midis |
| CAP-11 | Créneau en double dans un ensemble : abandon | Dédupliquer les créneaux |
| CAP-13 | Enseignant inexistant dans une contrainte : abandon | Vérifier toutes les références |
| PDS-04 | Poids 101, -5 acceptés ; `99,5`, `abc`, vide lus comme 0 | Borner à [0, 100], point décimal |
| OPT-03 | Booléens lus par leur fin | Écrire exactement `true` / `false` |
| ROB-05 | Id 0 accepté | Id ≥ 1 |
| ROB-11 | Jour en double accepté | Noms de jours uniques |
| ROB-43 | Jour vide accepté, sortie ambiguë | Noms non vides |
| ROB-44 | Heure en double acceptée, sortie ambiguë | Noms d'heures uniques |
| ROB-50 | 3 abandons sur 1 000 fichiers mutés (bâtiment manquant, poids géant) | Valider références de bâtiments et poids avant l'appel |
| SYS-05 | `result.txt` « succès » puis SIGXFSZ | Exiger code 0 **et** présence de `<nom>_activities.xml` |
| SYS-13 | `logs/` et dossier de résultat partagés entre exécutions simultanées | Un `--outputdir` neuf par exécution |

Règle d'interprétation du résultat, mise à jour :

```
rc < 0 (Python) ou rc > 128 (shell) → processus tué ou abandon, PRIORITAIRE sur result.txt
rc == 127 (shell)                   → bibliothèque Qt introuvable
rc == 1                             → erreur d'appel ou de données (logs/errors.txt)
rc == 0 :
   "Generation successful" ET timetables/<nom>/<nom>_activities.xml présent → succès
   "Generation successful" sans <nom>_activities.xml                       → sorties incomplètes
   "Impossible" / "Time exceeded"                                          → non trouvé (-highest)
   "Generation interrupted"                                                → arrêt demandé
```

`fet_batch.py` applique désormais cette règle (statuts `KILLED` prioritaire et `INCOMPLETE`), vérifié en relançant le superviseur sous `ulimit -f 64` : statut `KILLED` alors que `result.txt` annonçait un succès.

## 10. Comparaison avec la campagne du 6 octobre 2026

| Élément | 6 octobre | 7 octobre |
|---|---|---|
| Tests | 446 | 529 (+83 : ROB, STR, SYS, OUT, CMB) |
| Résultat | 439 PASS, 7 WARN | 515 PASS, 14 WARN |
| Statuts des 446 tests communs | — | identiques, 0 changement |
| Catalogue des contraintes et des options | — | identique |
| Durée | 3 min 42 s | 8 min 44 s |

## 11. Corrections apportées pendant la campagne

| Élément | Correction |
|---|---|
| Validateur | Partie Windows supprimée (scripts `.bat`, PyInstaller, NTSTATUS, CTRL_BREAK) ; version 3.0.0 Linux uniquement |
| Validateur | Mesure CPU et mémoire de chaque exécution ; affichage dans les rapports HTML et Markdown |
| Validateur | Contrôle de cohérence d'après `*_data_and_timetable.fet` (évitait de faux FAIL sur `Days_List` absente, Id hors bornes, `Active` vide) |
| Validateur | Combinaisons : prise en compte des pauses pour `TwoActivitiesConsecutive` (faux FAIL corrigé après lecture du code de fet-cl) |
| Validateur | Rapport détaillé Markdown automatique, avec comparaison à la campagne précédente du même dossier ; bouton « Rapport détaillé » dans l'interface |
| `fet_batch.py` | Linux uniquement ; code négatif prioritaire sur `result.txt` ; statut `INCOMPLETE` |
| Documentation développeur | Sections 1, 3, 4.1, 6.3, 6.6, 8, 10, 11, 12 (pièges 31 à 40), 13.3, 14, 15 et 16 mises à jour ; mentions Windows et macOS supprimées |
| Documentation d'interfaçage | Signaux POSIX, codes 127 / SIGXCPU / SIGXFSZ, règle d'interprétation, script embarqué mis à jour |

## 12. Limites de la campagne

- Une seule machine (2 cœurs) : les durées et débits sont indicatifs ; relancer la catégorie 13 sur le matériel de production.
- Les limites de format de `timetable_defs.h` (500 000 activités, 30 000 sous-groupes, salles, bâtiments) ne sont pas atteintes ; maximum testé : 29 719 activités.
- Le fuzzing explore 1 000 mutations simples et reproductibles, pas toutes les combinaisons possibles.
- Les cgroups v2 (`memory.max`) n'ont pas été testés ; un dépassement y déclenche normalement le tueur OOM (SIGKILL, code -9) plutôt que `std::bad_alloc`.
- Seul Qt 6.10.0 a été utilisé.
