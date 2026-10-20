'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  findAllCreneauxAffichage,
  findCreneauAffichageById,
  createCreneauAffichage,
  updateCreneauAffichage,
  deleteCreneauAffichage,
  duplicateCreneauxAffichage,
  type CreneauAffichage,
  type CreateCreneauAffichageInput,
  type UpdateCreneauAffichageInput,
  type CreneauAffichageQuery,
  type DuplicateCreneauxAffichageInput,
  type DuplicateCreneauxAffichageResponse,
} from '@/lib/api/ramadan';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

// Clés de cache React Query
export const creneauxAffichageKeys = {
  all: ['creneaux-affichage'] as const,
  list: (query: CreneauAffichageQuery) => [...creneauxAffichageKeys.all, 'list', query] as const,
  detail: (id: string) => [...creneauxAffichageKeys.all, 'detail', id] as const,
};

/**
 * Hook pour récupérer la liste paginée des correspondances d'affichage avec filtres.
 */
export function useCreneauxAffichage(query?: CreneauAffichageQuery) {
  return useQuery({
    queryKey: creneauxAffichageKeys.list(query ?? {}),
    queryFn: () => findAllCreneauxAffichage(query),
    staleTime: 30_000,
  });
}

/**
 * Hook pour récupérer une correspondance d'affichage par son ID.
 */
export function useCreneauAffichage(id: string) {
  return useQuery({
    queryKey: creneauxAffichageKeys.detail(id),
    queryFn: () => findCreneauAffichageById(id),
    enabled: !!id,
  });
}

/**
 * Hook pour créer une correspondance d'affichage Ramadan.
 */
export function useCreateCreneauAffichage() {
  const queryClient = useQueryClient();
  return useMutation<CreneauAffichage, Error, CreateCreneauAffichageInput>({
    mutationFn: createCreneauAffichage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creneauxAffichageKeys.all });
      toast.success(messages.successRamadanCreated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorCreateRamadan);
    },
  });
}

/**
 * Hook pour mettre à jour une correspondance d'affichage Ramadan.
 */
export function useUpdateCreneauAffichage() {
  const queryClient = useQueryClient();
  return useMutation<CreneauAffichage, Error, { id: string; input: UpdateCreneauAffichageInput }>({
    mutationFn: ({ id, input }) => updateCreneauAffichage(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: creneauxAffichageKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: creneauxAffichageKeys.all });
      toast.success(messages.successRamadanUpdated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorUpdateRamadan);
    },
  });
}

/**
 * Hook pour supprimer une correspondance d'affichage Ramadan.
 */
export function useDeleteCreneauAffichage() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteCreneauAffichage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creneauxAffichageKeys.all });
      toast.success(messages.successRamadanDeleted);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorDeleteRamadan);
    },
  });
}

/**
 * Hook pour dupliquer les correspondances d'affichage d'un semestre vers un autre.
 */
export function useDuplicateCreneauxAffichage() {
  const queryClient = useQueryClient();
  return useMutation<DuplicateCreneauxAffichageResponse, Error, DuplicateCreneauxAffichageInput>({
    mutationFn: duplicateCreneauxAffichage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creneauxAffichageKeys.all });
      toast.success(messages.successRamadanDuplicated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorDuplicateRamadan);
    },
  });
}
