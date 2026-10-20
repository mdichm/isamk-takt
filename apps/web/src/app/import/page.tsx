// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Page d'import de fichier CSV/XLSX (L1-27)
// Dépôt de fichier, rapport de simulation ligne par ligne, impacts, confirmation.
// Le contenu client est chargé dynamiquement (ssr: false) afin d'éviter toute
// évaluation de React Query pendant le prerender statique.
'use client';

import nextDynamic from 'next/dynamic';

const ImportPageContent = nextDynamic(() => import('./import-page-content'), {
  ssr: false,
});

export const dynamic = 'force-dynamic';

export default function ImportPage() {
  return <ImportPageContent />;
}
