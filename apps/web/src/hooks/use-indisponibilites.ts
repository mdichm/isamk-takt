'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  findAllIndisponibilites,
  findIndisponibiliteById,
  createIndisponibilite,
  updateIndisponibilite,
  deleteIndisponibilite,
  type Indisponibilite,
  type CreateIndisponibiliteInput,
  type UpdateIndisponibiliteInput,
  type IndisponibiliteQuery,
} from '@/lib/api/indisponibilites';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

// Clés de cache React Query
export const indisponibilitesKeys = {
  all: ['indisponibilites'] as const,
  list: (query: IndisponibiliteQuery) => [...indisponibilitesKeys.all, 'list', query] as const,
  detail: (id: string) => [...indisponibilitesKeys.all, 'detail', id] as const,
};

/**
 * Hook pour récupérer la liste paginée des indisponibilités avec filtres.
 */
export function useIndisponibilites(query?: IndisponibiliteQuery) {
  return useQuery({
    queryKey: indisponibilitesKeys.list(query ?? {}),
    queryFn: () => findAllIndisponibilites(query),
    staleTime: 30_000,
  });
}

/**
 * Hook pour récupérer une indisponibilité par son ID.
 */
export function useIndisponibilite(id: string) {
  return useQuery({
    queryKey: indisponibilitesKeys.detail(id),
    queryFn: () => findIndisponibiliteById(id),
    enabled: !!id,
  });
}

/**
 * Hook pour créer une indisponibilité.
 */
export function useCreateIndisponibilite() {
  const queryClient = useQueryClient();
  return useMutation<Indisponibilite, Error, CreateIndisponibiliteInput>({
    mutationFn: createIndisponibilite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: indisponibilitesKeys.all });
      toast.success(messages.successIndisponibiliteCreated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorCreateIndisponibilite);
    },
  });
}

/**
 * Hook pour mettre à jour une indisponibilité.
 */
export function useUpdateIndisponibilite() {
  const queryClient = useQueryClient();
  return useMutation<Indisponibilite, Error, { id: string; input: UpdateIndisponibiliteInput }>({
    mutationFn: ({ id, input }) => updateIndisponibilite(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: indisponibilitesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: indisponibilitesKeys.all });
      toast.success(messages.successIndisponibiliteUpdated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorUpdateIndisponibilite);
    },
  });
}

/**
 * Hook pour désactiver (soft delete) une indisponibilité.
 */
export function useDeleteIndisponibilite() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteIndisponibilite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: indisponibilitesKeys.all });
      toast.success(messages.successIndisponibiliteDeleted);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorDeleteIndisponibilite);
    },
  });
}
