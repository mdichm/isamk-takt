'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  findAllContrainteDefinitions,
  findAllContrainteInstances,
  findContrainteInstanceById,
  createContrainteInstance,
  updateContrainteInstance,
  deleteContrainteInstance,
  appliquerContrainteApresValidation,

  type ContrainteInstance,
  type CreateContrainteInstanceInput,
  type UpdateContrainteInstanceInput,
  type ContraintesQuery,
  type ContraintesDefinitionsQuery,
  type AppliquerContrainteApresValidationInput,
  type AppliquerContrainteApresValidationOutput,
} from '@/lib/api/contraintes';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

// Clés de cache React Query
export const contraintesKeys = {
  all: ['contraintes'] as const,
  definitions: {
    all: ['contraintes', 'definitions'] as const,
    list: (query: ContraintesDefinitionsQuery) => [
      ...contraintesKeys.definitions.all,
      'list',
      query,
    ] as const,
  },
  instances: {
    all: ['contraintes', 'instances'] as const,
    list: (query: ContraintesQuery) => [
      ...contraintesKeys.instances.all,
      'list',
      query,
    ] as const,
    detail: (id: string) => [...contraintesKeys.instances.all, 'detail', id] as const,
  },
};

/**
 * Hook pour récupérer la liste des définitions de contraintes (catalogue).
 */
export function useContraintesDefinitions(query?: ContraintesDefinitionsQuery) {
  return useQuery({
    queryKey: contraintesKeys.definitions.list(query ?? {}),
    queryFn: () => findAllContrainteDefinitions(query),
    staleTime: 60_000,
  });
}

/**
 * Hook pour récupérer la liste paginée des instances de contraintes avec filtres.
 */
export function useContraintesInstances(query?: ContraintesQuery) {
  return useQuery({
    queryKey: contraintesKeys.instances.list(query ?? {}),
    queryFn: () => findAllContrainteInstances(query),
    staleTime: 30_000,
  });
}

/**
 * Hook pour récupérer une instance de contrainte par son ID.
 */
export function useContrainteInstance(id: string) {
  return useQuery({
    queryKey: contraintesKeys.instances.detail(id),
    queryFn: () => findContrainteInstanceById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/**
 * Hook pour créer une instance de contrainte.
 */
export function useCreateContrainteInstance() {
  const queryClient = useQueryClient();
  return useMutation<ContrainteInstance, Error, CreateContrainteInstanceInput>({
    mutationFn: createContrainteInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contraintesKeys.instances.all });
      queryClient.invalidateQueries({ queryKey: contraintesKeys.definitions.all });
      toast.success(messages.successContrainteInstanceCreated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorCreateContrainteInstance);
    },
  });
}

/**
 * Hook pour mettre à jour une instance de contrainte.
 */
export function useUpdateContrainteInstance() {
  const queryClient = useQueryClient();
  return useMutation<
    ContrainteInstance,
    Error,
    { id: string; input: UpdateContrainteInstanceInput }
  >({
    mutationFn: ({ id, input }) => updateContrainteInstance(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: contraintesKeys.instances.detail(id) });
      queryClient.invalidateQueries({ queryKey: contraintesKeys.instances.all });
      toast.success(messages.successContrainteInstanceUpdated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorUpdateContrainteInstance);
    },
  });
}

/**
 * Hook pour modifier une contrainte après validation (L5-14).
 * Permet de choisir entre application immédiate et application à la prochaine génération.
 */
export function useContrainteApresValidation() {
  const queryClient = useQueryClient();
  return useMutation<
    AppliquerContrainteApresValidationOutput,
    Error,
    { id: string; input: AppliquerContrainteApresValidationInput }
  >({
    mutationFn: ({ id, input }) => appliquerContrainteApresValidation(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: contraintesKeys.instances.detail(id) });
      queryClient.invalidateQueries({ queryKey: contraintesKeys.instances.all });
      toast.success(messages.successContrainteApresValidation);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorContrainteApresValidation);
    },
  });
}

/**
 * Hook pour supprimer (désactiver) une instance de contrainte.
 */
export function useDeleteContrainteInstance() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteContrainteInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contraintesKeys.instances.all });
      toast.success(messages.successContrainteInstanceDeleted);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorDeleteContrainteInstance);
    },
  });
}