'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  findAllEnseignants,
  findEnseignantById,
  createEnseignant,
  updateEnseignant,
  deleteEnseignant,
  assignModules,
  unassignModule,
  type Enseignant,
  type CreateEnseignantInput,
  type UpdateEnseignantInput,
  type EnseignantsQuery,
  type AssignModulesInput,
} from '@/lib/api/enseignants';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

// Clés de cache React Query
export const enseignantsKeys = {
  all: ['enseignants'] as const,
  list: (query: EnseignantsQuery) => [...enseignantsKeys.all, 'list', query] as const,
  detail: (id: string) => [...enseignantsKeys.all, 'detail', id] as const,
};

/**
 * Hook pour récupérer la liste paginée des enseignants avec filtres.
 */
export function useEnseignants(query?: EnseignantsQuery) {
  return useQuery({
    queryKey: enseignantsKeys.list(query ?? {}),
    queryFn: () => findAllEnseignants(query),
    staleTime: 30_000,
  });
}

/**
 * Hook pour récupérer un enseignant par son ID.
 */
export function useEnseignant(id: string) {
  return useQuery({
    queryKey: enseignantsKeys.detail(id),
    queryFn: () => findEnseignantById(id),
    enabled: !!id,
  });
}

/**
 * Hook pour créer un enseignant.
 */
export function useCreateEnseignant() {
  const queryClient = useQueryClient();
  return useMutation<Enseignant, Error, CreateEnseignantInput>({
    mutationFn: createEnseignant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enseignantsKeys.all });
      toast.success(messages.successEnseignantCreated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorCreateEnseignant);
    },
  });
}

/**
 * Hook pour mettre à jour un enseignant.
 */
export function useUpdateEnseignant() {
  const queryClient = useQueryClient();
  return useMutation<Enseignant, Error, { id: string; input: UpdateEnseignantInput }>({
    mutationFn: ({ id, input }) => updateEnseignant(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: enseignantsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: enseignantsKeys.all });
      toast.success(messages.successEnseignantUpdated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorUpdateEnseignant);
    },
  });
}

/**
 * Hook pour désactiver (soft delete) un enseignant.
 */
export function useDeleteEnseignant() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteEnseignant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enseignantsKeys.all });
      toast.success(messages.successEnseignantDeleted);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorDeleteEnseignant);
    },
  });
}

/**
 * Hook pour assigner des modules enseignables à un enseignant.
 */
export function useAssignModules() {
  const queryClient = useQueryClient();
  return useMutation<Enseignant, Error, { enseignantId: string; input: AssignModulesInput }>({
    mutationFn: ({ enseignantId, input }) => assignModules(enseignantId, input),
    onSuccess: (_, { enseignantId }) => {
      queryClient.invalidateQueries({ queryKey: enseignantsKeys.detail(enseignantId) });
      queryClient.invalidateQueries({ queryKey: enseignantsKeys.all });
      toast.success(messages.successModulesAssigned);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorAssignModules);
    },
  });
}

/**
 * Hook pour désassigner un module d'un enseignant.
 */
export function useUnassignModule() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { enseignantId: string; moduleId: string }>({
    mutationFn: ({ enseignantId, moduleId }) =>
      unassignModule(enseignantId, moduleId),
    onSuccess: (_, { enseignantId }) => {
      queryClient.invalidateQueries({ queryKey: enseignantsKeys.detail(enseignantId) });
      queryClient.invalidateQueries({ queryKey: enseignantsKeys.all });
      toast.success(messages.successModuleUnassigned);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorUnassignModule);
    },
  });
}
