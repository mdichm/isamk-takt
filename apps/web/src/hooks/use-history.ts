'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchHistory, type HistoryResponse } from '@/lib/api/versions';

// Clés de cache React Query
export const historyKeys = {
  all: ['history'] as const,
  detail: (versionId: string) => [...historyKeys.all, 'detail', versionId] as const,
};

/** Hook pour récupérer l'historique des transitions d'une version. */
export function useHistory(versionId: string) {
  return useQuery<HistoryResponse, Error>({
    queryKey: historyKeys.detail(versionId),
    queryFn: () => fetchHistory(versionId),
    enabled: !!versionId,
    staleTime: 30_000,
  });
}
