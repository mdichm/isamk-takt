'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listProfils,
  getProfil,
  createProfil,
  updateProfil,
  setDefaultProfil,
  getDefaultProfil,
  type Profil,
  type CreateProfilInput,
  type UpdateProfilInput,
  type SetDefaultProfilInput,
} from '@/lib/api/profils';
import { useToast } from '@/components/ui/use-toast';

// Clés de cache React Query
export const profilsKeys = {
  all: ['profils'] as const,
  list: (semestreId: string) => [...profilsKeys.all, 'list', semestreId] as const,
  detail: (id: string) => [...profilsKeys.all, 'detail', id] as const,
  default: (semestreId: string) =>
    [...profilsKeys.all, 'default', semestreId] as const,
};

/**
 * Hook pour récupérer la liste des profils de génération d’un semestre.
 */
export function useProfils(semestreId: string) {
  return useQuery<Profil[], Error>({
    queryKey: profilsKeys.list(semestreId),
    queryFn: () => listProfils(semestreId),
    enabled: !!semestreId,
    staleTime: 30_000,
  });
}

/**
 * Hook pour récupérer le détail d’un profil.
 */
export function useProfil(id: string) {
  return useQuery<Profil, Error>({
    queryKey: profilsKeys.detail(id),
    queryFn: () => getProfil(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/**
 * Hook pour récupérer le profil par défaut d’un semestre.
 */
export function useDefaultProfil(semestreId: string) {
  return useQuery<Profil | null, Error>({
    queryKey: profilsKeys.default(semestreId),
    queryFn: () => getDefaultProfil(semestreId),
    enabled: !!semestreId,
    staleTime: 30_000,
  });
}

/**
 * Hook pour créer un profil de génération.
 */
export function useCreateProfil(semestreId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<Profil, Error, CreateProfilInput>({
    mutationFn: createProfil,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: profilsKeys.list(semestreId),
      });
      queryClient.invalidateQueries({
        queryKey: profilsKeys.default(semestreId),
      });
      toast({
        description: 'Profil créé avec succès.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: 'Impossible de créer le profil.',
      });
    },
  });
}

/**
 * Hook pour modifier un profil de génération.
 */
export function useUpdateProfil(semestreId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<Profil, Error, { id: string; input: UpdateProfilInput }>({
    mutationFn: ({ id, input }) => updateProfil(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: profilsKeys.list(semestreId),
      });
      queryClient.invalidateQueries({
        queryKey: profilsKeys.default(semestreId),
      });
      toast({
        description: 'Profil mis à jour avec succès.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: 'Impossible de mettre à jour le profil.',
      });
    },
  });
}

/**
 * Hook pour définir le profil par défaut d’un semestre.
 */
export function useSetDefaultProfil(semestreId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<Profil, Error, SetDefaultProfilInput>({
    mutationFn: (input) => setDefaultProfil(semestreId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: profilsKeys.list(semestreId),
      });
      queryClient.invalidateQueries({
        queryKey: profilsKeys.default(semestreId),
      });
      toast({
        description: 'Profil par défaut défini.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: 'Impossible de définir le profil par défaut.',
      });
    },
  });
}