'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchPrevisualisationPublication,
  publishVersion,
  type PrevisualisationPublicationDto,
  type PublishResponseDto,
} from '@/lib/api/versions';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

// ============================================================================
// Clés de cache React Query
// ============================================================================

export const previsualisationKeys = {
  all: ['previsualisation'] as const,
  detail: (versionId: string) =>
    [...previsualisationKeys.all, 'detail', versionId] as const,
};

// ============================================================================
// Lecture : prévisualisation avant publication
// ============================================================================

/** Hook pour récupérer les données de prévisualisation avant publication d'une version. */
export function usePrevisualisationPublication(versionId: string) {
  return useQuery<PrevisualisationPublicationDto, Error>({
    queryKey: previsualisationKeys.detail(versionId),
    queryFn: () => fetchPrevisualisationPublication(versionId),
    enabled: !!versionId,
    staleTime: 30_000,
  });
}

// ============================================================================
// Écriture : publication de version
// ============================================================================

/** Hook pour publier une version (POST /versions/:id/publish). */
export function usePublishVersion(versionId: string) {
  const queryClient = useQueryClient();

  return useMutation<PublishResponseDto, Error, void>({
    mutationFn: async (): Promise<PublishResponseDto> => {
      const res = await publishVersion(versionId);
      return res as PublishResponseDto;
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({
        queryKey: previsualisationKeys.detail(versionId),
      });
      toast.success(messages.previsualisationSucces);
    },
    onError: (error) => {
      const status = (error as { status?: number }).status;
      const message = getErrorMessage(error) || messages.errorGeneric;

      if (status === 409) {
        toast.error(messages.previsualisationErreurPublier);
      } else if (status === 403) {
        toast.error(messages.validationInterdite);
      } else if (status === 404) {
        toast.error(messages.validationVersionIntrouvable);
      } else {
        toast.error(message);
      }
    },
  });
}
