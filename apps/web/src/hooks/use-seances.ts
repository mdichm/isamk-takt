'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  findSeancesByVersion,
  getSuggestions,
  moveSeance,
  type Seance,
  type MoveSeanceDto,
  type SuggestionDto,
} from '@/lib/api/seances';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

export type { Seance, SuggestionDto };

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

// ============================================================================
// Suggestions (L3-25 / L3-26)
// ============================================================================

export const suggestionsKeys = {
  all: ['suggestions'] as const,
  detail: (seanceId: string) => [...suggestionsKeys.all, 'detail', seanceId] as const,
};

/** Hook pour récupérer les suggestions de placement d'une séance. */
export function useSuggestions(
  seanceId: string,
  query?: { jour?: string; creneauDebutId?: string; salleId?: string; enseignantId?: string; limit?: number },
) {
  return useQuery({
    queryKey: suggestionsKeys.detail(seanceId),
    queryFn: () => getSuggestions(seanceId, query),
    enabled: !!seanceId,
    staleTime: 30_000,
  });
}
