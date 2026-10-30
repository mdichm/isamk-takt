# Jeux de données de recette FET (ticket L7-14)

Ce dossier contient les fichiers `.fet` utilisés pour la stratégie de tests et les jeux de données de recette (ticket L7-14),
conformément aux exigences de la SF §23 et du POC FET (SF §24).

## Fichiers

### `recette-reussite.fet`
Jeu de données couvrant un scénario de génération réussie, avec :
- Plusieurs groupes : M2-CI (divisions A et B), L3-INFO (division A)
- Plusieurs enseignants : M. Martin, Mme. Dubois, M. Durand
- Quatre types de séances : CM, TD, TP, CI
- Salle spécifique : "Salle spécifique CI" (pour les CI)
- Capacités différentes : Amphi A (120), Salle TD 1 (35), Salle TP 1 (24), Salle spécifique CI (30)
- Indisponibilités enseignants : M. Martin indisponible mercredi 14:00, M. Durand indisponible vendredi 16:00
- Préférence : TP M2-CI le mardi 8:00 (poids 80%)
- Pause déjeuner : pas d'activité entre 12:00 et 14:00 tous les jours (poids 100%)
- Activité verrouillée : CI le lundi 8:00 (poids 100%)

### `recette-impossible.fet`
Jeu de données couvrant un scénario de génération impossible, avec :
- Deux activités du même enseignant dans la même salle au même créneau (lundi 8:00)
- Contraintes de verrouillage contradictoires (poids 100% sur les deux)
- Résultat attendu : FET déclare la génération impossible ou retourne un code d'erreur

## Utilisation

Ces fichiers sont utilisés pour valider :
1. L'import de fichiers `.fet` depuis le constructeur métier (ticket L4-09)
2. L'exécution de FET via `fet-cl` (ticket L4-08)
3. Les scénarios de recette documentés dans `docs/tests/recette-scenarios.md` (scénarios 2, 10, 11)

## Références

- Ticket L7-14 : Stratégie de tests et jeux de données de recette
- SF §23 : Critères d'acceptation et recette (scénarios Given/When/Then)
- SF §24 : POC FET (jeu de données minimal)
- ST §5.5 : Qualité, tests et exploitation