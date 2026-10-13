# Spécification fonctionnelle — TAKT

**Application de gestion et de génération des emplois du temps de l'ISAM Kairouan (ISAMK)**

| | |
|---|---|
| **Version** | 1.0 (version de référence) |
| **Date** | 3 octobre 2026 |
| **Langue de l'application** | Français uniquement |
| **Déploiement** | Sur site, réseau interne de l'ISAMK |
| **Moteur de génération** | FET (Free Timetabling Software), version 7.11.1 épinglée |
| **Statut** | Référence initiale du développement. Le développement du moteur de génération reste conditionné au POC FET (§24). |
| **Documents liés** | `ST_TAKT.md` (spécification technique), `Backlog_TAKT_tickets.csv` et `Backlog_TAKT.xlsx` (backlog), `ADR_S1_FET.md` (intégration de FET), `TRACABILITE_TAKT.md` (matrice générée) |

**Convention d'identification.** Chaque exigence porte un code stable `EX-<DOMAINE>-<NN>`. Le backlog et la spécification technique citent ces codes et jamais des numéros de section, qui peuvent changer. Les décisions de référence sont tracées dans le Decision Log (§26).

---

## 1. Objet et principes

TAKT gère la répartition pédagogique, les contraintes de planification, la génération automatique des emplois du temps avec FET, leur édition manuelle, leur validation, leur publication, leur versionnement, leur archivage et leur export. L'application est la source de vérité fonctionnelle. FET est un moteur externe jetable.

- **EX-PRI-01** — L'application est la source de vérité fonctionnelle. FET reçoit uniquement des fichiers dérivés et n'accède jamais à la base métier.
- **EX-PRI-02** — Toute règle de planification ayant un impact sur la génération et techniquement supportable par FET est traduite dans le fichier FET. Les règles non supportables restent contrôlées par l'application et sont marquées `APPLICATION_ONLY`. Une règle `APPLICATION_ONLY` n'est jamais présentée comme respectée par FET.
- **EX-PRI-03** — Une version publiée est immuable. Toute modification crée une nouvelle version de travail à partir de la précédente. L'ancienne version reste consultable.
- **EX-PRI-04** — La sélection finale d'une génération est toujours manuelle. Le système ne choisit jamais seul une proposition.
- **EX-PRI-05** — La répartition pédagogique et la construction du planning sont séparées fonctionnellement. Une validation pédagogique ne vaut pas validation du planning.
- **EX-PRI-06** — Les règles sont centralisées dans un moteur unique qui alimente la génération du fichier FET, les contrôles avant génération, la validation des modifications manuelles et les contrôles de validation et de publication.
- **EX-PRI-07** — Une génération est reproductible à partir de son snapshot. Une publication référence toutes les versions nécessaires à sa reproduction (§13).

## 2. Périmètre et capacités

| Élément | Volumétrie de référence | Dimensionnement cible (ST) |
|---|---|---|
| Université | 1 | 1 |
| Étudiants | < 2 000 (non gérés individuellement) | — |
| Enseignants | ~150 | 400 |
| Départements | 2 | 10 |
| Formations | ~20 | — |
| Groupes TD/TP | ~60 | — |
| Salles | ~40 | 150 |
| Séances par semestre | — | 4 000 |
| Comptes et utilisateurs simultanés | — | 50 comptes, 10 simultanés |
| Semestres par année / semaines par semestre | 2 / 14 | — |
| Jours | lundi à samedi | — |
| Pas de temps | 30 minutes, fixe pour toute l'institution | — |

Le planning est une grille hebdomadaire répétée pendant les 14 semaines d'un semestre. Il n'y a ni semaines A/B ni variation hebdomadaire individuelle. Les modules futurs et les fonctions hors v1.0 sont listés au §25.

## 3. Rôles et droits

Quatre rôles, fixés par le Decision Log (DL-012, DL-020, DL-028) :

| Rôle | Code | Résumé |
|---|---|---|
| Administrateur | `ADMINISTRATEUR` | Configuration, comptes, paramètres pédagogiques ; détient en plus tous les droits du Gestionnaire |
| Gestionnaire des emplois du temps | `GESTIONNAIRE` | Planification, génération, édition, verrous, soumission, publication |
| Responsable de département | `RESPONSABLE_DEPARTEMENT` | Répartition pédagogique et validations de son département |
| Direction (Directeur, Secrétaire général) | `DIRECTION` | Consultation en lecture seule |

- **EX-ROL-01** — Le système distingue les quatre rôles ci-dessus. Les droits sont contrôlés à la fois par rôle et par périmètre départemental.
- **EX-ROL-02** — L'Administrateur détient l'union de ses droits propres (configuration système, comptes, paramètres pédagogiques et de sécurité, modèles visuels d'export) et de ceux du Gestionnaire. Il peut écrire la répartition de n'importe quel département.
- **EX-ROL-03** — Le Responsable de département est limité à son département. Il crée et modifie les activités de son département, valide sa répartition et son planning, consulte les charges. Un objet hors portée est invisible (réponse « introuvable »).
- **EX-ROL-04** — La Direction consulte les plannings publiés et archivés, les exports officiels, la répartition, les charges, les contraintes et l'audit métier. Elle n'écrit rien et ne voit pas les versions de travail.
- **EX-ROL-05** — Séparation des fonctions : le Gestionnaire ne modifie ni les paramètres pédagogiques ni la répartition pédagogique ; il peut seulement adresser une demande de modification au Responsable. Le Responsable ne génère ni ne publie.
- **EX-ROL-06** — L'Administrateur peut valider la répartition ou le planning d'un département à la place de son Responsable, un département à la fois, en nommant ce département. L'historique et l'audit portent la mention « validé par l'Administrateur pour le département X » et le Responsable est notifié. La justification est facultative. Sur un même cycle de validation, la personne qui a soumis la version ne peut pas la valider elle-même.
- **EX-ROL-07** — Pour un enseignant intervenant dans plusieurs départements, le Responsable voit le total de sa charge, tous départements confondus, sans le détail des modules ni des groupes des autres départements.

Matrice d'accès consolidée (C = consultation, ✓ = écriture, — = aucun accès) :

| Fonction | Administrateur | Gestionnaire | Responsable de département | Direction |
|---|---|---|---|---|
| Configuration système, comptes, sécurité | ✓ | — | — | — |
| Paramètres pédagogiques | ✓ | — | selon périmètre | — |
| Données de planification et contraintes | ✓ | ✓ | C | C |
| Répartition pédagogique | ✓ | C | ✓ (son département) | C |
| Validation de la répartition | ✓ (par département) | — | ✓ | C |
| Génération FET, profils de génération | ✓ | ✓ | — | — |
| Sélection d'une génération, édition, verrous | ✓ | ✓ | — | — |
| Soumission et validation du planning | ✓ | soumission | validation (son département) | C |
| Publication | ✓ | ✓ | — | C |
| Exports | ✓ | ✓ | son périmètre | exports officiels |
| Audit métier | ✓ | selon périmètre | selon périmètre | C |
| Journal de sécurité | ✓ | — | — | — |

## 4. Authentification et sécurité

- **EX-SEC-01** — Authentification locale par identifiant et mot de passe en v1.0. L'architecture permet un futur SSO (LDAP/AD, OIDC) sans modifier le contrôle d'accès.
- **EX-SEC-02** — Seul l'Administrateur gère les comptes. Les suppressions sont logiques ; la réactivation est réservée à l'Administrateur. Les identités historiques restent présentes dans l'audit. La désactivation d'un compte révoque immédiatement ses sessions.
- **EX-SEC-03** — Un utilisateur peut changer son propre mot de passe (en fournissant l'actuel). En cas d'oubli, l'Administrateur déclenche une réinitialisation : un lien à usage unique et à expiration courte est envoyé à l'adresse du compte, l'utilisateur choisit alors son mot de passe. L'Administrateur ne voit jamais un mot de passe.
- **EX-SEC-04** — Les paramètres de sécurité sont configurables par l'Administrateur et audités : longueur minimale (défaut 12, plancher technique 8), règles de composition (défaut aucune), expiration (défaut aucune), historique des mots de passe (défaut 5), verrouillage (défaut 5 échecs, 15 minutes), inactivité avant déconnexion (défaut 30 minutes), MFA obligatoire par rôle (défaut : Administrateur), durées de conservation des journaux.
- **EX-SEC-05** — Le verrouillage de compte et les réponses de connexion ne permettent pas d'énumérer les comptes (message générique, délai identique).
- **EX-SEC-06** — MFA par code TOTP, configurable par rôle.
- **EX-SEC-07** — Déconnexion automatique après la durée d'inactivité configurée. Les requêtes automatiques (renouvellement du bail d'édition, suivi de génération) ne comptent pas comme une activité.
- **EX-SEC-08** — Moindre privilège : contrôle d'accès par rôle et par périmètre, refus par défaut de toute route sans permission déclarée, matrice de permissions vérifiée automatiquement.
- **EX-SEC-09** — Le journal de sécurité, distinct de l'audit métier, enregistre les connexions réussies et échouées, les verrouillages, la réutilisation d'un jeton révoqué, l'usage d'un lien de réinitialisation, l'enrôlement MFA et les accès aux exports. Il est consultable par l'Administrateur seul.

## 5. Calendrier académique

- **EX-CAL-01** — Une année universitaire comporte deux semestres de 14 semaines. Chaque semestre a son propre emploi du temps. Les enseignants et salles sont des données annuelles ; groupes et créneaux sont propres au semestre. Les affectations peuvent changer entre S1 et S2. Une matière est semestrielle.
- **EX-CAL-02** — La grille horaire est propre à chaque semestre. Les heures de début et de fin sont saisies par jour (lundi à samedi). Un créneau dure exactement 30 minutes ; toute durée d'activité est un multiple de 30 minutes. Les pauses sont des créneaux non planifiables.
- **EX-CAL-03** — Un générateur de grille produit les créneaux consécutifs d'un semestre à partir des heures de début et de fin par jour et des pauses, avec un mode simulation. La grille d'un semestre peut être dupliquée depuis un autre semestre ou une autre année ; elle n'est jamais reconduite automatiquement.
- **EX-CAL-04** — Grille Ramadan. La génération reste fondée sur les créneaux logiques réguliers. Une table de correspondance par semestre associe chaque créneau logique à un horaire Ramadan affiché, avec des durées d'affichage libres (pas un simple décalage). Le choix de la grille « Normale » ou « Ramadan » se fait à l'affichage et à l'export. Le Ramadan ne modifie ni activités, ni volumes, ni affectations, ni durée logique FET. La correspondance utilisée est figée avec la version à sa publication.
- **EX-CAL-05** — Une année a trois statuts : `PREPARATION`, `ACTIVE` (une seule à la fois), `CLOTUREE`. La clôture est définitive : une année clôturée n'est jamais restaurée comme active. Elle exige une confirmation explicite qui rappelle ses conséquences et la saisie du code de l'année ; l'API exige la même confirmation. Elle est refusée si une version est en validation ; les versions non publiées sont alors archivées avec le motif « clôture ».
- **EX-CAL-06** — Une année clôturée reste consultable en lecture seule : planning, répartition, charges, versions, audit et exports. Elle est protégée contre toute écriture, y compris par l'Administrateur.

## 6. Organisation académique et référentiels

Hiérarchie : Université → Institut → Département → Formation → Niveau → Groupe → Sous-groupe TD/TP. Configuration de référence : 1 institut, 2 départements, niveaux L1, L2, L3, M1, M2. Les étudiants individuels ne sont pas gérés.

- **EX-ORG-01** — Gestion de la structure académique (départements, formations, niveaux), rattachée à l'année. Une suppression d'objet référencé est refusée avec la liste des références ; la désactivation est recommandée.
- **EX-ORG-02** — Les groupes sont hiérarchiques (section, groupe, sous-groupe), propres à un semestre, avec un effectif. Une même activité peut concerner plusieurs groupes simultanément (CM commun). Un groupe est en conflit avec ses ancêtres et ses descendants.
- **EX-ORG-03** — Code de groupe : `(L1|L2|L3|M1|M2)-(abréviation de la spécialité)-(groupe)`, par exemple `L2-INFO-1`. Le premier segment est le niveau, le deuxième l'abréviation de la formation (unique par année), le dernier l'identifiant du groupe dans le niveau (1, 2, 3 ou A, B), confirmé par le client. Le format est validé partout, y compris à l'import. Le système propose le prochain identifiant libre. Les groupes d'un semestre peuvent être dupliqués vers l'autre.
- **EX-REF-01** — Matières (modules) : code, libellé, niveau, semestre, état actif, commentaire. Le référentiel porte le volume hebdomadaire prévu par (module, type d'enseignement), qui sert au contrôle de cohérence des volumes.
- **EX-REF-02** — Types d'enseignement (CM, TD, TP, CI, Autre, paramétrables) pour le calcul de charge, et grades, paramétrables par l'Administrateur.
- **EX-REF-03** — Enseignants : matricule, nom, prénom, e-mail, téléphone facultatif, grade, département, matières enseignables, état actif, commentaire. Un enseignant n'a pas de compte en v1.0. Un enseignant figurant dans une répartition non clôturée ne peut pas être désactivé.
- **EX-REF-04** — Salles : code, nom, site, bâtiment, étage, capacité maximale, capacité recommandée, type, équipements, accessibilité PMR, rattachement éventuel à un département, état actif, commentaire. Les sites (principal et annexes) sont un référentiel ; le site sert aux filtres, vues et exports et n'a aucun effet de calcul en v1.0.
- **EX-REF-05** — Le FET Activity Tag est un référentiel distinct du type d'enseignement. Le type sert à la charge, le tag catégorise l'activité dans FET et pilote la compatibilité des salles (tags autorisés par salle). Un type porte un tag par défaut que le Responsable peut remplacer sur l'affectation. Le système ne suppose jamais qu'un tag égale un type.
- **EX-REF-06** — Indisponibilités absolues des enseignants et des salles, définies par jour et par créneau, rattachées au semestre.
- **EX-REF-07** — Décharges des enseignants, par semestre, en heures équivalentes, saisies par l'Administrateur.

## 7. Activités et séances

Une activité correspond à une affectation de la répartition : semestre, matière, **un seul enseignant**, un ou plusieurs groupes, type d'enseignement, Activity Tag, nombre de séances par semaine, durée d'une séance, préférences et règles applicables.

- **EX-ACT-01** — Une activité n'a qu'un seul enseignant. Le co-enseignement est hors v1.0.
- **EX-ACT-02** — Volume hebdomadaire = nombre de séances × durée ; volume semestriel = volume hebdomadaire × 14. Les séances sont contiguës et répétées à l'identique pendant les 14 semaines. L'imposition de jours différents entre séances d'une même activité est possible.
- **EX-ACT-03** — Une activité commune à plusieurs groupes (CM commun) produit une seule séance planifiée simultanément pour tous les groupes, et compte une seule fois dans la charge de l'enseignant.
- **EX-ACT-04** — Pour une activité, le Gestionnaire (ou l'Administrateur) peut imposer une salle spécifique (contrainte dure) ou définir une liste de salles autorisées, en complément de la compatibilité automatique par Activity Tag. Ces exigences relèvent de la planification : elles ne rouvrent pas la répartition.

## 8. Répartition pédagogique et charge

Terminologie (DL-024) : le sigle « DU » est abandonné au profit de « charge ».

| Terme | Définition |
|---|---|
| Volume brut | Heures réelles affectées, sans pondération |
| Coefficient | Pondération par type d'activité (et par grade seulement si la règle institutionnelle le prévoit) |
| Charge calculée | Somme des (volume brut × coefficient) des activités de l'enseignant |
| Charge de référence | Charge exigée par le grade, définie dans le jeu de règles de charge |
| Décharges | Réductions accordées à l'enseignant |
| Service dû | Charge de référence − décharges (jamais négatif) |
| Écart | Charge calculée − service dû. Positif : dépassement. Négatif : reste à affecter |
| Heures supplémentaires | Part de l'écart positif au-delà du seuil du jeu de règles |

- **EX-REP-01** — Le Responsable crée et modifie les affectations de son département (groupe, module, type, enseignant, nombre de séances, durée). Le serveur calcule le volume. Les doublons, enseignants inactifs et modules hors niveau sont refusés.
- **EX-REP-02** — Contrôle de cohérence des volumes : pour chaque (groupe, module, type), la somme des affectations doit égaler le volume prévu. Les écarts sont visibles en saisie et bloquent la validation de la répartition.
- **EX-REP-03** — La validation d'une répartition (par département et par semestre) crée un snapshot immuable des affectations, des charges et du jeu de règles utilisé. Elle est refusée tant qu'un écart de volume ou une incohérence bloquante subsiste.
- **EX-REP-04** — Une répartition validée peut être rouverte par son Responsable (ou l'Administrateur). La réouverture n'a aucun effet sur les versions existantes ; elle produit un indicateur de divergence. La validation suivante produit un nouveau snapshot.
- **EX-REP-05** — Le Gestionnaire peut adresser au Responsable une demande de modification ou de signalement d'anomalie liée à une affectation ou une séance. Le Responsable la traite avec un motif.
- **EX-CHG-01** — Les jeux de règles de charge sont versionnés et immuables une fois publiés : charge de référence par grade, coefficients par type d'activité (et par grade si prévu), période (hebdomadaire, semestrielle, annuelle), seuil et plafond d'heures supplémentaires, arrondi (2 décimales par défaut). Aucune valeur n'est codée en dur dans l'interface ni dans FET. Un coefficient ou une charge manquants provoquent une erreur explicite, jamais une valeur par défaut silencieuse.
- **EX-CHG-02** — Le calcul est déterministe et reproductible. Il distingue sans ambiguïté volume brut, coefficient, charge calculée, charge de référence, service dû, écart et heures supplémentaires. Une modification de règle ne réécrit jamais un calcul historique.
- **EX-CHG-03** — Le calcul est effectué en temps réel pendant la saisie et contrôlé formellement à la validation. Les agrégations couvrent enseignant, département, formation, module, groupe et type, en volumes bruts et pondérés.
- **EX-CHG-04** — Vue annuelle S1 + S2 par enseignant, informative (elle ne bloque pas la validation), avec la source de chaque semestre (snapshot validé, copie de travail non validée, absent) et un indicateur de divergence.
- **EX-CHG-05** — Chaque calcul conservé détaille les activités contributrices (type, volume, coefficient, contribution), la règle utilisée et sa version.

## 9. Contraintes de planification

- **EX-CTR-01** — Un catalogue de contraintes définit chaque règle : identifiant, domaine, portée, catégorie (dure ou souple), schéma de paramètres, support FET (natif, partiel, aucun), message de conflit, version. Ajouter une règle ne demande pas de modifier les écrans existants de manière excessive.
- **EX-CTR-02** — Règles générales par semestre, surchargeables par groupe ou enseignant : heures min/max par jour, heures consécutives min/max, creux par jour et par semaine, jours min/max par semaine, amplitude journalière, heures maximales dans un intervalle. Les contraintes souples sont cumulatives ; une instance dure spécifique remplace la règle globale dure de même code pour son sujet ; un minimum supérieur au maximum est refusé. Un avertissement signale un volume de groupe supérieur à ce que ses règles permettent.
- **EX-CTR-03** — Vœux des enseignants : contraintes souples saisies par le Gestionnaire ou l'Administrateur (créneaux à éviter, jour libre souhaité, jours par semaine, heures par jour, creux), avec des niveaux de poids FAIBLE 25, MOYEN 50, FORT 75, TRES_FORT 90. Le poids 100 est interdit pour un vœu. Un vœu contradictoire avec une indisponibilité déclenche un avertissement. Les contraintes et vœux d'un semestre peuvent être dupliqués vers un autre.
- **EX-CTR-04** — Pauses : pauses fixes, créneaux bloqués, fenêtres de pause et pause libre minimale dans une fenêtre (par exemple 30 minutes libres entre 12h00 et 14h00 pour un groupe). Elles sont contrôlées à la génération et à l'édition manuelle.
- **EX-CTR-05** — Covoiturage : groupes d'enseignants par semestre avec une marge horaire (60 minutes par défaut) et un minimum de jours communs de présence. Souple par défaut ; un indicateur « strict » le rend bloquant. FET ne l'exprime pas : la règle est `APPLICATION_ONLY`, évaluée après import et dans le score.
- **EX-CTR-06** — Chaque règle est classée `HARD_CONSTRAINT`, `SOFT_CONSTRAINT`, `BUSINESS_VALIDATION` ou `INFORMATIONAL`, et sa traduction technique est `FET_SUPPORTED`, `FET_TRANSFORMED` ou `APPLICATION_ONLY`. La nature de la contrainte est toujours affichée : une préférence n'est jamais présentée comme une interdiction. Une matrice de traduction des règles est un livrable du POC (§24).
- **EX-CTR-07** — Sévérités : les collisions, indisponibilités, compatibilités, règles pédagogiques, complétude et capacité maximale sont bloquantes et jamais acceptables. Sont des avertissements acceptables : la capacité recommandée dépassée, un équipement marqué « souhaité » manquant, un vœu non respecté. Une contrainte souple non satisfaite est une information. Un avertissement est accepté par le Gestionnaire ou l'Administrateur après affichage de son impact ; l'acceptation est liée à la signature de l'avertissement (elle tombe si la séance change), tracée (utilisateur, date, règle, version) et visible dans l'historique, la prévisualisation de publication et l'export officiel. Un conflit bloquant ne peut jamais être accepté.
- **EX-CTR-08** — Chaque salle distingue trois niveaux de compatibilité pour une activité : compatible, acceptable avec avertissement, incompatible. Une exigence d'équipement est obligatoire par défaut ou souhaitée.

## 10. Intégration du moteur FET

- **EX-MOT-01** — Un port `SchedulingEngine` isole le domaine du moteur : le domaine ne dépend d'aucun type FET. Un futur moteur n'implémente que ce port.
- **EX-MOT-02** — Le constructeur de fichier FET est déterministe : mêmes entrées, même fichier octet à octet. Aucune identité en clair n'est écrite (identifiants techniques). Les périodes FET sont les créneaux de 30 minutes du semestre.
- **EX-MOT-03** — Un rapport de traduction classe chaque contrainte active : traduite, partielle (raison explicite) ou non traduite. L'utilisateur doit acquitter les contraintes non traduites avant de lancer. Le rapport de génération indique les règles traduites dans le fichier et celles contrôlées par l'application.
- **EX-MOT-04** — FET est exécuté (`fet-cl`) dans un conteneur isolé du worker, sans réseau sortant, système de fichiers en lecture seule, non-root, avec limites CPU et mémoire, dossier de sortie dédié par tâche et arrêt ordonné (SIGTERM puis SIGKILL après délai).
- **EX-MOT-05** — Un résultat partiel est importé : limite de temps dépassée, génération impossible ou arrêt ordonné. Les activités absentes du résultat sont créées « non placées ». Sans sortie exploitable, la génération est en échec avec les dernières lignes du journal.
- **EX-MOT-06** — Reproductibilité : le fichier, la version de FET, les graines, les paramètres et l'empreinte du fichier sont conservés. Un fichier identique, une même version et les mêmes graines redonnent le même résultat, pour une génération qui se termine d'elle-même.
- **EX-MOT-07** — Le fichier moteur généré peut être exporté (empreinte et version de FET incluses). Le Gestionnaire peut importer le résultat d'un fichier exporté, relancé à la main dans FET ; il est rattaché à une génération de mode « manuel » qui référence l'empreinte du fichier exporté et se compare et s'adopte comme une génération normale. L'import de structure depuis un fichier FET externe est hors v1.0.
- **EX-MOT-08** — Licence : FET est distribué sous GNU AGPL v3. Il est utilisé en binaire non modifié, en processus séparé, pour un usage interne à l'ISAMK. Aucune validation juridique n'est requise (DL-009). Le réexamen est obligatoire si FET est modifié ou si l'application ou son image est remise à un tiers. Un fichier NOTICE est tenu à jour.

## 11. Génération, historique et comparaison

- **EX-GEN-01** — Profils de génération versionnés : durée limite, préservation des séances verrouillées, version de l'adaptateur et du moteur, graines facultatives, poids des critères du score. Un profil utilisé est immuable ; le modifier crée la version suivante. Un profil par défaut est défini par semestre. L'Administrateur et le Gestionnaire les gèrent.
- **EX-GEN-02** — Périmètre explicite. Avant chaque génération, l'utilisateur voit : année, semestre, départements, nombre d'activités, groupes, enseignants, salles, contraintes actives, verrous, profil, version du jeu de règles et de l'adaptateur. En v1.0 le périmètre est le semestre complet et il est figé : il est confirmé, non modifiable, et enregistré avec une empreinte. Le lancement est refusé si les données ont changé depuis l'affichage.
- **EX-GEN-03** — Un tableau de préparation par semestre expose les contrôles avant génération (grille, groupes, ressources, répartitions validées n/m, volumes couverts, règles, indisponibilités, vœux, verrous, contradictions) avec le niveau bloquant, avertissement ou information, l'objet, la règle, l'explication, l'action attendue et un lien direct de correction. Il est filtrable. Le lancement est interdit tant qu'un blocage subsiste.
- **EX-GEN-04** — La génération est asynchrone, exécutée par un worker, suivie en temps réel (statut, phase, progression quand disponible) sans bloquer l'interface, et annulable. Elle conserve durée, journal d'exécution et informations techniques.
- **EX-GEN-05** — Une seule génération peut être active par semestre. Les modifications de répartition pendant une génération n'ont aucun effet sur elle. L'adoption est refusée si les snapshots de la version ont changé depuis.
- **EX-GEN-06** — Chaque génération est conservée avec ses paramètres, son snapshot complet (activités, groupes, enseignants, salles, créneaux, règles, contraintes, préférences, verrous, profil, adaptateur), son fichier moteur, ses résultats, erreurs, conflits, métriques, score et statut. Aucune génération n'est supprimée automatiquement sans politique d'archivage explicite.
- **EX-GEN-07** — Une génération en échec est conservée pour diagnostic (journaux, message FET, fichier généré, durée, profil, snapshot). Elle n'altère jamais la version de travail précédente. Le Gestionnaire corrige la cause et relance.
- **EX-CMP-01** — Comparaison de 2 à 4 générations : vue côte à côte, métriques globales, différences uniquement (activités déplacées, enseignants, salles et créneaux modifiés, conflits apparus ou disparus, contraintes satisfaites ou non, verrous respectés ou non).
- **EX-CMP-02** — Score d'optimisation de 0 à 100 : chaque critère reçoit un sous-score de 0 à 100 (100 : aucune pénalité) et le score global est la moyenne pondérée par les poids du profil. Les critères de départ sont la satisfaction des vœux, les creux des groupes et des enseignants, les heures consécutives, l'équilibre journalier, l'utilisation des salles, la capacité recommandée et le covoiturage. Un critère non évaluable est exclu et marqué « non évalué » ; les poids sont renormalisés. L'écran affiche le score global, la contribution de chaque critère, les indicateurs bruts et la comparaison. Le score est une aide à la décision. Une génération avec conflit bloquant ou activité non placée est exclue du classement mais conservée.
- **EX-CMP-03** — Le Gestionnaire adopte manuellement une génération comme base d'édition. L'adoption remplace les séances issues du moteur non verrouillées et crée une version en édition.

## 12. Édition manuelle et verrous

- **EX-EDI-01** — Le planning se modifie par glisser-déposer. Après chaque modification : recalcul immédiat des conflits, vérification des règles, mise à jour des indicateurs. Un déplacement qui crée un conflit bloquant est refusé. Chaque modification est historisée et annulable avant soumission.
- **EX-EDI-02** — Classification des conflits : enseignant, groupe, salle, capacité, équipement, compatibilité, indisponibilité, pause, règle pédagogique, verrou, covoiturage, vœu, donnée manquante, avec une sévérité (EX-CTR-07).
- **EX-EDI-03** — Avant dépôt, une simulation indique contraintes respectées et violées, impact sur le groupe, l'enseignant, la salle et les verrous. Pour une séance en conflit, le système propose jusqu'à 20 alternatives classées, sans écriture.
- **EX-EDI-04** — Un bail d'édition exclusif par version (30 minutes, renouvelable) empêche l'édition simultanée ; le second utilisateur reste en lecture seule. L'Administrateur peut forcer la libération. Un contrôle optimiste protège en seconde ligne.
- **EX-EDI-05** — Un contrôle de couverture compare le volume placé au volume attendu pour chaque affectation. Seule une couverture exactement égale à 100 % autorise la soumission ; la sur-planification est un conflit bloquant.
- **EX-EDI-06** — Les préparations et éditions sont enregistrées sans publication ; le Gestionnaire peut quitter puis reprendre, voir le dernier auteur et la dernière modification, annuler une modification récente et comparer avec la version de référence.
- **EX-VRR-01** — Verrous par séance, de quatre types : créneau (jour et heure), salle, enseignant, activité (gel complet). Une pose en masse verrouille toutes les séances d'un groupe, d'un enseignant ou d'une salle. Seuls le Gestionnaire et l'Administrateur posent et lèvent des verrous ; la justification est facultative. Les verrous sont envoyés à FET comme positions imposées. Un verrou incompatible avec les contraintes bloque la génération avant tout appel à FET. La levée affiche son impact sur les générations futures. Les verrous suivent la séance dans les nouvelles versions et disparaissent avec elle. Pose et levée sont auditées avec leur historique.

## 13. Workflow, validation et publication

- **EX-WFL-01** — Une version suit une machine d'états (§20) : brouillon, génération, édition, prêt pour validation, en validation, rejeté, correction, validé, publié, archivé. Chaque transition vérifie ses gardes (conflits, couverture), écrit l'historique et l'audit.
- **EX-WFL-02** — Le circuit est configurable par l'Administrateur au moyen de deux interrupteurs globaux : « validation du planning requise » et « publication requise », tous deux activés par défaut. La validation de la répartition reste toujours obligatoire. Sans validation requise, la soumission mène directement à « validé » sans décision de Responsable ; sans publication requise, une version validée est publiée dans la même transaction après les contrôles de publication, et reste « validée » si ces contrôles échouent. Les valeurs sont figées à la soumission. Une confirmation avertit quand la soumission publiera et archivera la version actuelle. Toute transition sautée ou automatique est tracée, avec pour auteur l'utilisateur qui l'a déclenchée.
- **EX-WFL-03** — Validation du planning : chaque département concerné est validé par son Responsable, qui voit le planning complet de son département, ses conflits et avertissements. Un rejet exige un motif. L'unanimité des départements concernés mène à « validé », un rejet à « rejeté ». Le Responsable peut valider malgré des avertissements, jamais malgré un blocage.
- **EX-WFL-04** — Revalidation ciblée. Pour une version issue d'une version parente, un département est « impacté » si l'une de ses séances a changé, si son snapshot de répartition a changé, ou s'il partage un enseignant avec une séance modifiée d'un autre département. Un département non impacté conserve son approbation précédente, reportée et tracée ; un département impacté est à revalider et notifié. Une synthèse d'impact est affichée à la création de la version, avant une régénération et à la soumission. Sans version parente, tous les départements valident.
- **EX-WFL-05** — La publication est atomique : dernier contrôle (version, validations requises, conflits bloquants, avertissements, couverture, verrous, provenance, cohérence du snapshot et du périmètre, absence de modification concurrente). Elle rend la version immuable, la désigne comme publiée courante, archive la précédente, rattache les exports et émet les notifications. Un échec ne laisse jamais de version partiellement publiée. Une seule version est publiée par semestre.
- **EX-WFL-06** — Toute modification demandée sur une version publiée crée une version de travail enfant, avec analyse d'impact, revalidation ciblée, régénération si nécessaire, validation puis nouvelle publication. L'ancienne version reste inchangée.
- **EX-WFL-07** — Versionnement et provenance. Une version de planning permet de retrouver la génération source, la version du profil de génération, le jeu de règles, le snapshot de données et la version de l'adaptateur. Les objets critiques sont versionnés indépendamment (§21).
- **EX-WFL-08** — Lorsqu'une contrainte est modifiée après validation, le Gestionnaire choisit l'application immédiate ou à la prochaine génération. En cas d'application immédiate, la version courante est recalculée et les conflits sont identifiés ; si le planning devient non conforme, il choisit de régénérer (avec le profil de son choix) ou d'annuler. La version publiée reste immuable.
- **EX-WFL-09** — Avant publication, une prévisualisation montre la version candidate et la précédente, les départements validés, les activités modifiées, les conflits, les avertissements acceptés, les verrous, la provenance, le profil et les activités planifiées ou non. La publication demande une confirmation explicite.

## 14. Notifications

- **EX-NOT-01** — Notifications dans l'application avec boîte de réception (lu/non lu), compteur, historique et mise à jour en direct.
- **EX-NOT-02** — Les notifications importantes sont aussi envoyées par e-mail, via le SMTP institutionnel (`cck.rnu.tn`), depuis une adresse institutionnelle existante. L'envoi n'est jamais bloquant pour le workflow (file avec reprises). Les e-mails portent un lien et un contenu minimal, sans donnée de charge ni détail pédagogique. Les utilisateurs ne peuvent pas désactiver les e-mails obligatoires.
- **EX-NOT-03** — Événements, destinataires et canaux :

| Événement | Destinataires | Canal |
|---|---|---|
| Demande de validation (soumission) | Responsables des départements à valider | Application + e-mail |
| Validation à refaire (département impacté) | Responsables concernés | Application + e-mail |
| Validation ou rejet | Gestionnaire auteur de la version | Application + e-mail |
| Validation par l'Administrateur pour un département | Responsable concerné | Application + e-mail |
| Périmètre prêt à générer | Gestionnaires | Application + e-mail |
| Génération démarrée | Initiateur | Application |
| Génération terminée | Initiateur | Application + e-mail |
| Génération échouée | Initiateur et Administrateurs | Application + e-mail |
| Nouvelle version | Gestionnaires et Responsables concernés | Application + e-mail |
| Publication | Gestionnaires, Responsables concernés, Direction, Administrateurs | Application + e-mail |
| Répartition rouverte | Gestionnaires | Application |
| Demande de modification créée ou traitée | Responsable concerné ou Gestionnaire auteur | Application + e-mail |

Toutes les notifications ont la même priorité fonctionnelle.

## 15. Audit

- **EX-AUD-01** — L'audit métier couvre les modifications métier, validations, publications, transitions d'état, acceptations d'avertissements, verrous, gestion des comptes et des paramètres. Chaque événement conserve utilisateur, date et heure, objet, ancienne et nouvelle valeur. Il est écrit dans la même transaction que l'action. Il n'est modifiable par aucun utilisateur. Les connexions relèvent du journal de sécurité (EX-SEC-09).
- **EX-AUD-02** — La durée de conservation de l'audit et du journal de sécurité est configurable par l'Administrateur (défauts : audit sans purge, journal de sécurité 12 mois). La purge passe par une fonction dédiée, elle-même tracée.

## 16. Imports et archives

- **EX-IMP-01** — Imports Excel et CSV (enseignants, salles, groupes, modules, et données de planification pour le Gestionnaire) en deux temps : simulation obligatoire avec rapport ligne par ligne (ligne, colonne, valeur, erreur, cause, correction attendue), puis confirmation. Un import avec erreur bloquante ou doublon est refusé en totalité ; aucune importation partielle. Contrôle de taille et de type réel du fichier.
- **EX-IMP-02** — Import depuis une année clôturée, sélectif par type de donnée (départements, formations, niveaux, groupes, modules, salles, enseignants, et en option créneaux et correspondance Ramadan), avec aperçu obligatoire (ajouts, modifications, doublons, conflits, erreurs). L'opération est transactionnelle et idempotente. Ne sont jamais copiés : répartitions, séances, versions, contraintes, indisponibilités, charges.
- **EX-IMP-03** — Un import qui touche des données utilisées dans une répartition validée présente l'impact avant application et ne modifie aucune validation silencieusement.

## 17. Affichage et exports

- **EX-EXP-01** — Interface en français uniquement ; dates JJ/MM/AAAA, heures sur 24 h. Vues par groupe, enseignant, salle, formation, département et vue globale, plus la vue des charges.
- **EX-EXP-02** — Export PDF : A4/A3, orientation, logo, en-tête, pied de page, couleurs lisibles en noir et blanc (état rendu aussi par icône et libellé).
- **EX-EXP-03** — Export Excel : colonnes, feuilles, ordre et regroupements configurables.
- **EX-EXP-04** — Deux objets distincts, versionnés et immuables une fois utilisés : le modèle visuel (logo, en-tête, pied de page, couleurs, orientation, format, éléments affichés), géré par l'Administrateur ; la configuration de vue (type de vue, colonnes, ordre, feuilles, regroupements, éléments du PDF), gérée par le Gestionnaire et l'Administrateur. Un export enregistre les versions utilisées et peut être régénéré à l'identique.
- **EX-EXP-05** — Un export porte la version, le périmètre, la grille d'affichage (normale ou Ramadan). Il est « brouillon » (filigrane, numéro de version) pour une version non publiée, « officiel » pour une version publiée ; l'officiel reprend le numéro de version, la date de publication et les avertissements acceptés.
- **EX-EXP-06** — Droits d'export : Administrateur et Gestionnaire, toutes vues, brouillon et officiel ; Responsable, son département seulement ; Direction, exports officiels des versions publiées et archivées, charges comprises.

## 18. Tableau de bord

- **EX-TDB-01** — Le Gestionnaire et l'Administrateur disposent d'un tableau de bord unique : année et semestre actifs, état des répartitions par département, validations en attente, résultats de préparation, version en préparation (statut, conflits, non placées, avertissements non acceptés), générations en cours et récentes, version publiée avec sa provenance, changements, et au plus cinq actions prioritaires. Les actions sont déterministes, ordonnées (génération en échec, planning rejeté, conflits bloquants, séances non placées, répartitions bloquantes, prêt à générer, prêt à soumettre, en attente de publication), chacune avec sa cause et un lien direct. Il répond immédiatement aux questions : que faire, pourquoi ce n'est pas générable, ce qui a changé, qui doit valider, ce qui sera impacté, quelle version est publiée, avec quelles données et quelle version de FET.
- **EX-TDB-02** — Le Responsable voit ses répartitions, la charge de ses enseignants avec alertes de dépassement, ses validations à donner et ses demandes ouvertes. La Direction voit la version publiée par semestre et l'accès aux exports.

## 19. Exigences non fonctionnelles

- **EX-NFR-01** — Déploiement sur site, réseau interne de l'ISAMK ; les données restent en Tunisie. Architecture modulaire en couches : interface web, API, moteur de règles, service de génération, constructeur FET, worker asynchrone, base PostgreSQL, stockage de fichiers, notifications, audit. Préparée pour une exposition Internet ultérieure (séparation front/API, reverse proxy, TLS, jetons, contrôle d'accès).
- **EX-NFR-02** — Conteneurs et déploiement par scripts sur trois environnements (développement, recette, production) ; pipeline avec tests et contrôles ; séparation stricte des environnements.
- **EX-NFR-03** — Sauvegarde et restauration : base (sauvegarde continue et complète quotidienne), fichiers (profils FET, résultats, exports, rapports), copie sur un support distinct du serveur, procédure documentée, test de restauration périodique. Les sauvegardes ne remplacent pas l'historique fonctionnel.
- **EX-NFR-04** — Performances cibles (95e centile) : déplacement de séance < 200 ms, simulation < 100 ms, suggestions < 1 s, chargement d'une grille < 500 ms, calcul de charge d'un département < 500 ms, tableau de bord < 500 ms, recalcul complet de 4 000 séances < 2 s, export de 100 pages < 60 s.
- **EX-NFR-05** — Observabilité : journaux structurés avec identifiant de requête, traces, métriques, alertes (file d'échecs non vide, génération trop longue, erreurs serveur), séparés de l'audit métier.
- **EX-NFR-06** — Protection des données personnelles : minimisation, aucune identité en clair dans les fichiers FET, chiffrement des disques et sauvegardes, conformité INPDP (loi 2004-63) et durée de conservation à valider avec le DPO.
- **EX-NFR-07** — Qualité : tests unitaires (charge, règles, versionnement, permissions, import, transformations FET), d'intégration (API et base, worker et FET, notifications, stockage), tests FET (génération, exécution, lecture, erreurs, cohérence avec les règles), tests fonctionnels des workflows, tests de sécurité, recette sur jeux de données représentatifs.
- **EX-NFR-08** — Textes de l'interface externalisés (i18n), français uniquement. Libellés des états conformes au glossaire (§20).
- **EX-NFR-09** — Architecture modulaire et extensible dès la v1.0 (§25), sans refonte majeure pour les modules futurs.
- **EX-NFR-10** — Identité visuelle : logo (SVG maître, jamais reconstruit à partir d'un texte) et tokens de conception TAKT du package de charte (source unique des couleurs, des états et des variables) ; le nom TAKT utilisé comme signature de marque est composé en Black Ops One (licence SIL OFL 1.1) ; titres en Sora, interface en Inter ; polices auto-hébergées, contrastes conformes WCAG AA, états jamais rendus par la seule couleur (libellé et icône), pas de mode sombre en v1.0.

## 20. États et glossaire

Les codes techniques restent internes ; l'interface et les exports n'affichent que les libellés français (DL-025).

**Version de planning**

| Code | Libellé |
|---|---|
| `BROUILLON` | Brouillon |
| `GENERATION` | Génération |
| `EDITION` | En édition |
| `PRET_POUR_VALIDATION` | Prêt pour validation |
| `EN_VALIDATION` | En validation |
| `REJETE` | Rejeté |
| `CORRECTION` | En correction |
| `VALIDE` | Validé |
| `PUBLIE` | Publié |
| `ARCHIVE` | Archivé |

**Génération** : `QUEUED` En attente · `RUNNING` En cours · `SUCCEEDED` Réussie · `SUCCEEDED_WITH_WARNINGS` Réussie partiellement · `FAILED` Échec · `TIMED_OUT` Délai dépassé sans résultat · `CANCELLED` Annulée. Mode : `AUTOMATIQUE` ou `MANUELLE`.

**Répartition** : `BROUILLON` Brouillon · `VALIDEE` Validée · `ROUVERTE` Rouverte.

**Année** : `PREPARATION` En préparation · `ACTIVE` Active · `CLOTUREE` Clôturée.

**Validation d'un département** : impact `IMPACTE` / `NON_IMPACTE` ; décision `EN_ATTENTE` À revalider ou à valider · `APPROUVE` Approuvé (éventuellement reporté) · `REJETE` Rejeté.

**Séance** : `PLACEE` Placée · `NON_PLACEE` À placer.

**Sévérité** : `BLOQUANT` Bloquant · `AVERTISSEMENT` Avertissement · `INFORMATION` Information.

**Validation d'un département** (complément) : indicateur `REPORTEE` Approbation reportée.

**Verrou** : `CRENEAU` Verrouillé sur le créneau · `SALLE` Verrouillé sur la salle · `ENSEIGNANT` Verrouillé sur l'enseignant · `ACTIVITE` Activité figée.

**Origine d'une séance** : `MOTEUR` Moteur · `MANUEL` Manuel.

**Nature d'une contrainte** (dérivée de la catégorie et de la nature, pas un code API) : Règle dure · Règle souple · Vœu.

**Avertissement** : Avertissement accepté · Acceptation caduque.

Correspondance indicative avec les états du processus : non généré = brouillon ; proposition sélectionnée = génération puis en édition ; à corriger = rejeté puis en correction. Il n'existe pas d'état stocké « données prêtes » ni « prêt à générer » : ce sont des résultats du tableau de préparation (EX-GEN-03). La publication est une opération atomique sans état propre.

**Vocabulaire.** *Fichier moteur* : fichier `.fet` généré. *Profil de génération* : configuration versionnée d'une génération. *Snapshot* : copie immuable des données utilisées. *Version* : état versionné d'un planning pour un semestre. *Gestionnaire* : Gestionnaire des emplois du temps.

## 21. Données, identifiants et versionnement

Entités principales : Université, Institut, Département, Formation, Niveau, Groupe, Année, Semestre, Matière, Enseignant, Grade, Type d'enseignement, Activity Tag, Affectation (activité), Séance, Salle, Type de salle, Équipement, Site, Créneau, Correspondance d'affichage (Ramadan), Contrainte, Vœu, Groupe de covoiturage, Profil de génération, Génération, Fichier moteur, Version de planning, Verrou, Avertissement accepté, Validation de département, Notification, Audit, Journal de sécurité, Import, Export (modèle visuel, configuration de vue), Paramètres (workflow, sécurité), Utilisateur, Rôle.

- **EX-DAT-01** — Les identifiants internes sont des UUID ; les codes fonctionnels sont distincts des identifiants techniques et uniques dans leur périmètre.
- **EX-DAT-02** — Objets versionnés indépendamment : jeu de règles de charge, profil de génération, version de l'adaptateur, snapshot de données, jeu de règles de planification, génération, version de planning, modèles d'export. Une version publiée référence toutes les versions nécessaires à sa reproduction et permet de répondre : « pourquoi ce créneau, cette salle et cet enseignant dans cette version ? ».
- **EX-DAT-03** — Toute modification d'une règle ayant un impact sur une génération identifie les versions concernées, calcule l'impact, signale les plannings potentiellement obsolètes et conserve les anciennes versions. Une règle ne change jamais rétroactivement une version publiée.

## 22. Processus métier et responsabilités

```text
Préparation académique → Répartition pédagogique → Préparation de la planification
   → Génération FET → Sélection et édition → Validation du planning → Publication
   → Modification (nouvelle version) ↺
```

1. **Préparation académique.** L'Administrateur et le Gestionnaire créent l'année et les semestres, configurent grille et correspondance Ramadan, chargent les référentiels et contrôlent les doublons.
2. **Répartition pédagogique.** Chaque Responsable crée les activités de son département, contrôle les volumes, visualise les charges (total inter-départements) et valide.
3. **Préparation de la planification.** Le Gestionnaire saisit contraintes, vœux et exigences de salle, choisit le profil, exécute les contrôles et confirme le périmètre.
4. **Génération.** Snapshot, fichier moteur, exécution par le worker, import, métriques et score ; la génération est conservée intégralement.
5. **Sélection et édition.** Comparaison, adoption, corrections manuelles avec recalcul des conflits, verrous, contrôle complet, soumission.
6. **Validation du planning** (si requise). Chaque département concerné valide ; la revalidation est ciblée.
7. **Publication** (manuelle ou automatique selon EX-WFL-02).
8. **Modification.** Nouvelle version de travail ; la modification d'une donnée pédagogique après validation rouvre la répartition concernée, notifie le Gestionnaire et exige la revalidation des départements impactés avant toute nouvelle génération. Aucune génération n'est lancée automatiquement après une modification départementale.

Matrice RACI (R réalise, A approuve, C consulté, I informé ; un seul A par ligne) :

| Activité | Administrateur | Gestionnaire | Responsable | Direction |
|---|---|---|---|---|
| Créer et configurer l'année | A/R | R | I | I |
| Paramètres pédagogiques et de charge | A/R | I | C | I |
| Référentiels annuels, imports | A | R | C | I |
| Créer et modifier la répartition | I | I | A/R | I |
| Valider la répartition | C | C | A/R | I |
| Configurer les contraintes | A | R | C | I |
| Lancer la génération, comparer, sélectionner | C | A/R | C | I |
| Éditer le planning, gérer les verrous | C | A/R | C | I |
| Soumettre le planning | I | A/R | I | I |
| Valider le planning d'un département | C | I | A/R | I |
| Publier | C | A/R | I | I |
| Consulter le planning publié et les archives | R | R | R | R |
| Exporter | R | R | R | R (officiel) |
| Gérer comptes, sécurité | A/R | I | I | I |
| Consulter l'audit | A/R | R | C | R |

Lorsque l'Administrateur agit à la place d'un Responsable (EX-ROL-06), le Responsable reste responsable métier de son périmètre.

Règles structurantes de gestion du workflow :
- **RB-WF-01** — Les validations de répartition et de planning sont distinctes et historisées.
- **RB-WF-02** — Seules les validations dont le périmètre est impacté sont à refaire.
- **RB-WF-03** — Le système ne lance jamais une génération automatiquement après une modification départementale.
- **RB-WF-04** — Toute génération est liée à un snapshot immuable.
- **RB-WF-05** — Un conflit bloquant n'est jamais transformé en pénalité de score ni masqué par un avertissement accepté.
- **RB-WF-06** — Aucune opération métier ne modifie directement une version publiée.

## 23. Critères d'acceptation et recette

Les scénarios de recette sont exprimés en Given / When / Then.

- **Blocage avant génération.** *Given* une activité sans enseignant, *When* le Gestionnaire ouvre la préparation, *Then* l'activité est signalée bloquante avec un accès direct à la correction et FET ne peut pas être lancé.
- **Génération échouée.** *Given* une version de travail, *When* FET retourne une erreur, *Then* la génération est conservée en échec et la version de travail est intacte.
- **Modification manuelle.** *Given* une proposition adoptée, *When* le Gestionnaire déplace une séance, *Then* les conflits sont recalculés immédiatement et la modification est historisée ; un déplacement créant un blocage est refusé.
- **Enseignant partagé.** *Given* un enseignant intervenant dans deux départements dont les plannings sont validés, *When* une de ses séances est modifiée dans une nouvelle version, *Then* le second département est marqué à revalider ; si aucune de ses séances ni aucun enseignant partagé n'est touché, son approbation est reportée.
- **Génération groupée.** *Given* des modifications de répartition en cours dans plusieurs départements, *When* l'un d'eux termine, *Then* aucune génération n'est lancée tant que toutes les répartitions requises ne sont pas validées.
- **Publication.** *Given* une version validée, *When* le Gestionnaire publie, *Then* les contrôles finaux passent, la version devient immuable, la précédente est archivée et la provenance est conservée.
- **Modification d'une version publiée.** *Given* une version V1 publiée, *When* une modification est demandée, *Then* V1 reste inchangée et une version de travail est créée.
- **Import impactant.** *Given* une donnée utilisée dans une répartition validée, *When* l'aperçu d'import est calculé, *Then* l'impact est présenté avant application et aucune validation n'est modifiée silencieusement.
- **Clôture.** *Given* une année active, *When* l'Administrateur demande la clôture, *Then* la confirmation par saisie du code est exigée et l'année devient définitivement en lecture seule.
- **Verrou incompatible.** *Given* une séance verrouillée sur un créneau où son enseignant est indisponible, *When* le Gestionnaire lance la génération, *Then* le lancement est refusé avec la liste des séances en cause.
- **Avertissement accepté.** *Given* un avertissement de capacité recommandée, *When* le Gestionnaire l'accepte, *Then* l'acceptation est tracée et visible à la publication ; si la séance est déplacée, l'acceptation tombe.

La V1.0 est acceptable lorsqu'elle permet, sur le parcours complet : de créer une année et ses semestres ; de gérer les référentiels ; de réaliser, valider et rouvrir la répartition ; de calculer la charge ; de configurer les contraintes ; de produire un fichier FET cohérent ; de lancer, suivre et interpréter une génération asynchrone ; de conserver, comparer et adopter des générations ; d'éditer avec recalcul des conflits ; de verrouiller ; de valider et publier avec circuit configurable ; de notifier ; de consulter les anciennes versions ; de clôturer une année et d'importer depuis elle ; d'exporter en PDF et Excel ; de conserver l'audit ; de restaurer depuis les sauvegardes ; de disposer du tableau de bord, du contrôle pré-génération actionnable et de la comparaison en mode différences.

## 24. Pilotage du projet

**Jalons.** Validation des décisions → POC FET → conception détaillée → développement → recette → mise en production avec hypercare. Le découpage en lots de livraison (L0 à L7) est décrit dans la spécification technique.

**POC FET obligatoire** avant de figer le service de génération. Il doit prouver que l'architecture peut construire un fichier FET depuis le modèle métier, représenter les contraintes principales, lancer FET en mode automatisé, récupérer et parser les résultats, reconstruire un planning métier, détecter les conflits, comparer plusieurs générations et reproduire une génération. Jeu de données minimal : plusieurs groupes, enseignants et salles ; CM, TD, TP, CI ; une salle spécifique ; capacités différentes ; indisponibilités ; préférences ; pause ; contrainte inter-départementale ; activité verrouillée ; génération réussie et génération impossible ; import et export `.fet`. Critères de sortie : mapping métier → FET déterministe, règles bloquantes contrôlées, règles transformées documentées, règles `APPLICATION_ONLY` contrôlées hors FET, résultat reconstruit, génération reproductible, erreurs exploitables, temps acceptable. Le spike S1 (ADR_S1_FET) couvre les lancements automatisés, la récupération des résultats et la reproductibilité ; le reste relève du lot L4. La matrice de traduction des règles (identifiant, domaine, sévérité, type, traduction FET, entrée FET, contrôles pré/post-génération et édition, message, test, version) est un livrable du POC.

**Critères de préparation au développement.** Modèle métier, workflow, matrice des rôles, règle de charge, règles de salles et d'enseignants, matrice des contraintes et matrice FET validés ; POC FET réussi ; modèle de données, contrats d'API, stratégies de versionnement, de sauvegarde et de sécurité validés ; jeux de données de recette préparés ; stratégie de déploiement et procédure d'exploitation validées.

**Comité de validation.** Gestionnaire (workflow, génération, édition, publication, imports) ; Responsable de département (répartition, charges, validations) ; Responsable pédagogique ou scolarité (formations, groupes, volumes, règle de charge) ; Responsable des salles (capacités, équipements, compatibilités) ; enseignants représentatifs (disponibilités, préférences, lisibilité) ; Responsable informatique (architecture, sécurité, sauvegarde, exploitation) ; Direction et Secrétariat général (responsabilités, chaîne de validation, valeur de l'archive) ; expert FET (faisabilité, limites, performances) ; représentants étudiants (consultation et lisibilité).

**Risques résiduels.**

| Risque | Niveau | Traitement |
|---|---|---|
| Limite de FET sur une règle métier | Élevé | POC et matrice de traduction |
| Règle de charge mal définie | Élevé | Valider séparément charge de référence par grade et coefficients par type avant développement |
| Dépendances inter-départements | Élevé | Analyse d'impact et revalidation ciblée |
| Modification après publication | Élevé | Version de travail obligatoire |
| Import destructif | Élevé | Aperçu, transaction, analyse d'impact |
| Perte de données, serveur unique sans haute disponibilité | Élevé | Sauvegardes testées, restauration documentée, matériel de secours à envisager |
| Mauvaise interprétation des droits | Élevé | Matrice d'accès, tests de permissions |
| Divergence entre FET et application | Élevé | Jeu de règles unique, adaptateur versionné |
| Conflits manuels | Moyen | Recalcul immédiat |
| Performance de génération (grille de 30 minutes) | Moyen | Worker, mesure au spike S1, tests de charge |
| Changements institutionnels | Moyen | Règles versionnées, Decision Log |
| Publication sans relecture si un interrupteur est désactivé | Moyen | Défaut activé, changement audité, confirmation à la soumission |

## 25. Évolutions possibles (hors v1.0)

Génération par périmètre réduit ou en parallèle sur des périmètres indépendants ; graphe d'impact général au-delà de l'enseignant partagé ; verrou de groupe et expiration des verrous ; co-enseignement et partage d'activité ; modules partagés entre formations ; semaines A/B ; saisie des vœux par l'enseignant et comptes enseignants ; gestion individuelle des étudiants et assiduité ; réservation de salles et ressources ; portail public et API externe ; LDAP/AD et exposition Internet ; application mobile ; statistiques avancées ; import de structure depuis un fichier FET externe ; temps de trajet entre sites.

## 26. Decision Log

Format : identifiant, date, problème, décision, justification, impact, demandeur, validateur. Les colonnes « Demandeur » et « Validateur » sont à compléter par la maîtrise d'ouvrage (à l'exception de DL-002, confirmé par le client). Toutes les décisions sont en vigueur dans la version 1.0.

| ID | Date | Problème | Décision | Impact | Demandeur | Validateur |
|---|---|---|---|---|---|---|
| DL-001 | 2026-10-03 | Faut-il garder la validation et la publication ? | Conservées, avec deux interrupteurs globaux activés par défaut | EX-WFL-02 | À renseigner | À renseigner |
| DL-002 | 2026-10-03 | Signification du dernier segment du code de groupe | Identifiant du groupe dans le niveau (1, 2, 3 ou A, B) | EX-ORG-03 | Client | Client (confirmé) |
| DL-003 | 2026-10-03 | Le Responsable voit-il la charge tous départements ? | Oui, le total seulement | EX-ROL-07 | À renseigner | À renseigner |
| DL-004 | 2026-10-03 | Le pas de 30 minutes est-il fixe ? | Oui, pour toute l'institution | EX-CAL-02 | À renseigner | À renseigner |
| DL-005 | 2026-10-03 | Les horaires diffèrent-ils selon les jours ? | Oui, saisie par jour | EX-CAL-02 | À renseigner | À renseigner |
| DL-006 | 2026-10-03 | L'enseignant saisit-il ses vœux ? | Non en v1.0 ; saisie par Gestionnaire ou Administrateur | EX-CTR-03 | À renseigner | À renseigner |
| DL-007 | 2026-10-03 | Qui publie ? | Le Gestionnaire et l'Administrateur | EX-WFL-05 | À renseigner | À renseigner |
| DL-008 | 2026-10-03 | Écart entre déploiement sur site et cloud | Sur site, réseau interne ; cloud abandonné | EX-NFR-01 | À renseigner | À renseigner |
| DL-009 | 2026-10-03 | Licence AGPL de FET | Aucune validation juridique ; réexamen si FET est modifié ou remis à un tiers | EX-MOT-08 | Chef de projet | Architecte |
| DL-010 | 2026-10-03 | Langue de l'application | Français uniquement | EX-NFR-08 | À renseigner | À renseigner |
| DL-011 | 2026-10-03 | Nom de l'application | TAKT | EX-NFR-10 | À renseigner | À renseigner |
| DL-012 | 2026-10-03 | Accès du Directeur et du Secrétaire général | Rôle `DIRECTION` en lecture seule, publié et consultations | EX-ROL-04 | À renseigner | À renseigner |
| DL-013 | 2026-10-03 | Notifications absentes de la conception technique | Module de notifications application + e-mail ; Administrateurs notifiés des échecs de génération et publications | EX-NOT-01 à 03 | À renseigner | À renseigner |
| DL-014 | 2026-10-03 | Ramadan absent de la conception technique | Table de correspondance d'affichage par semestre, choix à l'affichage | EX-CAL-04 | À renseigner | À renseigner |
| DL-015 | 2026-10-03 | Année clôturée réversible ou non | Clôture définitive avec confirmation par saisie du code ; statut archivé supprimé ; import en deux temps | EX-CAL-05, EX-IMP-02 | À renseigner | À renseigner |
| DL-016 | 2026-10-03 | Périmètre et concurrence des générations | Périmètre semestre complet affiché et figé, une génération à la fois ; parallélisme et périmètre réduit en évolution | EX-GEN-02, EX-GEN-05 | À renseigner | À renseigner |
| DL-017 | 2026-10-03 | Graphe d'impact et revalidation | Revalidation ciblée avec report des approbations des départements non impactés | EX-WFL-04 | À renseigner | À renseigner |
| DL-018 | 2026-10-03 | Granularité des verrous | Quatre types par séance, pose en masse, justification facultative | EX-VRR-01 | À renseigner | À renseigner |
| DL-019 | 2026-10-03 | Avertissements acceptés et sévérités | Capacité maximale toujours bloquante ; capacité recommandée, équipement souhaité et vœux en avertissements acceptables | EX-CTR-07 | À renseigner | À renseigner |
| DL-020 | 2026-10-03 | Droits de l'Administrateur | Union des droits du Gestionnaire ; validation par département ; séparation des tâches ; justification facultative | EX-ROL-02, EX-ROL-06 | À renseigner | À renseigner |
| DL-021 | 2026-10-03 | Mots de passe, sessions, audit | Paramètres configurables par l'Administrateur ; audit métier et journal de sécurité séparés ; réinitialisation par l'Administrateur | EX-SEC-03 à 09, EX-AUD-02 | À renseigner | À renseigner |
| DL-022 | 2026-10-09 | Schémas de validation des données | Adoption de Zod pour les schémas de validation partagés entre API, worker et web | EX-NFR-07, EX-NFR-10 | Architecte | Lead Développeur |
| DL-023 | 2026-10-03 | Profils, score, covoiturage | Profil versionné, score normalisé 0-100, covoiturage évalué par l'application avec option stricte | EX-GEN-01, EX-CMP-02, EX-CTR-05 | À renseigner | À renseigner |
| DL-024 | 2026-10-03 | Vocabulaire du « DU » | « Charge » remplace « DU » ; écart mesuré par rapport au service dû ; CM commun compté une fois | EX-CHG-01 à 05 | À renseigner | À renseigner |
| DL-025 | 2026-10-03 | États divergents entre les documents | Codes techniques conservés avec libellés français ; états de soumission de répartition et de publication supprimés | §20 | À renseigner | À renseigner |
| DL-026 | 2026-10-03 | Tableau de bord | Tableau par rôle, cinq actions prioritaires au plus | EX-TDB-01, EX-TDB-02 | À renseigner | À renseigner |
| DL-027 | 2026-10-03 | Configuration des exports | Modèle visuel (Administrateur) et configuration de vue (Gestionnaire) distincts ; sept vues ; brouillon et officiel | EX-EXP-04 à 06 | À renseigner | À renseigner |
| DL-028 | 2026-10-03 | Terminologie des rôles | Gestionnaire, Responsable de département, Direction, Administrateur | §3 | À renseigner | À renseigner |
| DL-029 | 2026-10-03 | Import d'un fichier FET | Export du fichier moteur ; import du résultat d'un fichier exporté (mode manuel) ; import de structure externe en évolution | EX-MOT-07 | À renseigner | À renseigner |
| DL-030 | 2026-10-03 | Gouvernance documentaire | Remise à zéro du versionnement : toute la documentation actuelle est la version 1.0 ; exigences identifiées par codes `EX-` ; historique ancien conservé dans Git (étiquette `archive-avant-v1.0`) | Ensemble | À renseigner | À renseigner |
| DL-031 | 2026-10-04 | Mise à jour de la charte graphique (package V2.2) | Charte retenue ; tokens comme source unique des couleurs de l'interface ; Stencilia-A réservée à la signature de marque | EX-NFR-10 | À renseigner | À renseigner |
| DL-032 | 2026-10-04 | Mise à jour de la charte graphique (package V2.3.6) | Package V2.3.6 retenu ; tokens JSON source unique ; Black Ops One (OFL 1.1) remplace Stencilia-A (DL-031) ; clés d'états alignées sur les codes API ; pas de mode sombre en v1.0 | EX-NFR-10 | À renseigner | À renseigner |
| DL-033 | 2026-10-04 | Version de Node.js | Node.js 24 LTS (LTS active) à la place de Node 22 (en maintenance) ; décision documentaire, aucun impact fonctionnel | ST §0.1 | À renseigner | À renseigner |
| DL-034 | 2026-10-04 | Version de TypeScript | TypeScript 6.x épinglé ; TypeScript 7 écarté tant que typescript-eslint ne le supporte pas | ST §0.1 | À renseigner | À renseigner |
| DL-035 | 2026-10-07 | Version de FET | FET 7.11.1 épinglé à la place de 7.10.5 ; six graines MRG32k3a à la place de `--randomseedx/y` (refusés en 7.11.1) ; issue lue dans `logs/result.txt` (code 0 non fiable) ; poids validés avant appel ; multi-graines pour la qualité souple ; décision fondée sur la documentation `fet-cl` 7.11.1, tests empiriques réalisés (voir ADR S1) | EX-MOT-04, EX-MOT-06, EX-MOT-08, ST §4.6 | Chef de projet | Architecte |
| DL-036 | 2026-10-09 | Hypothèse de volumétrie (HY-01) – définir les volumes réels pour le dimensionnement | 2 départements, 120 enseignants, 30 salles, 500 séances par semestre, 10 comptes, 5 utilisateurs simultanés | Dimensionnement (section 5) | À renseigner | À renseignant |
| DL-037 | 2026-10-09 | Valeurs initiales du jeu de règles de charge (HY-05) – définir les grades, charges de référence, coefficients, seuils | Grades: Assistant, Maître assistant, Maître de conférences, Professeur, PES, PES_P, PES_A, Contrat expert, Vacataire, Contrat (charge de référence = 0). Coeff. activités (CM,TD,TP,CI…) = 1. Seuil = 1. Plafond = charge de référence + 4 | EX-CHG-01 | À renseigner | À renseignant |
| DL-038 | 2026-10-09 | Validation du schéma Prisma de la ST §2.2 (spike S3) | Exécuter la validation du schéma Prisma et confirmer qu'il est valide | À renseigner | À renseigner | À renseigner | À renseignant |
| DL-039 | 2026-10-09 | Positions imposées dans FET | Les verrous sont envoyés comme contraintes d'heure et de salle à poids 100 % sans rendre la régénération « impossible » (spike S1, ticket de régénération partielle) | 4.14, 4.6.2 | À renseigner | À renseignant |
| DL-040 | 2026-10-09 | Conservation INPDP | Audit: 5 ans, journal de sécurité: 3 ans, exports: 1 an (durées configurables, valeurs par défaut à valider avec le DPO) | Politique de purge (EX-AUD-02) | À renseigner | À renseignant |
| DL-041 | 2026-10-09 | Volumes prévus | Validé : l'ISAMK fournit la maquette pédagogique par (module, type) en entrée du processus de saisie guidée (EX-REF-01) | Saisie guidée (EX-REF-01) | À renseigner | À renseignant |

| DL-042 | 2026-10-09 | SMTP institutionnel | Paramètres de `cck.rnu.tn` (port 587, TLS STARTTLS, authentification requise, limites et adresse expéditeur à définir par l'ISAMK) à fournir par l'ISAMK | EX-NOT-02, règle réseau de l'API | À renseigner | À renseignant |
| DL-043 | 2026-10-09 | Serveur sur site | Dimensionnement : 4 vCPU, 16 Go RAM, 200 Go SSD RAID 1 ; sauvegardes : continues (pgBackRest) avec rétention 35 jours complète, fichiers sauvegardés quotidiennement, copie sur support distinct, procédure documentée, tests de restauration trimestriels ; mises à jour : appliquées selon calendrier ISAMK ; surveillance : journaux structurés et métriques (Prometheus/Grafana) avec alertes sur seuils | 1.8, EX-NFR-03 | À renseigner | À renseignant |
| DL-044 | 2026-10-09 | Capacité de salle dans FET | Validé : la règle `ROOM_CAPACITY` est activée et la capacité des salles est prise en compte dans la génération (test T6 à valider lors du déploiement) | 4.6.2 | À renseigner | À renseignant |
| DL-045 | 2026-10-09 | SSO | Non prévu pour v1.0 ; évolution possible vers SSO institutionnel dans les versions futures | EX-SEC-01 | À renseigner | À renseignant |
| DL-046 | 2026-10-09 | Première migration Prisma | Migration initiale créant les tables User, UserRole, RefreshToken et AuditLog avec clés UUID et index appropriés | prisma/migrations/20261009000001_init/ | À renseigner | À renseignant |
| DL-047 | 2026-10-09 | Migration Prisma 8 (spike S4) | Adoption de Prisma 8 (`@prisma/orm-postgres` 8.0.0‑rc.17) avec contrat PSL 8 (`prisma/contract.prisma`), artefacts émis (`contract.json`, `contract.d.ts`), client ORM dans `@takt/db`, migrations gérées par `prisma migration plan` / `db migrate`, ref `db` aligné sur hash `0fa104b8…` ; colonnes `Date` mappées sur `Temporal.PlainDate` (dépendance `temporal-spec`) | 2.4, 3.1, ST §6.1 S4 | Chef de projet | Architecte |
| DL-048 | 2026-10-09 | Choix du format d'erreur API | Adoption de RFC 9457 `application/problem+json` pour toutes les erreurs HTTP, avec catalogue de codes métier | Homogénéité, interopérabilité, traçabilité via requestId | Chef de projet | Architecte |
| DL-049 | 2026-10-09 | Authentification & RBAC | JWT court (15 min) + refresh rotatif argon2id, guard JwtAuthGuard, RolesGuard + @Roles(), périmètre département | Sécurité, moindre privilège, extensible vers SSO | Chef de projet | Architecte |

Toute décision nouvelle est ajoutée à ce registre avec les mêmes colonnes. Le chantier de design (état des couleurs, déclinaisons du logo, tokens complémentaires) est suivi dans `ETAT_PROJET_TAKT.md`.

**Fin de la spécification fonctionnelle — version 1.0**
