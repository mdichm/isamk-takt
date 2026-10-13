---
paths:
  - "apps/frontend/**"
  - "src/app/**"
  - "components/**"
---
# Architecture & Standards Frontend

## Stack Technique Obligatoire
* **Framework :** Next.js 15 (App Router).
* **Langage :** TypeScript (mode `strict: true` exigé, interdiction absolue du type `any`).
* **Gestion d'état & Fetching :** React Query (TanStack Query).
* **Drag and Drop :** dnd-kit (configuré pour une grille d'édition).
* **Styles & UI :** Tailwind CSS + composants shadcn/ui.
* **Langue & Internationalisation :** i18n (textes obligatoirement externalisés). Interface finale exclusivement en français.
* **Polices :** Auto-hébergées via `next/font`. Interdiction de requêter des CDN externes (Google Fonts, etc.).

## Règles de Code & Patterns
* **Composants :** Utiliser des Server Components (`RSC`) par défaut. Ajouter `'use client'` au niveau le plus bas possible (uniquement si gestion d'état, hooks ou dnd-kit requis).
* **Gestion d'état :** Ne jamais utiliser de variables globales. Privilégier les URL states (`searchParams`) ou React Query pour les états partagés.
* **Intégration d'API :** Utiliser exclusivement le SDK ou les types générés par l'OpenAPI du backend.
* **i18n strict :** Interdiction d'écrire des chaînes de caractères brutes (hardcoded) dans le JSX. Tout texte doit passer par les clés de traduction i18n.
