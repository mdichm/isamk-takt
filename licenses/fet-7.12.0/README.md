# Licences FET 7.12.0

Ce dossier contient les textes de licence du moteur FET (Free Timetabling Software)
version 7.12.0, utilisé par TAKT.

## Fichiers

- `COPYING` — Texte de la GNU Affero General Public License v3.0 (AGPL v3),
  licence sous laquelle FET est distribué. Texte complet disponible sur
  https://www.gnu.org/licenses/agpl-3.0.txt

- `NOTICE` (à la racine du dépôt) — Notice d'attribution décrivant le mode
  d'intégration de FET dans TAKT (binaire non modifié, processus séparé,
  worker Docker isolé).

## Contexte

FET est utilisé tel quel, en développement interne pour le seul compte de
l'ISAMK, conformément au ticket L7-13 (Conformité / mentions de licence FET).
Le binaire `fet-cl` n'est pas modifié. Il est invoqué en processus séparé
depuis l'API TAKT via son interface CLI.

## Règle de non-modification

FET ne doit pas être modifié. L'application TAKT ni son image Docker ne
doivent pas être remises à une autre entité sans réexamen de la licence
AGPL v3. Toute évolution nécessitant une modification de FET doit faire
l'objet d'une réévaluation juridique.

Voir aussi `docs/ADR_S1_FET.md` (décision d'intégration de FET).