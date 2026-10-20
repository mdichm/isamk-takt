'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  findModuleVolumes,
  createModuleVolume,
  updateModuleVolume,
  deleteModuleVolume,
  type ModuleVolume,
  type CreateModuleVolumeInput,
  type UpdateModuleVolumeInput,
  type ModuleVolumesQuery,
} from '@/lib/api/volumes';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

// Clés de cache React Query
export const volumesKeys = {
  all: ['volumes'] as const,
  list: (moduleId: string, query: ModuleVolumesQuery) =>
    [...volumesKeys.all, 'list', moduleId, query] as const,
  detail: (moduleId: string, volumeId: string) =>
    [...volumesKeys.all, 'detail', moduleId, volumeId] as const,
};

/**
 * Hook pour récupérer la liste paginée des volumes d'un module.
 */
export function useModuleVolumes(moduleId: string, query?: ModuleVolumesQuery) {
  return useQuery({
    queryKey: volumesKeys.list(moduleId, query ?? {}),
    queryFn: () => findModuleVolumes(moduleId, query),
    enabled: !!moduleId,
    staleTime: 30_000,
  });
}

/**
 * Hook pour créer un volume de module.
 */
export function useCreateModuleVolume() {
  const queryClient = useQueryClient();
  return useMutation<ModuleVolume, Error, CreateModuleVolumeInput>({
    mutationFn: createModuleVolume,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: volumesKeys.list(variables.moduleId, {}),
      });
      toast.success(messages.successVolumeCreated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorCreateVolume);
    },
  });
}

/**
 * Hook pour mettre à jour un volume de module.
 */
export function useUpdateModuleVolume() {
  const queryClient = useQueryClient();
  return useMutation<
    ModuleVolume,
    Error,
    { moduleId: string; volumeId: string; input: UpdateModuleVolumeInput }
  >({
    mutationFn: ({ moduleId, volumeId, input }) =>
      updateModuleVolume(moduleId, volumeId, input),
    onSuccess: (_, { moduleId }) => {
      queryClient.invalidateQueries({
        queryKey: volumesKeys.list(moduleId, {}),
      });
      toast.success(messages.successVolumeUpdated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorUpdateVolume);
    },
  });
}

/**
 * Hook pour supprimer un volume de module.
 */
export function useDeleteModuleVolume() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { moduleId: string; volumeId: string }>({
    mutationFn: ({ moduleId, volumeId }) => deleteModuleVolume(moduleId, volumeId),
    onSuccess: (_, { moduleId }) => {
      queryClient.invalidateQueries({
        queryKey: volumesKeys.list(moduleId, {}),
      });
      toast.success(messages.successVolumeDeleted);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorDeleteVolume);
    },
  });
}
