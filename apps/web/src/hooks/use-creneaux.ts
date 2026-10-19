'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  findAllCreneaux,
  findCreneauById,
  createCreneau,
  updateCreneau,
  deleteCreneau,
  duplicateCreneaux,
  type Creneau,
  type CreateCreneauInput,
  type UpdateCreneauInput,
  type CreneauQuery,
  type DuplicateCreneauxInput,
  type DuplicateCreneauxResponse,
} from '@/lib/api/creneaux';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

// Clés de cache React Query
export const creneauxKeys = {
  all: ['creneaux'] as const,
  list: (query: CreneauQuery) => [...creneauxKeys.all, 'list', query] as const,
  detail: (id: string) => [...creneauxKeys.all, 'detail', id] as const,
};

/**
 * Hook pour récupérer la liste paginée des créneaux avec filtres.
 */
export function useCreneaux(query?: CreneauQuery) {
  return useQuery({
    queryKey: creneauxKeys.list(query ?? {}),
    queryFn: () => findAllCreneaux(query),
    staleTime: 30_000,
  });
}

/**
 * Hook pour récupérer un créneau par son ID.
 */
export function useCreneau(id: string) {
  return useQuery({
    queryKey: creneauxKeys.detail(id),
    queryFn: () => findCreneauById(id),
    enabled: !!id,
  });
}

/**
 * Hook pour créer un créneau ou une pause.
 */
export function useCreateCreneau() {
  const queryClient = useQueryClient();
  return useMutation<Creneau, Error, CreateCreneauInput>({
    mutationFn: createCreneau,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creneauxKeys.all });
      toast.success(messages.successCreneauCreated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorCreateCreneau);
    },
  });
}

/**
 * Hook pour mettre à jour un créneau.
 */
export function useUpdateCreneau() {
  const queryClient = useQueryClient();
  return useMutation<Creneau, Error, { id: string; input: UpdateCreneauInput }>({
    mutationFn: ({ id, input }) => updateCreneau(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: creneauxKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: creneauxKeys.all });
      toast.success(messages.successCreneauUpdated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorUpdateCreneau);
    },
  });
}

/**
 * Hook pour désactiver (soft delete) un créneau.
 */
export function useDeleteCreneau() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteCreneau,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creneauxKeys.all });
      toast.success(messages.successCreneauDeleted);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorDeleteCreneau);
    },
  });
}

/**
 * Hook pour dupliquer les créneaux d'un semestre vers un autre.
 */
export function useDuplicateCreneaux() {
  const queryClient = useQueryClient();
  return useMutation<DuplicateCreneauxResponse, Error, DuplicateCreneauxInput>({
    mutationFn: duplicateCreneaux,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creneauxKeys.all });
      toast.success(messages.successCreneauDuplicated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorDuplicateCreneaux);
    },
  });
}
