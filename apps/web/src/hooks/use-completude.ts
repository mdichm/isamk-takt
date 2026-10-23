'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchCompletude, type CompletudeResponse } from '@/lib/api/versions';

// Clés de cache React Query
export const completudeKeys = {
  all: ['completude'] as const,
  detail: (versionId: string) => [...completudeKeys.all, 'detail', versionId] as const,
};

/** Hook pour récupérer la couverture/complétude d'une version. */
export function useCompletude(versionId: string) {
  return useQuery<CompletudeResponse, Error>({
    queryKey: completudeKeys.detail(versionId),
    queryFn: () => fetchCompletude(versionId),
    enabled: !!versionId,
    staleTime: 30_000,
  });
}