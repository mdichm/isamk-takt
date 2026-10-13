# TAKT — Brand & Design Package V2.3.6

Référence officielle : **TAKT_3**.
Direction : **Argile & Sable chaleureux**.

## Versioning
- Version du package : **V2.3.6**.
- Version des tokens : **2.3.6**, source JSON `02_Design_System/TAKT_design_tokens_v2_3_6.json`.
- Les documents `.docx` et `.pdf` sont en V2.3.6 et restent à resynchroniser avec les tokens 2.3.6.

## Source de vérité
La spécification fonctionnelle du projet reste la source de vérité métier. Les tokens JSON sont la source de vérité pour l’implémentation visuelle et les contrats d’état frontend. Les écrans du Mockup Book sont des références UI/UX génériques et ne constituent pas une spécification fonctionnelle exhaustive.

## V2.3.6
- Alignement des clés d’états sur les codes API.
- Restauration de `states.severity` : `BLOQUANT`, `AVERTISSEMENT`, `INFORMATION`.
- Contraste erreur : `color.status.error.text` et couverture étendue des textes d’états.
- `REPORTEE` séparé du groupe `decision`.
- `REGLE_DURE`, `REGLE_SOUPLE` et `VOEU` traités comme dérivés UI, pas comme codes API.
- Ajout des six icônes métier non couvertes par Lucide.
- Pattern alternatif pour `À placer` sur Warm et Inset.
- Migration documentée depuis V2.3.5.

## V2.3.6 (correctif des tokens)
- Source JSON : `02_Design_System/TAKT_design_tokens_v2_3_6.json` (remplace la 2.3.6).
- Blocs racine dupliqués `lock`, `constraint`, `origin`, `warning_acceptance` supprimés : `states.*` est l'unique source.
- Bordure de champ `#858E91` : 3:1 sur Ivory, Warm, Inset et Card.
- Paires UI et navigation sur Deep déclarées dans `automated_test` ; exemption corrigée (`color.navigation_on_deep.text_disabled`).
- Les `.docx` et `.pdf` du package restent à resynchroniser avec ce JSON.

## Logo system
1. Color — master
2. Monochrome Deep
3. Monochrome Ivory
4. Inversé Deep/Ivory/Clay
5. Horizontal Compact
6. Symbole
7. Favicon / App icons dérivés du symbole

## Licence typographique
Black Ops One est sous SIL Open Font License 1.1. Voir `01_Brand_Guidelines/OFL-Black-Ops-One.txt`.

## Icônes métier
Voir `02_Design_System/icons/` pour : `lock-calendar`, `lock-room`, `lock-teacher`, `lock-activity`, `triangle-alert-check`, `triangle-alert-clock`.

## Licence / nettoyage
Le package est nettoyé des anciennes références de marque.
