'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  findAllAffectations,
  createAffectation,
  updateAffectation,
  deleteAffectation,
  type Affectation,
  type CreateAffectationInput,
  type UpdateAffectationInput,
  type AffectationsQuery,
} from '@/lib/api/repartitions';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

// Clés de cache React Query
export const affectationsKeys = {
  all: ['affectations'] as const,
  list: (repartitionId: string, query: AffectationsQuery) =>
    [...affectationsKeys.all, 'list', repartitionId, query] as const,
  detail: (id: string) => [...affectationsKeys.all, 'detail', id] as const,
};

/**
 * Hook pour récupérer la liste paginée des affectations d'une répartition.
 */
export function useAffectations(
  repartitionId: string,
  query?: AffectationsQuery,
) {
  return useQuery({
    queryKey: affectationsKeys.list(repartitionId, query ?? {}),
    queryFn: () => findAllAffectations(repartitionId, query),
    enabled: !!repartitionId,
    staleTime: 30_000,
  });
}

/**
 * Hook pour créer une affectation.
 */
export function useCreateAffectation() {
  const queryClient = useQueryClient();
  return useMutation<Affectation, Error, { repartitionId: string; input: CreateAffectationInput }>({
    mutationFn: ({ repartitionId, input }) => createAffectation(repartitionId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: affectationsKeys.list(variables.repartitionId, {}),
      });
      toast.success(messages.successAffectationCreated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorCreateAffectation);
    },
  });
}

/**
 * Hook pour mettre à jour une affectation.
 */
export function useUpdateAffectation() {
  const queryClient = useQueryClient();
  return useMutation<
    Affectation,
    Error,
    { repartitionId: string; id: string; input: UpdateAffectationInput }
  >({
    mutationFn: ({ repartitionId, id, input }) =>
      updateAffectation(repartitionId, id, input),
    onSuccess: (_, { repartitionId }) => {
      queryClient.invalidateQueries({
        queryKey: affectationsKeys.list(repartitionId, {}),
      });
      toast.success(messages.successAffectationUpdated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorUpdateAffectation);
    },
  });
}

/**
 * Hook pour supprimer une affectation.
 */
export function useDeleteAffectation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { repartitionId: string; id: string }>({
    mutationFn: ({ repartitionId, id }) => deleteAffectation(repartitionId, id),
    onSuccess: (_, { repartitionId }) => {
      queryClient.invalidateQueries({
        queryKey: affectationsKeys.list(repartitionId, {}),
      });
      toast.success(messages.successAffectationDeleted);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorDeleteAffectation);
    },
  });
}
