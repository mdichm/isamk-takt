'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchWorkflowParams,
  updateWorkflowParams,
  type WorkflowParamsDto,
  type WorkflowParamsUpdateDto,
} from '@/lib/api/workflow-params';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

// ============================================================================
// Clés de cache React Query
// ============================================================================

export const workflowParamsKeys = {
  all: ['workflowParams'] as const,
  detail: () => [...workflowParamsKeys.all, 'detail'] as const,
};

/**
 * Lecture des deux interrupteurs du circuit global (valeurs courantes).
 *
 * La lecture est partagée : tous les rôles y ont accès (parametre:read).
 * La valeur copiée sur une version est figée à sa soumission : l'écran de
 * validation utilise le circuit de la version, pas celui-ci (EX-WFL-02).
 */
export function useWorkflowParams() {
  return useQuery<WorkflowParamsDto, Error>({
    queryKey: workflowParamsKeys.detail(),
    queryFn: fetchWorkflowParams,
    staleTime: 30_000,
  });
}

/**
 * Mise à jour des deux interrupteurs du circuit global (Administrateur).
 * La modification est auditée côté backend.
 */
export function useUpdateWorkflowParams() {
  const queryClient = useQueryClient();

  return useMutation<WorkflowParamsDto, Error, WorkflowParamsUpdateDto>({
    mutationFn: (dto) => updateWorkflowParams(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowParamsKeys.detail() });
      toast.success(messages.circuitParametresEnregistres);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error) || messages.circuitParametresEnregistrementEchec,
      );
    },
  });
}
