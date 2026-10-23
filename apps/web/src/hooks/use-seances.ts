'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  findSeancesByVersion,
  moveSeance,
  type Seance,
  type MoveSeanceDto,
} from '@/lib/api/seances';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

export type { Seance };

// Clés de cache React Query
export const seancesKeys = {
  all: ['seances'] as const,
  list: (versionId: string) => [...seancesKeys.all, 'list', versionId] as const,
};

// ============================================================================
// Lecture
// ============================================================================

/** Hook pour récupérer les séances paginées d'une version. */
export function useSeancesByVersion(
  versionId: string,
  query?: { page?: number; limit?: number; affectationKey?: string },
) {
  return useQuery({
    queryKey: seancesKeys.list(versionId),
    queryFn: () => findSeancesByVersion(versionId, query),
    enabled: !!versionId,
    staleTime: 30_000,
  });
}

// ============================================================================
// Écriture : déplacement de séance (L3-20)
// ============================================================================

/** Hook pour déplacer une séance (PATCH /seances/{id}/placement). */
export function useMoveSeance() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { seanceId: string; dto: MoveSeanceDto; ifMatch: string; versionId: string }>({
    mutationFn: ({ seanceId, dto, ifMatch }) => moveSeance(seanceId, dto, ifMatch),
    onSuccess: (_, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: seancesKeys.list(versionId) });
      toast.success(messages.deplacementReussi);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorDeplacement);
    },
  });
}
