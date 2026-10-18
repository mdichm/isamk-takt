'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  findAllSalles,
  findSalleById,
  createSalle,
  updateSalle,
  deleteSalle,
  findAllSites,
  findAllTypeSalles,
  findAllEquipements,
  assignerEquipements,
  type Salle,
  type CreateSalleInput,
  type UpdateSalleInput,
  type SallesQuery,
} from '@/lib/api/salles';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

// Clés de cache React Query
export const sallesKeys = {
  all: ['salles'] as const,
  list: (query: SallesQuery) => [...sallesKeys.all, 'list', query] as const,
  detail: (id: string) => [...sallesKeys.all, 'detail', id] as const,
};

// Référentiels
export const sitesKeys = {
  all: ['sites'] as const,
  list: () => [...sitesKeys.all, 'list'] as const,
};

export const typeSallesKeys = {
  all: ['typeSalles'] as const,
  list: () => [...typeSallesKeys.all, 'list'] as const,
};

export const equipementsKeys = {
  all: ['equipements'] as const,
  list: () => [...equipementsKeys.all, 'list'] as const,
};

/**
 * Hook pour récupérer la liste paginée des salles avec filtres.
 */
export function useSalles(query?: SallesQuery) {
  return useQuery({
    queryKey: sallesKeys.list(query ?? {}),
    queryFn: () => findAllSalles(query),
    staleTime: 30_000,
  });
}

/**
 * Hook pour récupérer une salle par son ID.
 */
export function useSalle(id: string) {
  return useQuery({
    queryKey: sallesKeys.detail(id),
    queryFn: () => findSalleById(id),
    enabled: !!id,
  });
}

/**
 * Hook pour créer une salle.
 */
export function useCreateSalle() {
  const queryClient = useQueryClient();
  return useMutation<Salle, Error, CreateSalleInput>({
    mutationFn: createSalle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sallesKeys.all });
      toast.success(messages.successSalleCreated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorCreateSalle);
    },
  });
}

/**
 * Hook pour mettre à jour une salle.
 */
export function useUpdateSalle() {
  const queryClient = useQueryClient();
  return useMutation<Salle, Error, { id: string; input: UpdateSalleInput }>({
    mutationFn: ({ id, input }) => updateSalle(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: sallesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: sallesKeys.all });
      toast.success(messages.successSalleUpdated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorUpdateSalle);
    },
  });
}

/**
 * Hook pour désactiver (soft delete) une salle.
 */
export function useDeleteSalle() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteSalle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sallesKeys.all });
      toast.success(messages.successSalleDeleted);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorDeleteSalle);
    },
  });
}

/**
 * Hook pour affecter des équipements à une salle.
 */
export function useAssignerEquipements() {
  const queryClient = useQueryClient();
  return useMutation<Salle, Error, { salleId: string; equipementIds: string[] }>({
    mutationFn: ({ salleId, equipementIds }) =>
      assignerEquipements(salleId, equipementIds),
    onSuccess: (_, { salleId }) => {
      queryClient.invalidateQueries({ queryKey: sallesKeys.detail(salleId) });
      queryClient.invalidateQueries({ queryKey: sallesKeys.all });
      toast.success(messages.successEquipementsAssignes);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorAssignerEquipements);
    },
  });
}

/**
 * Hook pour récupérer la liste des sites (référentiel pour le formulaire).
 */
export function useSites(query?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: [...sitesKeys.list(), query ?? {}],
    queryFn: () => findAllSites(query),
    staleTime: 60_000,
  });
}

/**
 * Hook pour récupérer la liste des types de salle (référentiel pour le formulaire).
 */
export function useTypeSalles(
  query?: { page?: number; limit?: number; search?: string; estActive?: boolean },
) {
  return useQuery({
    queryKey: [...typeSallesKeys.list(), query ?? {}],
    queryFn: () => findAllTypeSalles(query),
    staleTime: 60_000,
  });
}

/**
 * Hook pour récupérer la liste des équipements (référentiel pour le formulaire).
 */
export function useEquipements(
  query?: { page?: number; limit?: number; search?: string; estActive?: boolean },
) {
  return useQuery({
    queryKey: [...equipementsKeys.list(), query ?? {}],
    queryFn: () => findAllEquipements(query),
    staleTime: 60_000,
  });
}
