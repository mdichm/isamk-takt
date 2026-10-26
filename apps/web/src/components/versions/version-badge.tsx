/**
 * VersionBadge - Affiche le statut d'une version avec son libellé français
 * (SF §20) et une couleur complémentaire.
 *
 * La couleur ne porte jamais seule l'information : le libellé est toujours
 * présent à côté du badge.
 */

import { Badge } from '@/components/ui/badge';
import { messages } from '@/lib/messages/fr';

type VersionStatut =
  | 'BROUILLON'
  | 'EDITION'
  | 'PRET_POUR_VALIDATION'
  | 'EN_VALIDATION'
  | 'VALIDE'
  | 'PUBLIE'
  | 'ARCHIVE'
  | 'CORRECTION'
  | 'REJETE';

interface VersionBadgeProps {
  statut: string;
}

const STATUT_CONFIG: Record<
  VersionStatut,
  { label: string; className: string }
> = {
  BROUILLON: {
    label: messages.statutBrouillon,
    className: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100',
  },
  EDITION: {
    label: messages.statutEdition,
    className: 'bg-blue-100 text-blue-900',
  },
  PRET_POUR_VALIDATION: {
    label: messages.statutPretPourValidation,
    className: 'bg-blue-100 text-blue-900',
  },
  EN_VALIDATION: {
    label: messages.statutEnValidation,
    className: 'bg-amber-100 text-amber-900',
  },
  VALIDE: {
    label: 'Validé',
    className: 'bg-green-100 text-green-900',
  },
  PUBLIE: {
    label: 'Publié',
    className: 'bg-green-100 text-green-900',
  },
  ARCHIVE: {
    label: messages.statutArchivee,
    className: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  },
  CORRECTION: {
    label: messages.statutCorrection,
    className: 'bg-orange-100 text-orange-900',
  },
  REJETE: {
    label: messages.statutRejetee,
    className: 'bg-red-100 text-red-900',
  },
};

/** Affiche le statut d'une version sous forme de badge coloré avec libellé. */
export function VersionBadge({ statut }: VersionBadgeProps) {
  const cle = statut as VersionStatut;
  const config = STATUT_CONFIG[cle] ?? {
    label: String(statut),
    className: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100',
  };

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
