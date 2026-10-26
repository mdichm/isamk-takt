'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { executeTransition, type TransitionRequestDto } from '@/lib/api/versions';
import { conflitsKeys } from '@/hooks/use-conflits';
import { historyKeys } from '@/hooks/use-history';
import { versionKeys } from '@/hooks/use-version';
import { apiFetch } from '@/lib/api/client';
import { getErrorCode, getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

// ============================================================================
// Clés de cache React Query (invalidation après transition)
// ============================================================================

export const versionTransitionKeys = {
  all: ['versionTransition'] as const,
  detail: (versionId: string) => [
    ...versionTransitionKeys.all,
    'detail',
    versionId,
  ] as const,
};

// ============================================================================
// Écriture : exécution d'une transition de workflow (L5-01)
// POST /versions/{id}/transitions
// ============================================================================

/** Hook pour exécuter une transition de workflow sur une version. */
export function useExecuteTransition(versionId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof executeTransition>>,
    Error,
    TransitionRequestDto
  >({
    mutationFn: (dto) => executeTransition(versionId, dto),

    onSuccess: () => {
      toast.success(messages.versionTransitionSucces);
      // Invalider les requêtes dépendantes de l'état de la version.
      queryClient.invalidateQueries({
        queryKey: conflitsKeys.list(versionId),
      });
      queryClient.invalidateQueries({
        queryKey: historyKeys.detail(versionId),
      });
      queryClient.invalidateQueries({
        queryKey: versionTransitionKeys.detail(versionId),
      });
      // L5-19 : le statut final (validé, publié) et le circuit de la version
      // doivent être reflétés immédiatement à l'écran.
      queryClient.invalidateQueries({
        queryKey: versionKeys.detail(versionId),
      });
      queryClient.invalidateQueries({
        queryKey: versionKeys.avertissements(versionId),
      });
    },

    onError: (error) => {
      const status = (error as { status?: number }).status;
      const code = getErrorCode(error);
      // L5-19 : la confirmation de publication a été exigée par le backend.
      if (code === 'CONFIRMATION_PUBLICATION_REQUISE') {
        toast.error(messages.confirmationSoumissionPublication);
      } else if (status === 409) {
        toast.error(messages.versionTransitionInterdite);
      } else if (status === 422) {
        toast.error(messages.versionNonSoumettable);
      } else if (status === 403) {
        toast.error(messages.validationInterdite);
      } else {
        toast.error(getErrorMessage(error) || messages.versionTransitionErreur);
      }
    },
  });
}

// ============================================================================
// Lecture : détection des avertissements avant soumission
// ============================================================================

/**
 * Retourne le nombre d'avertissements (conflits de sévérité AVERTISSEMENT
 * non résolus) sur une version. Ce compte est une borne supérieure du
 * nombre d'avertissements non acceptés : le statut d'acceptation exact
 * est géré côté backend (AvertissementAccepte avec caduqueLe = null).
 * Retourne undefined si la lecture échoue.
 */
export async function countAvertissements(
  versionId: string,
): Promise<number | undefined> {
  try {
    const res = await apiFetch(`/versions/${versionId}/conflits`);
    const conflits = (await res.json()) as {
      severite: string;
      resoluLe: string | null;
    }[];
    return conflits.filter(
      (c) => c.severite === 'AVERTISSEMENT' && !c.resoluLe,
    ).length;
  } catch {
    return undefined;
  }
}
