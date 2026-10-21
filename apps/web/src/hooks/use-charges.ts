'use client';

import { useQuery } from '@tanstack/react-query';
import {
  findAllCharges,
  findChargeByEnseignant,
  findAnnualCharges,
  findChargeGlobale,
  type ChargesQuery,
  type ChargeEnseignant,
  type ChargeGlobaleDto,
  type AnnualChargesDto,
  type AnnualChargesQuery,
  type PaginatedCharges,
} from '@/lib/api/charges';

// Clés de cache React Query
export const chargesKeys = {
  all: ['charges'] as const,
  list: (query: ChargesQuery) => [...chargesKeys.all, 'list', query] as const,
  detail: (enseignantId: string) => [...chargesKeys.all, 'detail', enseignantId] as const,
  annuelle: (query?: AnnualChargesQuery) =>
    [...chargesKeys.all, 'annuelles', query] as const,
  globale: (enseignantId: string) =>
    [...chargesKeys.all, 'globale', enseignantId] as const,
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

/**
 * Hook pour récupérer la charge globale d’un enseignant (multi-départements).
 */
export function useChargeGlobale(enseignantId: string) {
  return useQuery<ChargeGlobaleDto, Error>({
    queryKey: chargesKeys.globale(enseignantId),
    queryFn: () => findChargeGlobale(enseignantId),
    enabled: !!enseignantId,
  });
}

/**
 * Hook pour récupérer la vue annuelle des charges (S1 + S2).
 */
export function useAnnualCharges(query?: AnnualChargesQuery) {
  return useQuery<AnnualChargesDto, Error>({
    queryKey: chargesKeys.annuelle(query),
    queryFn: () => findAnnualCharges(query),
    staleTime: 30_000,
  });
}