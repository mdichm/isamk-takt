'use client';

import { Badge } from '@/components/ui/badge';
import { t } from '@/lib/i18n';
import { type GenerationStatut } from '@/lib/api/generations';

interface GenerationStatusBadgeProps {
  statut: GenerationStatut;
}

const STATUT_LABELS: Record<GenerationStatut, string> = {
  QUEUED: t('statutEnAttente'),
  RUNNING: t('statutEnCours'),
  SUCCEEDED: t('statutReussie'),
  SUCCEEDED_WITH_WARNINGS: t('statutReussieAvecAvertissements'),
  FAILED: t('statutEchec'),
  CANCELLED: t('statutAnnulee'),
  TIMED_OUT: t('statutDepassee'),
};

const STATUT_VARIANTS: Record<GenerationStatut, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  QUEUED: 'secondary',
  RUNNING: 'default',
  SUCCEEDED: 'default',
  SUCCEEDED_WITH_WARNINGS: 'secondary',
  FAILED: 'destructive',
  CANCELLED: 'outline',
  TIMED_OUT: 'destructive',
};

export function GenerationStatusBadge({ statut }: GenerationStatusBadgeProps) {
  return (
    <Badge variant={STATUT_VARIANTS[statut]}>
      {STATUT_LABELS[statut]}
    </Badge>
  );
}
