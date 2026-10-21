'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  findAllDemandes,
  findDemandeById,
  createDemande,
  traiterDemande,
  type Demande,
  type CreateDemandeInput,
  type TraiterDemandeInput,
  type DemandesQuery,
} from '@/lib/api/demandes';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

// Clés de cache React Query
export const demandesKeys = {
  all: ['demandes'] as const,
  list: (query: DemandesQuery) => [...demandesKeys.all, 'list', query] as const,
  detail: (id: string) => [...demandesKeys.all, 'detail', id] as const,
};

/**
 * Hook pour récupérer la liste paginée des demandes de modification avec filtres.
 */
export function useDemandes(query?: DemandesQuery) {
  return useQuery({
    queryKey: demandesKeys.list(query ?? {}),
    queryFn: () => findAllDemandes(query),
    staleTime: 30_000,
  });
}

/**
 * Hook pour récupérer une demande par son identifiant.
 */
export function useDemande(id: string) {
  return useQuery({
    queryKey: demandesKeys.detail(id),
    queryFn: () => findDemandeById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/**
 * Hook pour créer une demande de modification (Gestionnaire).
 */
export function useCreateDemande() {
  const queryClient = useQueryClient();
  return useMutation<Demande, Error, CreateDemandeInput>({
    mutationFn: createDemande,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: demandesKeys.all });
      toast.success(messages.successDemandeCreated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorCreateDemande);
    },
  });
}

/**
 * Hook pour traiter (accepter/refuser) une demande de modification (Responsable).
 */
export function useTraiterDemande() {
  const queryClient = useQueryClient();
  return useMutation<Demande, Error, { id: string; input: TraiterDemandeInput }>({
    mutationFn: ({ id, input }) => traiterDemande(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: demandesKeys.all });
      toast.success(messages.successDemandeTraitee);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorTraiterDemande);
    },
  });
}
