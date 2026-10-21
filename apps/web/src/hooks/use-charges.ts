'use client';

import { useQuery } from '@tanstack/react-query';
import {
  findAllCharges,
  findChargeByEnseignant,
  type ChargesQuery,
  type ChargeEnseignant,
  type PaginatedCharges,
} from '@/lib/api/charges';

// Clés de cache React Query
export const chargesKeys = {
  all: ['charges'] as const,
  list: (query: ChargesQuery) => [...chargesKeys.all, 'list', query] as const,
  detail: (enseignantId: string) => [...chargesKeys.all, 'detail', enseignantId] as const,
};

/**
 * Hook pour récupérer la liste paginée des charges avec filtres.
 */
export function useCharges(query?: ChargesQuery) {
  return useQuery<PaginatedCharges, Error>({
    queryKey: chargesKeys.list(query ?? {}),
    queryFn: () => findAllCharges(query),
    staleTime: 30_000,
  });
}

/**
 * Hook pour récupérer la charge détaillée d’un enseignant.
 */
export function useChargeByEnseignant(enseignantId: string) {
  return useQuery<ChargeEnseignant, Error>({
    queryKey: chargesKeys.detail(enseignantId),
    queryFn: () => findChargeByEnseignant(enseignantId),
    enabled: !!enseignantId,
  });
}