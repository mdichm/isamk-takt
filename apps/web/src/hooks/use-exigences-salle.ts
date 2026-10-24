'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listExigencesSalle,
  getExigenceSalle,
  createExigenceSalle,
  updateExigenceSalle,
  deleteExigenceSalle,
  type ExigenceSalleActivite,
  type CreateExigenceSalleInput,
  type UpdateExigenceSalleInput,
  type ExigenceSalleQuery,
} from '@/lib/api/exigences-salle';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

// Clés de cache React Query
export const exigencesSalleKeys = {
  all: ['exigences-salle'] as const,
  list: (query: ExigenceSalleQuery) =>
    [...exigencesSalleKeys.all, 'list', query] as const,
  detail: (id: string) => [...exigencesSalleKeys.all, 'detail', id] as const,
};

/**
 * Hook pour récupérer la liste paginée des exigences de salle d'un semestre.
 */
export function useExigencesSalle(query?: ExigenceSalleQuery) {
  return useQuery({
    queryKey: exigencesSalleKeys.list(query ?? {}),
    queryFn: () => listExigencesSalle(query),
    staleTime: 30_000,
    enabled: !!query?.semestreId,
  });
}

/**
 * Hook pour récupérer une exigence de salle par son ID.
 */
export function useExigenceSalle(id: string) {
  return useQuery({
    queryKey: exigencesSalleKeys.detail(id),
    queryFn: () => getExigenceSalle(id),
    enabled: !!id,
  });
}

/**
 * Hook pour créer une exigence de salle.
 */
export function useCreateExigenceSalle() {
  const queryClient = useQueryClient();
  return useMutation<ExigenceSalleActivite, Error, CreateExigenceSalleInput>({
    mutationFn: createExigenceSalle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exigencesSalleKeys.all });
      toast.success(messages.successExigenceSalleCreated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorCreateExigenceSalle);
    },
  });
}

/**
 * Hook pour mettre à jour une exigence de salle.
 */
export function useUpdateExigenceSalle() {
  const queryClient = useQueryClient();
  return useMutation<
    ExigenceSalleActivite,
    Error,
    { id: string; input: UpdateExigenceSalleInput }
  >({
    mutationFn: ({ id, input }) => updateExigenceSalle(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: exigencesSalleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: exigencesSalleKeys.all });
      toast.success(messages.successExigenceSalleUpdated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorUpdateExigenceSalle);
    },
  });
}

/**
 * Hook pour supprimer une exigence de salle.
 */
export function useDeleteExigenceSalle() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteExigenceSalle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exigencesSalleKeys.all });
      toast.success(messages.successExigenceSalleDeleted);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorDeleteExigenceSalle);
    },
  });
}
