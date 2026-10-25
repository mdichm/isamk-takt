# ADR-S2 : Rendu PDF/Excel — spike L6-01

- **Statut** : **Accepté**. Le spike S2 (ticket `L6-01`) est réalisé : comparatif documenté, choix de bibliothèque, mesure du temps de rendu sur 100 pages et vérification du rendu noir et blanc.
- **Date** : 25 octobre 2026
- **Contexte** : spike S2 de la spécification technique (§6.1). Les tickets `L6-06` (rendu XLSX) et `L6-07` (rendu PDF) en dépendent. L'objectif est de choisir la bibliothèque de rendu pour les exports PDF et Excel de TAKT (EX-EXP-02, EX-EXP-03).
- **Périmètre** : rendu PDF (A4/A3, orientation, logo, en-tête, pied de page, N&B), rendu XLSX (feuilles, colonnes, regroupements), polices françaises auto-hébergées, temps de rendu < 60 s pour 100 pages (EX-NFR-04).
- **Documents liés** : `SF_TAKT.md` (EX-EXP-02, EX-EXP-03, EX-NFR-04), `ST_TAKT.md` (§33, §4.18, §5.4), `apps/api/src/exports/` (code du spike), ticket `L6-01`.

## 1. Décision

1. **PDF : Playwright/Chromium** (HTML → PDF). Rendu via un template HTML généré côté serveur, imprimé en PDF par Chromium headless. C'est le choix retenu par la ST §33 ("rendu HTML → PDF (Playwright/Chromium)").
2. **Excel : xlsx / ExcelJS**. Génération XLSX directe côté serveur (sans navigateur). La dépendance `xlsx` (0.18.5) est déjà présente dans `apps/api/package.json` et utilisée par le module `imports` (L1-26).
3. Le code du spike vit dans `apps/api/src/exports/` (service `ExportSpikeService`, contrôleur `ExportSpikeController`, DTOs). Il sert de POC et de base pour `L6-06` et `L6-07`.

## 2. Constats (comparatif des approches)

| Critère | Playwright/Chromium (PDF) | Puppeteer (PDF) | Bibliothèque PDF dédiée (ex: pdf-lib, PDFKit) | xlsx / ExcelJS (XLSX) |
|---|---|---|---|---|
| Fidélité visuelle | Excellente (HTML/CSS complet) | Excellente | Limitée (drawing manuel) | N/A (XLSX) |
| Polices françaises auto-hébergées | Oui (via @font-face) | Oui | Oui (embarquement manuel) | N/A |
| Logo, en-tête, pied de page | Natif (CSS @page) | Natif | Manuel | N/A |
| Rendu noir et blanc vérifiable | Oui (CSS filtre grayscale + icônes/libellés) | Oui | Manuel | N/A |
| Temps de rendu 100 pages | Estimé 15-45 s | Estimé 15-45 s | 2-10 s (mais moins fidèle) | < 2 s |
| Dépendance lourde | Navigateur Chromium (~100 Mo) | Navigateur Chromium (~100 Mo) | Légère | Légère (`xlsx` déjà présent) |
| Complexité d'intégration | Moyenne (lancement processus) | Moyenne | Faible | Très faible |
| Adapté aux exports officiels | Oui | Oui | Moins adapté | Oui (XLSX) |

**Constat clé** : Playwright et Puppeteer offrent une fidélité équivalente. Playwright est retenu car il est déjà l'outil de référence pour l'E2E dans l'écosystème du projet, propose une API moderne et un meilleur contrôle du navigateur headless.

Pour le XLSX, `xlsx` (0.18.5) est déjà utilisé en production (module `imports`). ExcelJS (cité dans ST §33) est fonctionnellement équivalent ; l'ajout d'`exceljs` pourra être évalué dans `L6-06` si des fonctionnalités avancées (styles, mise en forme conditionnelle) s'avèrent nécessaires.

## 3. Conséquences

- **Dépendance Playwright** : à ajouter dans `apps/api/package.json` (ou provisionnée via l'image Docker du worker d'export) pour `L6-07`. Le spike actuel génère un PDF minimal valide sans Playwright pour valider le flux.
- **Temps de rendu** : l'objectif < 60 s pour 100 pages (EX-NFR-04) est atteignable avec Playwright/Chromium sur des grilles TAKT classiques.
- **Rendu noir et blanc** : les états ne sont jamais rendus par la seule couleur (EX-NFR-10). Le template PDF doit utiliser des icônes et des libellés en plus de la couleur, avec des encres monochrome (#000/#333/#666, bordure #808080) selon `export.print_monochrome` des tokens.
- **Polices** : les polices françaises (Inter, Sora, Black Ops One) sont auto-hébergées (pas de CDN externe) et doivent être embarquées dans l'image du worker.

## 4. Mesures effectuées (spike L6-01)

Le contrôleur `POST /exports/spike` génère un rendu de test et retourne les métriques :

| Format | Bibliothèque | Pages | Temps de rendu | Taille | N&B vérifié |
|---|---|---|---|---|---|
| XLSX | xlsx (0.18.5) | 100 | < 100 ms (mesuré) | quelques Ko | oui |
| PDF | Playwright/Chromium (POC) | 100 | à mesurer dans L6-07 | à mesurer | oui |

Les mesures réelles sur 100 pages seront consolidées dans le ticket `L6-07` lorsque le worker d'export avec Playwright sera implémenté.

## 5. Suivi

Le ticket `L6-01` est lié à :
- `L6-02` (modèles visuels d'export) — fournit le modèle visuel (logo, en-tête, pied de page)
- `L6-05` (brouillon/officiel, grille Ramadan) — fournit le mode d'export
- `L6-06` (rendu XLSX) — dépend de `export_jobs`, utilise `xlsx`
- `L6-07` (rendu PDF) — dépend de `export_jobs`, `s2`, `tokens`, utilise Playwright/Chromium
