'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listConflits,
  simulatePlacement,
  type Conflit,
  type SimulatePlacementInput,
  type SimulatePlacementResponse,
} from '@/lib/api/conflits';
import { accepterAvertissement } from '@/lib/api/avertissements';

export type { Conflit };

import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

// Clés de cache React Query
export const conflitsKeys = {
  all: ['conflits'] as const,
  list: (versionId: string) => [...conflitsKeys.all, 'list', versionId] as const,
};

// ============================================================================
// Lecture : conflits d'une version
// ============================================================================

/** Hook pour récupérer les conflits non résolus d'une version. */
export function useConflits(versionId: string) {
  return useQuery<Conflit[], Error>({
    queryKey: conflitsKeys.list(versionId),
    queryFn: () => listConflits(versionId),
    enabled: !!versionId,
    staleTime: 30_000,
  });
}

// ============================================================================
// Écriture : simulation de placement (avant dépôt)
// ============================================================================

/** Hook pour simuler un placement de séance sans l'écrire en base. */
export function useSimulatePlacement(seanceId: string) {
  return useMutation<
    SimulatePlacementResponse,
    Error,
    SimulatePlacementInput
  >({
    mutationFn: (input) => simulatePlacement(seanceId, input),
    onSuccess: () => {
      toast.success(messages.simulationSucces);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorGeneric);
    },
  });
}

// ============================================================================
// Écriture : acceptation d'un avertissement (déplacé depuis L3-40)
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
        queryKey: conflitsKeys.list(versionId),
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
