'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  launchGeneration,
  getGenerationDetail,
  cancelGeneration,
  getGenerationsByVersion,
  compareGenerations,
  adoptGeneration,
  type GenerationResponse,
  type GenerationDetail,
  type CancelGenerationResponse,
  type CreateGenerationInput,
  type GenerationSummary,
  type CompareResponse,
  type AdoptGenerationInput,
  type AdoptResponse,
} from '@/lib/api/generations';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/errors';

// ============================================================================
// Clés de cache React Query
// ============================================================================

export const generationsKeys = {
  all: ['generations'] as const,
  detail: (id: string) => [...generationsKeys.all, 'detail', id] as const,
  version: (versionId: string) =>
    [...generationsKeys.all, 'version', versionId] as const,
};

// ============================================================================
// Hook : détail d'une génération
// ============================================================================

export function useGenerationDetail(generationId: string | undefined) {
  return useQuery<GenerationDetail, Error>({
    queryKey: generationsKeys.detail(generationId ?? ''),
    queryFn: () => getGenerationDetail(generationId!),
    enabled: !!generationId,
    staleTime: 5_000,
  });
}

// ============================================================================
// Hook : liste des générations d'une version (L4-21)
// ============================================================================

export function useGenerationsByVersion(versionId: string | undefined) {
  return useQuery<GenerationSummary[], Error>({
    queryKey: generationsKeys.version(versionId ?? ''),
    queryFn: () => getGenerationsByVersion(versionId!),
    enabled: !!versionId,
    staleTime: 10_000,
  });
}

// ============================================================================
// Hook : lancement d'une génération
// ============================================================================

export function useLaunchGeneration(versionId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<GenerationResponse, Error, CreateGenerationInput>({
    mutationFn: (input) => launchGeneration(versionId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: generationsKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: generationsKeys.version(versionId),
      });
      toast({
        description: 'Génération lancée avec succès.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        description: getErrorMessage(error),
      });
    },
  });
}

// ============================================================================
// Hook : annulation d'une génération
// ============================================================================

export function useCancelGeneration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<CancelGenerationResponse, Error, string>({
    mutationFn: cancelGeneration,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: generationsKeys.detail(data.generationId),
      });
      toast({
        description: 'Annulation demandée.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        description: getErrorMessage(error),
      });
    },
  });
}

// ============================================================================
// Hook : comparaison de générations (L4-21)
// ============================================================================

export function useCompareGenerations(ids: string[]) {
  return useQuery<CompareResponse, Error>({
    queryKey: [...generationsKeys.all, 'compare', ...ids],
    queryFn: () => compareGenerations(ids),
    enabled: ids.length >= 2 && ids.length <= 4,
  });
}

// ============================================================================
// Hook : adoption d'une génération (L4-21)
// ============================================================================

export function useAdoptGeneration(versionId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<AdoptResponse, Error, AdoptGenerationInput>({
    mutationFn: (input) => adoptGeneration(versionId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: generationsKeys.version(versionId),
      });
      toast({
        description: `Génération adoptée. Version ${data.numero} (${data.conflitsInitiaux} conflit(s) initial(s)).`,
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        description: getErrorMessage(error),
      });
    },
  });
}
