'use client';

import { useQuery } from '@tanstack/react-query';
import {
  findAllRepartitions,
  type PaginatedRepartitions,
  type RepartitionsQuery,
} from '@/lib/api/repartitions';

// Clés de cache React Query
export const repartitionsKeys = {
  all: ['repartitions'] as const,
  list: (query: RepartitionsQuery) => [...repartitionsKeys.all, 'list', query] as const,
};

/**
 * Hook pour récupérer la liste paginée des répartitions avec filtres.
 */
export function useRepartitions(query?: RepartitionsQuery) {
  return useQuery<PaginatedRepartitions, Error>({
    queryKey: repartitionsKeys.list(query ?? {}),
    queryFn: () => findAllRepartitions(query),
    staleTime: 30_000,
  });
}