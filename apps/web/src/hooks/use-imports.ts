// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Hook React Query pour l'import depuis une année clôturée (L1-24)
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  importAnneePreview,
  importAnneeConfirm,
  ImportAnneeInput,
  ImportPreviewDto,
  ImportResultDto,
} from '@/lib/api/imports';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

const IMPORT_KEY = ['import'];

export function useImportPreview() {
  return useMutation<ImportPreviewDto, Error, { sourceAnneeId: string; input: ImportAnneeInput }>({
    mutationKey: [...IMPORT_KEY, 'preview'],
    mutationFn: ({ sourceAnneeId, input }) => importAnneePreview(sourceAnneeId, input),
    onError: () => {
      toast.error(messages.errorImportPreview);
    },
  });
}

export function useImportConfirm() {
  const queryClient = useQueryClient();
  return useMutation<ImportResultDto, Error, { sourceAnneeId: string; input: ImportAnneeInput }>({
    mutationKey: [...IMPORT_KEY, 'confirm'],
    mutationFn: ({ sourceAnneeId, input }) => importAnneeConfirm(sourceAnneeId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annees'] });
      toast.success(messages.successImportApplied);
    },
    onError: () => {
      toast.error(messages.errorImportApply);
    },
  });
}
