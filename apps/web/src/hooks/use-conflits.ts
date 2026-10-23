'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  listConflits,
  simulatePlacement,
  type Conflit,
  type SimulatePlacementInput,
  type SimulatePlacementResponse,
} from '@/lib/api/conflits';

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
