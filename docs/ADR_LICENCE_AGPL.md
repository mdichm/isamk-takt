# ADR - Licence AGPL-3.0-or-later

## Statut
Acceptée

## Contexte
Le projet TAKT intègre le moteur de planification FET via l'adaptateur `fet-cl`.  
`fet-cl` est distribué sous licence AGPL v3.

Le dépôt était initialement sous MIT.

## Décision
Passer l'ensemble du projet TAKT sous **AGPL-3.0-or-later**.

- Remplacement de `LICENSE` par le texte AGPL v3.
- Mise à jour du badge et de la section Licence du README.
- `COPYING` conserve le texte de référence AGPL v3.

## Conséquences
- Toute distribution du logiciel, y compris via un réseau, impose la publication du code source complet sous AGPL-3.0.
- Les modifications apportées au worker FET et à l'adaptateur doivent être rendues publiques avec les changements correspondants.
- Les packages internes du monorepo héritent de la même licence.

## Références
- GNU AGPL v3 : https://www.gnu.org/licenses/agpl-3.0.html
- `fet-cl` licence AGPL v3
