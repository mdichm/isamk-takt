// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Badge d'action d'import (L1-27)
'use client';

import { ImportAction } from '@/lib/api/import-fichier';
import { messages } from '@/lib/messages/fr';

export type ImportActionBadgeProps = {
  action: ImportAction;
};

const VARIANTS: Record<ImportAction, string> = {
  ajout: 'bg-green-100 text-green-700',
  modification: 'bg-blue-100 text-blue-700',
  doublon: 'bg-gray-100 text-gray-700',
  conflit: 'bg-red-100 text-red-700',
  erreur: 'bg-orange-100 text-orange-700',
};

const LABELS: Record<ImportAction, string> = {
  ajout: messages.importActionAjout,
  modification: messages.importActionModification,
  doublon: messages.importActionDoublon,
  conflit: messages.importActionConflit,
  erreur: messages.importActionErreur,
};

export function ImportActionBadge({ action }: ImportActionBadgeProps) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${VARIANTS[action]}`}>
      {LABELS[action]}
    </span>
  );
}
