'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  launchGeneration,
  getGenerationDetail,
  cancelGeneration,
  type GenerationResponse,
  type GenerationDetail,
  type CancelGenerationResponse,
  type CreateGenerationInput,
} from '@/lib/api/generations';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/errors';

// ============================================================================
// Clés de cache React Query
// ============================================================================

export const generationsKeys = {
  all: ['generations'] as const,
  detail: (id: string) => [...generationsKeys.all, 'detail', id] as const,
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
