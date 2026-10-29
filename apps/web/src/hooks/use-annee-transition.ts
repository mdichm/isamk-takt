'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transitionAnnee, type TransitionResponseDto } from '@/lib/api/annees';
import { apiFetch } from '@/lib/api/client';
import { getErrorCode, getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

// ============================================================================
// Clés de cache React Query (invalidation après clôture)
// ============================================================================

const ANNEE_TRANSITION_ALL = ['anneeTransition'] as const;

export const anneeTransitionKeys = {
  all: ANNEE_TRANSITION_ALL,
  detail: (anneeId: string) => [...ANNEE_TRANSITION_ALL, 'detail', anneeId] as const,
  list: [...ANNEE_TRANSITION_ALL, 'list'] as const,
};

// ============================================================================
// Écriture : clôture d'une année universitaire (L7-01)
// POST /annees/{id}/transitions action CLOTURER
// ============================================================================

/** Hook pour exécuter la clôture d'une année avec confirmation par code. */
export function useTransitionAnnee(anneeId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    TransitionResponseDto,
    Error,
    { confirmation: string; motif?: string }
  >({
    mutationFn: ({ confirmation, motif }) =>
      transitionAnnee(anneeId, { action: 'CLOTURER', confirmation, motif }),

    onSuccess: () => {
      toast.success(messages.clotureSucces);
      // Invalider les requêtes dépendantes de l'état de l'année.
      queryClient.invalidateQueries({ queryKey: anneeTransitionKeys.detail(anneeId) });
      queryClient.invalidateQueries({ queryKey: anneeTransitionKeys.list });
    },

    onError: (error) => {
      const status = (error as { status?: number }).status;
      const code = getErrorCode(error);
      if (code === 'CONFIRMATION_MISMATCH' || status === 422) {
        toast.error(messages.clotureErreurConfirmation);
      } else if (status === 409) {
        toast.error(messages.clotureErreurConflit);
      } else if (status === 404) {
        toast.error(messages.clotureErreurGenerique);
      } else {
        toast.error(getErrorMessage(error) || messages.clotureErreurGenerique);
      }
    },
  });
}

// ============================================================================
// Lecture : détection si une version est en validation (garde avant clôture)
// ============================================================================

/**
 * Indique si au moins une version de l'année est en statut EN_VALIDATION.
 * Retourne undefined si la lecture échoue.
 */
export async function hasVersionEnValidation(anneeId: string): Promise<boolean | undefined> {
  try {
    const res = await apiFetch(`/versions?anneeId=${encodeURIComponent(anneeId)}`);
    const versions = (await res.json()) as { statut: string }[];
    return versions.some((v) => v.statut === 'EN_VALIDATION');
  } catch {
    return undefined;
  }
}
