'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  findAllDecharges,
  findDechargeById,
  createDecharge,
  updateDecharge,
  deleteDecharge,
  type Decharge,
  type CreateDechargeInput,
  type UpdateDechargeInput,
  type DechargesQuery,
} from '@/lib/api/decharges';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

// Clés de cache React Query
export const dechargesKeys = {
  all: ['decharges'] as const,
  list: (query: DechargesQuery) => [...dechargesKeys.all, 'list', query] as const,
  detail: (id: string) => [...dechargesKeys.all, 'detail', id] as const,
};

/**
 * Hook pour récupérer la liste paginée des décharges avec filtres.
 */
export function useDecharges(query?: DechargesQuery) {
  return useQuery({
    queryKey: dechargesKeys.list(query ?? {}),
    queryFn: () => findAllDecharges(query),
    staleTime: 30_000,
  });
}

/**
 * Hook pour récupérer une décharge par son ID.
 */
export function useDecharge(id: string) {
  return useQuery({
    queryKey: dechargesKeys.detail(id),
    queryFn: () => findDechargeById(id),
    enabled: !!id,
  });
}

/**
 * Hook pour créer une décharge (réservé à l'Administrateur).
 */
export function useCreateDecharge() {
  const queryClient = useQueryClient();
  return useMutation<Decharge, Error, CreateDechargeInput>({
    mutationFn: createDecharge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dechargesKeys.all });
      toast.success(messages.successDechargeCreated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorCreateDecharge);
    },
  });
}

/**
 * Hook pour mettre à jour une décharge (réservé à l'Administrateur).
 */
export function useUpdateDecharge() {
  const queryClient = useQueryClient();
  return useMutation<Decharge, Error, { id: string; input: UpdateDechargeInput }>({
    mutationFn: ({ id, input }) => updateDecharge(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: dechargesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: dechargesKeys.all });
      toast.success(messages.successDechargeUpdated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorUpdateDecharge);
    },
  });
}

/**
 * Hook pour supprimer une décharge (réservé à l'Administrateur).
 */
export function useDeleteDecharge() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteDecharge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dechargesKeys.all });
      toast.success(messages.successDechargeDeleted);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorDeleteDecharge);
    },
  });
}
