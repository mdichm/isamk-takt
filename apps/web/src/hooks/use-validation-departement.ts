'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchImpact,
  submitValidation,
  type ImpactResponseDto,
  type ValidationResponseDto,
} from '@/lib/api/versions';
import { fetchMe } from '@/lib/api/users';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

// ============================================================================
// Types
// ============================================================================

export interface UserDepartment {
  id: string;
  role: string;
  departments: string[];
}

// ============================================================================
// Clés de cache React Query
// ============================================================================

export const validationKeys = {
  all: ['validation'] as const,
  detail: (versionId: string) => [...validationKeys.all, 'detail', versionId] as const,
  impact: (versionId: string) => [...validationKeys.all, 'impact', versionId] as const,
  me: ['validation', 'me'] as const,
};

// ============================================================================
// Lecture : département de l'utilisateur connecté
// ============================================================================

/** Hook pour récupérer le profil de l'utilisateur connecté (rôle + départements). */
export function useUserDepartment() {
  return useQuery<UserDepartment, Error>({
    queryKey: validationKeys.me,
    queryFn: () => fetchMe(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// Lecture : impact par département d'une version
// ============================================================================

/** Hook pour récupérer l'analyse d'impact par département d'une version. */
export function useImpact(versionId: string) {
  return useQuery<ImpactResponseDto, Error>({
    queryKey: validationKeys.impact(versionId),
    queryFn: () => fetchImpact(versionId),
    enabled: !!versionId,
    staleTime: 30_000,
  });
}

// ============================================================================
// Écriture : décision de validation d'un département
// ============================================================================

interface SubmitValidationInput {
  departementId: string;
  decision: 'APPROUVE' | 'REJETE';
  motif?: string;
}

/** Hook pour prendre une décision de validation sur un département (POST /versions/:id/validations). */
export function useSubmitValidation(versionId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    ValidationResponseDto,
    Error,
    SubmitValidationInput
  >({
    mutationFn: async (input) => {
      const res = await submitValidation(versionId, {
        departementId: input.departementId,
        decision: input.decision,
        motif: input.motif,
      });
      return res as ValidationResponseDto;
    },
    onSuccess: (data) => {
      // Invalider les requêtes liées pour forcer un rechargement
      queryClient.invalidateQueries({ queryKey: validationKeys.detail(versionId) });
      queryClient.invalidateQueries({ queryKey: validationKeys.impact(versionId) });

      if (data.unanimiteAtteinte && data.nouveauStatutVersion) {
        toast.success(
          messages.validationUnanimiteSucces
            ? messages.validationUnanimiteSucces
            : `Unanimité atteinte : version passée en ${data.nouveauStatutVersion}`,
        );
      } else if (data.decision === 'APPROUVE') {
        toast.success(messages.validationApprouveeSucces);
      } else {
        toast.success(messages.validationRejeteeSucces);
      }
    },
    onError: (error) => {
      const status = (error as { status?: number }).status;
      const message = getErrorMessage(error) || messages.errorGeneric;

      if (status === 422) {
        toast.error(messages.validationMotifRequis);
      } else if (status === 409) {
        toast.error(messages.validationDejaDecidee);
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
