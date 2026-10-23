'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAvertissements,
  accepterAvertissement,
  type AvertissementConflit,
} from '@/lib/api/avertissements';

export type { AvertissementConflit };
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

// Clés de cache React Query
export const avertissementsKeys = {
  all: ['avertissements'] as const,
  list: (versionId: string) => [...avertissementsKeys.all, 'list', versionId] as const,
};

// ============================================================================
// Lecture : avertissements d'une version
// ============================================================================

/** Hook pour récupérer les avertissements non résolus d'une version. */
export function useAvertissements(versionId: string) {
  return useQuery<AvertissementConflit[], Error>({
    queryKey: avertissementsKeys.list(versionId),
    queryFn: () => listAvertissements(versionId),
    enabled: !!versionId,
    staleTime: 30_000,
  });
}

// ============================================================================
// Écriture : acceptation d'un avertissement
// ============================================================================

/** Hook pour accepter un avertissement (POST ...:accept). */
export function useAccepterAvertissement(versionId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof accepterAvertissement>>,
    Error,
    { signature: string; justification?: string }
  >({
    mutationFn: ({ signature, justification }) =>
      accepterAvertissement(versionId, { signature, justification }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: avertissementsKeys.list(versionId),
      });
      toast.success(messages.avertissementAccepteSucces);
    },
    onError: (error) => {
      const status = (error as { status?: number }).status;
      if (status === 422) {
        toast.error(messages.avertissementErreurBloquant);
      } else if (status === 404) {
        toast.error(messages.avertissementErreurIntrouvable);
      } else {
        toast.error(
          getErrorMessage(error) || messages.avertissementErreurGenerique,
        );
      }
    },
  });
}
